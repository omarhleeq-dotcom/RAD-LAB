// RAD-086 owner-laptop backup helpers. Read-only against the provider; local files only.
// Output is numeric or fixed stage codes. Passwords live only in a 0600 libpq password file outside the checkout.
import { createHash } from 'node:crypto';
import { createReadStream, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { sep, join } from 'node:path';
import { options } from '../assess/rad062-db-day.mjs';

export class Stop extends Error { constructor(stage) { super(stage); this.stage = stage; } }
export const guard = (stage, fn) => { try { return fn(); } catch (e) { throw e instanceof Stop ? e : new Stop(stage); } };
export const BACKUP_NAME = /^\d{8}T\d{6}Z$/;
export const AGE_RECIPIENT = /^age1[02-9ac-hj-np-z]{58}$/;
export const LOCALE = /^[A-Za-z0-9_.@-]{1,64}$/;
export const stamp = (d = new Date()) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
export const configDir = () => join(homedir(), '.config', 'rad-lab-backup');
export const configPath = () => join(configDir(), 'config.json');
export const passFilePath = () => join(configDir(), 'pgpass');

// A private file/dir: real (no symlink), owned by this user, no group/other bits.
export function assertPrivate(path, dir) {
  const st = lstatSync(path);
  if (st.isSymbolicLink() || (dir ? !st.isDirectory() : !st.isFile()) || (st.mode & 0o077) !== 0 ||
    (typeof process.getuid === 'function' && st.uid !== process.getuid())) throw Error('not_private');
}
export function outsideCheckout(path) {
  // Repository root comes from this file's location, not the working directory (Task Scheduler starts elsewhere).
  const real = realpathSync(path), root = realpathSync(fileURLToPath(new URL('../..', import.meta.url)));
  if (real === root || real.startsWith(root + sep)) throw Error('inside_checkout');
  return real;
}
export function sha256File(path) {
  return new Promise((ok, fail) => {
    const h = createHash('sha256'), s = createReadStream(path);
    s.on('data', c => h.update(c)); s.on('error', fail); s.on('end', () => ok(h.digest('hex')));
  });
}
export const sha256Bytes = b => createHash('sha256').update(b).digest('hex');
export const quoteIdent = n => {
  if (typeof n !== 'string' || !/^[\x20-\x7e]{1,63}$/.test(n)) throw Error('identifier');
  return '"' + n.replaceAll('"', '""') + '"';
};

const KEYS = ['projectRef', 'endpoint', 'poolerHost', 'ageRecipient', 'caFile', 'backupRoot', 'pgMajor'];
// Strict, non-secret configuration. Unknown keys are refused; no connection string, user or password fields exist.
export function validateConfig(c) {
  if (!c || typeof c !== 'object' || Object.keys(c).some(k => !KEYS.includes(k))) throw Error('config_keys');
  if (!/^[a-z]{20}$/.test(c.projectRef ?? '') || !['session-pooler', 'direct'].includes(c.endpoint) ||
    !AGE_RECIPIENT.test(c.ageRecipient ?? '') || !Number.isInteger(c.pgMajor) || c.pgMajor < 14 || c.pgMajor > 99 ||
    !/^\/[A-Za-z0-9_./-]+$/.test(c.caFile ?? '') || !/^\/[A-Za-z0-9_./-]+$/.test(c.backupRoot ?? '') ||
    c.caFile.includes('..') || c.backupRoot.includes('..')) throw Error('config_values');
  if ((c.endpoint === 'session-pooler') !== (c.poolerHost !== undefined)) throw Error('config_pooler');
  return c;
}
export function loadConfig(path = configPath()) {
  assertPrivate(path, false);
  return validateConfig(JSON.parse(readFileSync(path, 'utf8')));
}
// Selectors are validated by the same options() used by rad062-db-day, so both tools share one rule set.
export function connectionEnv(c) {
  const pooled = c.endpoint === 'session-pooler';
  const sel = { PGHOST: pooled ? c.poolerHost : `db.${c.projectRef}.supabase.co`, PGPORT: '5432', PGDATABASE: 'postgres',
    PGUSER: pooled ? `postgres.${c.projectRef}` : 'postgres', PGSSLMODE: 'verify-full', PGSSLROOTCERT: c.caFile,
    RAD062_EXPECTED_PROJECT_REF: c.projectRef, ...(pooled ? { RAD062_POOLER_HOST: c.poolerHost } : {}) };
  options(['backup', '--live', '--project-ref', c.projectRef, ...(pooled ? ['--session-pooler'] : [])], sel);
  return { PGHOST: sel.PGHOST, PGPORT: sel.PGPORT, PGDATABASE: sel.PGDATABASE, PGUSER: sel.PGUSER, PGSSLMODE: sel.PGSSLMODE,
    PGSSLROOTCERT: sel.PGSSLROOTCERT, PGPASSFILE: passFilePath(), PGCONNECT_TIMEOUT: '15', PATH: process.env.PATH ?? '', LANG: 'C' };
}
// libpq password-file line; ':' and '\' must be escaped. Never passed through argv or the environment.
export const passLine = (c, password) => {
  if (typeof password !== 'string' || password.length < 8 || /[\0\r\n]/.test(password)) throw Error('password');
  const esc = s => s.replaceAll('\\', '\\\\').replaceAll(':', '\\:');
  return `${esc(connectionEnv(c).PGHOST)}:5432:*:${esc(connectionEnv(c).PGUSER)}:${esc(password)}\n`;
};
export const writePassFile = (c, password, replace, path = passFilePath()) => {
  const line = passLine(c, password);
  if (replace) { const tmp = path + '.new'; writeFileSync(tmp, line, { mode: 0o600, flag: 'wx' }); renameSync(tmp, path); }
  else writeFileSync(path, line, { mode: 0o600, flag: 'wx' });
};

// Retention (owner decision D-E): exactly three rotating slots, daily / weekly (Sunday) / monthly (1st), as symlinks
// root/<slot> -> store/<stamp>. A new backup is built in root/.tmp, verified, moved into store/, and only then does each
// slot link swap atomically (rename of a new symlink over the old one). On any earlier failure the old links are untouched.
export const SLOTS = ['daily', 'weekly', 'monthly'];
export const storeDir = root => join(root, 'store');
export const tmpDir = root => join(root, '.tmp');
export function listBackups(root) {
  const d = storeDir(root);
  return existsSync(d) ? readdirSync(d).filter(n => BACKUP_NAME.test(n) && existsSync(join(d, n, 'checksums.json'))).sort() : [];
}
export function slotStamp(root, slot) {
  try { return /^store\/(\d{8}T\d{6}Z)$/.exec(readlinkSync(join(root, slot)))?.[1] ?? null; } catch { return null; }
}
export const parseStamp = n => Date.parse(`${n.slice(0, 4)}-${n.slice(4, 6)}-${n.slice(6, 8)}T${n.slice(9, 11)}:${n.slice(11, 13)}:${n.slice(13, 15)}Z`);
// UTC calendar day of the stamp decides promotion. An empty slot is filled by the first backup (there is no older copy to keep).
export function slotsFor(stamp, filled) {
  const d = new Date(parseStamp(stamp));
  return ['daily', ...(d.getUTCDay() === 0 || !filled.weekly ? ['weekly'] : []), ...(d.getUTCDate() === 1 || !filled.monthly ? ['monthly'] : [])];
}
export function swapSlot(root, slot, stamp, rename = renameSync) {
  const next = join(root, `.${slot}.new`);
  rmSync(next, { force: true });
  symlinkSync(`store/${stamp}`, next);
  rename(next, join(root, slot));
}
// Caller has already verified .tmp/<name> against its checksums. Returns [{slot, from, to}]; on a mid-way failure the error
// carries the swaps that did complete (e.done) and every slot not yet swapped still points at its previous backup.
export function publish(c, name, { rename = renameSync } = {}) {
  const root = c.backupRoot, dest = join(storeDir(root), name);
  mkdirSync(storeDir(root), { recursive: true, mode: 0o700 });
  if (existsSync(dest)) throw Error('exists');
  renameSync(join(tmpDir(root), name), dest);
  const done = [], filled = { weekly: slotStamp(root, 'weekly') !== null, monthly: slotStamp(root, 'monthly') !== null };
  try {
    for (const slot of slotsFor(name, filled)) { const from = slotStamp(root, slot); swapSlot(root, slot, name, rename); done.push({ slot, from, to: name }); }
  } catch (e) { e.done = done; throw e; }
  return done;
}
// Removes only unreferenced store/<stamp> directories and leftovers in .tmp. Refuses to delete anything if no slot resolves.
export function collect(root, remove = rmSync) {
  const keep = new Set(SLOTS.map(s => slotStamp(root, s)).filter(Boolean)), removed = [];
  if (!keep.size || !existsSync(storeDir(root))) return { removed, tmp_removed: 0 };
  for (const n of readdirSync(storeDir(root))) {
    const p = join(storeDir(root), n);
    if (BACKUP_NAME.test(n) && !keep.has(n) && lstatSync(p).isDirectory()) { remove(p, { recursive: true, force: true }); removed.push(n); }
  }
  let tmp_removed = 0;
  if (existsSync(tmpDir(root))) for (const n of readdirSync(tmpDir(root))) { remove(join(tmpDir(root), n), { recursive: true, force: true }); tmp_removed++; }
  return { removed, tmp_removed };
}
export function clientMajor(program, runner = execFileSync) {
  const m = /\) (\d+)\.(\d+)/.exec(String(runner(program, ['--version'], { encoding: 'utf8', timeout: 15000 })));
  if (!m) throw Error('version');
  return [Number(m[1]), Number(m[2])];
}

// Reconciliation log: one age-encrypted file per entry. The unattended job holds only the public recipient, so it can
// add entries but cannot read them. Each entry carries the SHA-256 of the previous entry file (deletion/reorder evidence).
export function logDir(c) { return join(c.backupRoot, 'reconciliation'); }
export function appendEntry(c, entry, run = execFileSync) {
  const dir = logDir(c);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  assertPrivate(dir, true);
  const files = readdirSync(dir).filter(n => /^\d{6}-\d{8}T\d{6}Z-[a-z_]+\.age$/.test(n)).sort();
  const prev = files.length ? sha256Bytes(readFileSync(join(dir, files.at(-1)))) : null;
  const body = JSON.stringify({ v: 1, at: new Date().toISOString(), ...entry, prev });
  const sealed = run('age', ['-r', c.ageRecipient], { input: body, timeout: 30000, maxBuffer: 16 * 1024 * 1024 });
  writeFileSync(join(dir, `${String(files.length + 1).padStart(6, '0')}-${stamp()}-${entry.kind}.age`), sealed, { mode: 0o600, flag: 'wx' });
  return files.length + 1;
}
// Owner-side only: needs the plaintext identity path (for example a process-substitution of the passphrase-protected file).
export function readEntries(c, identityPath, run = execFileSync) {
  const dir = logDir(c), files = readdirSync(dir).filter(n => /\.age$/.test(n)).sort(), out = [];
  let prev = null;
  for (const f of files) {
    const raw = readFileSync(join(dir, f)), e = JSON.parse(String(run('age', ['-d', '-i', identityPath], { input: raw, timeout: 30000 })));
    if (e.prev !== prev) throw Error('log_chain');
    prev = sha256Bytes(raw); out.push(e);
  }
  return out;
}

export async function verifyBackup(dir) {
  assertPrivate(dir, true);
  const sums = JSON.parse(readFileSync(join(dir, 'checksums.json'), 'utf8'));
  if (Object.keys(sums).sort().join(',') !== 'project.dump,roles.sql') throw Error('inventory');
  for (const [f, d] of Object.entries(sums)) {
    assertPrivate(join(dir, f), false);
    if (await sha256File(join(dir, f)) !== d) throw Error('checksum');
  }
  return { files: 2, bytes: Object.keys(sums).reduce((n, f) => n + lstatSync(join(dir, f)).size, 0) };
}
export const resolveBackup = (c, name) => {
  const root = realpathSync(c.backupRoot);
  assertPrivate(root, true); outsideCheckout(root);
  const pick = name === 'latest' ? slotStamp(root, 'daily') : SLOTS.includes(name) ? slotStamp(root, name) : name;
  if (!pick || !BACKUP_NAME.test(pick)) throw Error('no_backup');
  const dir = join(storeDir(root), pick);
  if (!existsSync(join(dir, 'checksums.json'))) throw Error('no_backup');
  return dir;
};
