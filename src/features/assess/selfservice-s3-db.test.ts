/** Approved S3 read contract, isolated PostgreSQL only. */
import { expect, it } from 'vitest';
import { selfServiceS3Fixture as setup, id, type Session } from './selfservice-fixture';
type Row = { studentId: string; sessionId: string; eligible: boolean; reason: string; serverTime: string };
type Page = { version: 1; rows: Row[]; next: string | null; serverTime: string };
it('own-assignment read: exact public shape, no table grant, read scope, supervisor revocation and stable capped pages', async () => {
 const db = await setup();
 try {
  const read = (user = 2, after: string | null = null, limit: number | null = 50) => db.rpc<Page>(user,'attempt_eligibility_page_v1',[id(51),after,limit]);
  expect(await read()).toMatchObject({version:1,rows:[],next:null});
  await expect(read(3)).rejects.toMatchObject({code:'42501'});
  await expect(read(1)).rejects.toMatchObject({code:'42501'}); // owner cannot read another issuer's assignment
  for (const n of [0,101,null]) await expect(read(2,null,n)).rejects.toMatchObject({code:'22023'});
  await db.admin.query(`insert into assess.sessions(id,assignment_id,user_id,ordinal,lifecycle_version,state,started_at,submitted_at,deadline,failed_at)
   select ('00000000-0000-0000-0000-'||lpad((1000+n)::text,12,'0'))::uuid,$1,$2,n,2,'grading-failed',clock_timestamp(),clock_timestamp(),clock_timestamp(),clock_timestamp() from generate_series(1,103) n`,[id(51),id(3)]);
  const before = (await db.admin.query('select count(*) n from emergency.audit')).rows;
  const first = await read(2,null,100), second = await read(2,first.next,100);
  expect(first.rows).toHaveLength(100); expect(first.next).toBe(first.rows.at(-1)!.sessionId);
  expect(second.rows).toHaveLength(3); expect(second.next).toBeNull();
  expect(new Set([...first.rows,...second.rows].map(r=>r.sessionId)).size).toBe(103);
  expect(first.rows.every(r=>!r.eligible&&r.reason==='unknown-history')).toBe(true);
  expect(Object.keys(first.rows[0]!).sort()).toEqual(['studentId','sessionId','eligible','reason','serverTime'].sort());
  expect(first.rows.every(r=>r.serverTime===first.serverTime)).toBe(true);
  expect((await db.admin.query('select count(*) n from emergency.audit')).rows).toEqual(before);
  expect((await db.admin.query("select has_table_privilege('authenticated','assess.stop_active_attempts','SELECT') allowed")).rows[0].allowed).toBe(false);
  const definition = (await db.admin.query("select pg_get_functiondef('assess.attempt_eligibility_page_v1(uuid,uuid,integer)'::regprocedure) d")).rows[0].d as string;
  expect(definition).toContain('scope_enter_v1(false)'); expect(definition).not.toContain('own_assignment_v1');
  await db.admin.query('begin');
  try {
   await db.admin.query('update assess.assignments set owner_id=$1 where id=$2',[id(1),id(51)]);
   await db.admin.query('set local role authenticated');
   await db.admin.query("select set_config('request.jwt.claim.sub',$1,true)",[id(1)]);
   expect(((await db.admin.query('select assess.attempt_eligibility_page_v1($1,null,1) p',[id(51)])).rows[0].p as Page).rows).toHaveLength(1);
  } finally {await db.admin.query('rollback');}
  // All-students assignments are separate and need no invented group scope.
  await db.admin.query("update assess.assignments set audience='all-students' where id=$1",[id(51)]);
  await db.admin.query('insert into assess.all_students_assignments values($1)',[id(51)]);
  await db.admin.query('delete from assess.assignment_scopes where assignment_id=$1',[id(51)]);
  expect((await read()).rows).toHaveLength(50);
  await db.rpc(1,'appointment_v1',[id(2),false]);
  await expect(read()).rejects.toMatchObject({code:'42501'});
 } finally { await db.close(); }
},300000);
it('captured ACTIVE only; stale read cannot bypass locked grant, held timestamp/state/expiry/availability and grant limits', async () => {
 const db = await setup();
 try {
  const read = () => db.rpc<Page>(2,'attempt_eligibility_page_v1',[id(51),null,100]);
  const start = (op:number)=>db.rpc<Session>(3,'start_v2',[id(51),id(op)]);
  const first = await start(100);
  await db.admin.query('select assess.freeze_v2()');
  expect((await read()).rows).toEqual([expect.objectContaining({studentId:id(3),sessionId:first.attemptId,eligible:true,reason:'eligible'})]);
  await db.admin.query("update assess.sessions set expires_at=clock_timestamp()-interval '1 second' where id=$1",[first.attemptId]);
  expect((await read()).rows[0]).toMatchObject({eligible:false,reason:'expired'});
  await expect(db.rpc(2,'new_attempt_v1',[id(51),first.attemptId])).rejects.toMatchObject({code:'55000'});
  await db.admin.query("update assess.sessions set expires_at=clock_timestamp()+interval '1 day' where id=$1",[first.attemptId]);
  for (const [change,reason] of [
   ["update assess.stop_active_attempts set was_active=false",'not-active-at-stop'],
   ["update assess.stop_active_attempts set held_at=held_at-interval '1 second'",'not-held'],
   ["delete from assess.stop_active_attempts",'unknown-history'],
   ["update assess.versions set available=false",'assignment-unavailable'],
   ["update assess.assignments set closed_at=clock_timestamp()",'assignment-unavailable'],
   ["update assess.assignment_windows set opens_at=clock_timestamp()-interval '2 hours',closes_at=clock_timestamp()-interval '1 hour'",'assignment-unavailable'],
  ]) {
   // Fixture-only mutation and rollback; read itself must not change any state.
   await db.admin.query('begin');
   try {
    await db.admin.query(change!);
    await db.admin.query('set local role authenticated');
    await db.admin.query("select set_config('request.jwt.claim.sub',$1,true)",[id(2)]);
    const changed=(await db.admin.query('select assess.attempt_eligibility_page_v1($1) p',[id(51)])).rows[0].p as Page;
    expect(changed.rows[0]).toMatchObject({eligible:false,reason});
   } finally { await db.admin.query('rollback'); }
  }
  await db.rpc(2,'new_attempt_v1',[id(51),first.attemptId]);
  expect((await read()).rows[0]).toMatchObject({eligible:false,reason:'already-granted'});
  expect((await db.rpc<{rows:{replacementGranted:boolean}[]}>(3,'student_exams_page_v1',[null,50])).rows[0]!.replacementGranted).toBe(true);
  let current=await start(101);
  for (let n=0;n<3;n++) {
   await db.admin.query('select assess.freeze_v2()');
   const row=(await read()).rows.find(r=>r.sessionId===current.attemptId)!;
   expect(row).toMatchObject({eligible:n<2,reason:n<2?'eligible':'grant-limit'});
   if (n<2) {await db.rpc(2,'new_attempt_v1',[id(51),current.attemptId]); current=await start(102+n);}
   else await expect(db.rpc(2,'new_attempt_v1',[id(51),current.attemptId])).rejects.toMatchObject({code:'54000'});
  }
 } finally {await db.close();}
},300000);
it('real non-active capture and stale appointment/group reads cannot authorize a grant',async()=>{
 const db=await setup();
 try {
  const read=()=>db.rpc<Page>(2,'attempt_eligibility_page_v1',[id(51),null,100]);
  const s=await db.rpc<Session>(3,'start_v2',[id(51),id(100)]);
  await db.rpc(3,'command_v2',[s.attemptId,id(101),s.ack.revision,{type:'submit'}]);
  await db.admin.query('select assess.freeze_v2()');
  expect((await read()).rows[0]).toMatchObject({eligible:false,reason:'not-active-at-stop'});
  await db.rpc(1,'owner_resume_v1',['RESUME ASSESS']);
  await db.admin.query('delete from assess.sessions where id=$1',[s.attemptId]);
  const active=await db.rpc<Session>(3,'start_v2',[id(51),id(102)]);
  await db.admin.query('select assess.freeze_v2()');
  expect((await read()).rows.find(r=>r.sessionId===active.attemptId)).toMatchObject({eligible:true});
  await db.rpc(1,'appointment_v1',[id(2),false]);
  await expect(read()).rejects.toMatchObject({code:'42501'});
  await expect(db.rpc(2,'new_attempt_v1',[id(51),active.attemptId])).rejects.toMatchObject({code:'42501'});
 } finally {await db.close();}
},300000);
