// Synthetic owner step 3, using the real rehearsal and pinned restore without mocks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rehearseM09 } from '../assess/rad062-m09-rehearsal.mjs';
import { localOnly } from '../assess/rad062-laptop-rehearsal.mjs';
import { verifyMigrations } from '../assess/rad062-db-day.mjs';
import { containerArgs, IMAGE_DIGEST } from '../ops/laptop-restore-test.mjs';
import { loadConfig, readEntries, sha256Bytes, stamp, Stop, verifyBackup } from '../ops/laptop-backup-lib.mjs';

const locale = { datlocprovider: 'i', datlocale: 'en-US', datcollate: 'en_US.UTF-8', datctype: 'en_US.UTF-8' };
const read = file => readFileSync(file, 'utf8');
const sourceSnapshotSQL = `select jsonb_build_object(
  'functions',(select jsonb_agg(to_jsonb(p) order by oid) from pg_proc p where pronamespace='assess'::regnamespace),
  'foreign_keys',(select jsonb_agg(to_jsonb(k) order by oid) from pg_constraint k where contype='f'),
  'witness',(select jsonb_agg(n) from public.backup_witness))`;
const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (key.startsWith('PG') || ['DATABASE_URL', 'SUPABASE_DB_URL', 'RAD062_EXPECTED_PROJECT_REF', 'RAD062_POOLER_HOST',
    'DOCKER_HOST', 'DOCKER_CONTEXT', 'DOCKER_TLS', 'DOCKER_TLS_VERIFY', 'DOCKER_CERT_PATH'].includes(key)) delete env[key];
}
const dockerArgs = args => ['--host=unix:///var/run/docker.sock', ...args];
const docker = (args, input) => execFileSync('docker', dockerArgs(args), {
  env, input, stdio: 'pipe', timeout: 120000, maxBuffer: 64 * 1024 * 1024,
});

// Wait for the final server's readiness log after image initialization, once.
// Following the log avoids a new polling/retry loop or a fixed startup sleep.
function sourceReady(name) {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', dockerArgs(['logs', '--follow', '--timestamps', name]), { env, timeout: 120000 });
    const output = { stdout: '', stderr: '' };
    let ready = false;
    const observe = (stream, chunk) => {
      output[stream] += chunk;
      const logs = output.stdout + '\n' + output.stderr;
      // stdout/stderr chunks may arrive out of order; compare daemon timestamps.
      const initialized = /^(\S+) .*PostgreSQL init process complete; ready for start up\./m.exec(logs)?.[1];
      const servers = [...logs.matchAll(/^(\S+) .*database system is ready to accept connections/gm)];
      if (initialized && servers.some(m => m[1] > initialized)) {
        ready = true;
        child.kill();
      }
    };
    child.stdout.on('data', chunk => observe('stdout', chunk));
    child.stderr.on('data', chunk => observe('stderr', chunk));
    child.on('error', reject);
    child.on('close', () => ready ? resolve() : reject(Error('STOP synthetic_source_ready')));
  });
}

const containers = () => String(docker(['ps', '-a', '--format', '{{.Names}}'])).trim().split('\n');
const volumes = () => String(docker(['volume', 'ls', '--format', '{{.Name}}'])).trim().split('\n');
const scratch = () => readdirSync(tmpdir()).filter(n => n.startsWith('rad062-m09-restore-')).sort();
function removed(name, ownedVolumes) {
  assert.ok(!containers().includes(name), 'container must be removed');
  const remaining = volumes();
  for (const volume of ownedVolumes) assert.ok(!remaining.includes(volume), 'anonymous volume must be removed');
}

// Read completed daemon events to identify only this target's anonymous volumes.
// Global volume equality would race other docs:test files running concurrently.
function restoredVolumes(name, since, until) {
  const events = String(docker(['events', '--since', since, '--until', until,
    '--filter', 'type=container', '--filter', 'type=volume', '--format', '{{json .}}']))
    .trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
  const created = events.filter(e => e.Type === 'container' && e.Action === 'create' && e.Actor.Attributes.name === name);
  assert.equal(created.length, 1, 'the real restore container must have been created');
  const mounted = [...new Set(events.filter(e => e.Type === 'volume' && e.Action === 'mount' &&
    e.Actor.Attributes.container === created[0].Actor.ID).map(e => e.Actor.ID))];
  assert.ok(mounted.length > 0, 'observe the real restore data volume');
  return mounted;
}

test('M09 CLI refuses selectors before reading configuration and redacts output', () => {
  const cases = [['--live'], ['latest'], ['--host', 'PRIVATE_HOST_CANARY'], ['--session-pooler']].map(args => ({ args, selectors: {} }));
  for (const selectors of [{ PGHOST: 'PRIVATE_HOST_CANARY' }, { DATABASE_URL: 'PRIVATE_URL_CANARY' }]) cases.push({ args: [], selectors });
  for (const { args, selectors } of cases) {
    assert.throws(() => localOnly(args, { ...env, ...selectors }), e => e instanceof Stop && e.stage === 'selectors');
    const result = spawnSync(process.execPath, ['scripts/assess/rad062-m09-rehearsal.mjs', ...args], {
      encoding: 'utf8', timeout: 15000, env: { ...env, ...selectors, PGPASSWORD: 'PRIVATE_PASSWORD_CANARY' },
    });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr.trim(), 'STOP rad062_m09_rehearsal; inspect locally with the owner; no live action authorized');
  }
});

test('encrypted synthetic M08 -> rehearseM09 PASS; M07 -> STOP; both restore targets tear down', { timeout: 300000 }, async t => {
  const started = performance.now();
  const root = mkdtempSync(join(tmpdir(), 'rad062-m09-witness-'));
  const name = `rad062-m09-source-${process.pid}-${root.split('-').at(-1).toLowerCase()}`;
  const identity = join(root, 'identity'), backupRoot = join(root, 'backups');
  const stopStamp = stamp(), passStamp = stamp(new Date(Date.now() + 1000));
  let sourceStarted = false, sourceVolumes = [];
  const q = (sql, user = 'postgres') => String(docker(['exec', '-i', name, 'psql', '-X', '-At', '-v', 'ON_ERROR_STOP=1',
    '-U', user, '-d', 'synthetic', '-f', '-'], sql)).trim();
  try {
    writeFileSync(identity, execFileSync('age-keygen', [], { stdio: 'pipe', timeout: 15000 }), { mode: 0o600 });
    mkdirSync(backupRoot, { mode: 0o700 });
    const configPath = join(root, 'config.json');
    writeFileSync(configPath, JSON.stringify({ backupRoot, ageRecipient: String(execFileSync('age-keygen', ['-y', identity])).trim(),
      projectRef: 'a'.repeat(20), endpoint: 'direct', caFile: join(root, 'synthetic-ca.crt'), pgMajor: 17 }), { mode: 0o600 });
    // Explicit temporary path: never load or write the owner's default config.
    const config = loadConfig(configPath);
    docker(containerArgs(name, locale)); sourceStarted = true;
    sourceVolumes = JSON.parse(String(docker(['inspect', name])))[0].Mounts.filter(m => m.Type === 'volume').map(m => m.Name);
    assert.ok(sourceVolumes.length > 0);
    await sourceReady(name);
    docker(['exec', name, 'pg_isready', '-U', 'supabase_admin', '-d', 'postgres']);
    docker(['exec', name, 'createdb', '-U', 'supabase_admin', '-O', 'postgres', '-T', 'template0', '--encoding=UTF8',
      '--locale-provider=icu', '--icu-locale=en-US', '--lc-collate=en_US.UTF-8', '--lc-ctype=en_US.UTF-8', 'synthetic']);
    assert.equal(q('show server_version_num'), '170011');
    assert.deepEqual(JSON.parse(q(`select json_build_object('datlocprovider',datlocprovider,'datlocale',datlocale,
      'datcollate',datcollate,'datctype',datctype) from pg_database where datname=current_database()`)), locale);
    assert.equal(q("select rolsuper from pg_roles where rolname=current_user"), 'f');
    q(`create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb,banned_until timestamptz);
      create table auth.sessions(user_id uuid); create table auth.refresh_tokens(user_id uuid);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
    for (const file of readdirSync('supabase/migrations').filter(f => f.endsWith('.sql') && f < '20261030000100').sort()) {
      q(read('supabase/migrations/' + file));
    }
    q(read('supabase/manual/rad085-sharing-policy-live-p1.sql'));
    q(`create role assess_job_a nologin; create role assess_job_b nologin;
      create table public.backup_witness(n integer); insert into public.backup_witness values(1);`);
    const migrations = verifyMigrations(); // The frozen eight-file package works before and after M09 promotion.
    for (const file of migrations.slice(0, 7)) q(read('supabase/migrations/' + file));
    assert.equal(q("select to_regprocedure('assess.health_v2()') is null"), 't');
    assert.match(q(read('supabase/checks/rad062-ready.sql')), /^functions\|f$/m, 'STOP fixture must fail the M08 guard');

    const save = async at => {
      const dump = docker(['exec', name, 'pg_dump', '-U', 'supabase_admin', '-d', 'synthetic', '-Fc']);
      const roles = docker(['exec', name, 'pg_dumpall', '-U', 'supabase_admin', '--roles-only', '--no-role-passwords']);
      const dir = join(backupRoot, 'store', at), sealed = join(root, 'sealed', at);
      mkdirSync(dir, { recursive: true, mode: 0o700 }); mkdirSync(sealed, { recursive: true, mode: 0o700 });
      // RAD-086 restore consumes private plaintext files and encrypts reconciliation.
      // Also exercise a real age round trip of the synthetic backup, without a provider.
      for (const [file, bytes] of [
        ['project.dump', dump], ['roles.sql', roles],
        ['checksums.json', JSON.stringify({ 'project.dump': sha256Bytes(dump), 'roles.sql': sha256Bytes(roles) })],
        ['db-meta.json', JSON.stringify({ ...locale, encoding: 'UTF8', server_version_num: 170011, tables: [['public', 'backup_witness', 1]] })],
      ]) {
        const encrypted = execFileSync('age', ['-r', config.ageRecipient], { input: bytes, timeout: 30000, maxBuffer: 64 * 1024 * 1024 });
        const path = join(sealed, file + '.age');
        writeFileSync(path, encrypted, { mode: 0o600 });
        assert.match(String(encrypted.subarray(0, 22)), /^age-encryption.org\/v1/);
        const decrypted = execFileSync('age', ['-d', '-i', identity, path], { timeout: 30000, maxBuffer: 64 * 1024 * 1024 });
        assert.deepEqual(decrypted, Buffer.from(bytes));
        writeFileSync(join(dir, file), decrypted, { mode: 0o600 });
      }
      assert.equal((await verifyBackup(dir)).files, 2);
    };
    await save(stopStamp);
    q(read('supabase/migrations/' + migrations[7]));
    const readiness = q(read('supabase/checks/rad062-ready.sql')).split('\n');
    assert.equal(readiness.length, 6); assert.ok(readiness.every(row => row.endsWith('|t')));
    await save(passStamp);
    const sourceSnapshot = q(sourceSnapshotSQL);

    const run = async (at, stop) => {
      const daily = join(backupRoot, 'daily');
      rmSync(daily, { force: true }); symlinkSync('store/' + at, daily);
      const beforeScratch = scratch(), since = new Date().toISOString();
      try {
        if (stop) await assert.rejects(rehearseM09(config, env), e => e instanceof Stop && e.stage === 'rehearsal');
        else assert.deepEqual(await rehearseM09(config, env), {
          m09_committed: 1, pre_m08_ready: 1, post_m09_ready: 1, anchor_rollbacks: 2, foreign_keys_unchanged: 1, teardown_pass: 1,
        });
      } finally {
        const target = `rad-restore-${at.toLowerCase()}`;
        removed(target, restoredVolumes(target, since, new Date().toISOString()));
        assert.deepEqual(scratch(), beforeScratch, 'rehearsal temporary socket directory must be removed');
      }
      const entries = readEntries(config, identity), entry = entries.at(-1);
      assert.equal(entries.length, stop ? 2 : 1);
      assert.equal(entry.kind, 'restore_test'); assert.equal(entry.dir, at);
      assert.equal(entry.result, stop ? 'fail' : 'pass');
      assert.equal(entry.image_digest, IMAGE_DIGEST);
      if (stop) {
        // Restore/counts succeeded; the M07 catalogue was refused inside the callback,
        // at the M08 readiness guard before M09 can commit. No success is recorded.
        assert.equal(entry.stage, 'rehearsal');
        assert.equal(entries.some(e => e.dir === at && e.result === 'pass'), false);
      } else {
        assert.equal(entry.collation_match, 1); assert.equal(entry.tables_compared, 1);
        assert.equal(entry.tables_mismatched, 0); assert.equal(entry.rows_restored, 1);
        assert.equal(entry.container_server_version_num, 170011);
      }
      assert.equal(q(sourceSnapshotSQL), sourceSnapshot);
    };
    await run(passStamp, false);
    await run(stopStamp, true);
  } finally {
    try { if (sourceStarted) docker(['rm', '-f', '-v', name]); }
    finally { rmSync(root, { recursive: true, force: true }); }
    if (sourceStarted) removed(name, sourceVolumes);
    assert.equal(existsSync(root), false, 'synthetic store, config, identity and encrypted artifacts must be removed');
    t.diagnostic(`Elapsed ${((performance.now() - started) / 1000).toFixed(3)}s (includes setup and teardown; a failure is not a runtime pass)`);
  }
});
