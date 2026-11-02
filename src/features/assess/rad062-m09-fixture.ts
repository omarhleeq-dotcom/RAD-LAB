/** Required real PostgreSQL proofs. Both local and production-pinned ICU image; no live URL. */
import { afterAll } from 'vitest';
import { Client } from 'pg';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const { prepareSocketAuth } = await import('../../../scripts/assess/' + 'rad062-laptop-rehearsal.mjs') as { prepareSocketAuth: (run: typeof execFileSync, container: string, database: string) => string };
import { rad062Fixture, syntheticDraft, id } from './rad062-test-fixture';
import { publicationFromDraftV2, type BridgeSnapshotV2 } from './server-authoring-bridge-v2';
import type { GradingClaimV2 } from './server-contracts-v2';
export { id };
export const M09 = '20261102000100_rad062_supervisor_grading_authorization.sql';
export const sql = (file = M09) => readFileSync('supabase/migrations/' + file, 'utf8');
export const modes = ['embedded', 'supabase17'] as const;
export type Mode = typeof modes[number];
export const image = 'supabase/postgres:17.11.0.016@sha256:6ce438c186e9f0a0aad707c2151cc0023e26bb7afd57e20080fdcd2bd76ba57d';
const docker = (args: string[]) => execFileSync('docker', args, { encoding: 'utf8', stdio: 'pipe', timeout: 120000 });
let container: Promise<{ name: string; socket: string; password: string; startedAt: number; databasesCloned: number }> | undefined;
async function startContainer() {
 const startedAt = performance.now();
 const socket = mkdtempSync(join(tmpdir(), 'rad062-m09-')); chmodSync(socket, 0o777);
 const name = `rad062-m09-${process.pid}-${Date.now()}`;
 try {
  docker(['run', '-d', '--name', name, '--network', 'none', '--pull', 'never',
   '--mount', 'type=volume,destination=/var/lib/postgresql/data', '--mount', `type=bind,src=${socket},dst=/var/run/postgresql`,
   '-e', 'POSTGRES_USER=supabase_admin', '-e', 'POSTGRES_HOST_AUTH_METHOD=trust',
   '-e', 'POSTGRES_INITDB_ARGS=--encoding=UTF8 --locale-provider=icu --icu-locale=en-US --lc-collate=en_US.UTF-8 --lc-ctype=en_US.UTF-8',
   image]);
  for (let n = 0; n < 90; n++) {
   if (docker(['logs', name]).includes('PostgreSQL init process complete; ready for start up.')) {
    try { docker(['exec', name, 'pg_isready', '-U', 'supabase_admin']); }
    catch { await new Promise(r => setTimeout(r, 1000)); continue; }
    docker(['exec',name,'createdb','-U','supabase_admin','-O','postgres','-T','template0','--encoding=UTF8','--locale-provider=icu','--icu-locale=en-US','--lc-collate=en_US.UTF-8','--lc-ctype=en_US.UTF-8','rad_restore']);
    const password = prepareSocketAuth(execFileSync, name, 'rad_restore');
    // Roles are cluster-global: migrate exactly once, then clone the closed M08
    // catalogue. Keep synthetic users/groups and M09 out of the template.
    const template = new Client({ host: socket, user: 'postgres', password, database: 'rad_restore', query_timeout: 10000 });
    try {
     await template.connect();
     await template.query(`create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
     for (const f of readdirSync('supabase/migrations').filter(f => f.endsWith('.sql') && f <= '20261030000800_rad062_erasure_operations.sql').sort()) await template.query(sql(f));
    } finally { await template.end(); }
    docker(['exec',name,'psql','-X','-v','ON_ERROR_STOP=1','-U','supabase_admin','-d','postgres','-c',
     'alter database rad_restore rename to m09_template; alter database m09_template with is_template true allow_connections false;']);
    return { name, socket, password, startedAt, databasesCloned: 0 };
   }
   await new Promise(r => setTimeout(r, 1000));
  }
  throw Error('M09 Supabase17 startup failed');
 } catch (e) { docker(['rm', '-fv', name]); rmSync(socket, { recursive: true, force: true }); throw e; }
}
afterAll(async () => {
 if (container) {
  const source = await container;
  docker(['rm', '-fv', source.name]); rmSync(source.socket, { recursive: true, force: true });
  // Includes image startup, the one template migration, all clones and teardown.
  console.info('M09 Supabase17 fixture timing', JSON.stringify({ databasesCloned: source.databasesCloned, elapsedSeconds: (performance.now() - source.startedAt) / 1000 }));
 }
});
async function dockerDatabase() {
 const source = await (container ??= startContainer());
 const { name, socket, password } = source;
 const database = 'rad_restore';
 docker(['exec',name,'createdb','-U','supabase_admin','-O','postgres','-T','m09_template','--encoding=UTF8','--locale-provider=icu','--icu-locale=en-US','--lc-collate=en_US.UTF-8','--lc-ctype=en_US.UTF-8',database]);
 source.databasesCloned++;
 const connect = async () => { const c = new Client({ host: socket, user: 'postgres', password, database, query_timeout: 10000 }); await c.connect(); return c; };
 const admin = await connect();
 async function close() { await admin.end(); docker(['exec',name,'dropdb','--force','-U','supabase_admin',database]); }
 async function rpc<T = unknown>(user: number | 'anon' | 'worker', name: string, args: unknown[] = []): Promise<T> {
  const c = await connect();
  try {
   await c.query('begin'); await c.query(`set local role ${user === 'anon' ? 'anon' : user === 'worker' ? 'assess_worker' : 'authenticated'}`);
   await c.query("select set_config('request.jwt.claim.sub',$1,true)", [typeof user === 'number' ? id(user) : '']);
   const v = (await c.query(`select assess.${name}(${args.map((_, i) => '$' + (i + 1)).join(',')}) v`, args)).rows[0].v as T;
   await c.query('commit'); return v;
  } catch (e) { await c.query('rollback'); throw e; } finally { await c.end(); }
 }
 try {
  for (const n of [1, 2, 3]) await admin.query('insert into auth.users values($1,$2,now(),$3)', [id(n), `synthetic${n}@example.invalid`, { display_name: 'SYNTHETIC Account Name' }]);
  await admin.query("update public.profiles set status='approved',role=case when user_id=$1 then 'owner' else 'participant' end", [id(1)]);
  await rpc(1, 'appointment_v1', [id(2), true]);
  const group = (await rpc<{ id: string }>(2, 'supervisor_group_v1', ['create', null, null, 'SYNTHETIC group', new Date(Date.now() + 3600000).toISOString()])).id;
  const call = async <T = unknown>(name: string, args: unknown[] = [], user = 2): Promise<T> => {
   const c = await connect();
   try {
    await c.query('begin'); await c.query("select set_config('request.jwt.claim.sub',$1,true)", [id(user)]);
    const v = (await c.query(`select assess.${name}(${args.map((_, i) => '$' + (i + 1)).join(',')}) v`, args)).rows[0].v as T;
    await c.query('commit'); return v;
   } catch (e) { await c.query('rollback'); throw e; } finally { await c.end(); }
  };
  const save = (d: ReturnType<typeof syntheticDraft>) => call<{ document: ReturnType<typeof syntheticDraft> }>('draft_save_v2', [group, d.id, d.revision, d, '[]']);
  return { admin, connect, close, rpc, call, save, group };
 } catch (e) { await close(); throw e; }
}
export async function catalogueFixture(mode: Mode) {
 if (mode === 'supabase17') return dockerDatabase();
 const db = await rad062Fixture(4);
 try {
  for (const f of ['20261030000500_rad062_manual_foundation_freeze.sql', '20261030000600_rad062_lifecycle_v2.sql', '20261030000700_rad062_manual_grading.sql', '20261030000800_rad062_erasure_operations.sql']) await db.admin.query(sql(f));
  return db;
 } catch (e) { await db.close(); throw e; }
}
export type Db = Awaited<ReturnType<typeof catalogueFixture>>;
export const literal = '  حرفي 😀 e\u0301 <>&\n\t  ';
export const score = (value = '1.000001') => [{ item: { id: 'w0', version: '1' }, score: value }];
export const scores = (db: Db, s: string, rev = 0, op = 200, user = 2, reason = 'initial', value = '1.000001') => db.rpc(user, 'manual_score_v1', [s, id(op), rev, JSON.stringify(score(value)), reason]);
export const finalize = (db: Db, s: string, rev = 1, op = 300, user = 2) => db.rpc(user, 'manual_finalize_v1', [s, id(op), rev]);
export async function fixture(mode: Mode) {
 const db = await catalogueFixture(mode);
 try {
  await db.admin.query(sql());
  const draft = syntheticDraft(); draft.policy.durationSeconds = 3600;
  draft.items.push({ id: 'w0', type: 'written-answer', prompt: literal, maximum: '3.000001', provenance: structuredClone(draft.items[0]!.provenance) });
  const saved = await db.save(draft);
  const snap = await db.call<BridgeSnapshotV2>('authoring_bridge_read_v2', [db.group, draft.id, saved.document.revision]);
  const publication = publicationFromDraftV2(snap, []);
  await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,schema_version,available) values($1,$2,$3,'1','SYNTHETIC','mixed',2,true)", [id(50), id(2), publication.assessment.ref.id]);
  await db.admin.query('insert into assess.publications values($1,$2,$3,now())', [id(50), publication, { q: {}, w0: {} }]);
  await db.admin.query('insert into assess.assignments(id,owner_id,version_id,source_group_ids) values($1,$2,$3,$4)', [id(51), id(2), id(50), [db.group]]);
  // Trusted synthetic binding: preserve all real FK/provenance and period constraints.
  await db.admin.query("update assess.sharing_policy set required_version='synthetic',text_digest=repeat('a',64)");
  await db.rpc(3, 'sharing_consent_v1', ['synthetic', 'a'.repeat(64), true]);
  await db.admin.query("select set_config('request.jwt.claim.sub',$1,false)", [id(2)]);
  await db.admin.query('insert into assess.memberships(group_id,user_id) values($1,$2)', [db.group, id(3)]);
  await db.admin.query(`insert into assess.assignment_reviews(id,writer_id,group_id,group_revision,appointment_revision,draft_id,draft_revision,version_id,source_digest,expires_at,created_at,assignment_id)
   select $1,$2,g.id,g.scope_revision,ap.revision,$3,$4,$5,$6,now()+interval '5 minutes',now(),$7 from assess.groups g,assess.supervisor_appointments ap where g.id=$8 and ap.user_id=$2`, [id(60), id(2), draft.id, saved.document.revision, id(50), snap.snapshot.digest, id(51), db.group]);
  await db.admin.query('insert into assess.assignment_scopes values($1,$2,$3,$4)', [id(51), db.group, id(2), id(60)]);
  await db.admin.query('insert into assess.assignment_review_targets select $1,user_id,period_id,visible_from from assess.visible_members_v1($2)', [id(60), db.group]);
  await db.admin.query('insert into assess.targets values($1,$2)', [id(51), id(3)]);
  await db.rpc(3, 'consent_v2', ['assess-pilot-2026-10-20-v2']);
  await db.admin.query('update assess.launch_gate set enabled=true');
  const s = (await db.call<{ attemptId: string }>('start_v2', [id(51), id(100)], 3)).attemptId;
  await db.call('command_v2', [s, id(101), 0, { type: 'save', item: { id: 'w0', version: '1' }, answer: { type: 'written-answer', text: literal } }], 3);
  await db.call('command_v2', [s, id(102), 1, { type: 'submit' }], 3);
  const claim = await db.call<GradingClaimV2>('claim_v2'); await db.call('finish_v2', [s, claim.token, '1', '3']);
  await db.admin.query('update assess.launch_gate set enabled=false');
  return { db, s };
 } catch (e) { await db.close(); throw e; }
}
export async function blocked(db: Db, pid: number) {
 for (let n = 0; n < 300; n++) {
  if ((await db.admin.query('select exists(select 1 from pg_stat_activity where $1=any(pg_blocking_pids(pid))) ok', [pid])).rows[0].ok) return;
  await new Promise(r => setTimeout(r, 10));
 }
 throw Error('missing PostgreSQL lock witness');
}
