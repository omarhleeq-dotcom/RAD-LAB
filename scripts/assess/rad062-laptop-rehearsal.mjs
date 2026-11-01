// Owner-only, latest RAD-086 backup -> isolated Supabase image -> postgres apply.
// No provider connection. Never print driver/restore errors or row payloads.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, chmodSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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
const diagnostic = 'scripts/assess/sql/rad062-b-diagnostic.sql';
const frozen = 'supabase/checks/rad085-p1-b-ready.sql';
const transitionKinds = ['columns', 'constraints', 'effective_privileges', 'functions', 'indexes', 'relations', 'triggers'];

// Exported for synthetic witnesses. No alternate SQL, role, phase or check selectors.
export async function inspectRestored(db) {
  const identity = (await db.query("select current_user, session_user, rolsuper, current_setting('rad085.sharing_phase',true) phase from pg_roles where rolname=current_user")).rows[0];
  if (identity.current_user !== 'postgres' || identity.session_user !== 'postgres' || identity.rolsuper !== false || ![null, '', 'initialized'].includes(identity.phase)) throw new Stop('apply_role');
  try { await checks(db, [diagnostic]); } catch { throw new Stop('pre_diagnostic'); }
  try { await checks(db, [frozen]); } catch { throw new Stop('pre_frozen_b'); }
  let migrations = 0;
  for (let n = 1; n <= 8; n++) {
    try { await apply(db, `M0${n}`, { RAD062_SECRET_STATE: 'DISABLED' }); migrations++; }
    catch { throw new Stop(`M0${n}`); }
  }
  let passed = 0;
  for (const file of manifest().checks) {
    try { await checks(db, [file]); passed++; } catch { throw new Stop('check_' + String(passed + 1).padStart(2, '0')); }
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
  if (!counts || !Object.values(counts).every(v => /^\d+$/.test(String(v)))) throw new Stop('counts');
  // Existing capacity/quota STOPs: no automatic cleanup or acceptance of violations.
  if (Object.entries(counts).some(([k, v]) => !['database_bytes', 'reserved_peak_bytes'].includes(k) && Number(v) !== 0) ||
      Number(counts.database_bytes) + Number(counts.reserved_peak_bytes) >= 300000000) throw new Stop('capacity');
  return { pre_m01_diagnostic_ready: 1, pre_m01_frozen_b_ready: 1, postgres_non_superuser: 1,
    migrations_committed: migrations, checks_passed: passed, transition_inspections_passed: 2, ...counts };
}

export async function rehearse(c, { env = process.env } = {}) {
  localOnly([], env); verifyMigrations();
  const root = mkdtempSync(join(tmpdir(), 'rad062-laptop-')), socket = join(root, 'socket');
  mkdirSync(socket); chmodSync(root, 0o700); chmodSync(socket, 0o777); // private parent; image UID can write only the bind-mounted child
  const dockerEnv = { ...env };
  for (const key of ['DOCKER_HOST', 'DOCKER_CONTEXT', 'DOCKER_TLS', 'DOCKER_TLS_VERIFY', 'DOCKER_CERT_PATH']) delete dockerEnv[key];
  let container, result, cleanupFailed = false;
  const run = (program, args, opts = {}) => {
    if (program === 'pg_restore') return execFileSync('docker', ['--host=unix:///var/run/docker.sock', 'run', '--rm', '-i', '--network=none', '--pull=never', '--entrypoint', 'pg_restore', IMAGE, '--list'],
      { ...opts, env: dockerEnv, input: readFileSync(args.at(-1)) });
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
    catch (e) { if (args[0] === 'rm') cleanupFailed = true; throw e; }
  };
  const spawn = (program, args, opts) => spawnSync(program, ['--host=unix:///var/run/docker.sock', ...args], { ...opts, env: dockerEnv });
  try {
    const restored = await restoreTest(c, { name: 'latest', run, spawn, beforeTeardown: async ({ database }) => {
      const db = new Client({ host: socket, port: 5432, user: 'postgres', database, password: '', ssl: false,
        options: '', application_name: 'rad062-rehearsal', connectionTimeoutMillis: 10000, query_timeout: 120000 });
      db.on('error', () => {}); // Query/connect rejection carries STOP through finally; never emit raw idle errors.
      try { await db.connect(); result = await inspectRestored(db); } finally { await db.end(); }
    } });
    if (cleanupFailed) throw new Stop('teardown');
    return { ...restored, ...result, rehearsal_pass: 1, teardown_pass: 1 };
  } catch (e) {
    throw new Stop(e instanceof Stop && /^(M0[1-8]|check_[0-9]{2}|selectors|apply_role|pre_diagnostic|pre_frozen_b|transition|counts|capacity|teardown)$/.test(e.stage) ? e.stage : 'restore_or_check');
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
export const stopLine = e => 'STOP rad062_laptop_rehearsal:' + (e instanceof Stop && /^(M0[1-8]|check_[0-9]{2}|selectors|apply_role|pre_diagnostic|pre_frozen_b|transition|counts|capacity|teardown|restore_or_check)$/.test(e.stage) ? e.stage : 'internal');
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().then(r => console.log(JSON.stringify(r))).catch(e => { console.error(stopLine(e)); process.exitCode = 1; });
}
