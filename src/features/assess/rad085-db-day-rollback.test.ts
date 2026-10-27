// RAD085-DB-DAY rollback proof (B3): synthetic data only, disposable local PostgreSQL, no provider.
// Pre-DB-day = main's schema up to C2 (every migration except the four RAD-085 sources).
import { readFileSync } from 'node:fs';
import type { Client } from 'pg';
import { expect, it } from 'vitest';
import { RAD085_MIGRATIONS } from './server-rad085-contracts';
import { openRad085Database, fixtureId as id } from './rad085-local-db';

const ROLLBACK = readFileSync('supabase/manual/rad085-db-day-rollback.sql', 'utf8');
const SCHEMAS = "('public','assess')";
const FUNCTIONS = `select p.oid::regprocedure::text sig, pg_get_functiondef(p.oid) def,
 coalesce((select jsonb_agg(jsonb_build_array(case when a.grantee=0 then 'PUBLIC' else a.grantee::regrole::text end,a.privilege_type) order by 1,2) from aclexplode(p.proacl) a),'null'::jsonb) acl,
 p.proowner::regrole::text owner
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ${SCHEMAS} order by 1`;
const TRIGGERS = `select c.oid::regclass::text tbl,t.tgname,pg_get_triggerdef(t.oid) def,t.tgenabled en from pg_trigger t join pg_class c on c.oid=t.tgrelid
 join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname in ('public','assess','auth') order by 1,2`;
const NULLABILITY = `select a.attrelid::regclass::text tbl,a.attname col,a.attnotnull nn from pg_attribute a join pg_class c on c.oid=a.attrelid
 join pg_namespace n on n.oid=c.relnamespace where n.nspname in ${SCHEMAS} and c.relkind='r' and a.attnum>0 and not a.attisdropped order by 1,2`;
const TABLES = `select n.nspname||'.'||c.relname t from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname in ${SCHEMAS} and c.relkind='r' order by 1`;

type Rows = Record<string, unknown>[];
const q = async (c: Client, sql: string) => (await c.query(sql)).rows as Rows;
const catalogue = async (c: Client) => ({ f: await q(c, FUNCTIONS), t: await q(c, TRIGGERS), n: await q(c, NULLABILITY) });
async function rowHashes(c: Client) {
 const out: Record<string, string> = {};
 for (const { t } of await q(c, TABLES)) out[t as string] = ((await c.query(`select coalesce(md5(string_agg(to_jsonb(x)::text,'|' order by to_jsonb(x)::text)),'empty') h from ${t} x`)).rows[0] as { h: string }).h;
 return out;
}
const sqlstate = async (run: Promise<unknown>) => { try { await run; return 'ok'; } catch (e) { return (e as { code?: string }).code ?? String(e); } };

// Pre-DB-day synthetic rows, copied into qa_pre so the post-rollback state can be checked row by row.
async function seed(c: Client) {
 await c.query('alter table auth.users add column banned_until timestamptz; create table auth.sessions(user_id uuid); create table auth.refresh_tokens(user_id text)');
 for (let n = 1; n <= 5; n++) await c.query("insert into auth.users values($1,$2,now(),'{\"display_name\":\"SYNTHETIC\",\"consent_version\":\"2026-10-24\"}')", [id(n), `rb-${n}@example.test`]);
 await c.query("update public.profiles set status='approved',role=case when user_id=$1 then 'owner' else 'participant' end", [id(1)]);
 await c.query("insert into public.attempts(id,user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale) values($1,$2,1,'synthetic','synthetic','v1','{}','{}','en')", [id(90), id(4)]);
 await c.query("insert into public.feedback(user_id,exam_id,attempt_id,text) values($1,'SYNTHETIC',$2,'SYNTHETIC note')", [id(4), id(90)]);
 await c.query("insert into assess.groups(owner_id,name) values($1,'SYNTHETIC legacy group')", [id(1)]);
 await c.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values($1,$2,$1,'1','SYNTHETIC','mixed',true)", [id(300), id(2)]);
 await c.query("insert into assess.assignments(id,owner_id,version_id) values($1,$2,$3)", [id(400), id(2), id(300)]);
 await c.query("select set_config('request.jwt.claim.sub',$1,false)", [id(1)]);
 await c.query("select public.owner_account_deletion_v1('deactivate',$1)", [id(5)]);
 await c.query("select set_config('request.jwt.claim.sub','',false)");
 await c.query('create schema qa_pre');
 for (const { t } of await q(c, TABLES)) await c.query(`create table qa_pre.${(t as string).replace('.', '_')} as select * from ${t}`);
}
async function preservedRows(c: Client) {
 const missing: Record<string, number> = {};
 for (const { t } of await q(c, TABLES)) {
  const copy = `qa_pre.${(t as string).replace('.', '_')}`;
  if (!(await c.query('select to_regclass($1) r', [copy])).rows[0].r) continue;
  const n = (await c.query(`select count(*)::int n from ${copy} p where not exists(select 1 from ${t} x where to_jsonb(x) @> to_jsonb(p))`)).rows[0].n as number;
  if (n) missing[t as string] = n;
 }
 return missing;
}

// Ordinary use after the migrations: the activity the rollback must keep as data but stop serving.
async function activity(db: Awaited<ReturnType<typeof openRad085Database>>, level: number) {
 const policy = readFileSync('supabase/manual/rad085-sharing-policy-live-p1.sql', 'utf8');
 await db.admin.query(policy);
 await db.rpc(1, 'appointment_v1', [id(2), true]);
 const p = (await db.admin.query('select required_version,text_digest from assess.sharing_policy')).rows[0];
 await db.rpc(4, 'sharing_consent_v1', [p.required_version, p.text_digest, true]);
 const g = await db.rpc<{ id: string; code: string }>(2, 'supervisor_group_v1', ['create', null, null, 'SYNTHETIC group', new Date(Date.now() + 3600000)]);
 const r = await db.rpc<{ id: string; revision: number }>(4, 'join_request_v1', [g.code]);
 await db.rpc(2, 'join_decide_v1', [r.id, r.revision, 'approve']);
 await db.admin.query("insert into public.attempts(id,user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale) values($1,$2,2,'synthetic','synthetic','v1','{}','{}','en')", [id(91), id(4)]);
 expect((await db.admin.query('select count(*)::int n from assess.practice_recordings')).rows[0].n).toBe(1);
 if (level >= 2) await db.rpc(2, 'draft_save_v1', [g.id, id(200), 0, { schemaVersion: 1, id: id(200), revision: 0, name: 'SYNTHETIC', track: 'mixed', policy: {}, items: [] }]);
}

for (const [label, level] of [['M1–M4 + live initializer', 4], ['M1–M3 (M4 failed or not run)', 3], ['M1 only', 1]] as const) {
 it(`rollback from ${label}: pre-existing function bodies/ACL and trigger set equal the pre-DB-day catalogue and no row is lost`, async () => {
  let pre: Awaited<ReturnType<typeof catalogue>> | undefined, preHash: Record<string, string> = {};
  const db = await openRad085Database(async c => { await seed(c); pre = await catalogue(c); preHash = await rowHashes(c); }, RAD085_MIGRATIONS.slice(0, level));
  try {
   await activity(db, level);
   const before = await rowHashes(db.admin);
   expect((await catalogue(db.admin)).t.length).toBeGreaterThan(pre!.t.length);

   await db.admin.query(ROLLBACK);
   const status = (await db.admin.query('select 1')).rows; expect(status).toHaveLength(1);
   const after = await catalogue(db.admin);

   // Every pre-existing function: identical body, owner and ACL. Functions the migrations added are not compared.
   const post = new Map(after.f.map(f => [f.sig, f]));
   for (const f of pre!.f) expect(post.get(f.sig), String(f.sig)).toEqual(f);
   // Trigger set: exactly the pre-DB-day set (the three triggers the migrations added to existing tables are gone).
   expect(after.t).toEqual(pre!.t);
   // NOT NULL of every pre-existing column is back (no NULL rows exist in this scenario).
   const nn = new Map(after.n.map(n => [`${n.tbl}.${n.col}`, n.nn]));
   for (const n of pre!.n) expect(nn.get(`${n.tbl}.${n.col}`), `${n.tbl}.${n.col}`).toBe(n.nn);

   // Nothing deleted or changed: all tables identical to just before the rollback; every seeded row is still there.
   expect(await rowHashes(db.admin)).toEqual(before);
   expect(await preservedRows(db.admin)).toEqual({});
   expect(Object.keys(preHash).length).toBeGreaterThan(20);
   expect((await db.admin.query('select count(*)::int n from assess.practice_recordings')).rows[0].n).toBe(1);

   // Live behaviour is pre-DB-day: the practice trigger is gone, C2 works, new RPCs are closed.
   await db.admin.query("insert into public.attempts(id,user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale) values($1,$2,3,'synthetic','synthetic','v1','{}','{}','en')", [id(92), id(4)]);
   expect((await db.admin.query('select count(*)::int n from assess.practice_recordings')).rows[0].n).toBe(1);
   const list = await db.transaction(1, async c => (await c.query("select public.owner_account_deletion_v1('list') v")).rows[0].v);
   expect(JSON.stringify(list)).toContain(id(5));
   expect(await sqlstate(db.rpc(1, 'appointment_v1', [id(3), true]))).toBe('42501');
   expect(await sqlstate(db.rpc(2, 'supervisor_group_v1', ['create', null, null, 'SYNTHETIC', new Date(Date.now() + 3600000)]))).toBe('42501');

   const mid = await rowHashes(db.admin);
   // Second run is a clean no-op and the closing check reads true / 0 / true.
   await db.admin.query(ROLLBACK.slice(0, ROLLBACK.lastIndexOf('select\n')));
   const check = (await db.admin.query(ROLLBACK.slice(ROLLBACK.lastIndexOf('select\n')))).rows[0];
   expect(check).toEqual({ triggers_removed: true, owner_id_not_null_not_restored: '0', new_rpc_closed_to_clients: true });
   expect(await rowHashes(db.admin)).toEqual(mid);
  } finally { await db.close(); }
 }, 120000);
}

it('rollback keeps NOT NULL off (and reports it) when a NULL owner row already exists; still deletes nothing', async () => {
 const db = await openRad085Database(async c => { await seed(c); });
 try {
  await db.admin.query('update assess.versions set owner_id=null');
  const before = await rowHashes(db.admin);
  await db.admin.query(ROLLBACK);
  const check = (await db.admin.query(ROLLBACK.slice(ROLLBACK.lastIndexOf('select\n')))).rows[0];
  expect(check.owner_id_not_null_not_restored).toBe('1');
  expect(await rowHashes(db.admin)).toEqual(before);
 } finally { await db.close(); }
}, 120000);
