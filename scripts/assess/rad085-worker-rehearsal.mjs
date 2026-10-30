// Required local/CI integration. Fresh PostgreSQL, owned bridge address, internal
// Docker network, random synthetic credentials. No inherited PG/URL/provider config.
import assert from 'node:assert/strict';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'esbuild';
import { Client } from 'pg';
import { openSyntheticRecoveryEvidence, reconcileSynthetic } from './rad085-erasure-recovery.mjs';

const PG_IMAGE = 'postgres:18.4-bookworm@sha256:882236b897e39051d2368c5ccc6cda944904723506b2dfc97f2a8f5bc9afa382';
const dockerEnv = { ...process.env };
for (const name of ['DOCKER_HOST', 'DOCKER_CONTEXT', 'DOCKER_TLS', 'DOCKER_TLS_VERIFY', 'DOCKER_CERT_PATH']) delete dockerEnv[name];
const prefix = `rad085-worker-${randomBytes(6).toString('hex')}`;
const pgName = prefix + '-postgres', network = prefix + '-net', image = prefix + ':local';
const inputVolume = prefix + '-inputs', hostUid = process.getuid(), hostGid = process.getgid();
const dir = mkdtempSync(join(tmpdir(), 'rad085-worker-qa-'));
const owned = new Set(), clients = new Set(), builds = [];
const checks = [], measurements = [];
let admin, f, dbConfig, config, manifestSha256, evidence, recoveryHead, phase = 'docker', outcome = 'STOP', cleanup = true;
let networkCreated = false, imageBuilt = false, pgPaused = false, volumeCreated = false, lastInputs, migrationOrdinal = 0;
const now = () => performance.now();
const sha = b => createHash('sha256').update(b).digest('hex');
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const delay = () => new Promise(r => setTimeout(r, 30));
function command(program, args, options = {}) {
  return execFileSync(program, args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 120000, ...options });
}
function docker(args, options) { return command('docker', ['--host=unix:///var/run/docker.sock', ...args], { env: dockerEnv, ...options }); }
function jsonFile(name, value) { writeFileSync(join(dir, name), JSON.stringify(value), { mode: 0o600 }); }
async function connect(user = 'postgres', password = dbConfig.password, overrides = {}) {
  const c = new Client({ ...dbConfig, user, password, ...overrides });
  clients.add(c); await c.connect(); c.on('error', () => {}); return c;
}
async function end(c) { await c.end(); clients.delete(c); }
async function scalar(sql, args = [], c = admin) { return Object.values((await c.query(sql, args)).rows[0])[0]; }
async function as(role, user, name, args = []) {
  await admin.query('begin');
  try {
    await admin.query(`set local role ${role}`);
    await admin.query("select set_config('request.jwt.claim.sub',$1,true)", [user]);
    const v = await scalar(`select assess.${name}(${args.map((_, i) => '$' + (i + 1)).join(',')})`, args);
    await admin.query('commit'); return v;
  } catch (e) { await admin.query('rollback'); throw e; }
}
const owner = { call: (name, args) => as('authenticated', id(1), name, Object.values(args)) };
const installer = { call: (name, args) => as('assess_worker', '', name, Object.values(args)) };
async function snapshot(session) {
  return (await admin.query(`select s.state,(r.session_id is not null) result,
    exists(select 1 from assess.session_details d where d.session_id=s.id) details,
    (select count(*)::int from assess.results r2 where r2.session_id=s.id) results
    from assess.sessions s left join assess.results r on r.session_id=s.id where s.id=$1`, [session])).rows[0];
}
// Observer is a separate administrative READ ONLY QA connection. It is not a
// SELECT grant to the worker. A reviewed provider observer remains a launch gate.
async function metrics() {
  await admin.query('begin read only');
  try {
    const row = (await admin.query(`with sample as materialized(select state,lease_until from assess.sessions limit 101)
    select count(*)::int sampled,count(*) filter(where state in ('grading','grading-failed'))::int backlog,
    count(*) filter(where state='grading' and lease_until>clock_timestamp())::int leased,
    count(*) filter(where state='grading' and lease_until<=clock_timestamp())::int lease_expired
    from sample`)).rows[0];
    assert.ok(row.sampled <= 100); delete row.sampled; return row;
  }
  finally { await admin.query('rollback'); }
}
let ordinal = 0;
const documents = new Map();
async function submitted(track = 'mixed') {
  const { document, assignment, specs, answers, locked } = documents.get(track);
  const session = randomUUID();
  // Synthetic existing submitted attempt, not a new start path or a parallel
  // attempt service. launch_gate stays FALSE throughout; immutable C snapshot.
  await admin.query(`insert into assess.sessions(id,assignment_id,user_id,ordinal,state,started_at,submitted_at)
    values($1,$2,$3,$4,'grading',clock_timestamp(),clock_timestamp())`, [session, assignment, id(2), ++ordinal]);
  await admin.query('insert into assess.session_details(session_id,publication,specs,answers,locked) values($1,$2,$3,$4,$5)',
    [session, document, specs, answers, JSON.stringify(locked)]);
  return session;
}
function binding() { return f.createGradingWorkerBinding(config); }
const verify = async () => {
  assert.deepEqual(evidence.head(), recoveryHead);
  assert.equal(await scalar('select enabled from assess.launch_gate'), false);
};
async function tick(worker = binding(), stop = new AbortController(), observe) {
  return f.executeGradingWorker(async () => config, stop.signal, verify, () => worker, observe);
}
function containerArgs(name, extra = []) {
  return ['run', '--name', name, '--network', network, '--read-only', '--cap-drop=ALL', '--security-opt=no-new-privileges',
    '--pids-limit=64', '--cpus=1', '--memory=192m', '--tmpfs', '/tmp:rw,noexec,nosuid,size=8m',
    '--mount', `type=volume,src=${inputVolume},dst=/run/rad085,readonly`,
    '--env', 'RAD085_SYNTHETIC_WORKER=1', ...extra, image];
}
function syncInputs() {
  // Host UID can be 1001 in CI. Never make a credential world-readable or run the
  // worker as root to accommodate that. Populate a private owned Docker volume
  // over stdin in a networkless, unprivileged helper; the worker mounts it RO.
  const files = {};
  for (const [name, path] of [['worker.json', join(dir, 'worker.json')], ['permit.json', join(dir, 'recovery', 'permit.json')], ['current.json', join(dir, 'recovery', 'current.json')]])
    if (existsSync(path)) files[name] = readFileSync(path, 'utf8');
  const payload = JSON.stringify(files); if (payload === lastInputs) return;
  const name = prefix + '-input-' + randomBytes(3).toString('hex'); owned.add(name);
  docker(['run', '-i', '--name', name, '--network=none', '--read-only', '--cap-drop=ALL', '--security-opt=no-new-privileges',
    '--user=1000:1000', '--mount', `type=volume,src=${inputVolume},dst=/inputs`, '--entrypoint=node', image, '-e',
    `const fs=require('node:fs');let data='';process.stdin.setEncoding('utf8');process.stdin.on('data',b=>data+=b);process.stdin.on('end',()=>{
      const files=JSON.parse(data);for(const name of ['worker.json','permit.json','current.json']){
        const path='/inputs/'+name;if(fs.existsSync(path))fs.unlinkSync(path);
        if(Object.hasOwn(files,name)){fs.writeFileSync(path,files[name],{mode:0o600});const s=fs.statSync(path);if(s.uid!==1000||(s.mode&0o777)!==0o600)throw Error('file_mode');}
      }
    });`], { input: payload });
  lastInputs = payload;
}
function runContainer(extra = []) {
  syncInputs();
  const name = prefix + '-' + randomBytes(3).toString('hex'); owned.add(name);
  const child = spawn('docker', ['--host=unix:///var/run/docker.sock', ...containerArgs(name, extra)], { env: dockerEnv, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '', stderr = '';
  child.stdout.on('data', b => stdout += b); child.stderr.on('data', b => stderr += b);
  const ended = new Promise((resolve, reject) => {
    child.once('error', reject); child.once('exit', code => resolve({ code, stdout, stderr, name }));
  });
  return { name, ended };
}
async function imageResult(extra = []) {
  const result = await runContainer(extra).ended;
  if (result.stderr) checks.push('image-stderr-' + ['SyntaxError', 'Error', 'Warning', 'permission denied', 'mount'].filter(s => result.stderr.includes(s)).join('-'));
  assert.equal(result.stderr, '');
  assert.doesNotMatch(result.stdout, /correctOption|privateItems|fixedSettings|reviewedBy|password|SYNTHETIC_SECRET|RAD085_PRIVATE_NOTE_CANARY|optionId|SELECT|select assess/);
  return { ...result, report: JSON.parse(result.stdout) };
}
async function waitFor(test, limit = 10000) {
  const start = now();
  while (now() - start < limit) { if (await test()) return; await delay(); }
  throw Error('witness_timeout');
}

try {
  assert.equal(process.argv.length, 2);
  docker(['info', '--format', '{{.ServerVersion}}']);
  phase = 'build';
  for (let i = 0; i < 2; i++) builds.push(JSON.parse(command(process.execPath, ['scripts/assess/build-worker.mjs'])));
  const first = readFileSync(join(builds[0].output, 'manifest.json'));
  assert.equal(first.toString(), readFileSync(join(builds[1].output, 'manifest.json')).toString());
  const manifest = JSON.parse(first); manifestSha256 = sha(first);
  await build({ entryPoints: ['scripts/assess/rad085-worker-fixture.ts'], outfile: join(dir, 'fixture.cjs'), bundle: true,
    platform: 'node', target: 'node22', format: 'cjs', logLevel: 'silent', define: { 'process.env.NODE_PG_FORCE_NATIVE': 'false' } });
  f = createRequire(import.meta.url)(join(dir, 'fixture.cjs'));
  assert.deepEqual(manifest.versions, f.workerVersions());
  docker(['build', '--network=none', '--tag', image, builds[0].output]); imageBuilt = true;
  docker(['volume', 'create', inputVolume]); volumeCreated = true;
  const initName = prefix + '-input-init'; owned.add(initName);
  // This preparer sees no credentials, DB/network or Docker socket. Its sole
  // capability is CHOWN on the new volume, before any private input exists.
  docker(['run', '--name', initName, '--network=none', '--read-only', '--user=0:0', '--cap-drop=ALL', '--cap-add=CHOWN',
    '--security-opt=no-new-privileges', '--mount', `type=volume,src=${inputVolume},dst=/inputs`, '--entrypoint=node', image,
    '-e', "const fs=require('node:fs');fs.chmodSync('/inputs',0o700);fs.chownSync('/inputs',1000,1000)"]);
  const imageInfo = JSON.parse(docker(['image', 'inspect', image]))[0];
  docker(['build', '--network=none', '--tag', image, builds[1].output]);
  assert.equal(JSON.parse(docker(['image', 'inspect', image]))[0].Id, imageInfo.Id);
  assert.equal(imageInfo.Config.User, 'node');
  assert.deepEqual(imageInfo.Config.Entrypoint, ['node', '/app/worker-main.mjs']);
  const inspectName = prefix + '-inspect'; owned.add(inspectName);
  const contents = docker(['run', '--name', inspectName, '--network=none', '--read-only', '--cap-drop=ALL', '--entrypoint=node', image,
    '-e', "console.log(JSON.stringify({uid:process.getuid(),files:require('node:fs').readdirSync('/app')}))"]);
  assert.deepEqual(JSON.parse(contents), { uid: 1000, files: ['manifest.json', 'worker-main.mjs', 'worker.cjs'] });
  checks.push('reproducible-build-versions-curated-nonroot-image');
  measurements.push({ manifestSha256, localImageId: imageInfo.Id, imageBytes: imageInfo.Size,
    workerBundleBytes: readFileSync(join(builds[0].output, 'worker.cjs')).length, hostUid, postgresUid: hostUid, workerUid: 1000 });

  phase = 'postgres';
  const subnetOctet = randomBytes(1)[0];
  docker(['network', 'create', '--internal', '--subnet', `172.30.${subnetOctet}.0/24`, network]); networkCreated = true;
  // Internal bridges deliberately publish no ports. The host reaches only this
  // newly owned bridge address; no host network or external DB destination.
  const subnet = JSON.parse(docker(['network', 'inspect', network]))[0].IPAM.Config[0].Subnet;
  const serviceHost = subnet.split('/')[0].split('.').slice(0, 3).join('.') + '.2';
  command('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=rad085-postgres',
    '-addext', `subjectAltName=DNS:rad085-postgres,IP:${serviceHost}`, '-keyout', join(dir, 'server.key'), '-out', join(dir, 'server.crt')]);
  const ca = readFileSync(join(dir, 'server.crt'), 'utf8'), adminPassword = randomBytes(32).toString('hex'), password = randomBytes(32).toString('hex');
  writeFileSync(join(dir, 'admin-password'), adminPassword, { mode: 0o600 });
  owned.add(pgName);
  phase = 'postgres-container';
  docker(['run', '--detach', '--name', pgName, '--network', network, '--network-alias', 'rad085-postgres',
    `--user=${hostUid}:${hostGid}`, '--read-only', '--cap-drop=ALL', '--security-opt=no-new-privileges', '--cpus=1', '--memory=384m', '--pids-limit=128',
    '--ip', serviceHost, '--tmpfs', `/var/lib/postgresql:rw,uid=${hostUid},gid=${hostGid},mode=700`, '--tmpfs', '/tmp:rw,mode=1777',
    '--tmpfs', `/var/run/postgresql:rw,uid=${hostUid},gid=${hostGid},mode=700`,
    '--mount', `type=bind,src=${join(dir, 'admin-password')},dst=/run/admin-password,readonly`,
    '--mount', `type=bind,src=${join(dir, 'server.key')},dst=/run/server.key,readonly`,
    '--mount', `type=bind,src=${join(dir, 'server.crt')},dst=/run/server.crt,readonly`,
    '--env', 'POSTGRES_PASSWORD_FILE=/run/admin-password', '--env', 'POSTGRES_DB=rad085_synthetic', PG_IMAGE,
    '-c', 'ssl=on', '-c', 'ssl_cert_file=/run/server.crt', '-c', 'ssl_key_file=/run/server.key',
    '-c', 'log_statement=none', '-c', 'log_min_messages=panic', '-c', 'log_min_error_statement=panic',
    '-c', 'log_parameter_max_length=0', '-c', 'log_parameter_max_length_on_error=0']);
  const port = 5432;
  phase = 'postgres-connect';
  dbConfig = { host: serviceHost, port, database: 'rad085_synthetic', user: 'postgres', password: adminPassword,
    ssl: { ca, rejectUnauthorized: true }, connectionTimeoutMillis: 1000, query_timeout: 10000 };
  await waitFor(async () => { try { admin = await connect(); return true; } catch { return false; } }, 15000);
  phase = 'postgres-migrations';
  assert.equal(await scalar('show server_version_num'), '180004');
  await admin.query(`create role anon nologin;create role authenticated nologin;create schema auth;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
  const required=JSON.parse(readFileSync('scripts/pages/frontend-schema.json','utf8')).requiredMigrations;
  const applied = readdirSync('supabase/migrations').filter(p => p.endsWith('.sql')&&required.includes(p)).sort();
  assert.deepEqual(Object.keys(manifest.migrations),applied);
  for (const file of applied) {
    migrationOrdinal++;
    const sql = readFileSync(`supabase/migrations/${file}`); assert.equal(sha(sql), manifest.migrations[file]); await admin.query(sql.toString());
  }
  // Fixture-only role DDL, never an operational migration or provider grant.
  phase = 'postgres-fixture-role';
  await admin.query(`revoke create,temporary on database rad085_synthetic from public;
    revoke create on schema public from public;
    create role assess_grading_worker nologin noinherit nosuperuser nocreatedb nocreaterole nobypassrls noreplication;
    grant usage on schema assess to assess_grading_worker;
    grant execute on function assess.maintain_v1(integer),assess.claim_v1(),assess.finish_v1(uuid,uuid,text,text),
      assess.fail_v1(uuid,uuid),assess.health_v1() to assess_grading_worker;
    create role rad085_synthetic_worker login noinherit nosuperuser nocreatedb nocreaterole nobypassrls noreplication connection limit 2
      password '${password}' valid until '${new Date(Date.now() + 3600000).toISOString()}';
    grant assess_grading_worker to rad085_synthetic_worker with inherit false,set true;
    grant connect on database rad085_synthetic to rad085_synthetic_worker;`);
  config = { host: serviceHost, port, database: 'rad085_synthetic', user: 'rad085_synthetic_worker', password, ca };
  jsonFile('worker.json', { ...config, host: 'rad085-postgres', port: 5432 });

  phase = 'acl-tls';
  const restricted = await connect(config.user, password);
  await restricted.query('set role assess_grading_worker');
  for (const sql of ["set role assess_worker", "set role assess_authoring_bridge", "set role authenticated",
    'select * from assess.session_details', 'select * from public.profiles', 'select * from assess.authoring_reviewed_packages',
    "select assess.content_submit_v1('{}')", "select assess.content_read_v1('00000000-0000-0000-0000-000000000001')",
    "select assess.install_publication_v1('00000000-0000-0000-0000-000000000001','{}','{}')",
    "select assess.recover_v1('00000000-0000-0000-0000-000000000001')", 'create temp table stolen(x int)'])
    await assert.rejects(() => restricted.query(sql), e => e.code === '42501');
  await end(restricted);
  const badTls = new Client({ ...dbConfig, user: config.user, password, ssl: { ca, rejectUnauthorized: true, servername: 'wrong.invalid' } });
  await assert.rejects(() => badTls.connect(), e => e.code === 'ERR_TLS_CERT_ALTNAME_INVALID'); await badTls.end();
  const good = binding(); assert.deepEqual(await good.call('health_v1', {}), { failed: 0, alert: 0, overdue: 0, purgeDue: 0 }); await good.close();
  command('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=untrusted-synthetic',
    '-keyout', join(dir, 'untrusted.key'), '-out', join(dir, 'untrusted.crt')]);
  const untrusted = f.createGradingWorkerBinding({ ...config, ca: readFileSync(join(dir, 'untrusted.crt'), 'utf8') });
  await assert.rejects(() => untrusted.call('health_v1', {}), { code: 'unavailable' }); await untrusted.close();
  checks.push('actual-limited-login-no-publishing-review-accounts-or-bridge', 'verified-tls-hostname-rejection');

  phase = 'content';
  for (const n of [1, 2]) await admin.query('insert into auth.users values($1,$2,now(),$3)', [id(n), `synthetic${n}@example.test`, { display_name: 'SYNTHETIC Worker Account' }]);
  await admin.query("update public.profiles set status='approved',role=case when user_id=$1 then 'owner' else 'participant' end", [id(1)]);
  await as('authenticated', id(2), 'consent_v2', ['assess-pilot-2026-10-20-v2']); // synthetic identity only
  for (const track of ['mixed', 'full-practical']) {
    const document = track === 'mixed' ? f.mixedFixture() : f.practicalFixture();
    for (const key of document.privateItems) key.review.scope += ' RAD085_PRIVATE_NOTE_CANARY';
    if (track === 'full-practical') document.assessment.ref.id = id(11);
    const { specs } = f.validatePublication(document), answers = {}, locked = [];
    for (const key of document.privateItems) {
      if (key.type === 'single-choice') answers[key.ref.id] = { type: key.type, optionId: key.correctOptionId };
      else {
        const c = f.resolveCase(key.caseRef, key.evaluatorVersion);
        answers[key.ref.id] = { type: key.type, values: f.leafValues(key.fixedSettings ?? c.initialSettings, specs[key.ref.id]) };
        locked.push(key.ref.id);
      }
    }
    const version = await owner.call('content_submit_v1', { p_document: document });
    await (track === 'mixed' ? f.installMixedContent : f.installPracticalContent)(installer, version);
    const assignment = await owner.call('assign_v1', { p_version: version, p_users: [id(2)], p_groups: [] });
    documents.set(track, { document, assignment, specs, answers, locked });
    for (const field of ['case', 'evaluator', 'item']) {
      const wrong = structuredClone(document);
      const key = wrong.privateItems.find(k => k.type !== 'single-choice');
      if (field === 'case') key.caseRef.version = 'mismatch';
      else if (field === 'evaluator') key.evaluatorVersion = 'mismatch';
      else wrong.itemMarks[0].item = { ...wrong.itemMarks[0].item, version: 'mismatch' };
      assert.throws(() => f.gradePublication(wrong, answers, locked));
    }
  }
  checks.push('existing-mixed-mcq-simulator-and-full-practical-installers', 'pinned-case-evaluator-item-mismatch-refused');

  phase = 'recovery-gate';
  evidence = await openSyntheticRecoveryEvidence();
  const certificate = await reconcileSynthetic({ contract: 'rad085-synthetic-reconciliation/1', journal: evidence.journal, ports: {
    quarantine: async () => (await scalar('select enabled from assess.launch_gate')) === false,
    revokeAll: async () => (await scalar("select count(*)::int from pg_stat_activity where usename='rad085_synthetic_worker'")) === 0,
    seal: async () => evidence.head(), page: async (after, limit) => evidence.page(after, limit),
    apply: async () => { throw Error('fresh-empty-journal-only'); }, verify: async () => false,
    maintainAndVerify: async () => {
      await installer.call('maintain_v1', { p_limit: 1 });
      return (await scalar('select count(*)::int from assess.sessions')) === 0;
    },
    verifyRevoked: async () => (await scalar("select count(*)::int from pg_stat_activity where usename='rad085_synthetic_worker'")) === 0,
    latest: async () => evidence.head(),
  } });
  recoveryHead = evidence.head();
  // Separate, outside PostgreSQL, read-only during an execution. Fresh empty
  // synthetic history only. Nonempty restore replay has its own required witness.
  command('mkdir', ['-m', '700', join(dir, 'recovery')]);
  const permitPath = join(dir, 'recovery', 'permit.json'), headPath = join(dir, 'recovery', 'current.json');
  const permit = { ...certificate, manifestSha256, revoked: true, maintenance: true };
  writeFileSync(permitPath, JSON.stringify(permit), { mode: 0o600 });
  writeFileSync(headPath, JSON.stringify({ ...recoveryHead, frozen: true }), { mode: 0o600 });
  for (const mutation of [{ ...permit, maintenance: false }, { ...permit, revoked: false }, { ...permit, sequence: 1 }, { ...permit, manifestSha256: 'mismatch' }]) {
    writeFileSync(permitPath, JSON.stringify(mutation));
    const gate = (await imageResult()).report.code;
    if (gate !== 'quarantined') checks.push('unexpected-gate-' + gate);
    assert.equal(gate, 'quarantined');
  }
  rmSync(permitPath);
  assert.equal((await imageResult()).report.code, 'quarantined');
  writeFileSync(permitPath, JSON.stringify(permit), { mode: 0o600 });
  const badManifest = structuredClone(manifest); badManifest.versions.worker = 'mismatch';
  jsonFile('bad-manifest.json', badManifest);
  command('chmod', ['444', join(dir, 'bad-manifest.json')]); // Public source metadata only, never a credential.
  assert.equal((await imageResult(['--mount', `type=bind,src=${join(dir, 'bad-manifest.json')},dst=/app/manifest.json,readonly`])).report.code, 'configuration');
  checks.push('image-refuses-missing-stale-unreconciled-or-unrevoked-permit');

  phase = 'image-mixed-practical';
  for (const track of documents.keys()) {
    const sample = [];
    for (let n = 0; n < 4; n++) {
      phase = 'sample-seed-' + track;
      const session = await submitted(track), started = now();
      phase = 'sample-image-' + track;
      const result = await imageResult(); sample.push({ wallMilliseconds: Math.round(now() - started), jobMilliseconds: result.report.milliseconds,
        gradeMilliseconds: result.report.gradeMilliseconds, resources: result.report.resources });
      assert.equal(result.code, 0); assert.equal(result.report.counts.graded, 1);
      assert.deepEqual(await snapshot(session), { state: 'graded', result: true, details: false, results: 1 });
      const fixture = documents.get(track), expected = f.gradePublication(fixture.document, fixture.answers, fixture.locked);
      assert.deepEqual((await admin.query('select earned_n::text n,earned_d::text d from assess.results where session_id=$1', [session])).rows[0], { n: expected.numerator, d: expected.denominator });
      phase = 'sample-hidden-' + track;
      const hidden = await as('authenticated', id(2), 'result_v1', [session]);
      assert.doesNotMatch(JSON.stringify(hidden), /earned|maximum|privateItems|correctOption|values|checks|reviewedBy|RAD085_PRIVATE_NOTE_CANARY/);
      const before = await scalar('select count(*)::int from assess.results');
      assert.equal((await imageResult()).report.counts.graded, 0);
      assert.equal(await scalar('select count(*)::int from assess.results'), before);
    }
    measurements.push({ track, samples: sample, workerCpuLimit: 1, workerMemoryLimitMiB: 192, postgresCpuLimit: 1, postgresMemoryLimitMiB: 384 });
  }
  checks.push('image-grades-both-tracks-hidden-results-detail-erasure-no-regrade');

  phase = 'mismatched-snapshot';
  for (const track of documents.keys()) {
    const session = await submitted(track), wrong = structuredClone(documents.get(track).document);
    wrong.privateItems.find(k => k.type !== 'single-choice').evaluatorVersion = 'mismatch';
    await admin.query('update assess.session_details set publication=$1 where session_id=$2', [wrong, session]);
    const report = await tick(); assert.equal(report.counts.failed, 1);
    assert.deepEqual(await snapshot(session), { state: 'grading-failed', result: false, details: true, results: 0 });
    assert.equal(await scalar('select retry_at>clock_timestamp() from assess.sessions where id=$1', [session]), true);
    assert.equal((await tick()).counts.graded, 0);
    // No content repair, version substitution or automatic recovery. Discard only
    // this owned synthetic failure sample so later independent cases start empty.
    await admin.query('delete from assess.sessions where id=$1', [session]);
  }
  checks.push('claimed-version-mismatch-no-result-no-content-repair-retry-window-preserved');
  phase = 'atomic-finalize-rollback';
  const atomic = await submitted();
  await admin.query(`create function assess.worker_qa_reject_delete() returns trigger language plpgsql as $$begin raise exception 'synthetic deletion failure';end$$;
    revoke all on function assess.worker_qa_reject_delete() from public;
    create trigger worker_qa_reject_delete before delete on assess.session_details for each row execute function assess.worker_qa_reject_delete()`);
  assert.equal((await tick()).outcome, 'STOP');
  assert.deepEqual(await snapshot(atomic), { state: 'grading', result: false, details: true, results: 0 });
  await admin.query('drop trigger worker_qa_reject_delete on assess.session_details;drop function assess.worker_qa_reject_delete()');
  await admin.query("update assess.sessions set lease_until=clock_timestamp()-interval '1 second' where id=$1", [atomic]);
  assert.equal((await tick()).counts.graded, 1);
  checks.push('finalize-delete-failure-atomic-rollback-no-zero-no-reconnect');

  phase = 'stop-boundaries';
  for (const boundary of ['before-claim', 'after-claim', 'before-finalize', 'after-commit']) {
    const session = await submitted(), stop = new AbortController(), real = binding(), names = [];
    let verifies = 0;
    const wrapped = { close: () => real.close(), async call(name, args) {
      names.push(name); const result = await real.call(name, args);
      if ((boundary === 'before-claim' && name === 'maintain_v1') || (boundary === 'after-claim' && name === 'claim_v1') ||
          (boundary === 'after-commit' && name === 'finish_v1')) stop.abort();
      return result;
    } };
    const result = await f.executeGradingWorker(async () => config, stop.signal, async () => {
      await verify(); if (boundary === 'before-finalize' && ++verifies === 5) stop.abort();
    }, () => wrapped);
    assert.equal(result.code, 'stopped');
    const state = await snapshot(session);
    assert.equal(state.results, boundary === 'after-commit' ? 1 : 0);
    assert.equal(names.filter(n => n === 'finish_v1').length, boundary === 'after-commit' ? 1 : 0);
    if (boundary !== 'after-commit') {
      await admin.query("update assess.sessions set lease_until=clock_timestamp()-interval '1 second' where id=$1", [session]);
      assert.equal((await tick()).counts.graded, 1);
    }
  }
  checks.push('stop-before-claim-after-claim-before-finalize-after-commit');

  phase = 'ack-lease';
  for (const lostAt of ['claim_v1', 'finish_v1', 'health_v1']) {
    const session = await submitted(), real = binding(), calls = [];
    const wrapped = { close: () => real.close(), async call(name, args) {
      calls.push(name); const v = await real.call(name, args);
      if (name === lostAt) throw Error('SYNTHETIC_SECRET privateItems answers'); return v;
    } };
    const result = await tick(wrapped);
    assert.equal(result.outcome, 'STOP'); assert.doesNotMatch(JSON.stringify(result), /SYNTHETIC_SECRET|privateItems|answers/);
    assert.ok(!calls.includes('fail_v1')); assert.equal(calls.filter(n => n === 'claim_v1').length, 1);
    assert.equal((await snapshot(session)).results, lostAt === 'claim_v1' ? 0 : 1);
    if (lostAt === 'claim_v1') {
      await admin.query("update assess.sessions set lease_until=clock_timestamp()-interval '1 second' where id=$1", [session]);
      assert.equal((await tick()).counts.graded, 1);
    }
  }
  const leased = await submitted(), leaseWorker = binding(), old = await leaseWorker.call('claim_v1', {});
  assert.equal(old.attemptId, leased);
  assert.equal((await metrics()).leased, 1);
  await assert.rejects(() => leaseWorker.call('finish_v1', { p_session: leased, p_token: randomUUID(), p_n: '0', p_d: '1' }), { code: 'conflict' });
  await leaseWorker.close();
  const foreign = binding(); await assert.rejects(() => foreign.call('finish_v1', { p_session: randomUUID(), p_token: old.token, p_n: '0', p_d: '1' }), { code: 'conflict' }); await foreign.close();
  await admin.query("update assess.sessions set lease_until=clock_timestamp()-interval '1 second' where id=$1", [leased]);
  const expiredToken = binding();
  await assert.rejects(() => expiredToken.call('finish_v1', { p_session: leased, p_token: old.token, p_n: '0', p_d: '1' }), { code: 'conflict' }); await expiredToken.close();
  const currentWorker = binding(), current = await currentWorker.call('claim_v1', {});
  assert.notEqual(current.token, old.token);
  const stale = binding(); await assert.rejects(() => stale.call('finish_v1', { p_session: leased, p_token: old.token, p_n: '0', p_d: '1' }), { code: 'conflict' }); await stale.close();
  const doc = documents.get('mixed'), grade = f.gradePublication(doc.document, doc.answers, doc.locked);
  const finish = { p_session: leased, p_token: current.token, p_n: grade.numerator, p_d: grade.denominator };
  await currentWorker.call('finish_v1', finish); await currentWorker.call('finish_v1', finish); await currentWorker.close();
  assert.equal((await snapshot(leased)).results, 1);
  checks.push('lost-claim-finish-health-ack-no-blind-mutation', 'lease-expiry-stale-foreign-token-idempotent-finalize');

  phase = 'connection-loss';
  const lostSession = await submitted(), lost = binding(), claim = await lost.call('claim_v1', {});
  assert.equal(claim.attemptId, lostSession);
  const pid = await scalar("select pid from pg_stat_activity where usename='rad085_synthetic_worker'");
  await admin.query('select pg_terminate_backend($1)', [pid]);
  await assert.rejects(() => lost.call('health_v1', {}), { code: 'unavailable' });
  await assert.rejects(() => lost.call('claim_v1', {}), { code: 'unavailable' }); await lost.close();
  assert.equal(await scalar("select count(*)::int from pg_stat_activity where usename='rad085_synthetic_worker'"), 0);
  assert.equal((await snapshot(lostSession)).results, 0);
  await admin.query("update assess.sessions set lease_until=clock_timestamp()-interval '1 second' where id=$1", [lostSession]);
  await tick(); checks.push('terminated-backend-faults-execution-no-silent-reconnect');

  phase = 'overlap';
  const parallel = [await submitted(), await submitted('full-practical')];
  const overlap = await Promise.all([imageResult(), imageResult()]);
  assert.equal(overlap.reduce((n, r) => n + r.report.counts.graded, 0), 2);
  for (const session of parallel) assert.equal((await snapshot(session)).results, 1);
  checks.push('two-overlapping-images-no-duplicate-result');

  phase = 'sigterm';
  const gracefulSession = await submitted(), finalizeBlocker = await connect();
  await finalizeBlocker.query('begin'); await finalizeBlocker.query('lock table assess.results in access exclusive mode');
  const graceful = runContainer();
  await waitFor(async () => (await scalar("select count(*)::int from pg_stat_activity where usename='rad085_synthetic_worker' and wait_event_type='Lock'")) === 1);
  const gracefulBegan = now(); docker(['kill', '--signal=TERM', graceful.name]);
  await delay(); await finalizeBlocker.query('rollback'); await end(finalizeBlocker);
  const grace = await graceful.ended;
  assert.equal(grace.stderr, ''); assert.equal(JSON.parse(grace.stdout).code, 'stopped');
  assert.equal((await snapshot(gracefulSession)).results, 1);
  measurements.push({ gracefulShutdownMilliseconds: Math.round(now() - gracefulBegan) });
  const blockedSession = await submitted(), blocker = await connect();
  await blocker.query('begin');
  // Hold publication read in claim, after claim UPDATE and before its COMMIT.
  await blocker.query('lock table assess.session_details in access exclusive mode');
  const running = runContainer();
  await waitFor(async () => (await scalar("select count(*)::int from pg_stat_activity where usename='rad085_synthetic_worker' and wait_event_type='Lock'")) === 1);
  phase = 'sigterm-deadline';
  // Freeze ONLY the disposable server: unlike a lock, this cannot respond at the
  // unchanged 5s lock timeout. Exercises lost-connection drain beyond 8s without
  // increasing any SQL timeout/lease/retry limit.
  docker(['pause', pgName]); pgPaused = true;
  const signalled = now(); docker(['kill', '--signal=TERM', running.name]);
  const stopped = await running.ended;
  const shutdownMilliseconds = Math.round(now() - signalled);
  docker(['unpause', pgName]); pgPaused = false;
  measurements.push({ shutdownMilliseconds, processShutdownMilliseconds: JSON.parse(stopped.stdout).shutdownMilliseconds,
    boundMilliseconds: 8000, outerAssertionMilliseconds: 10000 });
  assert.ok(shutdownMilliseconds < 10000); assert.equal(stopped.stderr, '');
  assert.equal(JSON.parse(stopped.stdout).code, 'shutdown_uncertain');
  await blocker.query('rollback'); await end(blocker);
  assert.equal((await snapshot(blockedSession)).results, 0);
  await waitFor(async () => (await scalar("select count(*)::int from pg_stat_activity where usename='rad085_synthetic_worker'")) === 0);
  await tick();
  checks.push('real-image-pid1-sigterm-deadline-closes-db-sockets');

  phase = 'monitor-and-drift';
  const observed = await submitted(), events = [];
  const report = await tick(binding(), new AbortController(), event => { events.push(event); throw Error('SYNTHETIC_SECRET'); });
  assert.equal(report.counts.graded, 1); assert.equal((await snapshot(observed)).results, 1);
  assert.ok(events.some(e => e.phase === 'grade'));
  for (const e of events) assert.deepEqual(Object.keys(e).sort(), ['milliseconds', 'phase']);
  await admin.query('grant execute on function assess.content_read_v1(uuid) to assess_grading_worker');
  const drift = binding(); await assert.rejects(() => drift.call('health_v1', {}), { code: 'denied' }); await drift.close();
  await admin.query('revoke execute on function assess.content_read_v1(uuid) from assess_grading_worker');
  const revoke = binding(); await revoke.call('health_v1', {});
  await admin.query('alter role rad085_synthetic_worker nologin');
  await assert.rejects(() => revoke.call('health_v1', {}), { code: 'denied' }); await revoke.close();
  const revokedLogin = binding(); await assert.rejects(() => revokedLogin.call('health_v1', {}), { code: 'unavailable' }); await revokedLogin.close();
  await admin.query('alter role rad085_synthetic_worker login');
  checks.push('nologin-existing-pool-recheck-and-new-connection-denied');
  assert.equal(await scalar('select enabled from assess.launch_gate'), false);
  measurements.push({ finalObserverCounts: await metrics(), postgresVersion: await scalar('show server_version') });
  const logCapture = spawnSync('docker', ['--host=unix:///var/run/docker.sock', 'logs', pgName], { env: dockerEnv, encoding: 'utf8', timeout: 10000, maxBuffer: 1_000_000 });
  assert.equal(logCapture.status, 0);
  const serverLogs = logCapture.stdout + logCapture.stderr;
  assert.doesNotMatch(serverLogs, /correctOptionId|privateItems|RAD085_PRIVATE_NOTE_CANARY/);
  assert.ok(!serverLogs.includes(config.password));
  checks.push('monitor-sink-failure-no-leak-no-rewrite', 'effective-acl-drift-refused', 'launch-gate-never-changed');
  phase = 'complete'; outcome = 'PASS';
} catch (error) {
  // Fixed phase/ordinal/SQLSTATE and container-state categories only; never
  // SQL/error bodies, config, credentials or claims. Diagnostic reads do not relax QA.
  checks.push(error?.code === 'ERR_ASSERTION' ? 'assertion-failed' : 'execution-failed');
  if (phase === 'postgres-migrations') {
    checks.push('migration-ordinal-' + migrationOrdinal);
    if (/^[0-9A-Z]{5}$/.test(error?.code ?? '')) checks.push('sqlstate-' + error.code);
    try {
      const state = JSON.parse(docker(['inspect', '--format', '{{json .State}}', pgName]));
      if (state.OOMKilled === true) checks.push('postgres-oom-killed');
      if (state.Status === 'exited') checks.push('postgres-exited');
    } catch { checks.push('postgres-state-unavailable'); }
  }
  if (phase === 'postgres-container') {
    // Docker invocation contains only paths/public config, never passwords.
    // Emit fixed diagnostic categories, not the Docker error body.
    const diagnostic = String(error?.stderr ?? '');
    checks.push(...['permission denied', 'not found', 'network', 'read-only', 'invalid', 'No such image', 'port', 'mount'].filter(s => diagnostic.includes(s)));
  }
} finally {
  try { evidence?.close(); } catch { cleanup = false; }
  if (pgPaused) try { docker(['unpause', pgName]); } catch { cleanup = false; }
  for (const c of clients) try { await c.end(); } catch { cleanup = false; }
  for (const name of owned) try { docker(['rm', '--force', '--volumes', name]); } catch { cleanup = false; }
  if (volumeCreated) try { docker(['volume', 'rm', inputVolume]); } catch { cleanup = false; }
  if (imageBuilt) try { docker(['image', 'rm', image]); } catch { cleanup = false; }
  if (networkCreated) try { docker(['network', 'rm', network]); } catch { cleanup = false; }
  for (const b of builds) rmSync(b.output, { recursive: true, force: true });
  rmSync(dir, { recursive: true, force: true });
  if (existsSync(dir) || !cleanup) { outcome = 'STOP'; phase = 'cleanup_failed'; }
}
console.log(JSON.stringify({ contract: 'rad085-worker-rehearsal/1', outcome, phase, checks, measurements, cleanup, runtimeOrLaunchVerified: false }));
process.exitCode = outcome === 'PASS' ? 0 : 1;
