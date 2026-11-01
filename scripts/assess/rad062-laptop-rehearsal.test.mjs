// Required real-image synthetic backup; no provider data or credentials, no skip.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apply } from './rad062-db-day.mjs';
import { containerArgs } from '../ops/laptop-restore-test.mjs';
import { sha256Bytes, Stop } from '../ops/laptop-backup-lib.mjs';
import { localOnly, rehearse, stopLine, stageStop, verifyCounts, prepareSocketAuth, prepareDatabaseOwner, verifyRestoredFrozenB, inspectRestored, main, observeSyntheticQueries } from './rad062-laptop-rehearsal.mjs';
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
  for (const stage of ['restore:roles', 'restore:restore', 'restore:counts', 'restore:rehearsal', 'connect', 'invalid_names', 'capacity']) {
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

test('socket-auth command failure retains SQLSTATE and discards the generated credential and stderr', () => {
  let credential;
  const run = (_program, _args, opts) => {
    if (opts.input.includes('alter role postgres password')) {
      credential = /password '([0-9a-f]+)'/.exec(opts.input)[1];
      throw Object.assign(new Error('PRIVATE_MESSAGE ' + credential), { stderr: 'ERROR:  42501: PRIVATE_HOST ' + credential });
    }
    return opts.input.includes('auth_method') ? 't' : '{}';
  };
  assert.throws(() => prepareSocketAuth(run, 'synthetic', 'rad_restore'), e => {
    assert.equal(stopLine(e), 'STOP rad062_laptop_rehearsal:socket_auth sqlstate=42501');
    assert.doesNotMatch(JSON.stringify(e) + e.message, new RegExp(credential + '|PRIVATE_MESSAGE|PRIVATE_HOST'));
    return true;
  });
});

test('temporary database owner correction preserves non-superuser postgres attributes and memberships', () => {
  for (const drift of [null, 'superuser', 'attributes_or_memberships', 'target_owner']) {
    let snapshots = 0, altered = false;
    const run = (_program, args, opts) => {
      assert.equal(args[0], 'exec'); assert.equal(args[args.indexOf('-U') + 1], 'supabase_admin');
      assert.equal(args[args.indexOf('-d') + 1], 'rad_restore');
      const sql = opts.input;
      assert.doesNotMatch(sql, /grant |alter role|create role|set role/i);
      if (sql.startsWith('select jsonb_build_object')) return ++snapshots > 1 && drift === 'attributes_or_memberships' ? 'CHANGED' : 'SNAPSHOT';
      if (sql.includes('not rolsuper')) return altered && drift === 'superuser' ? 'f' : 't';
      if (sql.startsWith('alter database')) { assert.equal(sql, 'alter database rad_restore owner to postgres;'); altered = true; return ''; }
      if (sql.includes("='postgres'")) return drift === 'target_owner' ? 'f' : 't';
      return 't';
    };
    if (drift) assert.throws(() => prepareDatabaseOwner(run, 'synthetic', 'rad_restore'), e => stopLine(e) === 'STOP rad062_laptop_rehearsal:database_owner');
    else assert.deepEqual(prepareDatabaseOwner(run, 'synthetic', 'rad_restore'), { database_owner_postgres: 1, postgres_role_unchanged: 1 });
    assert.equal(altered, true);
  }
  assert.throws(() => prepareDatabaseOwner(() => { throw Error('must not execute'); }, 'synthetic', 'postgres'), e => stopLine(e) === 'STOP rad062_laptop_rehearsal:database_owner');
});

test('restored frozen B row contract rejects zero/additional/wrong failures, nulls, missing/duplicate/unknown kinds', () => {
  const kinds = ['columns', 'constraints', 'effective_privileges', 'functions', 'indexes', 'relations', 'triggers',
    'schema', 'fk_inventory', 'role_attributes', 'role_memberships', 'scope_lock', 'sharing_policy:initialized'];
  const rows = kinds.map(kind => ({ kind, ready: kind !== 'relations' }));
  assert.equal(verifyRestoredFrozenB({ rows }), 1);
  assert.equal(verifyRestoredFrozenB([{ rows: [] }, { rows: [...rows].reverse() }, { rows: [] }]), 1);
  const stop = e => stopLine(e) === 'STOP rad062_laptop_rehearsal:pre_frozen_b';
  for (const bad of [
    rows.map(row => ({ ...row, ready: true })), // Zero failures is drift too.
    rows.map(row => row.kind === 'functions' ? { ...row, ready: false } : row),
    rows.map(row => ({ ...row, ready: row.kind !== 'functions' })),
    ...kinds.map(kind => rows.map(row => row.kind === kind ? { ...row, ready: null } : row)),
    rows.map(row => row.kind === 'relations' ? { ...row, ready: 'false' } : row),
    rows.slice(1), [...rows, rows[0]], [rows[0], ...rows.slice(0, -1)],
    [...rows.slice(1), { kind: 'unknown', ready: true }], [], [null],
  ]) assert.throws(() => verifyRestoredFrozenB({ rows: bad }), stop);
});

test('restored frozen B SQL error remains pre_frozen_b even if rollback also fails', async () => {
  const diagnosticSQL = readFileSync('scripts/assess/sql/rad062-b-diagnostic.sql', 'utf8');
  const frozenSQL = readFileSync('supabase/checks/rad085-p1-b-ready.sql', 'utf8');
  const db = { query: async sql => {
    if (sql.includes('select current_user, session_user')) return { rows: [{ current_user: 'postgres', session_user: 'postgres', rolsuper: false, phase: 'initialized' }] };
    if (sql === diagnosticSQL) return { rows: [{ ready: true }] };
    if (sql === frozenSQL) throw Object.assign(new Error('PRIVATE_SQL_MESSAGE'), { code: '42501' });
    throw Object.assign(new Error('PRIVATE_ROLLBACK_MESSAGE'), { code: '08006' });
  } };
  await assert.rejects(inspectRestored(db), e => stopLine(e) === 'STOP rad062_laptop_rehearsal:pre_frozen_b sqlstate=42501');
});

test('synthetic diagnostics capture driver fields before helpers redact; main has no opt-in path', async () => {
  const error = Object.assign(new Error('PRIVATE_MESSAGE'), { code: '42501', detail: 'PRIVATE_DETAIL', hint: 'PRIVATE_HINT', where: 'PRIVATE_WHERE', position: '42' });
  const records = [];
  const db = { query: async () => { throw error; } };
  observeSyntheticQueries(db, value => records.push(value));
  await assert.rejects(db.query('synthetic statement'), e => e === error);
  assert.deepEqual(records, [{ source: 'query', sqlstate: '42501', message: 'PRIVATE_MESSAGE', detail: 'PRIVATE_DETAIL', hint: 'PRIVATE_HINT', where: 'PRIVATE_WHERE', position: '42', internalPosition: null, internalQuery: null }]);
  assert.equal(stopLine(stageStop('M01', error)), 'STOP rad062_laptop_rehearsal:M01 sqlstate=42501');
  // main's only options object contains env; no callback, flag, or env lookup can select diagnostics.
  assert.match(main.toString(), /return rehearse\(loadConfig\(\), \{ env \}\)/);
  const bootstrap = `
    import fs from 'node:fs';
    import { syncBuiltinESMExports } from 'node:module';
    import { resolve } from 'node:path';
    import { pathToFileURL } from 'node:url';
    fs.lstatSync = () => { throw Object.assign(new Error('PRIVATE_MESSAGE'), { code: '42501', detail: 'PRIVATE_DETAIL' }); };
    syncBuiltinESMExports();
    process.argv[1] = resolve('scripts/assess/rad062-laptop-rehearsal.mjs');
    await import(pathToFileURL(process.argv[1]).href);
  `;
  const configFailure = spawnSync(process.execPath, ['--input-type=module', '-e', bootstrap], {
    encoding: 'utf8', env: { ...process.env, PGHOST: 'localhost', CI: 'true', SYNTHETIC_DIAGNOSTICS: 'true', RAD062_VERBOSE: 'true' },
  });
  assert.equal(configFailure.status, 1); assert.equal(configFailure.stdout, '');
  assert.equal(configFailure.stderr.trim(), 'STOP rad062_laptop_rehearsal:internal sqlstate=42501');
  for (const args of [[], ['--synthetic-diagnostics']]) {
    const r = spawnSync(process.execPath, ['scripts/assess/rad062-laptop-rehearsal.mjs', ...args], {
      encoding: 'utf8', env: { ...process.env, CI: 'true', SYNTHETIC_DIAGNOSTICS: 'true', RAD062_VERBOSE: 'true', PGHOST: 'PRIVATE_MESSAGE', PGPASSWORD: 'PRIVATE_DETAIL' },
    });
    assert.equal(r.status, 1); assert.equal(r.stdout, '');
    assert.equal(r.stderr.trim(), 'STOP rad062_laptop_rehearsal:selectors');
  }
});

test('apply keeps its fixed message and only safe label/SQLSTATE properties on driver failure', async () => {
  const driverError = Object.assign(new Error('PRIVATE_MESSAGE'), { code: '42501', detail: 'PRIVATE_DETAIL' });
  let rollback = 0;
  const db = { query: async sql => {
    if (sql === 'rollback') { rollback++; return { rows: [] }; }
    if (sql.includes('gate_rows')) return { rows: [{ gate_rows: 1, open_gates: 0, login_roles: 0, open_assignments: 0, worker_connections: 0, unsettled_sessions: 0 }] };
    if (sql.startsWith('begin read only')) return { rows: [] };
    if (sql.startsWith('select version')) return { rows: [] };
    throw driverError;
  } };
  await assert.rejects(apply(db, 'M01', { RAD062_SECRET_STATE: 'DISABLED' }), e => {
    assert.equal(e.message, 'apply_failed_or_ack_uncertain');
    assert.deepEqual({ ...e }, { label: 'apply_failed_or_ack_uncertain', sqlstate: '42501' });
    assert.equal(e.cause, undefined);
    assert.doesNotMatch(JSON.stringify(e) + e.message, /PRIVATE_/);
    return true;
  });
  assert.equal(rollback, 2); // read-only preflight, then failed migration.
});

test('pinned Supabase restore -> postgres M01–M08 -> individual P10 checks/counts; check and migration STOP both tear down', { timeout: 300000 }, async () => {
  const root = mkdtempSync(join(tmpdir(), 'rad062-backup-')), name = `rad062-source-${process.pid}`;
  const stamp = '20261101T050000Z', dir = join(root, 'store', stamp), target = `rad-restore-${stamp.toLowerCase()}`;
  // Read-only synthetic evidence: no object identities, grants, owner repairs, or provider access.
  const privilegeSQL = `select json_build_object(
    'database_owned_by_postgres', d.datdba=(select oid from pg_roles where rolname='postgres'),
    'public_owned_by_database_owner', n.nspowner=(select oid from pg_roles where rolname='pg_database_owner'),
    'public_owned_by_postgres', n.nspowner=(select oid from pg_roles where rolname='postgres'),
    'postgres_can_create_public', has_schema_privilege('postgres','public','CREATE'))
    from pg_database d cross join pg_namespace n where d.datname=current_database() and n.nspname='public';`;
  const syntheticDiagnostics = process.env.CI === 'true' ? error => {
    console.log(JSON.stringify(error));
    if (error.source === 'query' && error.sqlstate === '42501') {
      try {
        const json = String(docker(['exec', '-i', target, 'psql', '-X', '-At', '-v', 'ON_ERROR_STOP=1', '-U', 'supabase_admin', '-d', 'rad_restore', '-f', '-'], privilegeSQL));
        console.log(JSON.stringify({ restored_privileges: JSON.parse(json) }));
      } catch { console.log(JSON.stringify({ restored_privilege_probe_pass: 0 })); }
    }
  } : undefined;
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
    if (process.env.CI === 'true') console.log(JSON.stringify({ source_privileges: JSON.parse(q(privilegeSQL)) }));
    save(); symlinkSync('store/' + stamp, join(root, 'daily')); sourceVolumes = volumes();
    const result = await rehearse(c, { env, syntheticDiagnostics, observeFrozenB: kinds => console.log(JSON.stringify(kinds)) }).finally(absent);
    assert.equal(result.rehearsal_pass, 1); assert.equal(result.teardown_pass, 1);
    assert.equal(result.event_triggers_second_pass_count, 1);
    assert.equal(result.database_owner_postgres, 1); assert.equal(result.postgres_role_unchanged, 1);
    assert.equal(result.postgres_non_superuser, 1); assert.equal(result.migrations_committed, 8);
    assert.equal(result.pre_m01_frozen_b_ready, 0); assert.equal(result.pre_m01_frozen_b_failures, 1); assert.equal(result.pre_m01_diagnostic_ready, 1);
    assert.equal(result.transition_inspections_passed, 2); assert.ok(result.checks_passed > 0);
    assert.ok(Object.values(result).every(v => /^\d+$/.test(String(v)))); absent();
    q('update assess.sharing_policy set required_version=null,text_digest=null'); save();
    await assert.rejects(rehearse(c, { env, syntheticDiagnostics }), e => stopLine(e) === 'STOP rad062_laptop_rehearsal:pre_diagnostic'); absent();
    q(readFileSync('supabase/manual/rad085-sharing-policy-live-p1.sql', 'utf8'));
    // Outside the checked Assess catalogue; fails the actual M01 DDL as postgres.
    q(`create function public.synthetic_deny_m01() returns event_trigger language plpgsql as $$begin
      if current_query() like '%rad062_valid_full_name%' then raise exception 'PRIVATE_FAILURE_CANARY'; end if; end$$;
      create event trigger synthetic_m01_stop on ddl_command_start execute function public.synthetic_deny_m01();`);
    save();
    await assert.rejects(rehearse(c, { env, syntheticDiagnostics }), e => stopLine(e) === 'STOP rad062_laptop_rehearsal:M01 sqlstate=P0001'); absent();
  } finally { try { docker(['rm', '-f', '-v', name]); } finally { rmSync(root, { recursive: true, force: true }); } }
});
