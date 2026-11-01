// Required real-image synthetic backup; no provider data or credentials, no skip.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { containerArgs } from '../ops/laptop-restore-test.mjs';
import { sha256Bytes, Stop } from '../ops/laptop-backup-lib.mjs';
import { localOnly, rehearse, stopLine, stageStop, verifyCounts } from './rad062-laptop-rehearsal.mjs';
const docker = (args, input) => execFileSync('docker', ['--host=unix:///var/run/docker.sock', ...args], { input, stdio: 'pipe', timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
const locale = { datlocprovider: 'i', datlocale: 'en-US', datcollate: 'en_US.UTF-8', datctype: 'en_US.UTF-8' };

test('refuses all CLI selectors and non-loopback hosts before config, with redacted STOP', () => {
  for (const host of ['db.invalid', '/tmp/provider-forward', '127.0.0.1.evil', 'service=live']) assert.throws(() => localOnly([], { PGHOST: host }), Stop);
  for (const host of ['localhost', '127.0.0.1', '::1']) localOnly([], { PGHOST: host });
  for (const arg of ['--live', 'latest', '--host', '--session-pooler']) assert.throws(() => localOnly([arg], {}), Stop);
  const r = spawnSync(process.execPath, ['scripts/assess/rad062-laptop-rehearsal.mjs', '--live'], { encoding: 'utf8', env: { ...process.env, PGHOST: 'PRIVATE_HOST_CANARY', PGPASSWORD: 'PRIVATE_PASSWORD_CANARY' } });
  assert.equal(r.status, 1); assert.equal(r.stdout, ''); assert.equal(r.stderr.trim(), 'STOP rad062_laptop_rehearsal:selectors');
});

test('STOP preserves only known stages and SQLSTATE/errno classes, never messages or data', () => {
  for (const stage of ['restore:roles', 'restore:restore', 'restore:counts', 'connect', 'invalid_names', 'capacity']) {
    const error = stageStop(stage, { code: '28000', message: 'PRIVATE_CANARY host/password/data' });
    assert.equal(stopLine(error), 'STOP rad062_laptop_rehearsal:' + stage + ' sqlstate=28000');
  }
  assert.equal(stopLine(stageStop('connect', { code: 'ECONNREFUSED' })), 'STOP rad062_laptop_rehearsal:connect errno=ECONNREFUSED');
  assert.equal(stopLine(stageStop('connect', { code: 'PRIVATE_CANARY' })), 'STOP rad062_laptop_rehearsal:connect');
  assert.equal(stopLine(stageStop('PRIVATE_CANARY', { code: 'PRIVATE_CANARY' })), 'STOP rad062_laptop_rehearsal:internal');
});

test('invalid restored names stop separately from quota/capacity, without printing counts or values', () => {
  const counts = { invalid_name_profiles: 0, authors_above_three_drafts: 0, database_bytes: 10000000, reserved_peak_bytes: 0 };
  verifyCounts(counts);
  assert.throws(() => verifyCounts({ ...counts, invalid_name_profiles: 1 }), e => stopLine(e) === 'STOP rad062_laptop_rehearsal:invalid_names');
  assert.throws(() => verifyCounts({ ...counts, database_bytes: 300000000 }), e => stopLine(e) === 'STOP rad062_laptop_rehearsal:capacity');
});

test('pinned Supabase restore -> postgres M01–M08 -> individual P10 checks/counts; check and migration STOP both tear down', { timeout: 300000 }, async () => {
  const root = mkdtempSync(join(tmpdir(), 'rad062-backup-')), name = `rad062-source-${process.pid}`;
  const stamp = '20261101T050000Z', dir = join(root, 'store', stamp), target = `rad-restore-${stamp.toLowerCase()}`;
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const identity = join(root, 'identity');
  writeFileSync(identity, execFileSync('age-keygen', [], { stdio: 'pipe' }), { mode: 0o600 });
  const c = { backupRoot: root, ageRecipient: String(execFileSync('age-keygen', ['-y', identity])).trim() };
  // These inherited selectors never choose a database; production explicitly selects its private socket.
  const env = { ...process.env }; for (const key of Object.keys(env)) if (key.startsWith('PG') || ['DATABASE_URL', 'SUPABASE_DB_URL', 'RAD062_EXPECTED_PROJECT_REF', 'RAD062_POOLER_HOST'].includes(key)) delete env[key];
  const q = (sql, user = 'postgres') => String(docker(['exec', '-i', name, 'psql', '-X', '-At', '-v', 'ON_ERROR_STOP=1', '-U', user, '-d', 'synthetic', '-f', '-'], sql)).trim();
  let sourceVolumes;
  const volumes = () => String(docker(['volume', 'ls', '--format', '{{.Name}}'])).trim().split('\n').sort();
  const absent = () => {
    assert.equal(String(docker(['ps', '-a', '--filter', `name=^/${target}$`, '--format', '{{.Names}}'])).trim(), '');
    assert.deepEqual(volumes(), sourceVolumes);
  };
  const save = () => {
    const dump = docker(['exec', name, 'pg_dump', '-U', 'supabase_admin', '-d', 'synthetic', '-Fc']);
    const roles = docker(['exec', name, 'pg_dumpall', '-U', 'supabase_admin', '--roles-only', '--no-role-passwords']);
    for (const [file, bytes] of [['project.dump', dump], ['roles.sql', roles]]) writeFileSync(join(dir, file), bytes, { mode: 0o600 });
    writeFileSync(join(dir, 'checksums.json'), JSON.stringify({ 'project.dump': sha256Bytes(dump), 'roles.sql': sha256Bytes(roles) }), { mode: 0o600 });
    writeFileSync(join(dir, 'db-meta.json'), JSON.stringify({ ...locale, encoding: 'UTF8', server_version_num: 170011, tables: [['public', 'backup_witness', 1]] }), { mode: 0o600 });
  };
  try {
    docker(containerArgs(name, locale));
    for (let n = 0; ; n++) {
      if (n > 90) throw Error('STOP synthetic_ready');
      if (String(docker(['logs', name])).includes('PostgreSQL init process complete; ready for start up.')) {
        try { docker(['exec', name, 'pg_isready', '-U', 'supabase_admin', '-d', 'postgres']); break; } catch { /* bounded ready retry */ }
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    docker(['exec', name, 'createdb', '-U', 'supabase_admin', '-O', 'postgres', '-T', 'template0', '--encoding=UTF8', '--locale-provider=icu', '--icu-locale=en-US', '--lc-collate=en_US.UTF-8', '--lc-ctype=en_US.UTF-8', 'synthetic']);
    assert.equal(q("select rolsuper from pg_roles where rolname=current_user"), 'f');
    q(`create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb,banned_until timestamptz);
      create table auth.sessions(user_id uuid); create table auth.refresh_tokens(user_id uuid);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
    for (const file of readdirSync('supabase/migrations').filter(f => f.endsWith('.sql') && f < '20261030000100').sort()) q(readFileSync('supabase/migrations/' + file, 'utf8'));
    // Synthetic initialization only; the rehearsal never sets pre-initializer or replays initialization.
    q(readFileSync('supabase/manual/rad085-sharing-policy-live-p1.sql', 'utf8'));
    q(`create role assess_job_a nologin; create role assess_job_b nologin;
      create schema supabase_migrations; create table supabase_migrations.schema_migrations(version text primary key,name text,statements text[]);
      create table public.backup_witness(n integer); insert into public.backup_witness values(1);`);
    q('create extension supabase_vault', 'supabase_admin');
    q(`create function public.synthetic_event_fn() returns event_trigger language plpgsql as $$begin end$$;
      create event trigger synthetic_owner_event on ddl_command_end when tag in ('ALTER TABLE') execute function public.synthetic_event_fn();`);
    save(); symlinkSync('store/' + stamp, join(root, 'daily')); sourceVolumes = volumes();
    const result = await rehearse(c, { env });
    assert.equal(result.rehearsal_pass, 1); assert.equal(result.teardown_pass, 1);
    assert.equal(result.event_triggers_second_pass_count, 1);
    assert.equal(result.postgres_non_superuser, 1); assert.equal(result.migrations_committed, 8);
    assert.equal(result.pre_m01_frozen_b_ready, 1); assert.equal(result.pre_m01_diagnostic_ready, 1);
    assert.equal(result.transition_inspections_passed, 2); assert.ok(result.checks_passed > 0);
    assert.ok(Object.values(result).every(v => /^\d+$/.test(String(v)))); absent();
    q('update assess.sharing_policy set required_version=null,text_digest=null'); save();
    await assert.rejects(rehearse(c, { env }), e => stopLine(e) === 'STOP rad062_laptop_rehearsal:pre_diagnostic'); absent();
    q(readFileSync('supabase/manual/rad085-sharing-policy-live-p1.sql', 'utf8'));
    // Outside the checked Assess catalogue; fails the actual M01 DDL as postgres.
    q(`create function public.synthetic_deny_m01() returns event_trigger language plpgsql as $$begin
      if current_query() like '%rad062_valid_full_name%' then raise exception 'PRIVATE_FAILURE_CANARY'; end if; end$$;
      create event trigger synthetic_m01_stop on ddl_command_start execute function public.synthetic_deny_m01();`);
    save();
    await assert.rejects(rehearse(c, { env }), e => stopLine(e) === 'STOP rad062_laptop_rehearsal:M01'); absent();
  } finally { try { docker(['rm', '-f', '-v', name]); } finally { rmSync(root, { recursive: true, force: true }); } }
});
