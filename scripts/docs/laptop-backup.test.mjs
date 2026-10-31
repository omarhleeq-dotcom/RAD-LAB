import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, existsSync, chmodSync, symlinkSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { validateConfig, outsideCheckout, connectionEnv, passLine, writePassFile, assertPrivate, appendEntry, readEntries, listBackups, quoteIdent, stamp,
  slotStamp, slotsFor, collect, publish, SLOTS, validateLocale, localeArgs } from '../ops/laptop-backup-lib.mjs';
import { runBackup, status } from '../ops/laptop-backup.mjs';
import { restoreTest, containerArgs, parseExtensions, IMAGE, prepareRolesSql } from '../ops/laptop-restore-test.mjs';

const ref = 'abcdefghijklmnopqrst', pooler = 'aws-0-eu-central-1.pooler.supabase.com';
const tmp = mkdtempSync(join(tmpdir(), 'rad086-'));
process.env.HOME = tmp;                       // homedir() follows HOME: config and password file stay in the temp tree
const cfgDir = join(tmp, '.config', 'rad-lab-backup');
mkdirSync(cfgDir, { recursive: true, mode: 0o700 });
writeFileSync(join(cfgDir, 'ca.crt'), 'public-ca');
// A missing external tool must fail with a readable message, never a TypeError (CI installs these; see .github/workflows/ci.yml).
function need(cmd, args, hint) {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  if (r.error || r.status !== 0) throw new Error(`Required tool unavailable: ${cmd} (${hint})`);
  return r;
}
need('psql', ['--version'], 'install the PostgreSQL client packages');
need('pg_dump', ['--version'], 'install the PostgreSQL client packages');
need('pg_restore', ['--version'], 'install the PostgreSQL client packages');
need('pg_dumpall', ['--version'], 'install the PostgreSQL client packages');
const key = need('age-keygen', [], 'install the Ubuntu package "age"');
const identity = join(tmp, 'identity.txt');
writeFileSync(identity, key.stdout, { mode: 0o600 });
const recipient = /age1[0-9a-z]{58}/.exec(key.stderr)?.[0];
if (!recipient) throw new Error('Required tool unavailable: age-keygen did not print a public key');
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
  let versions = [];
  try { versions = readdirSync('/usr/lib/postgresql'); } catch { /* reported below */ }
  const bin = versions.sort().map(v => `/usr/lib/postgresql/${v}/bin`).find(b => existsSync(b + '/initdb'));
  if (!bin) throw new Error('Required tool unavailable: PostgreSQL server binaries under /usr/lib/postgresql/*/bin (install postgresql-16)');
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
  makeClient: () => new pg.Client({ host: root, port: 55433, user: 'postgres', database: env.PGDATABASE ?? 'postgres' }) });

test('real local rehearsal (synthetic data, no provider): snapshot-consistent dump, counts, checksums, modes, encrypted log, no secrets', { timeout: 300000 }, async () => {
  const q = sql => execFileSync('psql', ['-X', '-h', pgc.root, '-p', '55433', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', sql]);
  q(`create schema app; create table app.items(id int primary key, v text); insert into app.items select g, 'row'||g from generate_series(1,25) g;
     create extension pgcrypto; create table public."Odd ""Name"""(a int); insert into public."Odd ""Name""" values (1),(2);`);
  const c = validateConfig({ ...base, pgMajor: pgc.major, backupRoot: join(tmp, 'rehearsal') }); mkdirSync(c.backupRoot, { mode: 0o700 });
  const dry = await runBackup(c, { dryRun: true });
  assert.equal(dry.database_connections, 0); assert.equal(listBackups(c.backupRoot).length, 0);
  const at = d => ({ ...local(pgc.root), now: new Date(d) });
  const slots = () => SLOTS.map(x => slotStamp(c.backupRoot, x));
  const store = () => readdirSync(join(c.backupRoot, 'store')).sort();
  const r = await runBackup(c, at('2026-10-31T03:15:00Z'));
  assert.equal(r.backup_archives, 2); assert.equal(r.tables_counted, 2); assert.equal(r.count_errors, 0); assert.equal(r.rows_total, 27);
  assert.equal(r.slots_updated, 3);                                          // empty weekly/monthly slots are filled by the first backup
  assert.ok(Object.values(r).every(Number.isInteger));
  const dir = join(c.backupRoot, 'store', '20261031T031500Z');
  assert.deepEqual(readdirSync(dir).sort(), ['checksums.json', 'db-meta.json', 'project.dump', 'roles.sql']);
  assert.equal(statSync(dir).mode & 0o777, 0o700);
  for (const f of readdirSync(dir)) assert.equal(statSync(join(dir, f)).mode & 0o777, 0o600);
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(join(dir, 'checksums.json')))).sort(), ['project.dump', 'roles.sql']);
  assert.doesNotMatch(readFileSync(join(dir, 'roles.sql'), 'utf8'), /PASSWORD '/);   // --no-role-passwords
  const meta = JSON.parse(readFileSync(join(dir, 'db-meta.json')));
  assert.deepEqual(meta.tables.map(t => t.join('.')).sort(), ['app.items.25', 'public.Odd "Name".2'].sort());
  assert.equal(meta.datcollate, 'C');
  const first = readEntries(c, identity);
  assert.deepEqual(first.map(e => e.kind), ['backup', 'rotation', 'rotation', 'rotation']);
  assert.equal(first[0].restore_test, 'not_run'); assert.equal(first[0].rows_total, 27); assert.match(first[0].dump_sha256, /^[0-9a-f]{64}$/);
  assert.deepEqual(first.slice(1).map(e => [e.slot, e.from, e.to]), SLOTS.map(x => [x, null, '20261031T031500Z']));
  assert.equal(status(c, new Date('2026-11-01T00:00:00Z')).daily_age_days, 0);
  assert.throws(() => status(c, new Date('2026-11-05T00:00:00Z')), /stale/);
  // Existing backup of the same stamp is refused and left untouched; a stop entry is logged.
  await assert.rejects(runBackup(c, at('2026-10-31T03:15:00Z')), /mkdir/);
  assert.ok(existsSync(dir) && !existsSync(dir + '.failed'));
  // A failing dump leaves the old copy in every slot; the partial work is quarantined in .tmp and logged as a stop.
  await assert.rejects(runBackup(c, { ...at('2026-11-02T03:15:00Z'), runAsync: async () => { throw Error('SECRET_CANARY'); } }),
    e => e.stage === 'dump_data' && !String(e.message).includes('CANARY'));
  assert.ok(existsSync(join(c.backupRoot, '.tmp', '20261102T031500Z.failed'))); assert.deepEqual(store(), ['20261031T031500Z']);
  assert.deepEqual(slots(), Array(3).fill('20261031T031500Z'));
  // Weekday (Tuesday, not the 1st): only daily moves; the old daily is removed only because no other slot references it.
  assert.equal((await runBackup(c, at('2026-11-03T03:15:00Z'))).slots_updated, 1);
  assert.deepEqual(slots(), ['20261103T031500Z', '20261031T031500Z', '20261031T031500Z']); assert.deepEqual(store(), ['20261031T031500Z', '20261103T031500Z']);
  assert.ok(!existsSync(join(c.backupRoot, '.tmp', '20261102T031500Z.failed')));   // earlier failed work is cleared by the next success
  // Sunday promotes to weekly (and daily); the previous daily copy becomes unreferenced and is removed.
  assert.equal((await runBackup(c, at('2026-11-08T03:15:00Z'))).slots_updated, 2);
  assert.deepEqual(slots(), ['20261108T031500Z', '20261108T031500Z', '20261031T031500Z']); assert.deepEqual(store(), ['20261031T031500Z', '20261108T031500Z']);
  // The 1st of the month promotes to monthly (a Tuesday here, so weekly is untouched).
  assert.equal((await runBackup(c, at('2026-12-01T03:15:00Z'))).slots_updated, 2);
  assert.deepEqual(slots(), ['20261201T031500Z', '20261108T031500Z', '20261201T031500Z']); assert.deepEqual(store(), ['20261108T031500Z', '20261201T031500Z']);
  // Failure keeps old: the weekly swap fails mid-way. Weekly still points at its previous verified copy, which still exists.
  const failSlot = name => (from, to) => { if (to.endsWith(`.${name}`)) throw Error('SECRET_CANARY'); return renameSync(from, to); };
  await assert.rejects(runBackup(c, { ...at('2026-12-06T03:15:00Z'), publishDeps: { rename: (f, t) => (t.endsWith('/weekly') ? failSlot('weekly')(f, t + '.weekly') : renameSync(f, t)) } }),
    e => e.stage === 'rotate' && !String(e.message).includes('CANARY'));
  assert.equal(slotStamp(c.backupRoot, 'weekly'), '20261108T031500Z'); assert.ok(existsSync(join(c.backupRoot, 'store', '20261108T031500Z', 'checksums.json')));
  assert.equal(slotStamp(c.backupRoot, 'monthly'), '20261201T031500Z');
  // Failure on the very first swap changes no slot at all.
  await assert.rejects(runBackup(c, { ...at('2026-12-07T03:15:00Z'), publishDeps: { rename: (f, t) => { if (t.endsWith('/daily')) throw Error('SECRET_CANARY'); return renameSync(f, t); } } }),
    e => e.stage === 'rotate');
  assert.equal(slotStamp(c.backupRoot, 'daily'), '20261206T031500Z');   // daily already advanced on the previous (partly failed) Sunday run
  assert.equal(slotStamp(c.backupRoot, 'weekly'), '20261108T031500Z'); assert.equal(slotStamp(c.backupRoot, 'monthly'), '20261201T031500Z');
  assert.ok(existsSync(join(c.backupRoot, 'store', '20261108T031500Z')) && existsSync(join(c.backupRoot, 'store', '20261201T031500Z')));
  // Every rotation, prune and stop is in the encrypted log with from/to.
  const log = readEntries(c, identity), rotations = log.filter(e => e.kind === 'rotation').map(e => `${e.slot}:${e.from}>${e.to}`);
  for (const expected of ['daily:20261031T031500Z>20261103T031500Z', 'daily:20261103T031500Z>20261108T031500Z', 'weekly:20261031T031500Z>20261108T031500Z',
    'daily:20261108T031500Z>20261201T031500Z', 'monthly:20261031T031500Z>20261201T031500Z', 'daily:20261201T031500Z>20261206T031500Z']) assert.ok(rotations.includes(expected), expected);
  assert.ok(!rotations.some(x => x.startsWith('weekly:20261108T031500Z>20261206')));
  assert.ok(log.some(e => e.kind === 'prune' && e.removed.includes('20261031T031500Z')) && log.filter(e => e.kind === 'stop').length >= 4);
  // Restore test with a fake docker: exact container flags, count comparison, extension STOP, and logged results.
  const calls = [];
  const fake = (counts, avail = 'plpgsql\npgcrypto', locale = 'c||C|C') => (p, a, o) => {
    if (p !== 'docker') return execFileSync(p, a, o);
    calls.push(a);
    if (a[0] === 'image') return 'sha256:' + 'a'.repeat(64);
    if (a[0] === 'logs') return 'PostgreSQL init process complete; ready for start up.';
    const sql = a.at(-1);
    if (sql === 'show server_version_num') return String(meta.server_version_num);
    if (sql.includes('pg_available_extensions')) return avail;
    if (sql.includes('from pg_database')) return locale;
    const m = /count\(\*\) from "([^"]+)"\."(.*)"$/.exec(sql);
    return m ? String(counts[m[1] + '.' + m[2].replaceAll('""', '"')]) : '';
  };
  const spawn = () => ({ status: 0, stdout: 'RAD086_supabase_admin_extra_settings []\n' });
  const good = { 'app.items': 25, 'public.Odd "Name"': 2 };
  const ok = await restoreTest(c, { name: 'monthly', run: fake(good), spawn, wait: async () => {} });
  assert.equal(ok.restore_test_pass, 1); assert.equal(ok.tables_mismatched, 0); assert.equal(ok.rows_restored, 27);
  const start = calls.find(a => a[0] === 'run');
  assert.ok(start.includes('--network') && start[start.indexOf('--network') + 1] === 'none' && start.includes('--pull') && start.at(-1) === IMAGE);
  assert.ok(!start.some(x => /^(-p|-P|--publish|--publish-all|--privileged|--net=host)$/.test(x)) && !start.some(x => x.includes('PASSWORD')));
  assert.ok(start.some(x => x.includes('--lc-collate=C --lc-ctype=C')));
  assert.ok(calls.some(a => a[0] === 'rm' && a.includes('-v')));
  await assert.rejects(restoreTest(c, { name: 'monthly', run: fake({ ...good, 'app.items': 24 }), spawn, wait: async () => {} }), e => e.stage === 'counts');
  await assert.rejects(restoreTest(c, { name: 'monthly', run: fake(good, 'plpgsql'), spawn, wait: async () => {} }), e => e.stage === 'extensions' && e.missing.join() === 'pgcrypto');
  const results = readEntries(c, identity).filter(e => e.kind === 'restore_test');
  assert.deepEqual(results.map(e => e.result).slice(0, 3), ['pass', 'fail', 'fail']); assert.equal(results[1].stage, 'counts'); assert.equal(results[1].tables_mismatched, 1);
  assert.deepEqual([results[2].stage, results[2].missing_extensions], ['extensions', 1]);
  for (const wrong of ['i||C|C', 'c|en-US|C|C', 'c||POSIX|C', 'c||C|POSIX'])
    await assert.rejects(restoreTest(c, { name: 'monthly', run: fake(good, 'plpgsql\npgcrypto', wrong), spawn, wait: async () => {} }), e => e.stage === 'collation');
  // A tampered archive is refused before any container exists.
  const before = calls.length, monthly = join(c.backupRoot, 'store', slotStamp(c.backupRoot, 'monthly'));
  writeFileSync(join(monthly, 'project.dump'), Buffer.concat([readFileSync(join(monthly, 'project.dump')), Buffer.from('x')]));
  await assert.rejects(restoreTest(c, { name: 'monthly', run: fake(good), spawn, wait: async () => {} }), e => e.stage === 'verify');
  assert.equal(calls.length, before);
});
test('slot promotion rule and collection are exact and never delete without a resolving slot', () => {
  const none = { weekly: true, monthly: true };
  assert.deepEqual(slotsFor('20261103T031500Z', none), ['daily']);                       // Tuesday
  assert.deepEqual(slotsFor('20261108T031500Z', none), ['daily', 'weekly']);             // Sunday
  assert.deepEqual(slotsFor('20261201T031500Z', none), ['daily', 'monthly']);            // 1st, Tuesday
  assert.deepEqual(slotsFor('20260301T031500Z', none), ['daily', 'weekly', 'monthly']);  // Sunday the 1st
  assert.deepEqual(slotsFor('20261103T031500Z', { weekly: false, monthly: false }), ['daily', 'weekly', 'monthly']);
  const root = mkdtempSync(join(tmpdir(), 'rad086-col-')); chmodSync(root, 0o700);
  mkdirSync(join(root, 'store', '20261031T031500Z'), { recursive: true });
  assert.deepEqual(collect(root), { removed: [], tmp_removed: 0 });                      // no slot resolves: nothing is deleted
  assert.ok(existsSync(join(root, 'store', '20261031T031500Z')));
  mkdirSync(join(root, '.tmp', 'x.failed'), { recursive: true }); mkdirSync(join(root, 'store', '20261101T031500Z'));
  symlinkSync('store/20261101T031500Z', join(root, 'daily'));
  assert.deepEqual(collect(root), { removed: ['20261031T031500Z'], tmp_removed: 1 });
  assert.ok(existsSync(join(root, 'store', '20261101T031500Z')));
  assert.throws(() => publish({ backupRoot: root }, '20261101T031500Z'));                // never replaces an existing store entry
});

test('container arguments never publish ports, keep no network, and never carry a password', () => {
  const a = containerArgs('n', { datlocprovider: 'c', datlocale: null, datcollate: 'en_US.UTF-8', datctype: 'en_US.UTF-8' });
  assert.deepEqual(a.slice(a.indexOf('--network'), a.indexOf('--network') + 2), ['--network', 'none']);
  assert.ok(!a.includes('-p') && !a.includes('-P') && !a.some(x => /PASSWORD=/.test(x)) && a.at(-1) === 'supabase/postgres:17.11.0.016@sha256:6ce438c186e9f0a0aad707c2151cc0023e26bb7afd57e20080fdcd2bd76ba57d');
  assert.deepEqual(parseExtensions('1; 0 0 EXTENSION - pgcrypto\n2; 0 0 COMMENT - EXTENSION pgcrypto\n3; 0 0 EXTENSION - "uuid-ossp"\n'), ['pgcrypto']);
  assert.equal(stamp(new Date('2026-10-31T03:15:00.123Z')), '20261031T031500Z');
});
test('CLI never prints secrets or raw errors and init-password refuses a non-terminal', () => {
  const r = spawnSync(process.execPath, ['scripts/ops/laptop-backup.mjs', 'init-password'], { env: { ...process.env, HOME: tmp }, input: 'CANARY_PASSWORD\n', encoding: 'utf8' });
  assert.equal(r.status, 1); assert.match(r.stderr.trim(), /^STOP laptop_backup:[a-z_]+$/); assert.equal(r.stdout, ''); assert.doesNotMatch(r.stderr, /CANARY/);
});
// The owner-run probe packet is exercised for real against the local synthetic cluster (SQL parts only; the timed retries need a provider).
const packet = readFileSync('docs/RAD-086_PROBE_SQL_PACKET.md', 'utf8');
const steps = new Map([...packet.matchAll(/\*\*([A-Z]\d[a-z]?) — [^\n]*\*\*\n\n```bash\n([\s\S]*?)```/g)].map(m => [m[1], m[2]]));
const sqlOf = id => /<<'SQL'\n([\s\S]*?)\nSQL\n/.exec(steps.get(id) + '\n')?.[1];
test('probe packet: every part under 15k, mutations name only probe roles, and the SQL runs, tears down and leaves everything else untouched', () => {
  for (const m of packet.matchAll(/```[a-z]*\n([\s\S]*?)```/g)) assert.ok(m[1].length < 15000);
  for (const id of ['P0a', 'P0b', 'P1a', 'P1b', 'P2', 'P4a', 'P5b', 'P5e', 'C1', 'C2', 'C3', 'P8b']) assert.ok(sqlOf(id), id);
  for (const [id, body] of steps) {
    const sql = sqlOf(id) ?? '';
    if (/\b(create|alter|drop|grant|revoke)\b/i.test(sql)) {
      assert.doesNotMatch(sql, /assess_|launch_gate|secret|cascade|drop owned|\bgrant\b|\brevoke\b|if exists/i, id);
      assert.match(sql, /:"(rname|a|b)"|\^rad086_probe_\[0-9a-f\]\{8\}_\[ab\]\$/, id);
    }
    assert.ok(!/\bsql\b.*password\s+'/i.test(body), id);                    // password only ever comes from a psql variable, never typed inline
  }
  assert.match(steps.get('P1a'), /noinherit nosuperuser nocreatedb nocreaterole noreplication nobypassrls connection limit 1 valid until/);
  // Real run of the SQL steps.
  const probe = join(tmp, 'probe'); mkdirSync(probe, { recursive: true });
  writeFileSync(join(probe, 'name_a'), 'rad086_probe_deadbeef_a\n'); writeFileSync(join(probe, 'name_b'), 'rad086_probe_deadbeef_b\n');
  for (const f of ['pa1', 'pb1', 'pb2']) writeFileSync(join(probe, f), 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718\n');
  const env = { ...process.env, HOME: tmp, PGHOST: pgc.root, PGPORT: '55433', PGUSER: 'postgres', PGDATABASE: 'postgres' };
  const run = id => execFileSync('psql', ['-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1'], { env, input: sqlOf(id), encoding: 'utf8' }).trim();
  const admin = sql => execFileSync('psql', ['-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1', '-c', sql], { env, encoding: 'utf8' }).trim();
  admin('create role assess_worker nologin; create role bystander login');
  const snap = () => admin("select string_agg(rolname||rolcanlogin||rolsuper, ',' order by rolname) from pg_roles where rolname in ('assess_worker','bystander','postgres')");
  const before = snap(), protectedBefore = run('P0b');
  assert.equal(run('P0a'), '0'); assert.equal(protectedBefore, '0|1');
  run('P1a'); run('P1b'); assert.equal(run('P2'), '2|0');
  run('P4a'); assert.equal(admin("select rolcanlogin from pg_roles where rolname='rad086_probe_deadbeef_a'"), 'f');
  run('P5b'); assert.equal(run('P5e'), '2');
  assert.match(run('C1'), /^\d+$/); run('C2'); assert.equal(run('C3'), '0');
  assert.equal(run('P8b'), protectedBefore); assert.equal(snap(), before);
  // Midway cleanup path: only role A was created, shell variables are gone, the exact-pattern teardown still removes it and nothing else.
  run('P1a'); assert.equal(run('P0a'), '1'); run('C2'); assert.equal(run('C3'), '0'); assert.equal(snap(), before);
});

test('locale provider is exact: ICU needs a bounded locale; unknown provider or missing ICU locale stops', () => {
  const m = { datlocprovider: 'i', datlocale: 'en-US', datcollate: 'en_US.UTF-8', datctype: 'en_US.UTF-8' };
  assert.doesNotThrow(() => validateLocale(m));
  assert.deepEqual(localeArgs(m), ['--locale-provider=icu', '--icu-locale=en-US', '--lc-collate=en_US.UTF-8', '--lc-ctype=en_US.UTF-8']);
  for (const bad of [{ datlocprovider: 'b' }, { datlocprovider: '' }, { datlocale: '' }, { datlocale: null }, { datlocale: undefined },
    { datlocale: 'en-US;id' }, { datlocale: 'en US' }, { datlocale: 'en-US\n' }, { datlocale: 'a'.repeat(65) }])
    assert.throws(() => validateLocale({ ...m, ...bad }), e => e.stage === 'locale');
});

test('ICU backup records all four locale fields in metadata and encrypted log; unsupported or empty locale stops', async () => {
  execFileSync('psql', ['-X','-h',pgc.root,'-p','55433','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-c',
    "create database rad086_icu template template0 encoding 'UTF8' locale_provider icu icu_locale 'en-US' lc_collate 'en_US.UTF-8' lc_ctype 'en_US.UTF-8'"]);
  execFileSync('psql', ['-X','-h',pgc.root,'-p','55433','-U','postgres','-d','rad086_icu','-c','create table public.icu_witness(id integer)']);
  const c = validateConfig({ ...base, pgMajor: pgc.major, backupRoot: join(tmp, 'icu-backup') });
  mkdirSync(c.backupRoot, { mode: 0o700 });
  const deps = local(pgc.root, { PGDATABASE: 'rad086_icu' });
  await runBackup(c, { ...deps, now: new Date('2026-10-31T04:00:00Z') });
  const meta = JSON.parse(readFileSync(join(c.backupRoot,'store','20261031T040000Z','db-meta.json')));
  const entry = readEntries(c, identity).find(e => e.kind === 'backup');
  for (const [k,v] of Object.entries({ datlocprovider:'i', datlocale:'en-US', datcollate:'en_US.UTF-8', datctype:'en_US.UTF-8' })) {
    assert.equal(meta[k],v); assert.equal(entry[k],v);
  }
  for (const [i,bad] of [{ p:'b' },{ l:'' }].entries()) {
    const makeClient = () => {
      const client = deps.makeClient(), query = client.query.bind(client);
      client.query = async (sql, ...args) => {
        const r = await query(sql, ...args);
        if (sql.includes('pg_encoding_to_char')) Object.assign(r.rows[0], bad);
        return r;
      };
      return client;
    };
    await assert.rejects(runBackup(c, { ...deps, makeClient, now: new Date(`2026-10-31T04:0${i+1}:00Z`) }), e => e.stage === 'locale');
  }
});

// Exercise the role rule through PostgreSQL, including defaults omitted by pg_dumpall.
test('role archive accepts matching existing attributes and loads new roles/settings cleanly', () => {
  const q = sql => execFileSync('psql', ['-X', '-h', pgc.root, '-p', '55433', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'], { input: sql, stdio: 'pipe' });
  q('CREATE ROLE "rad086 existing" NOLOGIN NOINHERIT CONNECTION LIMIT 2;');
  const sql = 'CREATE ROLE "rad086 existing";\nALTER ROLE "rad086 existing" WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 2;\n';
  assert.doesNotThrow(() => q(prepareRolesSql(sql + 'CREATE ROLE rad086_new;\nALTER ROLE rad086_new WITH LOGIN;\nALTER ROLE rad086_new SET search_path TO public;\n')));
  q('ALTER ROLE \"rad086 existing\" SET search_path TO public;');
  assert.doesNotThrow(() => q(prepareRolesSql(sql + 'ALTER ROLE \"rad086 existing\" SET search_path TO public;\n')));
  assert.equal(String(q("SELECT rolcanlogin FROM pg_roles WHERE rolname='rad086_new'")).includes('t'), true);
});
test('role attribute differences STOP roles, including archive default connection limit; no earlier work persists', () => {
  const q = sql => execFileSync('psql', ['-X', '-h', pgc.root, '-p', '55433', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'], { input: sql, stdio: 'pipe' });
  for (const attrs of ['NOLOGIN NOINHERIT', 'LOGIN NOINHERIT CONNECTION LIMIT 2', 'NOLOGIN INHERIT CONNECTION LIMIT 2', 'NOLOGIN NOINHERIT CONNECTION LIMIT 2 BYPASSRLS', 'NOLOGIN NOINHERIT CONNECTION LIMIT 2']) {
    assert.throws(() => q(prepareRolesSql('CREATE ROLE rad086_rolled_back;\nCREATE ROLE "rad086 existing";\nALTER ROLE "rad086 existing" WITH ' + attrs + ';\n')), e => String(e.stderr).includes('roles'));
    assert.match(String(q("SELECT count(*) FROM pg_roles WHERE rolname='rad086_rolled_back' OR rolname LIKE 'rad086_role_attribute_probe_%'")), /0/);
  }
  assert.throws(() => q(prepareRolesSql('GRANT rad086_missing TO rad086_new;')), e => String(e.stderr).includes('does not exist'));
});
