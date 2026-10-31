// Owner laptop only. No connection string arguments; errors never print SQL/data.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { Client } from 'pg';
export const manifest = () => JSON.parse(readFileSync('scripts/pages/frontend-schema.json', 'utf8'));
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export function verifyMigrations(read = file => readFileSync('supabase/migrations/' + file)) {
  const m = manifest(), files = m.guardedFeatures.rad062.migrations;
  if (files.length !== 8) throw Error('package_count');
  files.forEach((file, n) => {
    if (!file.startsWith(`20261030000${n + 1}00_`) || sha256(read(file)) !== m.deferredMigrations[file]?.sha256) throw Error('migration_digest');
  });
  return files;
}
// Explicit opt-in only (RAD-086 D-A): host is copied by the owner from the project's Connect panel,
// never derived from a region, never detected, never a fallback for the direct endpoint.
export const POOLER_HOST = /^aws-\d{1,2}-[a-z]{2}(?:-[a-z]+)+-\d{1,2}\.pooler\.supabase\.com$/;
export function options(args, env = process.env) {
  const allowed = ['verify', 'preflight', 'backup', 'restore', 'counts', 'apply', 'checks'];
  const [action = 'verify', ...flags] = args;
  if (!allowed.includes(action)) throw Error('action');
  const out = { action, execute: false, live: false, part: null, project: null, pooler: false };
  for (let n = 0; n < flags.length; n++) {
    if (flags[n] === '--execute') out.execute = true;
    else if (flags[n] === '--live') out.live = true;
    else if (flags[n] === '--session-pooler') out.pooler = true;
    else if (flags[n] === '--project-ref') out.project = flags[++n];
    else if (flags[n] === '--migration') out.part = flags[++n];
    else throw Error('argument');
  }
  // Even a dry-run remote request must carry both independent owner selectors.
  const local = /^\/[A-Za-z0-9_./-]+$/.test(env.PGHOST ?? '') && !env.PGHOST.includes('..');
  if (out.live || (out.action !== 'verify' && !local)) {
    const direct = !out.pooler && env.PGHOST === `db.${out.project}.supabase.co` && env.PGUSER === 'postgres';
    // Session pooler: shared-pooler host pattern, host equal to the owner's separate selector,
    // user exactly postgres.<ref>, port exactly 5432 (6543 transaction pooler is never accepted), CA file present.
    const pooled = out.pooler && POOLER_HOST.test(env.PGHOST ?? '') && env.PGHOST === env.RAD062_POOLER_HOST &&
      env.PGUSER === `postgres.${out.project}` && env.PGPORT === '5432' && (env.PGSSLROOTCERT ?? '') !== '';
    if (!out.live || !/^[a-z]{20}$/.test(out.project ?? '') || out.project !== env.RAD062_EXPECTED_PROJECT_REF ||
      !(direct || pooled) || env.PGDATABASE !== 'postgres' || env.PGSSLMODE !== 'verify-full') throw Error('live_refused');
  }
  // The pooler is for read-only and backup actions; DB-day apply/restore stay on reviewed paths (owner decision pending).
  if (out.pooler && (!out.live || out.action === 'apply' || out.action === 'restore' || out.action === 'verify')) throw Error('pooler_refused');
  if (local && (!/^[a-z_][a-z0-9_]*$/.test(env.PGUSER ?? '') || !/^[a-z_][a-z0-9_]*$/.test(env.PGDATABASE ?? '') || !/^\d{1,5}$/.test(env.PGPORT ?? '5432'))) throw Error('local_selectors');
  if (out.action === 'restore' && !local) throw Error('local_restore_only');
  if (out.action === 'backup' && !out.live) throw Error('live_backup_only');
  if (out.action === 'apply' && out.live && out.execute && env.RAD062_RESTORE_VERIFIED !== 'yes') throw Error('restore_evidence');
  if (out.action === 'apply' && !/^M0[1-8]$/.test(out.part ?? '')) throw Error('migration_selector');
  return out;
}
export const preflightSQL = `select
 (select count(*) from assess.launch_gate where enabled)::int open_gates,
 (select count(*) from assess.launch_gate)::int gate_rows,
 (select count(*) from pg_roles where rolname in ('assess_job_a','assess_job_b'))::int worker_roles,
 (select count(*) from pg_roles where rolname in ('assess_job_a','assess_job_b','assess_worker') and rolcanlogin)::int login_roles,
 (select count(*) from pg_stat_activity where usename in ('assess_job_a','assess_job_b'))::int worker_connections,
 (select count(*) from assess.assignments where closed_at is null)::int open_assignments,
 (select count(*) from assess.sessions where state in ('active','grading','awaiting-manual'))::int unsettled_sessions`;
export async function preflight(db, env) {
  const r = (await db.query(preflightSQL)).rows[0];
  if (r.gate_rows !== 1 || r.worker_roles !== 2 || Object.entries(r).some(([k, v]) => !['gate_rows', 'worker_roles'].includes(k) && v !== 0) ||
    env.RAD062_SECRET_STATE !== 'DISABLED' || env.RAD062_RAD086_VERIFIED !== 'yes' || env.RAD062_V1_PACKET_AT_HAND !== 'yes') throw Error('preconditions');
  return r;
}
export async function readOnly(db, sql) {
  await db.query("begin read only; set local lock_timeout='5s'; set local statement_timeout='30s'; set local row_security=off");
  try { return await db.query(sql); } finally { await db.query('rollback'); }
}
// Intentional false claims in old checks are not readiness assertions.
const nonAssertions = new Set(['runtime_or_launch_verified', 'restore_verified']);
export function checkRows(result) {
  const results = Array.isArray(result) ? result : [result];
  const rows = results.flatMap(r => r.rows ?? []);
  if (!rows.length) throw Error('empty_check');
  if (results.some(r => (r.fields ?? []).some(f => f.dataTypeID === 16 && !nonAssertions.has(f.name) && r.rows.some(row => row[f.name] !== true)))) throw Error('check_failed');
  if (rows.some(row => Object.entries(row).some(([key, v]) => typeof v === 'boolean' && !nonAssertions.has(key) && v !== true))) throw Error('check_failed');
  return rows.length;
}
export async function checks(db, files = [...manifest().checks, 'supabase/checks/rad062-ready.sql']) {
  let passed = 0;
  for (const file of files) {
    try { checkRows(await db.query(readFileSync(file, 'utf8'))); passed++; }
    catch { await db.query('rollback'); throw Error('required_check_failed:' + file); }
  }
  return { checks_passed: passed };
}
export async function apply(db, part, env = process.env) {
  const files = verifyMigrations(), n = Number(part.slice(1)) - 1, file = files[n];
  if (!file) throw Error('migration_selector');
  await readOnly(db, preflightSQL).then(r => {
    const f = r.rows[0];
    if (f.gate_rows !== 1 || f.open_gates || f.login_roles || f.open_assignments || f.worker_connections || f.unsettled_sessions) throw Error('preconditions');
  });
  if (env.RAD062_SECRET_STATE !== 'DISABLED') throw Error('secret_state');
  // The live project must already have the standard Supabase migration ledger.
  const ledger = await db.query('select version from supabase_migrations.schema_migrations where version=any($1::text[]) order by version', [files.map(f => f.slice(0, 14))]);
  if (JSON.stringify(ledger.rows.map(r => r.version)) !== JSON.stringify(files.slice(0, n).map(f => f.slice(0, 14)))) throw Error('migration_order_or_uncertain_ack');
  const sql = readFileSync('supabase/migrations/' + file, 'utf8');
  if (!/\bcommit;\s*$/i.test(sql)) throw Error('transaction_boundary');
  const version = file.slice(0, 14), name = file.slice(15, -4);
  // Ledger and migration COMMIT together; source bytes remain unchanged on disk.
  // Reviewed identifier strings derive only from the fixed manifest, never CLI text.
  const statement = sql.replace(/\bcommit;\s*$/i, `insert into supabase_migrations.schema_migrations(version,name,statements) values('${version}','${name}',ARRAY[]::text[]);\ncommit;`);
  try { await db.query(statement); } catch { await db.query('rollback'); throw Error('apply_failed_or_ack_uncertain'); }
  const recorded = await db.query('select count(*)::int n from supabase_migrations.schema_migrations where version=$1', [version]);
  if (recorded.rows[0].n !== 1) throw Error('ledger_ack');
  return { migrations_committed: n + 1 };
}
function backupDirectory(env) {
  const path = realpathSync(env.RAD062_BACKUP_DIR ?? '');
  const root = realpathSync('.');
  if (path === root || path.startsWith(root + sep)) throw Error('backup_outside_checkout');
  return path;
}
function command(program, args, extra = {}) {
  return execFileSync(program, args, { stdio: ['ignore', 'pipe', 'pipe'], timeout: 3600000, maxBuffer: 1024 * 1024, ...extra });
}
export async function main(args = process.argv.slice(2), env = process.env) {
  process.umask(0o077);
  const o = options(args, env);
  // libpq must not override the reviewed endpoint through service/hostaddr files.
  const pgKeys = new Set(['PGHOST','PGPORT','PGUSER','PGDATABASE','PGPASSWORD','PGSSLMODE','PGSSLROOTCERT']);
  env = Object.fromEntries(Object.entries(env).filter(([k]) => !k.startsWith('PG') || pgKeys.has(k)));
  env.PGPASSFILE = '/dev/null';
  verifyMigrations();
  if (!o.execute || o.action === 'verify') return { verified_migrations: 8, database_connections: 0, dry_run: o.execute ? 0 : 1 };
  if (o.action === 'restore') {
    const dir = backupDirectory(env);
    const hashes = JSON.parse(readFileSync(resolve(dir, 'checksums.json'), 'utf8'));
    if (Object.keys(hashes).sort().join(',') !== 'project.dump,roles.sql') throw Error('backup_inventory');
    for (const [file, digest] of Object.entries(hashes)) {
      if (!['roles.sql', 'project.dump'].includes(file) || sha256(readFileSync(resolve(dir, file))) !== digest) throw Error('backup_checksum');
    }
    // Fresh local cluster, unique bootstrap role, empty target DB; see runbook.
    command('psql', ['-X', '-v', 'ON_ERROR_STOP=1', '-f', resolve(dir, 'roles.sql')], { env });
    command('pg_restore', ['--exit-on-error', '--dbname', env.PGDATABASE, resolve(dir, 'project.dump')], { env });
    return { restored_archives: 2 };
  }
  const db = new Client({ host: env.PGHOST, port: Number(env.PGPORT ?? 5432), database: env.PGDATABASE, user: env.PGUSER,
    password: env.PGPASSWORD ?? '', ssl: o.live ? { rejectUnauthorized: true, ca: readFileSync(env.PGSSLROOTCERT, 'utf8') } : false,
    options: '', application_name: 'rad062-laptop', connectionTimeoutMillis: 10000, query_timeout: 120000 });
  try {
    await db.connect();
    if (o.action === 'backup') {
      await preflight(db, env);
      const dir = backupDirectory(env);
      // Fixed output names; never overwrite a prior backup or emit dump contents.
      const fs = await import('node:fs');
      for (const file of ['roles.sql', 'project.dump', 'checksums.json']) if (fs.existsSync(resolve(dir, file))) throw Error('backup_exists');
      fs.chmodSync(dir, 0o700);
      command('pg_dumpall', ['--roles-only', '--no-role-passwords', '--file', resolve(dir, 'roles.sql')], { env });
      command('pg_dump', ['--format=custom', '--file', resolve(dir, 'project.dump')], { env });
      const hashes = Object.fromEntries(['roles.sql', 'project.dump'].map(file => { fs.chmodSync(resolve(dir, file), 0o600); return [file, sha256(readFileSync(resolve(dir, file)))]; }));
      writeFileSync(resolve(dir, 'checksums.json'), JSON.stringify(hashes) + '\n', { mode: 0o600, flag: 'wx' });
      return { backup_archives: 2 };
    }
    if (o.action === 'preflight') return await readOnly(db, preflightSQL).then(async () => ({ ...await preflight(db, env), server_version_num: Number((await db.query('show server_version_num')).rows[0].server_version_num) }));
    if (o.action === 'counts') return (await readOnly(db, readFileSync('scripts/assess/sql/rad062-precounts.sql', 'utf8'))).rows[0];
    if (o.action === 'checks') { await preflight(db, env); return await checks(db); }
    if (o.action === 'apply') { await preflight(db, env); return await apply(db, o.part, env); }
  } finally { await db.end(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  // All successful outputs are numeric counts/version fields. No raw driver/CLI errors.
  main().then(result => console.log(JSON.stringify(result))).catch(() => { console.error('STOP rad062_db_day'); process.exitCode = 1; });
}
