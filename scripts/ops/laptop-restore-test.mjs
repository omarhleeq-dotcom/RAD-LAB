// RAD-086 restore proof on the owner's laptop: restore the chosen backup into a throwaway local postgres:17.11 container
// (no network at all, no published ports), with the live provider/datlocale/datcollate/datctype recorded at backup time, then compare table counts
// taken from the same snapshot as the dump. Records the result in the encrypted reconciliation log. Never touches the provider.
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Stop, guard, loadConfig, resolveBackup, verifyBackup, appendEntry, quoteIdent, validateLocale, localeArgs } from './laptop-backup-lib.mjs';

export const IMAGE = 'postgres:17.11';
const ADMIN = 'rad_restore_admin', DB = 'rad_restore';

// Streams a file to `docker exec -i`. Using stdin avoids bind mounts and uid/permission differences with 0600 backup files.
function dockerStdin(args, file, run = spawnSync) {
  const r = run('docker', args, { input: readFileSync(file), maxBuffer: 64 * 1024 * 1024, timeout: 3600000 });
  if (r.status !== 0) throw Error('docker_exec');
  return String(r.stdout ?? '');
}
export function containerArgs(name, meta) {
  // No -p/-P, --network none, image must already be present (--pull never). Trust auth is safe only because there is no network.
  return ['run', '-d', '--name', name, '--label', 'rad-lab-restore-test=1', '--network', 'none', '--pull', 'never',
    '-e', `POSTGRES_USER=${ADMIN}`, '-e', 'POSTGRES_HOST_AUTH_METHOD=trust',
    '-e', `POSTGRES_INITDB_ARGS=--encoding=UTF8 ${localeArgs(meta).join(' ')}`, IMAGE];
}
export function parseExtensions(toc) {
  return [...String(toc).matchAll(/^\d+; \d+ \d+ EXTENSION - ([A-Za-z0-9_-]+)\s*$/gm)].map(m => m[1]);
}
export function readMeta(dir) {
  const m = JSON.parse(readFileSync(join(dir, 'db-meta.json'), 'utf8'));
  validateLocale(m);
  if (!Number.isInteger(m.server_version_num) || !Array.isArray(m.tables)) throw Error('meta');
  for (const [s, t, n] of m.tables) { quoteIdent(s); quoteIdent(t); if (n !== null && !Number.isSafeInteger(n)) throw Error('meta'); }
  return m;
}

export async function restoreTest(c, { name = 'latest', dryRun = false, run = execFileSync, spawn = spawnSync, wait = ms => new Promise(r => setTimeout(r, ms)) } = {}) {
  let stage = 'select', container = null, dir, backup;
  const sh = (args, o = {}) => String(run('docker', args, { encoding: 'utf8', timeout: 600000, ...o }));
  const exec = (cmd, o) => sh(['exec', ...(o?.stdin ? ['-i'] : []), container, ...cmd]);
  try {
    dir = resolveBackup(c, name); backup = dir.split('/').at(-1);
    stage = 'verify'; await verifyBackup(dir);
    stage = 'meta'; const meta = readMeta(dir);
    stage = 'image'; const imageId = sh(['image', 'inspect', IMAGE, '--format', '{{.Id}}']).trim();
    if (!/^sha256:[0-9a-f]{64}$/.test(imageId)) throw new Stop('image');
    if (dryRun) return { dry_run: 1, tables: meta.tables.length, docker_started: 0 };
    container = `rad-restore-${backup.toLowerCase()}`;
    stage = 'container'; sh(containerArgs(container, meta));
    stage = 'ready';
    for (let n = 0; ; n++) {
      if (n > 90) throw new Stop('ready');
      const logs = sh(['logs', container], { stdio: ['ignore', 'pipe', 'pipe'] });
      if (logs.includes('PostgreSQL init process complete; ready for start up.')) {
        const r = spawn('docker', ['exec', container, 'pg_isready', '-U', ADMIN, '-d', 'postgres'], { timeout: 15000 });
        if (r.status === 0) break;
      }
      await wait(2000);
    }
    const psql = (args, file) => dockerStdin(['exec', '-i', container, 'psql', '-X', '-q', '-v', 'ON_ERROR_STOP=1', '-U', ADMIN, ...args], file, spawn);
    const server = Number(exec(['psql', '-X', '-At', '-U', ADMIN, '-d', 'postgres', '-c', 'show server_version_num']).trim());
    if (server !== meta.server_version_num) throw new Stop('version');
    stage = 'extensions';
    const toc = String(run('pg_restore', ['--list', join(dir, 'project.dump')], { encoding: 'utf8', timeout: 600000, maxBuffer: 256 * 1024 * 1024 }));
    const available = new Set(exec(['psql', '-X', '-At', '-U', ADMIN, '-d', 'postgres', '-c', 'select name from pg_available_extensions']).split('\n'));
    const missing = parseExtensions(toc).filter(x => !available.has(x));
    if (missing.length) { const e = new Stop('extensions'); e.missing = missing; throw e; }
    stage = 'roles'; psql(['-d', 'postgres'], join(dir, 'roles.sql'));
    stage = 'collation';
    // Successful creation is also the capability probe: absent ICU or libc locale is a hard STOP.
    exec(['createdb', '-U', ADMIN, '-T', 'template0', '--encoding=UTF8', ...localeArgs(meta), DB]);
    const verifyLocale = () => {
      const loc = exec(['psql', '-X', '-At', '-F', '|', '-U', ADMIN, '-d', 'postgres', '-c', `select datlocprovider, coalesce(datlocale,''), datcollate, datctype from pg_database where datname='${DB}'`]).trim();
      const collation_match = loc === `${meta.datlocprovider}|${meta.datlocale ?? ''}|${meta.datcollate}|${meta.datctype}`;
      if (!collation_match) throw new Stop('collation');
    };
    verifyLocale();
    stage = 'restore';
    dockerStdin(['exec', '-i', container, 'pg_restore', '--exit-on-error', '-U', ADMIN, '--dbname', DB], join(dir, 'project.dump'), spawn);
    stage = 'collation'; verifyLocale();
    stage = 'counts';
    const counted = meta.tables.filter(([, , n]) => n !== null);
    let mismatched = 0, rows = 0;
    for (const [s, t, n] of counted) {
      const got = Number(exec(['psql', '-X', '-At', '-U', ADMIN, '-d', DB, '-c', `select count(*) from ${quoteIdent(s)}.${quoteIdent(t)}`]).trim());
      rows += got; if (got !== n) mismatched++;
    }
    if (mismatched) { const e = new Stop('counts'); e.detail = { tables_compared: counted.length, tables_mismatched: mismatched }; throw e; }
    stage = 'log';
    const result = { tables_compared: counted.length, tables_mismatched: 0, rows_restored: rows, tables_uncounted: meta.tables.length - counted.length,
      container_server_version_num: server, collation_match: 1 };
    appendEntry(c, { kind: 'restore_test', dir: backup, result: 'pass', image_id: imageId, datlocprovider: meta.datlocprovider, datlocale: meta.datlocale, datcollate: meta.datcollate, datctype: meta.datctype, ...result }, run);
    return { ...result, restore_test_pass: 1 };
  } catch (e) {
    const code = e instanceof Stop ? e.stage : stage;
    if (dir) try { appendEntry(c, { kind: 'restore_test', dir: backup, result: 'fail', stage: code, ...(e.detail ?? {}), ...(e.missing ? { missing_extensions: e.missing.length } : {}) }, run); } catch { /* exit code is the signal */ }
    const s = new Stop(code); s.missing = e.missing; throw s;
  } finally {
    if (container) try { sh(['rm', '-f', '-v', container], { stdio: ['ignore', 'pipe', 'pipe'] }); } catch { /* owner removes via the label shown in the runbook */ }
  }
}
export async function main(argv = process.argv.slice(2)) {
  process.umask(0o077);
  const dryRun = argv.includes('--dry-run'), rest = argv.filter(a => a !== '--dry-run');
  if (rest.length > 1) throw new Stop('argument');
  return restoreTest(guard('config', () => loadConfig()), { name: rest[0] ?? 'latest', dryRun });
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().then(r => console.log(JSON.stringify(r))).catch(e => {
    console.error('STOP laptop_restore_test:' + (e instanceof Stop ? e.stage : 'internal') + (e.missing ? ' missing_extensions=' + e.missing.join(',') : ''));
    process.exitCode = 1;
  });
}
