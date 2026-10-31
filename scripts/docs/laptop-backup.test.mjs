import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, existsSync, chmodSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { validateConfig, outsideCheckout, connectionEnv, passLine, writePassFile, assertPrivate, appendEntry, readEntries, listBackups, quoteIdent, stamp } from '../ops/laptop-backup-lib.mjs';
import { runBackup, status } from '../ops/laptop-backup.mjs';
import { restoreTest, containerArgs, parseExtensions, IMAGE } from '../ops/laptop-restore-test.mjs';

const ref = 'abcdefghijklmnopqrst', pooler = 'aws-0-eu-central-1.pooler.supabase.com';
const tmp = mkdtempSync(join(tmpdir(), 'rad086-'));
process.env.HOME = tmp;                       // homedir() follows HOME: config and password file stay in the temp tree
const cfgDir = join(tmp, '.config', 'rad-lab-backup');
mkdirSync(cfgDir, { recursive: true, mode: 0o700 });
writeFileSync(join(cfgDir, 'ca.crt'), 'public-ca');
const key = spawnSync('age-keygen', [], { encoding: 'utf8' });
const identity = join(tmp, 'identity.txt');
writeFileSync(identity, key.stdout, { mode: 0o600 });
const recipient = /age1[0-9a-z]{58}/.exec(key.stderr)[0];
const base = { projectRef: ref, endpoint: 'session-pooler', poolerHost: pooler, ageRecipient: recipient, caFile: join(cfgDir, 'ca.crt'), backupRoot: join(tmp, 'backups'), pgMajor: 16 };
mkdirSync(base.backupRoot, { mode: 0o700 });
writeFileSync(join(cfgDir, 'pgpass'), 'x', { mode: 0o600 });

test('config accepts the reviewed pooler and direct shapes and rejects everything else', () => {
  assert.doesNotThrow(() => connectionEnv(validateConfig(base)));
  const { poolerHost: _unused, ...direct } = { ...base, endpoint: 'direct' };
  void _unused;
  assert.equal(connectionEnv(validateConfig(direct)).PGHOST, `db.${ref}.supabase.co`);
  assert.equal(connectionEnv(validateConfig(base)).PGUSER, `postgres.${ref}`);
  assert.equal(connectionEnv(validateConfig(base)).PGPORT, '5432');
  for (const bad of [{ ...base, extra: 1 }, { ...base, endpoint: 'transaction-pooler' }, { ...base, ageRecipient: 'age1short' }, { ...base, poolerHost: undefined },
    { ...base, projectRef: 'A'.repeat(20) }, { ...base, backupRoot: 'relative/path' }, { ...base, caFile: '/a/../b' }, { ...direct, poolerHost: pooler },
    { ...base, password: 'x' }, { ...base, connectionString: 'postgres://x' }]) assert.throws(() => validateConfig(bad));
  for (const host of ['db.' + ref + '.supabase.co', 'aws-0-eu-central-1.pooler.supabase.com:6543', 'evil.example.com', 'aws-0-eu-central-1.pooler.supabase.com.evil.io', 'AWS-0-eu-central-1.pooler.supabase.com'])
    assert.throws(() => connectionEnv(validateConfig({ ...base, poolerHost: host })));
  const env = connectionEnv(validateConfig(base));
  assert.ok(!('PGPASSWORD' in env) && env.PGSSLMODE === 'verify-full' && env.PGPASSFILE === join(cfgDir, 'pgpass'));
});
test('password file: escaped libpq line, 0600, no overwrite, replace is atomic, nothing printed', () => {
  const c = validateConfig(base), pw = 'a:b\\c-CANARY-pass';
  assert.equal(passLine(c, pw), `${pooler}:5432:*:postgres.${ref}:a\\:b\\\\c-CANARY-pass\n`);
  for (const bad of ['short', 'with\nnewline', '', 5]) assert.throws(() => passLine(c, bad));
  const file = join(tmp, 'pass-test');
  writePassFile(c, pw, false, file);
  assert.equal(statSync(file).mode & 0o777, 0o600);
  assert.throws(() => writePassFile(c, 'another-password', false, file));
  writePassFile(c, 'another-password', true, file);
  assert.equal(statSync(file).mode & 0o777, 0o600);
  assert.ok(!existsSync(file + '.new'));
});
test('private-file guard rejects group/other bits and symlinks', () => {
  const f = join(tmp, 'perm'); writeFileSync(f, 'x', { mode: 0o644 }); chmodSync(f, 0o644);
  assert.throws(() => assertPrivate(f, false)); chmodSync(f, 0o600); assert.doesNotThrow(() => assertPrivate(f, false));
  symlinkSync(f, join(tmp, 'link')); assert.throws(() => assertPrivate(join(tmp, 'link'), false));
  assert.throws(() => outsideCheckout('scripts'));           // anything inside the checkout is refused as a backup location
  assert.doesNotThrow(() => outsideCheckout(tmp));
  assert.equal(quoteIdent('we"ird'), '"we""ird"'); assert.throws(() => quoteIdent('a\nb'));
});
test('encrypted reconciliation log: append-only chain, owner-only read, deletion is detected', () => {
  const c = validateConfig({ ...base, backupRoot: join(tmp, 'logroot') }); mkdirSync(c.backupRoot, { mode: 0o700 });
  appendEntry(c, { kind: 'backup', dir: 'x', dump_sha256: 'a'.repeat(64), dump_bytes: 5 });
  assert.equal(appendEntry(c, { kind: 'restore_test', dir: 'x', result: 'pass' }), 2);
  const dir = join(c.backupRoot, 'reconciliation'), files = readdirSync(dir);
  assert.equal(files.length, 2); assert.equal(statSync(dir).mode & 0o777, 0o700);
  assert.ok(files.every(f => (statSync(join(dir, f)).mode & 0o777) === 0o600) && !readFileSync(join(dir, files[0])).includes('dump_sha256'));
  const rows = readEntries(c, identity);
  assert.deepEqual(rows.map(r => r.kind), ['backup', 'restore_test']); assert.equal(rows[0].prev, null); assert.ok(rows[1].prev);
  assert.throws(() => readEntries(c, join(tmp, 'missing-identity')));
  rmSync(join(dir, files[0]));
  assert.throws(() => readEntries(c, identity), /log_chain/);
});

function cluster() {
  const bin = readdirSync('/usr/lib/postgresql').sort().map(v => `/usr/lib/postgresql/${v}/bin`).find(b => existsSync(b + '/initdb'));
  if (!bin || spawnSync('pg_dump', ['--version']).status !== 0) return null;
  const root = mkdtempSync(join(tmpdir(), 'rad086-pg-')), as = process.getuid() === 0 ? ['runuser', '-u', 'postgres', '--'] : [];
  if (as.length) execFileSync('chown', ['postgres', root]);
  chmodSync(root, 0o700);
  const sh = (p, a) => execFileSync(as[0] ?? p, [...as.slice(1), ...(as.length ? [p] : []), ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  sh(`${bin}/initdb`, ['-D', root + '/data', '-A', 'trust', '-U', 'postgres', '--encoding=UTF8', '--locale=C']);
  sh(`${bin}/pg_ctl`, ['-D', root + '/data', '-o', `-c listen_addresses='' -k ${root} -p 55433`, '-w', '-l', root + '/log', 'start']);
  const major = Number(/ (\d+)\./.exec(execFileSync('pg_dump', ['--version'], { encoding: 'utf8' }))[1]);
  return { root, major, stop: () => sh(`${bin}/pg_ctl`, ['-D', root + '/data', '-m', 'immediate', 'stop']) };
}
const pgc = cluster();
after(() => { try { pgc?.stop(); } catch { /* already stopped */ } });
const local = (root, env = {}) => ({ conn: { PGHOST: root, PGPORT: '55433', PGUSER: 'postgres', PGDATABASE: 'postgres', PGPASSFILE: '/dev/null', PATH: process.env.PATH, ...env },
  makeClient: () => new pg.Client({ host: root, port: 55433, user: 'postgres', database: 'postgres' }) });

test('real local rehearsal (synthetic data, no provider): snapshot-consistent dump, counts, checksums, modes, encrypted log, no secrets', { skip: !pgc, timeout: 120000 }, async () => {
  const q = sql => execFileSync('psql', ['-X', '-h', pgc.root, '-p', '55433', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', sql]);
  q(`create schema app; create table app.items(id int primary key, v text); insert into app.items select g, 'row'||g from generate_series(1,25) g;
     create extension pgcrypto; create table public."Odd ""Name"""(a int); insert into public."Odd ""Name""" values (1),(2);`);
  const c = validateConfig({ ...base, pgMajor: pgc.major, backupRoot: join(tmp, 'rehearsal') }); mkdirSync(c.backupRoot, { mode: 0o700 });
  const dry = await runBackup(c, { dryRun: true });
  assert.equal(dry.database_connections, 0); assert.equal(listBackups(c.backupRoot).length, 0);
  const r = await runBackup(c, { ...local(pgc.root), now: new Date('2026-10-31T03:15:00Z') });
  assert.equal(r.backup_archives, 2); assert.equal(r.tables_counted, 2); assert.equal(r.count_errors, 0); assert.equal(r.rows_total, 27);
  assert.ok(Object.values(r).every(Number.isInteger));
  const dir = join(c.backupRoot, '20261031T031500Z');
  assert.deepEqual(readdirSync(dir).sort(), ['checksums.json', 'db-meta.json', 'project.dump', 'roles.sql']);
  assert.equal(statSync(dir).mode & 0o777, 0o700);
  for (const f of readdirSync(dir)) assert.equal(statSync(join(dir, f)).mode & 0o777, 0o600);
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(join(dir, 'checksums.json')))).sort(), ['project.dump', 'roles.sql']);
  assert.doesNotMatch(readFileSync(join(dir, 'roles.sql'), 'utf8'), /PASSWORD '/);   // --no-role-passwords
  const meta = JSON.parse(readFileSync(join(dir, 'db-meta.json')));
  assert.deepEqual(meta.tables.map(t => t.join('.')).sort(), ['app.items.25', 'public.Odd "Name".2'].sort());
  assert.equal(meta.datcollate, 'C');
  const [entry] = readEntries(c, identity);
  assert.equal(entry.restore_test, 'not_run'); assert.equal(entry.rows_total, 27); assert.match(entry.dump_sha256, /^[0-9a-f]{64}$/);
  assert.equal(status(c, new Date('2026-11-01T00:00:00Z')).newest_age_days, 0);
  assert.throws(() => status(c, new Date('2026-11-05T00:00:00Z')), /stale/);
  // Existing directory is refused and left untouched; a stop entry is logged.
  await assert.rejects(runBackup(c, { ...local(pgc.root), now: new Date('2026-10-31T03:15:00Z') }), /mkdir/);
  assert.ok(existsSync(dir) && !existsSync(dir + '.failed'));
  // A failing dump leaves no usable backup: directory renamed .failed, listing ignores it, stop entry logged.
  await assert.rejects(runBackup(c, { ...local(pgc.root), now: new Date('2026-11-01T03:15:00Z'), runAsync: async () => { throw Error('SECRET_CANARY'); } }),
    e => e.stage === 'dump_data' && !String(e.message).includes('CANARY'));
  assert.ok(existsSync(join(c.backupRoot, '20261101T031500Z.failed'))); assert.deepEqual(listBackups(c.backupRoot), ['20261031T031500Z']);
  assert.deepEqual(readEntries(c, identity).map(e => e.kind), ['backup', 'stop', 'stop']);
  // Restore test with a fake docker: exact container flags, count comparison, extension STOP, and logged results.
  const calls = [];
  const fake = (counts, avail = 'plpgsql\npgcrypto') => (p, a, o) => {
    if (p !== 'docker') return execFileSync(p, a, o);
    calls.push(a);
    if (a[0] === 'image') return 'sha256:' + 'a'.repeat(64);
    if (a[0] === 'logs') return 'PostgreSQL init process complete; ready for start up.';
    const sql = a.at(-1);
    if (sql === 'show server_version_num') return String(meta.server_version_num);
    if (sql.includes('pg_available_extensions')) return avail;
    if (sql.includes('from pg_database')) return 'C|C';
    const m = /count\(\*\) from "([^"]+)"\."(.*)"$/.exec(sql);
    return m ? String(counts[m[1] + '.' + m[2].replaceAll('""', '"')]) : '';
  };
  const spawn = () => ({ status: 0, stdout: '' });
  const good = { 'app.items': 25, 'public.Odd "Name"': 2 };
  const ok = await restoreTest(c, { run: fake(good), spawn, wait: async () => {} });
  assert.equal(ok.restore_test_pass, 1); assert.equal(ok.tables_mismatched, 0); assert.equal(ok.rows_restored, 27);
  const start = calls.find(a => a[0] === 'run');
  assert.ok(start.includes('--network') && start[start.indexOf('--network') + 1] === 'none' && start.includes('--pull') && start.at(-1) === IMAGE);
  assert.ok(!start.some(x => /^(-p|-P|--publish|--publish-all|--privileged|--net=host)$/.test(x)) && !start.some(x => x.includes('PASSWORD')));
  assert.ok(start.some(x => x.includes('--lc-collate=C --lc-ctype=C')));
  assert.ok(calls.some(a => a[0] === 'rm' && a.includes('-v')));
  await assert.rejects(restoreTest(c, { run: fake({ ...good, 'app.items': 24 }), spawn, wait: async () => {} }), e => e.stage === 'counts');
  await assert.rejects(restoreTest(c, { run: fake(good, 'plpgsql'), spawn, wait: async () => {} }), e => e.stage === 'extensions' && e.missing.join() === 'pgcrypto');
  const log = readEntries(c, identity).filter(e => e.kind === 'restore_test');
  assert.deepEqual(log.map(e => e.result).slice(0, 2), ['pass', 'fail']); assert.equal(log[1].stage, 'counts'); assert.equal(log[1].tables_mismatched, 1);
  assert.deepEqual([log[2].stage, log[2].missing_extensions], ['extensions', 1]);
  // A tampered archive is refused before any container exists.
  const before = calls.length;
  writeFileSync(join(dir, 'project.dump'), Buffer.concat([readFileSync(join(dir, 'project.dump')), Buffer.from('x')]));
  await assert.rejects(restoreTest(c, { run: fake(good), spawn, wait: async () => {} }), e => e.stage === 'verify');
  assert.equal(calls.length, before);
});
test('container arguments never publish ports, keep no network, and never carry a password', () => {
  const a = containerArgs('n', { datcollate: 'en_US.UTF-8', datctype: 'en_US.UTF-8' });
  assert.deepEqual(a.slice(a.indexOf('--network'), a.indexOf('--network') + 2), ['--network', 'none']);
  assert.ok(!a.includes('-p') && !a.includes('-P') && !a.some(x => /PASSWORD=/.test(x)) && a.at(-1) === 'postgres:17.11');
  assert.deepEqual(parseExtensions('1; 0 0 EXTENSION - pgcrypto\n2; 0 0 COMMENT - EXTENSION pgcrypto\n3; 0 0 EXTENSION - "uuid-ossp"\n'), ['pgcrypto']);
  assert.equal(stamp(new Date('2026-10-31T03:15:00.123Z')), '20261031T031500Z');
});
test('CLI never prints secrets or raw errors and init-password refuses a non-terminal', () => {
  const r = spawnSync(process.execPath, ['scripts/ops/laptop-backup.mjs', 'init-password'], { env: { ...process.env, HOME: tmp }, input: 'CANARY_PASSWORD\n', encoding: 'utf8' });
  assert.equal(r.status, 1); assert.match(r.stderr.trim(), /^STOP laptop_backup:[a-z_]+$/); assert.equal(r.stdout, ''); assert.doesNotMatch(r.stderr, /CANARY/);
});
