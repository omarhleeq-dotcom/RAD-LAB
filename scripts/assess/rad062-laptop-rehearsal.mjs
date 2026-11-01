// Owner-only, latest RAD-086 backup -> isolated Supabase image -> postgres apply.
// No provider connection. Owner CLI never prints driver/restore errors or row payloads.
import { randomBytes } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, chmodSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir, constants } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Client } from 'pg';
import { IMAGE, restoreTest } from '../ops/laptop-restore-test.mjs';
import { loadConfig, Stop } from '../ops/laptop-backup-lib.mjs';
import { apply, checks, checkRows, manifest, readOnly, verifyMigrations } from './rad062-db-day.mjs';

export function localOnly(args, env) {
  if (args.length || (env.PGHOST && !['localhost', '127.0.0.1', '::1'].includes(env.PGHOST)) ||
    ['PGHOSTADDR', 'PGSERVICE', 'PGSERVICEFILE', 'DATABASE_URL', 'SUPABASE_DB_URL', 'RAD062_EXPECTED_PROJECT_REF', 'RAD062_POOLER_HOST'].some(k => env[k])) throw new Stop('selectors');
}
const errnoClasses = new Set(Object.keys(constants.errno));
const sqlstatePattern = /^(?:[0-9]{2}|0[A-Z]|[A-Z][0-9]|HV|XX)[0-9A-Z]{3}$/;
const rehearsalStage = /^(M0[1-8]|check_[0-9]{2}|selectors|socket_auth|connect|inspect|apply_role|pre_diagnostic|pre_frozen_b|transition|counts|invalid_names|capacity|teardown)$/;
const restoreStage = /^restore:(select|verify|meta|image|container|ready|version|extensions|roles|collation|restore|counts|rehearsal|log|locale)$/;
export function stageStop(stage, error) {
  const stop = new Stop(rehearsalStage.test(stage) || restoreStage.test(stage) ? stage : 'internal');
  const state = error?.sqlstate ?? error?.code;
  if (typeof state === 'string' && sqlstatePattern.test(state)) stop.sqlstate = state;
  const errno = [error?.errno, error?.code].find(value => errnoClasses.has(value));
  if (errno) stop.errno = errno;
  stop.message = 'STOP rad062_laptop_rehearsal:' + stop.stage + (stop.sqlstate ? ' sqlstate=' + stop.sqlstate : '') + (stop.errno ? ' errno=' + stop.errno : '');
  return stop;
}
export const stopLine = e => {
  const safe = e instanceof Stop && (rehearsalStage.test(e.stage) || restoreStage.test(e.stage));
  const code = stageStop(safe ? e.stage : 'internal', e);
  return code.message;
};
const diagnostic = 'scripts/assess/sql/rad062-b-diagnostic.sql';
const frozen = 'supabase/checks/rad085-p1-b-ready.sql';
const transitionKinds = ['columns', 'constraints', 'effective_privileges', 'functions', 'indexes', 'relations', 'triggers'];

// P9b restored-copy contract, measured on the pinned image in CI before encoding.
export function verifyRestoredFrozenB(result) {
  const rows = (Array.isArray(result) ? result : [result]).flatMap(r => r?.rows ?? []);
  const kinds = [...transitionKinds, 'schema', 'fk_inventory', 'role_attributes', 'role_memberships', 'scope_lock', 'sharing_policy:initialized'].sort();
  if (rows.length !== kinds.length || rows.some(row => !row || typeof row.kind !== 'string' || typeof row.ready !== 'boolean') ||
      JSON.stringify(rows.map(row => row.kind).sort()) !== JSON.stringify(kinds) ||
      JSON.stringify(rows.filter(row => row.ready === false).map(row => row.kind).sort()) !== JSON.stringify(['relations'])) throw new Stop('pre_frozen_b');
  return 1;
}

// Exported for synthetic witnesses. No alternate SQL, role, phase or check selectors.
export async function inspectRestored(db, observeFrozenB) {
  const identity = (await db.query("select current_user, session_user, rolsuper, current_setting('rad085.sharing_phase',true) phase from pg_roles where rolname=current_user")).rows[0];
  if (identity.current_user !== 'postgres' || identity.session_user !== 'postgres' || identity.rolsuper !== false || ![null, '', 'initialized'].includes(identity.phase)) throw new Stop('apply_role');
  try { await checks(db, [diagnostic]); } catch (e) { throw stageStop('pre_diagnostic', e); }
  let frozenFailures;
  try {
    const result = await db.query(readFileSync(frozen, 'utf8'));
    const rows = (Array.isArray(result) ? result : [result]).flatMap(r => r.rows ?? []);
    // Synthetic CI observer only: fixed check kinds, never catalogue identities or data.
    observeFrozenB?.(rows.filter(row => row.ready === false).map(row => row.kind).sort());
    frozenFailures = verifyRestoredFrozenB(result);
  } catch (e) {
    try { await db.query('rollback'); } catch { /* preserve the frozen-check stage and primary SQLSTATE */ }
    throw stageStop('pre_frozen_b', e);
  }
  let migrations = 0;
  for (let n = 1; n <= 8; n++) {
    try { await apply(db, `M0${n}`, { RAD062_SECRET_STATE: 'DISABLED' }); migrations++; }
    catch (e) { throw stageStop(`M0${n}`, e); }
  }
  let passed = 0;
  for (const file of manifest().checks) {
    try { await checks(db, [file]); passed++; } catch (e) { throw stageStop('check_' + String(passed + 1).padStart(2, '0'), e); }
  }
  for (const file of [frozen, diagnostic]) {
    const result = await db.query(readFileSync(file, 'utf8'));
    const rows = (Array.isArray(result) ? result : [result]).flatMap(r => r.rows ?? []);
    // Assert the entire result, including nulls, duplicates, and every other boolean.
    const kinds = [...transitionKinds, 'schema', 'fk_inventory', 'role_attributes', 'role_memberships', 'scope_lock', 'sharing_policy:initialized'].sort();
    if (JSON.stringify(rows.map(r => r.kind).sort()) !== JSON.stringify(kinds) || JSON.stringify(rows.filter(r => r.ready === false).map(r => r.kind).sort()) !== JSON.stringify(transitionKinds)) throw new Stop('transition');
    checkRows((Array.isArray(result) ? result : [result]).map(r => ({ ...r, rows: r.rows?.map(row => transitionKinds.includes(row.kind) ? { ...row, ready: row.ready === false } : row) })));
  }
  const counts = (await readOnly(db, readFileSync('scripts/assess/sql/rad062-precounts.sql', 'utf8'))).rows[0];
  verifyCounts(counts);
  return { pre_m01_diagnostic_ready: 1, pre_m01_frozen_b_ready: 0, pre_m01_frozen_b_failures: frozenFailures, postgres_non_superuser: 1,
    migrations_committed: migrations, checks_passed: passed, transition_inspections_passed: 2, ...counts };
}

export function verifyCounts(counts) {
  if (!counts || !Object.values(counts).every(v => /^\d+$/.test(String(v)))) throw new Stop('counts');
  if (Number(counts.invalid_name_profiles) !== 0) throw new Stop('invalid_names');
  // Existing capacity/quota STOPs: no automatic cleanup or acceptance of violations.
  if (Object.entries(counts).some(([k, v]) => !['database_bytes', 'reserved_peak_bytes', 'invalid_name_profiles'].includes(k) && Number(v) !== 0) ||
      Number(counts.database_bytes) + Number(counts.reserved_peak_bytes) >= 300000000) throw new Stop('capacity');
}

// Only the throwaway restored target changes: credential + one database/role-specific local HBA rule.
// No grants, SET ROLE, role attributes/config, memberships, object owners, or migration SQL change.
export function prepareSocketAuth(run, container, database) {
  const admin = input => String(run('docker', ['exec', '-i', container, 'psql', '-X', '-At', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose', '-U', 'supabase_admin', '-d', database, '-f', '-'],
    { input, encoding: 'utf8', stdio: 'pipe', timeout: 600000, maxBuffer: 1024 * 1024 })).trim();
  try {
    // database is the fixed restoreTest target, never an external selector.
    if (database !== 'rad_restore') throw new Stop('socket_auth');
    const localRule = `select auth_method='peer' and exists(select from unnest(options) o where o like 'map=%')
      from pg_hba_file_rules where type='local' and ('all'=any(database) or 'rad_restore'=any(database))
      and ('all'=any(user_name) or 'postgres'=any(user_name)) order by rule_number limit 1;`;
    if (admin(localRule) !== 't') throw new Stop('socket_auth');
    const roleSnapshot = `select jsonb_build_object('role',(select to_jsonb(r) from pg_roles r where rolname='postgres'),
      'memberships',(select coalesce(jsonb_agg(to_jsonb(m) order by roleid,member,grantor),'[]'::jsonb)
        from pg_auth_members m where (select oid from pg_roles where rolname='postgres') in (m.member,m.roleid)));`;
    const before = admin(roleSnapshot), loaded = admin('select pg_conf_load_time();');
    const password = randomBytes(32).toString('hex');
    // psql -f sends each statement separately: turn statement/error-payload logging off before the credential.
    // Nothing sensitive is put in argv, environment, files, output, or returned errors.
    admin(`set log_statement='none';
set log_min_error_statement='panic';
set password_encryption='scram-sha-256';
alter role postgres password '${password}';`);
    const hba = admin('show hba_file;');
    if (!/^\/[A-Za-z0-9_./-]+$/.test(hba) || hba.includes('..')) throw new Stop('socket_auth');
    run('docker', ['exec', '-i', '--user', '0', container, 'sh', '-s', '--', hba], { input: `set -eu
cp -p "$1" "$1.rad062"
{ printf '%s\n' 'local rad_restore postgres scram-sha-256'; cat "$1"; } > "$1.rad062"
mv "$1.rad062" "$1"
`, stdio: 'pipe', timeout: 600000 });
    if (admin('select pg_reload_conf();') !== 't' || admin('select pg_conf_load_time();') === loaded) throw new Stop('socket_auth');
    if (admin(`select count(*)=1 from pg_hba_file_rules where rule_number=1 and type='local'
      and database=array['rad_restore'] and user_name=array['postgres'] and auth_method='scram-sha-256' and error is null;`) !== 't' ||
        admin('select count(*)=0 from pg_hba_file_rules where error is not null;') !== 't' || admin(roleSnapshot) !== before) throw new Stop('socket_auth');
    return password;
  } catch (e) {
    const sqlstate = String(e.stderr ?? '').match(/\b(?:ERROR|FATAL):\s+([0-9A-Z]{5}):/)?.[1];
    throw stageStop('socket_auth', { code: sqlstate ?? e.code, errno: e.errno });
  }
}

// Explicit test-only callback, never selected by main(), arguments, or environment.
// The synthetic CI test supplies the sink; normal callers cannot opt in via selectors.
export function syntheticError(error) {
  return Object.fromEntries(['code', 'message', 'detail', 'hint', 'where', 'position', 'internalPosition', 'internalQuery']
    .map(key => [key === 'code' ? 'sqlstate' : key, error?.[key] ?? null]));
}
export function observeSyntheticQueries(db, syntheticDiagnostics) {
  if (!syntheticDiagnostics) return;
  const query = db.query.bind(db);
  db.query = async (...args) => {
    try { return await query(...args); }
    catch (e) { syntheticDiagnostics({ source: 'query', ...syntheticError(e) }); throw e; }
  };
}
export async function rehearse(c, { env = process.env, observeFrozenB, syntheticDiagnostics } = {}) {
  localOnly([], env); verifyMigrations();
  const root = mkdtempSync(join(tmpdir(), 'rad062-laptop-')), socket = join(root, 'socket');
  mkdirSync(socket); chmodSync(root, 0o700); chmodSync(socket, 0o777); // private parent; image UID can write only the bind-mounted child
  const dockerEnv = { ...env };
  for (const key of ['DOCKER_HOST', 'DOCKER_CONTEXT', 'DOCKER_TLS', 'DOCKER_TLS_VERIFY', 'DOCKER_CERT_PATH']) delete dockerEnv[key];
  let container, result, callbackFailure, commandFailure, cleanupFailed = false, authInProgress = false;
  const run = (program, args, opts = {}) => {
    if (program === 'pg_restore') {
      try { return execFileSync('docker', ['--host=unix:///var/run/docker.sock', 'run', '--rm', '-i', '--network=none', '--pull=never', '--entrypoint', 'pg_restore', IMAGE, '--list'],
        { ...opts, env: dockerEnv, input: readFileSync(args.at(-1)) }); }
      catch (e) { syntheticDiagnostics?.({ source: 'restore', stderr: String(e.stderr ?? ''), ...syntheticError(e) }); throw e; }
    }
    if (program !== 'docker') return execFileSync(program, args, opts);
    if (args[0] === 'run') {
      container = args[args.indexOf('--name') + 1];
      args = [...args.slice(0, -1), '--mount', `type=bind,src=${socket},dst=/var/run/postgresql`, args.at(-1)];
    }
    if (args[0] === 'rm') {
      // Image startup may chown/chmod the mounted socket directory (including sticky bit).
      // Return its ownership before removal so the private host directory can be deleted.
      try { execFileSync('docker', ['--host=unix:///var/run/docker.sock', 'exec', '--user', '0', container, 'chown', '-R', `${process.getuid()}:${process.getgid()}`, '/var/run/postgresql'], { env: dockerEnv, stdio: 'pipe', timeout: 15000 }); } catch { /* always attempt container/volume removal */ }
    }
    try { return execFileSync('docker', ['--host=unix:///var/run/docker.sock', ...args], { ...opts, env: dockerEnv }); }
    catch (e) { if (args[0] === 'rm') cleanupFailed = true; else { commandFailure = stageStop('internal', e); if (!authInProgress) syntheticDiagnostics?.({ source: 'restore', stderr: String(e.stderr ?? ''), ...syntheticError(e) }); } throw e; }
  };
  const spawn = (program, args, opts) => {
    const r = spawnSync(program, ['--host=unix:///var/run/docker.sock', ...args], { ...opts, env: dockerEnv });
    if (r.status !== 0) syntheticDiagnostics?.({ source: 'restore', stderr: String(r.stderr ?? ''), ...syntheticError(r.error) });
    return r;
  };
  try {
    const restored = await restoreTest(c, { name: 'latest', run, spawn, beforeTeardown: async ({ database }) => {
      let password;
      try { authInProgress = true; password = prepareSocketAuth(run, container, database); } catch (e) { callbackFailure = e; throw e; } finally { authInProgress = false; }
      const db = new Client({ host: socket, port: 5432, user: 'postgres', database, password, ssl: false,
        options: '', application_name: 'rad062-rehearsal', connectionTimeoutMillis: 10000, query_timeout: 120000 });
      db.on('error', () => {}); // Query/connect rejection carries STOP through finally; never emit raw idle errors.
      try {
        try { await db.connect(); } catch (e) { syntheticDiagnostics?.({ source: 'connect', ...syntheticError(e) }); throw stageStop('connect', e); }
        observeSyntheticQueries(db, syntheticDiagnostics);
        result = await inspectRestored(db, observeFrozenB);
      } catch (e) { callbackFailure = e instanceof Stop ? e : stageStop('inspect', e); throw callbackFailure; }
      finally {
        try { await db.end(); } catch (e) { if (!callbackFailure) { callbackFailure = stageStop('connect', e); throw callbackFailure; } }
      }
    } });
    if (cleanupFailed) throw new Stop('teardown');
    return { ...restored, ...result, rehearsal_pass: 1, teardown_pass: 1 };
  } catch (e) {
    if (callbackFailure) throw callbackFailure;
    if (e instanceof Stop && rehearsalStage.test(e.stage)) throw e;
    const stage = e instanceof Stop && restoreStage.test('restore:' + e.stage) ? 'restore:' + e.stage : 'internal';
    throw stageStop(stage, e.restoreDiagnostic ?? e.diagnostics?.[0] ?? commandFailure ?? e);
  } finally {
    // restoreTest owns normal cleanup; retry a failed removal, and never report pass.
    if (cleanupFailed && container) try { run('docker', ['rm', '-f', '-v', container]); } catch { /* STOP already retained */ }
    rmSync(root, { recursive: true, force: true });
  }
}
export async function main(args = process.argv.slice(2), env = process.env) {
  process.umask(0o077); localOnly(args, env);
  return rehearse(loadConfig(), { env });
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().then(r => console.log(JSON.stringify(r))).catch(e => { console.error(stopLine(e)); process.exitCode = 1; });
}
