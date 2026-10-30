import { expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import type { Client, QueryResult } from 'pg';
import { rad062Fixture, migration, id } from './rad062-test-fixture';
import manifest from '../../../scripts/pages/frontend-schema.json';
const file = '20261030000500_rad062_manual_foundation_freeze.sql';
const read = (p: string) => readFileSync(p, 'utf8');
const m05 = () => read('supabase/migrations/' + file);
const rawStop = read('supabase/manual/assess-emergency-stop-v2.sql');
const transport = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', "import {stopV2Transport,renderV2Packet} from './scripts/assess/emergency-stop-v2-packet.mjs';console.log(JSON.stringify({parts:stopV2Transport(),packet:renderV2Packet()}))"], { encoding: 'utf8' })) as { parts: string[]; packet: string };
const stop = transport.parts.join('');
const verify = read('supabase/checks/assess-emergency-stopped-v2.sql');
const stores = ['manual_work_v1', 'manual_item_scores_v1', 'manual_events_v1', 'manual_final_receipts_v1'];
type Db = Awaited<ReturnType<typeof rad062Fixture>>;
async function report(c: Client, sql: string) {
 const out = await c.query(sql) as unknown as QueryResult[];
 const rows = out.flatMap(r => r.rows);
 expect(rows).toHaveLength(1); return rows[0]!;
}
async function fixture() {
 const db = await rad062Fixture(4);
 try { await db.admin.query(m05()); await seedBase(db); return db; }
 catch (e) { await db.close(); throw e; }
}
async function seedBase(db: Db) {
 await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values($1,$2,$1,'1','SYNTHETIC','mixed',true)", [id(50), id(1)]);
 await db.admin.query('insert into assess.assignments(id,owner_id,version_id) values($1,$2,$3)', [id(51), id(1), id(50)]);
 await db.rpc(3, 'consent_v2', ['assess-pilot-2026-10-20-v2']);
}
async function seed(db: Db, n: number, state: string, submitted = '2026-10-29T10:00:00Z') {
 await db.admin.query(`insert into assess.sessions(id,assignment_id,user_id,ordinal,state,started_at,deadline,submitted_at,lease,lease_until)
 values($1,$2,$3,$4,$5,'2026-10-29T09:00:00Z','2026-10-29T11:00:00Z',
 case when $5='active' then null else $6::timestamptz end,
 case when $5='grading' then gen_random_uuid() end,case when $5='grading' then now()+interval '5 minutes' end)`, [id(n), id(51), id(3), n, state, submitted]);
 await db.admin.query("insert into assess.session_details values($1,'{}','{}',$2,'[]')", [id(n), { literal: 'SYNTHETIC جواب <>&\n preserved' }]);
}
async function snapshot(db: Db) {
 const result: Record<string, unknown> = {};
 for (const table of ['session_details', 'receipts', 'results', ...stores])
  result[table] = (await db.admin.query(`select to_jsonb(t) row from assess.${table} t order by to_jsonb(t)::text`)).rows;
 return result;
}
it('promoted M05 retains historical current schema and v1 packet work first; explicit M01–M05 preserve every existing v1 function and deny runtime grants', async () => {
 const db = await rad062Fixture(0);
 try {
  expect((await db.admin.query("select to_regprocedure('assess.freeze_v2()') v")).rows[0].v).toBeNull();
  expect((await report(db.admin, read('supabase/manual/assess-emergency-stop.sql'))).status).toBe('STOPPED');
  expect((await report(db.admin, read('supabase/checks/assess-emergency-stopped.sql'))).status).toBe('STOPPED');
  await expect(db.admin.query(m05())).rejects.toMatchObject({ code: '55000' }); await db.admin.query('rollback');
  for (let n = 1; n <= 4; n++) await db.admin.query(migration(n));
  const before = (await db.admin.query("select oid,prosrc,proacl,proconfig,proowner from pg_proc where pronamespace in ('assess'::regnamespace,'public'::regnamespace) order by oid")).rows;
  await db.admin.query(m05());
  expect((await db.admin.query('select oid,prosrc,proacl,proconfig,proowner from pg_proc where oid=any($1::oid[]) order by oid', [before.map(r => r.oid)])).rows).toEqual(before);
  expect((await db.admin.query('select inventory=assess.d3_fk_inventory_v1() ok from assess.erasure_fk_contract')).rows[0].ok).toBe(true);
  for (const role of ['anon', 'authenticated', 'assess_worker', 'assess_authoring_bridge']) {
   expect((await db.admin.query("select has_function_privilege($1,'assess.freeze_v2()','execute') ok", [role])).rows[0].ok).toBe(false);
   for (const store of stores) expect((await db.admin.query(`select has_table_privilege($1,'assess.${store}','select,insert,update,delete') ok`, [role])).rows[0].ok).toBe(false);
  }
  expect((await db.admin.query('select relrowsecurity from pg_class where oid=any($1::regclass[])', [stores.map(t => 'assess.' + t)])).rows.every(r => r.relrowsecurity)).toBe(true);
  // Existing legacy recovery still works for a row without the additive hold.
  await seedBase(db); await seed(db, 60, 'grading-failed', new Date().toISOString());
  await expect(db.rpc('worker', 'recover_v1', [id(60)])).resolves.toBe('');
 } finally { await db.close(); }
 expect(manifest.requiredMigrations).toContain(file);
 expect(manifest.guardedFeatures.rad062.migrations).toContain(file);
 expect(manifest.guardedFeatures.rad062.migrationSha256[file]).toBe(createHash('sha256').update(m05()).digest('hex'));
 expect(read('src/features/assess/rad062-availability.ts')).toContain('RAD062_AVAILABLE: boolean = true');
 expect(read('src/features/supervisor/p1-availability.ts')).toContain('P1_AVAILABLE: boolean = true');
 const base = JSON.parse(execFileSync('git', ['show', '023ec84c15bfd744f317ec079e2587d90e099414:scripts/pages/frontend-schema.json'], { encoding: 'utf8' }));
 expect(manifest.requiredMigrations).toEqual([...base.requiredMigrations, ...base.guardedFeatures.rad062.migrations]); expect(manifest.checks).toEqual([...base.checks.map((p: string) => p === 'supabase/checks/rad085-p1-b-ready.sql' ? 'supabase/checks/rad062-p1-b-ready.sql' : p), 'supabase/checks/rad062-ready.sql']);
 for (const path of [...base.requiredMigrations.map((f: string) => 'supabase/migrations/' + f), ...base.checks,
  'supabase/manual/assess-emergency-stop.sql', 'supabase/checks/assess-emergency-stopped.sql',
  'scripts/assess/emergency-stop-packet.mjs', 'scripts/assess/emergency-stop-rehearsal.test.mjs', 'docs/RAD-059_PHONE_PACKET.md'])
  expect(readFileSync(path)).toEqual(path === 'src/features/assess/rad062-availability.ts' ? Buffer.from(execFileSync('git', ['show', '023ec84c15bfd744f317ec079e2587d90e099414:' + path], { encoding: 'utf8' }).replace('RAD062_AVAILABLE: boolean = false', 'RAD062_AVAILABLE: boolean = true')) : execFileSync('git', ['show', '023ec84c15bfd744f317ec079e2587d90e099414:' + path]));
 const expectedMarker = createHash('sha256').update('https://vlacestfruxooznrcjqc.supabase.co\n');
 for (const migration of [...manifest.requiredMigrations].sort()) expectedMarker.update(migration + '\0').update(readFileSync('supabase/migrations/' + migration)).update('\0');
 for (const check of manifest.checks) expectedMarker.update(readFileSync(check));
 const marker = execFileSync(process.execPath, ['scripts/pages/pilot-schema-gate.mjs', '--print-marker'], { encoding: 'utf8', env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'https://vlacestfruxooznrcjqc.supabase.co' } }).trim();
 expect(marker).toBe('pilot-v1:' + expectedMarker.digest('hex'));
}, 30000);
it('freeze captures all four states, preserves timers/answers/scores/results, is idempotent and blocks held recovery', async () => {
 const db = await fixture();
 try {
  for (const [i, state] of ['active', 'grading', 'grading-failed', 'awaiting-manual', 'graded', 'void'].entries()) await seed(db, 60 + i, state);
  await db.admin.query("insert into assess.manual_work_v1(session_id,automatic_complete,automatic_n,automatic_d) values($1,true,1,3)", [id(63)]);
  await db.admin.query("insert into assess.manual_item_scores_v1 values($1,'w','1',1,1,1,7,$2)", [id(63), id(2)]);
  await db.admin.query("insert into assess.manual_events_v1(session_id,operation_id,item_id,item_version,grading_revision,grader_id,new_n,new_d,reason_code) values($1,$2,'w','1',1,$3,1,7,'initial')", [id(63), id(70), id(2)]);
  await db.admin.query("insert into assess.results values($1,37,1,100,'SYNTHETIC','mixed','hidden')", [id(64)]);
  await db.admin.query("insert into assess.manual_final_receipts_v1 values($1,$2,1,2,now(),$3,1,1,'finalized',1)", [id(64), id(71), id(2)]);
  const data = await snapshot(db), before = (await db.admin.query('select * from assess.sessions order by id')).rows;
  expect((await report(db.admin, verify)).status).toBe('PARTIAL');
  const first = await report(db.admin, stop); expect(first.status).toBe('STOPPED'); expect(first.errors).toEqual([]);
  const after = (await db.admin.query('select * from assess.sessions order by id')).rows;
  for (let n = 0; n < 4; n++) {
   expect(after[n]).toMatchObject({ state: 'grading-failed', lease: null, lease_until: null, revision: before[n].revision + 1, deadline: before[n].deadline, started_at: before[n].started_at });
   expect(after[n].emergency_held_at).toBeInstanceOf(Date);
   expect(after[n].submitted_at).toEqual(n === 0 ? before[n].deadline : before[n].submitted_at);
   expect(after[n].retry_at.getTime()).toBe(after[n].submitted_at.getTime() + 7 * 86400000);
  }
  expect(after.slice(4)).toEqual(before.slice(4)); expect(await snapshot(db)).toEqual(data);
  expect((await report(db.admin, stop)).status).toBe('STOPPED');
  expect((await db.admin.query('select * from assess.sessions order by id')).rows).toEqual(after);
  expect((await report(db.admin, verify)).status).toBe('STOPPED');
  expect((await db.admin.query('select assess.freeze_v2() n')).rows[0].n).toBe('0');
  // Add a recently submitted held row to exercise the v1 recover path within 7d.
  await seed(db, 66, 'awaiting-manual', new Date().toISOString()); await report(db.admin, stop);
  await expect(db.rpc('worker', 'recover_v1', [id(66)])).rejects.toMatchObject({ code: '55000' });
  expect(await db.rpc('worker', 'claim_v1')).toBeNull();
  // Active with no deadline freezes at server time; an old timer is never extended.
  await db.admin.query("update assess.sessions set emergency_held_at=null,state='active',submitted_at=null,deadline=null where id=$1", [id(66)]);
  const at = Date.now(); await report(db.admin, stop);
  const untimed = (await db.admin.query('select * from assess.sessions where id=$1', [id(66)])).rows[0];
  expect(untimed.submitted_at.getTime()).toBeGreaterThanOrEqual(at - 1000); expect(untimed.submitted_at.getTime()).toBeLessThanOrEqual(Date.now());
 } finally { await db.close(); }
}, 30000);
it('bounded lock and statement failures return PARTIAL; verification detects awaiting-manual and an incomplete hold; denied stop returns FAILED', async () => {
 const db = await fixture(), lock = await db.connect();
 try {
  await seed(db, 60, 'awaiting-manual', new Date().toISOString());
  await db.admin.query('update assess.launch_gate set enabled=true; create role assess_job_a login');
  await lock.query('begin;lock table assess.sessions in access share mode');
  const at = performance.now(), partial = await report(db.admin, stop);
  expect(performance.now() - at).toBeLessThan(8000); expect(partial.status).toBe('PARTIAL'); expect(partial.errors).toContain('freeze:55P03');
  expect(partial.gate_ok).toBe(true); expect(partial.login_a_ok).toBe(true);
  expect((await report(db.admin, verify))).toMatchObject({ status: 'PARTIAL', unheld_sessions: '1', gate_closed: true, login_disabled: true });
  await lock.query('rollback');
  await db.admin.query("create function public.synthetic_slow() returns trigger language plpgsql as $$begin perform pg_sleep(6);return new;end$$;create trigger synthetic_slow before update on assess.sessions for each row execute function public.synthetic_slow()");
  const slow = performance.now(), timeout = await report(db.admin, stop);
  expect(timeout.status).toBe('PARTIAL'); expect(timeout.errors).toContain('freeze:57014'); expect(performance.now() - slow).toBeLessThan(9000);
  await db.admin.query('drop trigger synthetic_slow on assess.sessions;drop function public.synthetic_slow()');
  expect((await report(db.admin, stop)).status).toBe('STOPPED');
  // Reconstruct an incomplete stop without awaiting-manual: missing hold alone fails.
  await db.admin.query('update assess.sessions set emergency_held_at=null where id=$1', [id(60)]);
  expect((await report(db.admin, verify)).status).toBe('PARTIAL');
  expect((await report(db.admin, stop)).status).toBe('STOPPED');
  await db.admin.query('create role synthetic_denied login;alter role assess_job_a login;create role assess_job_b login');
  await db.connect('synthetic-live-worker', 'assess_job_a');
  const denied = await db.connect('denied-stop', 'synthetic_denied');
  const failed = await report(denied, stop); expect(failed.status).toBe('FAILED'); expect(failed.errors).toContain('freeze:42501');
 } finally { await lock.query('rollback'); await db.close(); }
}, 30000);
it('manual stores cascade with details/session, anonymize graders and keep final receipt only until session expiry/erasure', async () => {
 const db = await fixture();
 try {
  await seed(db, 60, 'awaiting-manual');
  await db.admin.query('insert into assess.manual_work_v1(session_id) values($1)', [id(60)]);
  await db.admin.query("insert into assess.manual_item_scores_v1 values($1,'w','1',1,1,1,3,$2)", [id(60), id(3)]);
  await db.admin.query("insert into assess.manual_events_v1(session_id,operation_id,item_id,item_version,grading_revision,grader_id,new_n,new_d,reason_code) values($1,$2,'w','1',1,$3,1,3,'initial')", [id(60), id(70), id(3)]);
  await db.admin.query("insert into assess.manual_final_receipts_v1 values($1,$2,1,2,now(),$3,1,1,'finalized',1)", [id(60), id(71), id(3)]);
  // A separate grader with no managed assets can be erased without transfer.
  await db.admin.query('insert into auth.users values($1,$2,now(),$3)', [id(4), 'synthetic-grader@example.invalid', { display_name: 'SYNTHETIC Grader Name' }]);
  for (const t of ['manual_item_scores_v1', 'manual_events_v1']) await db.admin.query(`update assess.${t} set grader_id=$1`, [id(4)]);
  await db.admin.query('update assess.manual_final_receipts_v1 set final_grader_id=$1', [id(4)]);
  await db.admin.query('delete from public.profiles where user_id=$1', [id(4)]);
  for (const t of ['manual_item_scores_v1', 'manual_events_v1']) expect((await db.admin.query(`select grader_id from assess.${t}`)).rows[0].grader_id).toBeNull();
  expect((await db.admin.query('select final_grader_id from assess.manual_final_receipts_v1')).rows[0].final_grader_id).toBeNull();
  await db.admin.query('delete from assess.session_details where session_id=$1', [id(60)]);
  for (const t of stores.slice(0, 3)) expect((await db.admin.query(`select count(*) n from assess.${t}`)).rows[0].n).toBe('0');
  expect((await db.admin.query('select count(*) n from assess.manual_final_receipts_v1')).rows[0].n).toBe('1');
  await db.admin.query('delete from assess.sessions where id=$1', [id(60)]);
  expect((await db.admin.query('select count(*) n from assess.manual_final_receipts_v1')).rows[0].n).toBe('0');
 } finally { await db.close(); }
}, 30000);
it('v2 phone packet is reproducible, every part <15k, six independent phases and one SELECT per stop/verify; no emergency DDL dependency', () => {
 const packet = transport;
 expect(packet.packet).toBe(read('docs/RAD-062_P05_PHONE_PACKET.md'));
 for (const block of packet.packet.matchAll(/```sql\n([\s\S]*?)\n```/g)) expect(block[1]!.length).toBeLessThan(15000);
 expect(packet.parts.every(p => p.length < 15000 && p.endsWith('\n'))).toBe(true);
 const blocks = [...rawStop.matchAll(/do (\$[a-z_]+\$)[\s\S]*?\1;/g)].map(m => m[0]);
 const decoded = [...packet.parts.join('').matchAll(/decode\('([^']+)'/g)].map(m => Buffer.from(m[1]!, 'base64').toString('utf8'));
 expect(decoded).toEqual(blocks); expect(blocks).toHaveLength(6);
 for (const sql of [rawStop.replace(/do (\$[a-z_]+\$)[\s\S]*?\1;/g, ''), verify]) expect([...sql.replace(/--[^\n]*/g, '').matchAll(/^select\b/gim)]).toHaveLength(1);
 expect(stop).not.toMatch(/create\s+(or replace\s+)?function|drop\s+function/i);
 expect(stop).toContain("set local lock_timeout='2s'"); expect(stop).toContain("set local statement_timeout='5s'");
});
it('an in-flight manual write drains before freeze; queued stale revision cannot commit a late transition', async () => {
 const db = await fixture(), writer = await db.connect(), stopper = await db.connect();
 try {
  await seed(db, 60, 'awaiting-manual', new Date().toISOString());
  await db.admin.query('insert into assess.manual_work_v1(session_id) values($1)', [id(60)]);
  await writer.query('begin');
  await writer.query('select id from assess.sessions where id=$1 for update', [id(60)]);
  await writer.query("insert into assess.manual_item_scores_v1 values($1,'w','1',1,1,1,3,$2)", [id(60), id(2)]);
  const stopping = report(stopper, stop);
  // Wait for an observed server lock wait, bounded to the emergency lock budget.
  const until = performance.now() + 1000;
  let waiting = false;
  while (!waiting && performance.now() < until) {
   waiting = (await db.admin.query("select exists(select 1 from pg_stat_activity where pid<>pg_backend_pid() and wait_event_type='Lock' and query like '%rad062_stop_report%') v")).rows[0].v;
   if (!waiting) await new Promise(r => setTimeout(r, 10));
  }
  await writer.query('commit');
  expect((await stopping).status).toBe('STOPPED'); expect(waiting).toBe(true);
  expect((await db.admin.query('select score_n,score_d from assess.manual_item_scores_v1')).rows[0]).toEqual({ score_n: '1', score_d: '3' });
  // M06/M07 will recheck the session revision under this same lock.
  expect((await db.admin.query("update assess.sessions set state='graded' where id=$1 and revision=0 returning id", [id(60)])).rowCount).toBe(0);
  expect((await report(db.admin, verify)).status).toBe('STOPPED');
 } finally { await writer.query('rollback'); await db.close(); }
}, 30000);
