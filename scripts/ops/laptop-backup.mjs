// RAD-086 owner-laptop daily backup (WSL2, run by Windows Task Scheduler). Read-only on the provider.
// Needs no RAD062 attestations. No participant export: only a full pg_dump archive plus numeric table counts.
// stdout: one JSON line of numbers. stderr on failure: "STOP laptop_backup:<stage>" only (no raw errors, paths or SQL).
import { chmodSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import pg from 'pg';
import { Stop, guard, stamp, sha256File, sha256Bytes, quoteIdent, validateConfig, loadConfig, connectionEnv, assertPrivate, outsideCheckout,
  configDir, configPath, passFilePath, writePassFile, listBackups, clientMajor, appendEntry, readEntries, verifyBackup, resolveBackup,
  LOCALE, validateLocale, SLOTS, tmpDir, storeDir, slotStamp, parseStamp, publish, collect } from './laptop-backup-lib.mjs';

const execAsync = promisify(execFile);
const META_SQL = `select current_setting('server_version_num')::int v, d.datcollate c, d.datctype t,
 pg_encoding_to_char(d.encoding) e, d.datlocprovider p, coalesce(to_jsonb(d)->>'datlocale', to_jsonb(d)->>'daticulocale') l from pg_database d where d.datname = current_database()`;
const TABLES_SQL = `select n.nspname s, c.relname t from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where c.relkind = 'r' and n.nspname not in ('pg_catalog','information_schema') and n.nspname !~ '^pg_toast'
 and not exists (select 1 from pg_depend d where d.classid = 'pg_class'::regclass and d.objid = c.oid and d.deptype = 'e')
 order by 1, 2`;

function flags(args, allowed) {
  const out = {};
  for (let n = 0; n < args.length; n++) {
    const k = args[n];
    if (!allowed.includes(k)) throw new Stop('argument');
    out[k.slice(2)] = k === '--dry-run' || k === '--replace' ? true : args[++n];
  }
  return out;
}
function tools(c, run) {
  const majors = ['pg_dump', 'pg_dumpall', 'pg_restore', 'psql'].map(p => guard('tools', () => clientMajor(p, run)));
  if (majors.some(([m]) => m !== c.pgMajor)) throw new Stop('tools');
  guard('tools', () => run('age', ['--version'], { timeout: 15000 }));
  return majors[0];
}
function prepare(c, run) {
  const conn = guard('config', () => connectionEnv(c));
  guard('perms', () => { assertPrivate(passFilePath(), false); assertPrivate(c.backupRoot, true); outsideCheckout(c.backupRoot); });
  return { conn, version: tools(c, run) };
}
// TLS is built here, from the owner's CA file only: verification on, no fallback to an unencrypted connection.
const defaultClient = ({ caFile, ...o }) => new pg.Client({ ...o, ssl: { rejectUnauthorized: true, ca: readFileSync(caFile, 'utf8') } });

export async function runBackup(c, { dryRun = false, run = execFileSync, runAsync = execAsync, makeClient = defaultClient, conn: given, now = new Date(), publishDeps } = {}) {
  const { conn: derived, version } = prepare(c, run), conn = given ?? derived;
  if (dryRun) return { dry_run: 1, database_connections: 0, client_major: version[0], client_minor: version[1], backups_present: listBackups(c.backupRoot).length };
  const name = stamp(now), dir = join(tmpDir(c.backupRoot), name), roles = join(dir, 'roles.sql'), dump = join(dir, 'project.dump');
  let stage = 'mkdir', created = false;
  try {
    mkdirSync(tmpDir(c.backupRoot), { recursive: true, mode: 0o700 });
    if (existsSync(join(storeDir(c.backupRoot), name))) throw new Stop('mkdir');
    mkdirSync(dir, { mode: 0o700 });            // non-recursive: an existing directory is refused, never overwritten
    created = true; chmodSync(dir, 0o700);
    stage = 'dump_roles';
    run('pg_dumpall', ['--roles-only', '--no-role-passwords', '--file', roles], { env: conn, stdio: ['ignore', 'pipe', 'pipe'], timeout: 600000 });
    stage = 'connect';
    process.env.PGPASSFILE = conn.PGPASSFILE;   // pg reads the password from this 0600 file; none in argv or env
    const db = makeClient({ host: conn.PGHOST, port: 5432, database: conn.PGDATABASE, user: conn.PGUSER, application_name: 'rad086-backup',
      caFile: conn.PGSSLROOTCERT, connectionTimeoutMillis: 15000, query_timeout: 120000 });
    let meta, tables = [], errors = 0, toc;
    try {
      await db.connect();
      stage = 'snapshot';
      await db.query('begin isolation level repeatable read read only');
      await db.query("set local lock_timeout = '5s'");
      await db.query("set local statement_timeout = '120s'");
      await db.query('set local row_security = off');
      const snap = (await db.query('select pg_export_snapshot() s')).rows[0].s;
      if (!/^[0-9A-F]{8}-[0-9A-F]{8}-\d+$/.test(snap) && !/^[0-9A-F-]{8,40}$/.test(snap)) throw new Stop('snapshot');
      const m = (await db.query(META_SQL)).rows[0];
      validateLocale({ datlocprovider: m.p, datcollate: m.c, datctype: m.t, datlocale: m.l });
      if (!LOCALE.test(m.e ?? '')) throw new Stop('locale');
      if (Math.floor(m.v / 10000) !== c.pgMajor) throw new Stop('tools');
      meta = { server_version_num: m.v, datlocprovider: m.p, datcollate: m.c, datctype: m.t, datlocale: m.l, encoding: m.e };
      stage = 'counts';
      // Same snapshot as the dump, so restored counts must equal these exactly. A table that cannot be counted is recorded
      // as null and counted in count_errors; it never aborts the backup and is never silently dropped.
      for (const { s, t } of (await db.query(TABLES_SQL)).rows) {
        await db.query('savepoint c');
        try { tables.push([s, t, Number((await db.query(`select count(*)::text n from ${quoteIdent(s)}.${quoteIdent(t)}`)).rows[0].n)]); await db.query('release c'); }
        catch { await db.query('rollback to c'); tables.push([s, t, null]); errors++; }
      }
      stage = 'dump_data';
      await runAsync('pg_dump', ['--format=custom', `--snapshot=${snap}`, '--file', dump], { env: conn, timeout: 3600000, maxBuffer: 1024 * 1024 });
      await db.query('commit');
    } finally { await db.end().catch(() => {}); }
    stage = 'toc';
    toc = String(run('pg_restore', ['--list', dump], { encoding: 'utf8', timeout: 600000, maxBuffer: 256 * 1024 * 1024 })).split('\n').filter(l => /^\d+;/.test(l)).length;
    if (toc < 1) throw new Stop('toc');
    stage = 'checksum';
    for (const f of [roles, dump]) chmodSync(f, 0o600);
    const sums = { 'project.dump': await sha256File(dump), 'roles.sql': await sha256File(roles) };
    writeFileSync(join(dir, 'checksums.json'), JSON.stringify(sums) + '\n', { mode: 0o600, flag: 'wx' });
    const metaBytes = JSON.stringify({ ...meta, tables, count_errors: errors }) + '\n';
    writeFileSync(join(dir, 'db-meta.json'), metaBytes, { mode: 0o600, flag: 'wx' });
    // Complete means re-read from disk and equal to the recorded digests; only then may any slot change.
    stage = 'verify'; await verifyBackup(dir);
    const sizes = { roles_bytes: statSync(roles).size, dump_bytes: statSync(dump).size };
    stage = 'rotate';
    let moved;
    try { moved = publish(c, name, publishDeps); }
    catch (e) { for (const r of e.done ?? []) try { appendEntry(c, { kind: 'rotation', ...r }, run); } catch { /* exit code is the signal */ } throw e; }
    stage = 'log';
    const rows = tables.reduce((n, [, , k]) => n + (k ?? 0), 0);
    let entries = appendEntry(c, { kind: 'backup', dir: name, ...sizes, roles_sha256: sums['roles.sql'], dump_sha256: sums['project.dump'],
      meta_sha256: sha256Bytes(metaBytes), toc_entries: toc, tables: tables.length, count_errors: errors, rows_total: rows, ...meta,
      client_version: version.join('.'), slots: moved.map(m => m.slot), restore_test: 'not_run' }, run);
    for (const r of moved) entries = appendEntry(c, { kind: 'rotation', ...r }, run);
    stage = 'collect';
    const gc = collect(c.backupRoot);
    if (gc.removed.length || gc.tmp_removed) entries = appendEntry(c, { kind: 'prune', removed: gc.removed, tmp_removed: gc.tmp_removed }, run);
    return { backup_archives: 2, ...sizes, toc_entries: toc, tables_counted: tables.length - errors, count_errors: errors, rows_total: rows,
      server_version_num: meta.server_version_num, slots_updated: moved.length, store_removed: gc.removed.length, log_entries: entries };
  } catch (e) {
    const code = e instanceof Stop ? e.stage : stage;
    try { if (created && existsSync(dir)) renameSync(dir, dir + '.failed'); } catch { /* removed by the next successful run */ }
    try { appendEntry(c, { kind: 'stop', dir: name, stage: code }, run); } catch { /* the exit code remains the signal */ }
    throw new Stop(code);
  }
}

export function status(c, now = new Date(), maxAgeDays = 2) {
  const root = c.backupRoot, age = slot => { const st = slotStamp(root, slot); return st ? Math.floor((now - parseStamp(st)) / 864e5) : -1; };
  const daily = age('daily');
  if (daily < 0) throw new Stop('no_backup');
  if (daily > maxAgeDays) throw new Stop('stale');
  const dir = join(storeDir(root), slotStamp(root, 'daily'));
  const bytes = ['roles.sql', 'project.dump'].reduce((n, f) => n + statSync(join(dir, f)).size, 0);
  return { slots_filled: SLOTS.filter(x => slotStamp(root, x)).length, daily_age_days: daily, weekly_age_days: age('weekly'), monthly_age_days: age('monthly'),
    stored_backups: listBackups(root).length, newest_bytes: bytes };
}

function readHidden(prompt) {
  return new Promise((ok, fail) => {
    const { stdin, stderr } = process;
    if (!stdin.isTTY) return fail(new Stop('tty_required'));
    stderr.write(prompt); stdin.setRawMode(true); stdin.resume(); stdin.setEncoding('utf8');
    let buf = '';
    const end = () => { stdin.setRawMode(false); stdin.pause(); stdin.off('data', onData); stderr.write('\n'); };
    const onData = chunk => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n' || ch === '\u0004') { end(); return ok(buf); }
        if (ch === '\u0003') { end(); return fail(new Stop('cancelled')); }
        buf = ch === '\u007f' || ch === '\b' ? buf.slice(0, -1) : buf + ch;
      }
    };
    stdin.on('data', onData);
  });
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  process.umask(0o077);
  const [cmd, ...rest] = argv;
  if (cmd === 'init-config') {
    const f = flags(rest, ['--project-ref', '--endpoint', '--pooler-host', '--age-recipient', '--ca-file', '--backup-root', '--pg-major']);
    const home = env.HOME ?? '';
    const c = guard('config', () => validateConfig({ projectRef: f['project-ref'], endpoint: f.endpoint, ...(f['pooler-host'] ? { poolerHost: f['pooler-host'] } : {}),
      ageRecipient: f['age-recipient'], caFile: f['ca-file'] ?? `${home}/.config/rad-lab-backup/supabase-ca.crt`,
      backupRoot: f['backup-root'] ?? `${home}/rad-lab-backups`, pgMajor: Number(f['pg-major'] ?? 17) }));
    guard('config', () => { connectionEnv(c); if (!existsSync(c.caFile)) throw Error('ca'); });
    guard('perms', () => {
      mkdirSync(configDir(), { recursive: true, mode: 0o700 }); chmodSync(configDir(), 0o700);
      mkdirSync(c.backupRoot, { recursive: true, mode: 0o700 }); chmodSync(c.backupRoot, 0o700); outsideCheckout(c.backupRoot);
      writeFileSync(configPath(), JSON.stringify(c, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
    });
    return { config_written: 1 };
  }
  if (cmd === 'init-password') {
    const f = flags(rest, ['--replace']);
    const c = guard('config', () => loadConfig());
    const pw = await readHidden('Database password (hidden): ');
    guard('password', () => writePassFile(c, pw, Boolean(f.replace)));
    return { password_file_written: 1, replaced: f.replace ? 1 : 0 };
  }
  const c = guard('config', () => loadConfig());
  if (cmd === 'run') return runBackup(c, { dryRun: Boolean(flags(rest, ['--dry-run'])['dry-run']) });
  if (cmd === 'status') return guard('status', () => status(c, new Date(), Number(flags(rest, ['--max-age-days'])['max-age-days'] ?? 2)));
  if (cmd === 'verify') {
    const r = await verifyBackup(resolveBackup(c, rest[0] ?? 'latest')).catch(() => { throw new Stop('verify'); });
    return { verified_files: r.files, verified_bytes: r.bytes };
  }
  if (cmd === 'log-read') {
    const f = flags(rest, ['--identity']);
    return guard('log', () => readEntries(c, resolve(f.identity)));
  }
  throw new Stop('argument');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().then(r => console.log(JSON.stringify(r))).catch(e => { console.error('STOP laptop_backup:' + (e instanceof Stop ? e.stage : 'internal')); process.exitCode = 1; });
}
