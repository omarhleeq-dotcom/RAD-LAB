// RAD-085 W4 production grading image rehearsal. Destructive synthetic QA only: the pinned
// Supabase 17.11.0.016 image with the real 2026-11-01 roles/catalogue, the W1 SQL, the real W2
// transport into a FAKE secret sink, and the production image on an --internal Docker network
// whose only name for the database is the reviewed direct host. No provider, URL or gcloud.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'esbuild';
import { containerArgs, prepareRolesSql } from '../ops/laptop-restore-test.mjs';

const read = path => readFileSync(path, 'utf8');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const ENTRY = read('scripts/assess/grading-worker-main.mjs');
const DIRECT_HOST = ENTRY.match(/const DIRECT_HOST = '([^']+)'/)[1];
const REF = DIRECT_HOST.split('.')[1];
const FIXTURE = 'supabase/fixtures/production-schema-2026-11-01/';
const dockerEnv = { ...process.env };
for (const name of ['DOCKER_HOST', 'DOCKER_CONTEXT', 'DOCKER_TLS', 'DOCKER_TLS_VERIFY', 'DOCKER_CERT_PATH']) delete dockerEnv[name];
const docker = (args, input, timeout = 180000) => execFileSync('docker', ['--host=unix:///var/run/docker.sock', ...args],
  { input, env: dockerEnv, stdio: 'pipe', timeout, maxBuffer: 64 * 1024 * 1024 }).toString();
const lines = text => text.split('\n').filter(Boolean);
// Same wrapper pattern as direct-tls-probe.test.mjs: the program is a parameter.
const command = (program, args) => execFileSync(program, args, { stdio: 'pipe' });

// The real W2 transport with a gcloud stand-in that keeps the payload in a 0600 temp file.
function transport() {
  const root = mkdtempSync(join(tmpdir(), 'rad085-w4-transport-'));
  try {
    mkdirSync(join(root, 'home', 'assess-ca'), { recursive: true }); mkdirSync(join(root, 'bin'));
    const ca = execFileSync('python3', ['-B', '-c', "import importlib.util,sys;s=importlib.util.spec_from_file_location('t','scripts/assess/test_upload_worker_secret.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);sys.stdout.write(m.CA)"], { encoding: 'utf8' });
    writeFileSync(join(root, 'home', 'assess-ca', 'prod-ca-2021.crt'), ca);
    const sink = join(root, 'sink.json');
    writeFileSync(join(root, 'bin', 'gcloud'), `#!/usr/bin/env python3
import os, sys
args = sys.argv[1:]
verb = args[args.index("versions") + 1]
name = "projects/124842667755/secrets/assess-worker-config/versions/"
if verb == "list": print('[{"name": "%s1", "state": "DISABLED"}]' % name)
elif verb == "add":
    data = sys.stdin.buffer.read()
    fd = os.open(${JSON.stringify(sink)}, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    os.write(fd, data); os.close(fd); print(name + "2")
elif verb == "disable": pass
elif verb == "describe": print("DISABLED")
else: sys.exit(3)
`);
    chmodSync(join(root, 'bin', 'gcloud'), 0o700);
    const run = spawnSync('python3', ['-I', '-B', 'scripts/assess/rotate-grading-credential.py', '--valid-days', '30'],
      { env: { PATH: join(root, 'bin') + ':' + process.env.PATH, HOME: join(root, 'home') }, encoding: 'utf8', timeout: 60000 });
    assert.equal(run.status, 0, 'transport STOP');
    const payload = JSON.parse(readFileSync(sink, 'utf8'));
    assert.ok(!run.stdout.includes(payload.password) && !run.stderr.includes(payload.password));
    return { sql: run.stdout, payload };
  } finally { rmSync(root, { recursive: true, force: true }); }
}

test('W4 production grading image: refusals, re-read verifier, one bounded run as assess_job_b', { timeout: 900000 }, async () => {
  const prefix = `rad085-w4-${randomBytes(5).toString('hex')}`;
  const network = prefix + '-net', image = prefix + ':local', db = prefix + '-supabase';
  const secretsVolume = prefix + '-secrets', recoveryVolume = prefix + '-recovery';
  const dir = mkdtempSync(join(tmpdir(), 'rad085-w4-qa-'));
  const owned = new Set(), evidence = [];
  let networkCreated = false, imageBuilt = false;
  try {
    // 1. Reviewed constants agree with the W2 transport; the synthetic entrypoint is not shipped.
    assert.match(read('scripts/assess/rotate-grading-credential.py'), new RegExp(`^DIRECT_HOST = "${DIRECT_HOST.replaceAll('.', '\\.')}"$`, 'm'));
    assert.match(DIRECT_HOST, /^db\.[a-z0-9]{20}\.supabase\.co$/);

    // 2. Reproducible build, curated non-root image.
    const builds = [0, 1].map(() => JSON.parse(execFileSync(process.execPath, ['scripts/assess/build-grading-worker.mjs'], { encoding: 'utf8' })));
    const manifestBytes = readFileSync(join(builds[0].output, 'manifest.json'));
    assert.equal(manifestBytes.toString(), read(join(builds[1].output, 'manifest.json')));
    const manifest = JSON.parse(manifestBytes), manifestSha256 = sha(manifestBytes);
    assert.equal(manifest.localOnly, false); assert.equal(manifest.slot, 'assess_job_b');
    assert.deepEqual(manifest.mounts, { config: '/run/secrets/assess-worker.json', recovery: '/run/recovery/assess-recovery.json' });
    for (const path of Object.values(manifest.mounts)) assert.ok(ENTRY.includes(`'${path}'`));
    docker(['build', '--network=none', '--tag', image, builds[0].output]); imageBuilt = true;
    const info = JSON.parse(docker(['image', 'inspect', image]))[0];
    docker(['build', '--network=none', '--tag', image, builds[1].output]);
    assert.equal(JSON.parse(docker(['image', 'inspect', image]))[0].Id, info.Id);
    assert.equal(info.Config.User, 'node');
    assert.deepEqual(info.Config.Entrypoint, ['node', '/app/grading-worker-main.mjs']);
    const inspect = prefix + '-inspect'; owned.add(inspect);
    assert.deepEqual(JSON.parse(docker(['run', '--name', inspect, '--network=none', '--read-only', '--cap-drop=ALL', '--entrypoint=node', image,
      '-e', "console.log(JSON.stringify({uid:process.getuid(),files:require('node:fs').readdirSync('/app')}))"])),
      { uid: 1000, files: ['grading-worker-main.mjs', 'manifest.json', 'worker.cjs'] });
    evidence.push('reproducible-build-nonroot-production-entrypoint');

    // 3. Supabase 17.11 on an internal network; the reviewed direct host is its only alias.
    docker(['network', 'create', '--internal', network]); networkCreated = true;
    const args = containerArgs(db, { datlocprovider: 'c', datlocale: null, datcollate: 'C', datctype: 'C' });
    const at = args.indexOf('--network'); assert.equal(args[at + 1], 'none');
    args.splice(at, 2, '--network', network, '--network-alias', DIRECT_HOST);
    owned.add(db); docker(args);
    for (let n = 0; ; n++) {
      if (n > 90) throw Error('supabase_ready');
      if (docker(['logs', db]).includes('PostgreSQL init process complete; ready for start up.')) {
        try { docker(['exec', db, 'pg_isready', '-U', 'supabase_admin', '-d', 'postgres']); break; } catch { /* bounded */ }
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    const su = (sql, database = 'postgres') => docker(['exec', '-i', db, 'psql', '-X', '-q', '-At', '-F', '|', '-v', 'ON_ERROR_STOP=1', '-U', 'supabase_admin', '-d', database, '-f', '-'], sql).trim();
    const owner = sql => lines(docker(['exec', '-i', db, 'psql', '-X', '-q', '-At', '-F', '|', '-v', 'ON_ERROR_STOP=1', '-h', '127.0.0.1', '-U', 'postgres', '-d', 'postgres', '-f', '-'], sql));
    assert.equal(su('show server_version_num'), '170011');
    su(prepareRolesSql(read(FIXTURE + 'roles.sql')));
    // The W2 payload names database postgres: replace the image's own postgres database with the catalogue.
    su('drop database postgres with (force);', 'template1');
    docker(['exec', db, 'createdb', '-U', 'supabase_admin', '-O', 'postgres', '-T', 'template0', '--encoding=UTF8', '--locale=C', 'postgres']);
    let load = read(FIXTURE + 'schema.sql');
    for (const [, trigger, role] of load.matchAll(/^ALTER EVENT TRIGGER ([a-z_][a-z0-9_]*) OWNER TO ([a-z_][a-z0-9_]*);$/gm)) {
      if (su(`select rolsuper from pg_roles where rolname='${role}'`) !== 'f') continue;
      load = load.replace(new RegExp(`^CREATE EVENT TRIGGER ${trigger} ON [\\s\\S]*?^ALTER EVENT TRIGGER ${trigger} OWNER TO ${role};$`, 'gm'),
        block => `SET ROLE ${role};\n${block}\nRESET ROLE;`);
    }
    su(load);
    su('set role postgres;' + read('supabase/migrations/20261020000700_assess_lifecycle.sql').match(/^insert into assess\.launch_gate [^;]+;/m)[0]);
    // TLS for the direct host, SCRAM-only over TLS for the slot from the network, connection logging.
    command('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', `/CN=${DIRECT_HOST}`,
      '-addext', `subjectAltName=DNS:${DIRECT_HOST}`, '-keyout', join(dir, 'server.key'), '-out', join(dir, 'server.crt')]);
    docker(['exec', '-u', 'root', db, 'mkdir', '-p', '/etc/rad085-tls']);
    for (const file of ['server.key', 'server.crt']) docker(['cp', join(dir, file), `${db}:/etc/rad085-tls/${file}`]);
    docker(['exec', '-u', 'root', db, 'sh', '-c', 'chown -R postgres:postgres /etc/rad085-tls && chmod 600 /etc/rad085-tls/server.key']);
    docker(['exec', '-u', 'root', db, 'sed', '-i', '-e', '1i hostssl postgres assess_job_b samenet scram-sha-256', '-e', '1i host all assess_job_b all reject', '/etc/postgresql/pg_hba.conf']);
    su("alter system set ssl='on'; alter system set ssl_cert_file='/etc/rad085-tls/server.crt'; alter system set ssl_key_file='/etc/rad085-tls/server.key'; alter system set log_connections='on';");
    su('select pg_reload_conf()');
    assert.equal(su('show ssl'), 'on');
    assert.deepEqual(owner('select current_user, rolsuper from pg_roles where rolname=current_user;'), ['postgres|f']);
    evidence.push('supabase-17.11-production-catalogue-direct-host-alias-tls');

    // 4. W1 SQL and the W2 transport, in package order (provision, credential, D-W1, LOGIN 4.3).
    assert.deepEqual(owner(read('supabase/manual/assess-grading-worker-provision.sql')), ['assess-grading-worker-provision/1|t']);
    const { sql, payload } = transport();
    assert.deepEqual(Object.keys(payload).sort(), ['ca', 'database', 'host', 'password', 'port', 'user']);
    assert.deepEqual({ host: payload.host, port: payload.port, database: payload.database, user: payload.user },
      { host: DIRECT_HOST, port: 5432, database: 'postgres', user: 'assess_job_b' });
    assert.deepEqual(owner(sql), ['assess-grading-credential/1|t|f']);
    assert.deepEqual(owner(read('supabase/manual/assess-grading-worker-public-temp.sql')), ['assess-grading-worker-public-temp/1|t|t']);
    assert.deepEqual(owner(read('supabase/manual/assess-grading-worker-login.sql')), ['assess-grading-worker-login/1|t|t']);
    for (const row of owner(read('supabase/checks/assess-grading-worker-ready.sql'))) assert.match(row, /\|t$/, row);
    // The only rehearsal deviation from the W2 payload: the trust root of the local server.
    const config = { ...payload, ca: read(join(dir, 'server.crt')) };
    evidence.push('w1-provision-w2-transport-d-w1-login-ready');

    // 5. Two synthetic submitted v1 attempts on the real catalogue; one run may grade only one.
    await build({ entryPoints: ['scripts/assess/rad085-worker-fixture.ts'], outfile: join(dir, 'fixture.cjs'), bundle: true,
      platform: 'node', target: 'node22', format: 'cjs', logLevel: 'silent', define: { 'process.env.NODE_PG_FORCE_NATIVE': 'false' } });
    const f = createRequire(import.meta.url)(join(dir, 'fixture.cjs'));
    assert.deepEqual(manifest.versions, f.workerVersions());
    const document = f.mixedFixture();
    const { specs } = f.validatePublication(document), answers = {}, locked = [];
    for (const key of document.privateItems) {
      if (key.type === 'single-choice') answers[key.ref.id] = { type: key.type, optionId: key.correctOptionId };
      else {
        const c = f.resolveCase(key.caseRef, key.evaluatorVersion);
        answers[key.ref.id] = { type: key.type, values: f.leafValues(key.fixedSettings ?? c.initialSettings, specs[key.ref.id]) };
        locked.push(key.ref.id);
      }
    }
    const expected = f.gradePublication(document, answers, locked);
    const lit = value => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
    su(`insert into auth.users(id,email) values('${id(1)}','synthetic-owner@example.test'),('${id(2)}','synthetic-student@example.test');
      update public.profiles set status='approved',role=case when user_id='${id(1)}' then 'owner' else 'participant' end;
      -- The 2026-11-01 catalogue predates consent v3; the target trigger requires the v2 row.
      insert into assess.consents(user_id,version) values('${id(2)}','assess-pilot-2026-10-20-v2');
      insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values('${id(10)}','${id(1)}','${id(10)}','1','SYNTHETIC W4','mixed',true);
      insert into assess.publications(version_id,document,specs) values('${id(10)}',${lit(document)},${lit(specs)});
      insert into assess.assignments(id,owner_id,version_id) values('${id(11)}','${id(1)}','${id(10)}');
      insert into assess.targets values('${id(11)}','${id(2)}');
      insert into assess.sessions(id,assignment_id,user_id,ordinal,state,started_at,submitted_at) values
        ('${id(101)}','${id(11)}','${id(2)}',1,'grading',clock_timestamp()-interval '1 hour',clock_timestamp()-interval '2 minutes'),
        ('${id(102)}','${id(11)}','${id(2)}',2,'grading',clock_timestamp()-interval '1 hour',clock_timestamp()-interval '1 minute');
      insert into assess.session_details(session_id,publication,specs,answers,locked) select s,${lit(document)},${lit(specs)},${lit(answers)},${lit(locked)}
        from unnest(array['${id(101)}','${id(102)}']::uuid[]) s;`);
    const state = () => su("select string_agg(s.id::text||':'||s.state||':'||(r.session_id is not null),',' order by s.id) from assess.sessions s left join assess.results r on r.session_id=s.id");
    const ungraded = `${id(101)}:grading:false,${id(102)}:grading:false`;
    assert.equal(state(), ungraded);
    const serverLog = () => { // PostgreSQL logs to the container's stderr stream; read both streams.
      const out = spawnSync('docker', ['--host=unix:///var/run/docker.sock', 'logs', db], { env: dockerEnv, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      assert.equal(out.status, 0); return out.stdout + out.stderr;
    };
    assert.match(serverLog(), /connection authorized: user=postgres database=postgres/, 'connection logging is active');
    const authorized = () => serverLog().split('\n').filter(l => l.includes('connection authorized: user=assess_job_b database=postgres') && l.includes('SSL enabled')).length;
    assert.equal(authorized(), 0);

    // 6. Private input volumes, owned by the image user (Cloud Run mounts each secret in its own directory).
    for (const volume of [secretsVolume, recoveryVolume]) { docker(['volume', 'create', volume]); owned.add('volume:' + volume); }
    const init = prefix + '-init'; owned.add(init);
    docker(['run', '--name', init, '--network=none', '--read-only', '--user=0:0', '--cap-drop=ALL', '--cap-add=CHOWN', '--security-opt=no-new-privileges',
      '--mount', `type=volume,src=${secretsVolume},dst=/s`, '--mount', `type=volume,src=${recoveryVolume},dst=/r`, '--entrypoint=node', image,
      '-e', "const fs=require('node:fs');for(const d of ['/s','/r']){fs.chmodSync(d,0o700);fs.chownSync(d,1000,1000);}"]);
    let writes = 0;
    function inputs(files) {
      // files: {config, recovery} each a string, {link: true} (symlink to a valid copy), or undefined (absent).
      const name = `${prefix}-write-${++writes}`; owned.add(name);
      docker(['run', '-i', '--name', name, '--network=none', '--read-only', '--cap-drop=ALL', '--security-opt=no-new-privileges', '--user=1000:1000',
        '--mount', `type=volume,src=${secretsVolume},dst=/s`, '--mount', `type=volume,src=${recoveryVolume},dst=/r`, '--entrypoint=node', image, '-e',
        `const fs=require('node:fs');let data='';process.stdin.setEncoding('utf8');process.stdin.on('data',b=>data+=b);process.stdin.on('end',()=>{
          const files=JSON.parse(data);for(const [key,dir,file] of [['config','/s','assess-worker.json'],['recovery','/r','assess-recovery.json']]){
            for(const old of fs.readdirSync(dir).filter(n=>n!==file))fs.rmSync(dir+'/'+old);
            const v=files[key],tmp=dir+'/.next';
            if(v===undefined){fs.rmSync(dir+'/'+file,{force:true});continue;}
            if(typeof v==='object'){fs.writeFileSync(dir+'/target.json',v.content,{mode:0o600});fs.rmSync(tmp,{force:true});fs.symlinkSync(dir+'/target.json',tmp);}
            else fs.writeFileSync(tmp,v,{mode:0o600});
            fs.renameSync(tmp,dir+'/'+file);
          }});`], JSON.stringify(files));
    }
    async function worker(env = []) {
      const name = `${prefix}-run-${randomBytes(3).toString('hex')}`; owned.add(name);
      const began = performance.now();
      const child = spawn('docker', ['--host=unix:///var/run/docker.sock', 'run', '--name', name, '--network', network, '--read-only', '--cap-drop=ALL',
        '--security-opt=no-new-privileges', '--pids-limit=64', '--cpus=1', '--memory=512m', '--tmpfs', '/tmp:rw,noexec,nosuid,size=8m',
        '--mount', `type=volume,src=${secretsVolume},dst=/run/secrets,readonly`, '--mount', `type=volume,src=${recoveryVolume},dst=/run/recovery,readonly`,
        ...env, image], { env: dockerEnv, stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '', stderr = '';
      child.stdout.on('data', b => stdout += b); child.stderr.on('data', b => stderr += b);
      const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
      assert.equal(stderr, '', 'worker stderr');
      assert.equal(lines(stdout).length, 1);
      // No detail: no secret, certificate, path, host, role or SQL text in the single report line.
      for (const leak of [config.password, 'BEGIN CERTIFICATE', '/run/', DIRECT_HOST, REF, 'assess_job', 'select', 'ENOENT', 'ELOOP', 'Error'])
        assert.ok(!stdout.includes(leak), 'report leaks ' + leak.slice(0, 12));
      return { code, report: JSON.parse(stdout), milliseconds: performance.now() - began };
    }
    const now = Date.now(), iso = ms => new Date(ms).toISOString();
    const attestation = (patch = {}) => ({ contract: 'assess-recovery-attestation/1', projectRef: REF, manifestSha256,
      baselineAt: iso(now - 86400000), restoresSinceBaseline: 0, issuedAt: iso(now - 60000), expiresAt: iso(now + 47 * 3600000), ...patch });
    const good = JSON.stringify(attestation()), goodConfig = JSON.stringify(config);
    async function refused(files, code, env) {
      inputs(files);
      const r = await worker(env);
      assert.equal(r.report.outcome, 'STOP'); assert.equal(r.report.code, code, JSON.stringify(r.report)); assert.equal(r.code, 1);
    }

    // 7. Destination refusals: every non-production destination, pooler shape, extra/missing key, symlink, synthetic flag.
    const destinations = [
      { ...config, host: 'db.aaaaaaaaaaaaaaaaaaaa.supabase.co' }, { ...config, host: 'aws-0-eu-central-1.pooler.supabase.com' },
      { ...config, host: 'rad085-postgres' }, { ...config, host: 'localhost' }, { ...config, host: DIRECT_HOST.toUpperCase() },
      { ...config, port: 6543 }, { ...config, port: '5432' }, { ...config, database: 'rad085_synthetic' },
      { ...config, user: 'postgres' }, { ...config, user: 'assess_job_a' }, { ...config, user: `assess_job_b.${REF}` },
      { ...config, sessionPoolerProjectRef: REF }, Object.fromEntries(Object.entries(config).filter(([k]) => k !== 'ca')),
    ];
    for (const bad of destinations) await refused({ config: JSON.stringify(bad), recovery: good }, 'configuration');
    await refused({ recovery: good }, 'configuration');
    await refused({ config: '[]', recovery: good }, 'configuration');
    await refused({ config: { content: goodConfig }, recovery: good }, 'configuration');
    await refused({ config: goodConfig, recovery: good }, 'configuration', ['--env', 'RAD085_SYNTHETIC_WORKER=1']);
    evidence.push(`destination-refusals-${destinations.length + 4}`);

    // 8. Verifier refusals (owner decision B, 48 h cap): each ends quarantined before any connection.
    const missing = attestation(); delete missing.baselineAt;
    const attestations = [
      { ...attestation(), extra: true }, missing, attestation({ contract: 'rad085-synthetic-reconciliation/1' }),
      attestation({ projectRef: 'aaaaaaaaaaaaaaaaaaaa' }), attestation({ manifestSha256: 'f'.repeat(64) }),
      attestation({ restoresSinceBaseline: 1 }), attestation({ restoresSinceBaseline: '0' }), attestation({ restoresSinceBaseline: null }),
      attestation({ issuedAt: iso(now - 47 * 3600000), expiresAt: iso(now - 60000) }),
      attestation({ issuedAt: iso(now + 3600000), expiresAt: iso(now + 7200000) }),
      attestation({ issuedAt: iso(now - 60000), expiresAt: iso(now - 60000 + 48 * 3600000 + 1000) }),
      attestation({ issuedAt: iso(now - 60000).replace(/\.\d{3}Z$/, 'Z') }),
      attestation({ baselineAt: iso(now) }),
    ];
    for (const bad of attestations) await refused({ config: goodConfig, recovery: JSON.stringify(bad) }, 'quarantined');
    await refused({ config: goodConfig }, 'quarantined');
    await refused({ config: goodConfig, recovery: 'not json' }, 'quarantined');
    await refused({ config: goodConfig, recovery: { content: good } }, 'quarantined');
    assert.equal(authorized(), 0, 'a refused run reached the database');
    assert.equal(state(), ungraded);
    evidence.push(`verifier-refusals-${attestations.length + 3}-no-connection`);

    // 9. The exact 48 h span is accepted by the verifier; a wrong password is rejected by SCRAM.
    inputs({ config: JSON.stringify({ ...config, password: 'A'.repeat(48) }),
      recovery: JSON.stringify(attestation({ issuedAt: iso(now - 60000), expiresAt: iso(now - 60000 + 48 * 3600000) })) });
    let r = await worker();
    assert.deepEqual([r.report.outcome, r.report.code], ['STOP', 'unavailable']);
    assert.equal(authorized(), 0); assert.equal(state(), ungraded);
    evidence.push('exact-48h-accepted-wrong-password-rejected');

    // 10. Re-read on every verify: maintain_v1 waits on a held lock, the attestation is replaced
    // by an expired one, and the next verify stops the run before any claim.
    inputs({ config: goodConfig, recovery: good });
    const holder = spawn('docker', ['--host=unix:///var/run/docker.sock', 'exec', '-i', db, 'psql', '-X', '-q', '-v', 'ON_ERROR_STOP=1', '-U', 'supabase_admin', '-d', 'postgres'],
      { env: dockerEnv, stdio: ['pipe', 'pipe', 'pipe'] });
    holder.stdin.write("begin; lock table assess.sessions in access exclusive mode; select 'held';\n");
    for (let n = 0; !su("select count(*) from pg_locks where relation='assess.sessions'::regclass and mode='AccessExclusiveLock' and granted").startsWith('1'); n++) {
      if (n > 100) throw Error('lock_not_held'); await new Promise(res => setTimeout(res, 50));
    }
    const pending = worker();
    for (let n = 0; su("select count(*) from pg_stat_activity where usename='assess_job_b' and wait_event_type='Lock'") !== '1'; n++) {
      if (n > 200) throw Error('worker_not_waiting'); await new Promise(res => setTimeout(res, 25));
    }
    inputs({ config: goodConfig, recovery: JSON.stringify(attestation({ issuedAt: iso(now - 47 * 3600000), expiresAt: iso(now - 60000) })) });
    holder.stdin.end('commit;\n');
    await new Promise(res => holder.once('exit', res));
    r = await pending;
    assert.deepEqual([r.report.outcome, r.report.code], ['STOP', 'unavailable']);
    assert.equal(r.report.counts, undefined);
    assert.equal(authorized(), 1, 'first verify passed and the slot connected');
    assert.equal(state(), ungraded, 'no claim after the attestation changed');
    evidence.push('verifier-re-read-mid-run-stops-before-claim');

    // 11. One bounded run grades exactly one synthetic v1 attempt as assess_job_b and exits.
    inputs({ config: goodConfig, recovery: good });
    r = await worker();
    assert.equal(r.code, 0, JSON.stringify(r.report));
    assert.equal(r.report.outcome, 'COMPLETE');
    assert.deepEqual(r.report.counts, { graded: 1, failed: 0, expired: 0, purged: 0, healthFailed: 0, alert: 0, overdue: 0, purgeDue: 0 });
    assert.ok(r.milliseconds < 60000);
    assert.equal(state(), `${id(101)}:graded:true,${id(102)}:grading:false`);
    assert.equal(su(`select earned_n::text||'/'||earned_d::text from assess.results where session_id='${id(101)}'`).replace(/\.0+(?=\/|$)/g, ''),
      `${expected.numerator}/${expected.denominator}`);
    assert.equal(su(`select count(*) from assess.session_details where session_id='${id(101)}'`), '0');
    assert.equal(authorized(), 2);
    assert.equal(su("select count(*) from pg_stat_activity where usename='assess_job_b'"), '0', 'the run exited and closed its session');
    assert.equal(su('select enabled from assess.launch_gate'), 'f');
    evidence.push('one-bounded-run-graded-exactly-one-as-assess_job_b-tls-scram');
    console.log(JSON.stringify({ contract: 'rad085-grading-image-rehearsal/1', outcome: 'PASS', manifestSha256, localImageId: info.Id,
      evidence, providerVerified: false, runtimeOrLaunchVerified: false }));
  } finally {
    for (const name of owned) if (!name.startsWith('volume:')) try { docker(['rm', '-f', '-v', name]); } catch { /* best effort */ }
    for (const name of owned) if (name.startsWith('volume:')) try { docker(['volume', 'rm', '-f', name.slice(7)]); } catch { /* best effort */ }
    if (networkCreated) try { docker(['network', 'rm', network]); } catch { /* best effort */ }
    if (imageBuilt) try { docker(['image', 'rm', '-f', image]); } catch { /* best effort */ }
    rmSync(dir, { recursive: true, force: true });
  }
});
