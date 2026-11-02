// Owner laptop only: latest encrypted RAD-086 -> isolated pinned ICU image -> M09.
// No provider connection, selectors, row payloads, live SQL or promotion.
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, mkdtempSync, mkdirSync, chmodSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Client } from 'pg';
import { IMAGE, restoreTest } from '../ops/laptop-restore-test.mjs';
import { loadConfig } from '../ops/laptop-backup-lib.mjs';
import { localOnly, prepareDatabaseOwner, prepareSocketAuth } from './rad062-laptop-rehearsal.mjs';
const file = '20261102000100_rad062_supervisor_grading_authorization.sql';
const read = path => readFileSync(path, 'utf8');
const snapshot = `select jsonb_build_object('functions',(select jsonb_agg(to_jsonb(p) order by oid) from pg_proc p where pronamespace='assess'::regnamespace),
 'foreign_keys',(select jsonb_agg(to_jsonb(k) order by oid) from pg_constraint k where contype='f')) v`;
function assert(value) { if (!value) throw Error('M09 rehearsal assertion'); }
async function ready(db, path) { const rows = (await db.query(read(path))).rows; assert(rows.length === 6 && rows.every(r => r.ok === true)); }
export async function inspectM09(db) {
 const migration = read('supabase/migrations/' + file);
 const manifest = JSON.parse(read('scripts/pages/frontend-schema.json'));
 const reviewedSha256 = '9152676e5975333e1bedaf453c7b7855d5f8e910df7d03dc1e64cdf78037dc0a';
 const deferred = Object.hasOwn(manifest.deferredMigrations, file);
 const required = manifest.requiredMigrations.includes(file);
 assert(deferred !== required && (!deferred || manifest.deferredMigrations[file]?.sha256 === reviewedSha256)
  && createHash('sha256').update(migration).digest('hex') === reviewedSha256);
 await ready(db, 'supabase/checks/rad062-ready.sql');
 const before = (await db.query(snapshot)).rows[0].v;
 for (const replacement of ['$anchor$\n NO_SUCH_ANCHOR;$anchor$', '$anchor$\n$anchor$']) {
  let failed = false;
  try { await db.query(migration.replace('$anchor$\n return receipt;$anchor$', replacement)); }
  catch (e) { failed = e.code === '55000' && e.message.startsWith('M09 anchor count'); }
  finally { await db.query('rollback'); }
  assert(failed && JSON.stringify((await db.query(snapshot)).rows[0].v) === JSON.stringify(before));
 }
 await db.query(migration);
 await ready(db, 'supabase/checks/rad062-m09-ready.sql');
 assert(JSON.stringify((await db.query(snapshot)).rows[0].v.foreign_keys) === JSON.stringify(before.foreign_keys));
 return { m09_committed: 1, pre_m08_ready: 1, post_m09_ready: 1, anchor_rollbacks: 2, foreign_keys_unchanged: 1 };
}
export async function rehearseM09(config, env = process.env) {
 localOnly([], env);
 const root = mkdtempSync(join(tmpdir(), 'rad062-m09-restore-')), socket = join(root, 'socket');
 mkdirSync(socket); chmodSync(root, 0o700); chmodSync(socket, 0o777);
 const dockerEnv = { ...env };
 for (const key of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH']) delete dockerEnv[key];
 let container, result, cleanupFailed = false;
 const run = (program, args, opts = {}) => {
  if (program === 'pg_restore') return execFileSync('docker', ['--host=unix:///var/run/docker.sock','run','--rm','-i','--network=none','--pull=never','--entrypoint','pg_restore',IMAGE,'--list'], { ...opts, env: dockerEnv, input: readFileSync(args.at(-1)) });
  if (program !== 'docker') return execFileSync(program, args, opts);
  if (args[0] === 'run') {
   container = args[args.indexOf('--name') + 1];
   args = [...args.slice(0,-1),'--mount',`type=bind,src=${socket},dst=/var/run/postgresql`,args.at(-1)];
  }
  if (args[0] === 'rm') try { execFileSync('docker', ['--host=unix:///var/run/docker.sock','exec','--user','0',container,'chown','-R',`${process.getuid()}:${process.getgid()}`,'/var/run/postgresql'], { env: dockerEnv, stdio: 'pipe', timeout: 15000 }); } catch { /* always remove */ }
  try { return execFileSync('docker', ['--host=unix:///var/run/docker.sock',...args], { ...opts, env: dockerEnv }); }
  catch (e) { if (args[0] === 'rm') cleanupFailed = true; throw e; }
 };
 const spawn = (program, args, opts) => spawnSync(program, ['--host=unix:///var/run/docker.sock',...args], { ...opts, env: dockerEnv });
 try {
  await restoreTest(config, { name: 'latest', run, spawn, beforeTeardown: async ({ database }) => {
   prepareDatabaseOwner(run, container, database);
   const password = prepareSocketAuth(run, container, database);
   const db = new Client({ host: socket, user: 'postgres', database, password, ssl: false, application_name: 'rad062-m09-local-restore', connectionTimeoutMillis: 10000, query_timeout: 120000 });
   db.on('error', () => {});
   try { await db.connect(); result = await inspectM09(db); } finally { await db.end(); }
  } });
  assert(!cleanupFailed && result);
  return { ...result, teardown_pass: 1 };
 } finally {
  if (cleanupFailed && container) try { run('docker',['rm','-fv',container]); } catch { /* failure remains STOP */ }
  rmSync(root, { recursive: true, force: true });
 }
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
 try { localOnly(process.argv.slice(2), process.env); console.log(JSON.stringify(await rehearseM09(loadConfig()))); }
 catch { console.error('STOP rad062_m09_rehearsal; inspect locally with the owner; no live action authorized'); process.exitCode = 1; }
}
