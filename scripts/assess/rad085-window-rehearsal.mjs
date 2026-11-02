// Owner laptop only: latest encrypted RAD-086 -> isolated pinned ICU image -> 0200 -> 0300.
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
import { checks } from './rad062-db-day.mjs';
const read = path => readFileSync(path, 'utf8');
// Historical post-M09 checks: never select the promoted manifest on a restored M09 backup.
export const M09_CHECKS = Object.freeze([
 'supabase/checks/training-ready.sql',
 'supabase/checks/comparison-ready.sql',
 'supabase/checks/assess-mixed-ready.sql',
 'supabase/checks/assess-practical-ready.sql',
 'supabase/checks/rad062-p1-b-m09-ready.sql',
 'supabase/checks/assess-history-ready.sql',
 'supabase/checks/assess-retention-ready.sql',
 'supabase/checks/owner-dashboard-ready.sql',
 'supabase/checks/owner-deletion-surveys-ready.sql',
 'supabase/checks/rad062-m09-ready.sql',
]);
export const WINDOW_MIGRATIONS = Object.freeze({
 '20261102000200_rad059_emergency_alternate.sql': '4246d046edc0913adbed66992263226cdcc11ef92bd60895155c245ad4f9f610',
 '20261102000300_rad085_rights_write_disclosures.sql': '707362db6890b027bcfee29c07f644fdb207d58e56d52803a4dab0a0dd1baee1',
});
const snapshot = `select jsonb_build_object(
 'functions',(select coalesce(jsonb_agg(jsonb_build_object('oid',p.oid,'signature',p.oid::regprocedure::text,'properties',to_jsonb(p)-'prosrc','body',p.prosrc) order by p.oid),'[]')
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('assess','emergency','public') and not exists(select 1 from pg_depend d where d.classid='pg_proc'::regclass and d.objid=p.oid and d.deptype='e')),
 'relations',(select coalesce(jsonb_agg(jsonb_build_object('oid',c.oid,'name',c.oid::regclass::text,'owner',c.relowner,'acl',c.relacl,'rls',c.relrowsecurity,'force',c.relforcerowsecurity) order by c.oid),'[]')
 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('assess','emergency','public') and c.relkind in ('r','p')),
 'foreign_keys',(select coalesce(jsonb_agg(jsonb_build_object('oid',k.oid,'name',k.conname,'table',k.conrelid::regclass::text,'definition',pg_get_constraintdef(k.oid),'catalogue',to_jsonb(k)) order by k.oid),'[]') from pg_constraint k where contype='f'),
 'objects',(select jsonb_agg(to_jsonb(c) order by c.oid) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('assess','emergency','public')),
 'triggers',(select jsonb_agg(to_jsonb(t) order by t.oid) from pg_trigger t),
 'constraints',(select jsonb_agg(to_jsonb(k) order by k.oid) from pg_constraint k),
 'emergency',to_regnamespace('emergency')::oid) v`;
function assert(value) { if (!value) throw Error('RAD085 window rehearsal assertion'); }
const equal = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const addedKeys = [
 ['emergency.appointment','appointment_appointed_by_fkey','FOREIGN KEY (appointed_by) REFERENCES profiles(user_id) ON DELETE SET NULL'],
 ['emergency.appointment','appointment_user_id_fkey','FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE SET NULL'],
 ['emergency.audit','audit_actor_fkey','FOREIGN KEY (actor) REFERENCES profiles(user_id) ON DELETE SET NULL'],
 ['emergency.operations','operations_actor_fkey','FOREIGN KEY (actor) REFERENCES profiles(user_id) ON DELETE SET NULL'],
 ['emergency.phases','phases_operation_fkey','FOREIGN KEY (operation) REFERENCES emergency.operations(operation) ON DELETE CASCADE'],
 ['assess.pilot_write_usage','pilot_write_usage_stream_fkey','FOREIGN KEY (stream) REFERENCES assess.pilot_write_limits(stream)'],
 ['assess.pilot_write_usage','pilot_write_usage_user_id_fkey','FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE'],
].map(x=>x.join('|')).sort();
function preserve(before, after, changedBodies) {
 for (const kind of ['functions','relations','foreign_keys']) {
  for (const old of before[kind]) {
   const current=after[kind].find(x=>x.oid===old.oid);
   assert(current && equal(kind==='functions'? {...old,body:null}:old,kind==='functions'? {...current,body:null}:current));
  }
 }
 const changed=before.functions.filter(old=>after.functions.find(x=>x.oid===old.oid).body!==old.body).map(x=>x.signature).sort();
 assert(equal(changed,changedBodies.slice().sort()));
}
export async function inspectWindow(db) {
 const manifest=JSON.parse(read('scripts/pages/frontend-schema.json'));
 const migrations=Object.entries(WINDOW_MIGRATIONS).map(([file,sha])=>{
  const migration=read('supabase/migrations/'+file), deferred=Object.hasOwn(manifest.deferredMigrations,file), required=manifest.requiredMigrations.includes(file);
  assert(deferred!==required && (!deferred || manifest.deferredMigrations[file].sha256===sha) && createHash('sha256').update(migration).digest('hex')===sha);
  return migration;
 });
 await checks(db,M09_CHECKS);
 const snap=async()=> (await db.query(snapshot)).rows[0].v;
 const before=await snap(); assert(before.emergency===null);
 let refused=false;
 try { await db.query(migrations[1]); }
 catch(e) { refused=e.code==='55000' && e.message==='RAD085 post-0200 catalogue required'; }
 finally { await db.query('rollback'); }
 assert(refused && equal(await snap(),before));
 await db.query(migrations[0]);
 await checks(db,['supabase/checks/rad059-alternate-ready.sql']);
 const alternate=await snap(); preserve(before,alternate,[]);
 assert(equal(alternate.foreign_keys.filter(x=>!before.foreign_keys.some(b=>b.oid===x.oid)).map(x=>[x.table,x.name,x.definition].join('|')).sort(),addedKeys.filter(x=>x.startsWith('emergency.'))));
 await db.query(migrations[1]);
 await checks(db,['supabase/checks/rad085-review-ready.sql',...M09_CHECKS.filter(x=>!x.includes('rad062-'))]);
 const after=await snap();
 preserve(alternate,after,[
  'owner_account_deletion_v1(text,uuid,uuid,integer)', 'assess.join_decide_v1(uuid,integer,text)',
  'assess.scope_page_v1(text,uuid,uuid,integer)', 'assess.require_consent_v1()',
  'assess.manual_authorize_v1(uuid)', 'assess.manual_queue_v1(uuid,integer)',
  'assess.manual_read_v1(uuid)', 'assess.manual_score_v1(uuid,uuid,integer,jsonb,text)',
  'assess.manual_finalize_v1(uuid,uuid,integer)',
 ]);
 assert(equal(after.foreign_keys.filter(x=>!before.foreign_keys.some(b=>b.oid===x.oid)).map(x=>[x.table,x.name,x.definition].join('|')).sort(),addedKeys));
 return { pre_m09_checks:10, order_refused:1, refusal_unchanged:1, alternate_committed:1, alternate_ready:1,
  review_committed:1, review_ready:1, unchanged_checks:8, baseline_preserved:1, reviewed_added_fks:7 };
}
export async function rehearseWindow(config, env = process.env) {
 localOnly([], env);
 const root = mkdtempSync(join(tmpdir(), 'rad085-window-restore-')), socket = join(root, 'socket');
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
   const db = new Client({ host: socket, user: 'postgres', database, password, ssl: false, application_name: 'rad085-window-local-restore', connectionTimeoutMillis: 10000, query_timeout: 120000 });
   db.on('error', () => {});
   try { await db.connect(); result = await inspectWindow(db); } finally { await db.end(); }
  } });
  assert(!cleanupFailed && result);
  return { ...result, teardown_pass: 1 };
 } finally {
  if (cleanupFailed && container) try { run('docker',['rm','-fv',container]); } catch { /* failure remains STOP */ }
  rmSync(root, { recursive: true, force: true });
 }
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
 try { localOnly(process.argv.slice(2), process.env); console.log(JSON.stringify(await rehearseWindow(loadConfig()))); }
 catch { console.error('STOP rad085_window_rehearsal; inspect locally with the owner; no live action authorized'); process.exitCode = 1; }
}
