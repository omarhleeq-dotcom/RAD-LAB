import { describe, expect, it } from 'vitest';
import { fixture, modes, id, scores, finalize, literal } from './rad062-m09-fixture';
import type { ManualQueue, ManualRead, ManualFinalReceipt } from './server-manual-contracts';
describe.each(modes)('M09 grading %s', mode => {
 it('own supervisor queues, reads verbatim, freely edits six-decimal scores, finalizes and replays receipt without details', async () => {
  const { db, s } = await fixture(mode);
  try {
   const q = await db.rpc<ManualQueue>(2, 'manual_queue_v1', [null, 1]); expect(q.rows.map(r => r.id)).toEqual([s]); expect(q.next).toBe(s);
   const read = await db.rpc<ManualRead>(2, 'manual_read_v1', [s]); expect(read.items[0]).toMatchObject({ answer: literal, prompt: literal, maximum: '3.000001' });
   expect(Object.keys(read).sort()).toEqual(['attemptId','finalizeBefore','gradingRevision','items','operationCount']);
   expect(JSON.stringify([q,read])).not.toMatch(/email|user_id|display_name|example.invalid|automatic_n/); expect(JSON.stringify([q,read])).not.toContain(id(3));
   for (const [rev,value] of ['0','3.000001','1.000001'].entries()) await scores(db,s,rev,200+rev,2,rev?'correction':'initial',value);
   await expect(scores(db,s,3,203,2,'initial','3.000002')).rejects.toMatchObject({ code: '22023' });
   await expect(scores(db,s,3,203,2,'initial','0.0000001')).rejects.toMatchObject({ code: '22023' });
   const receipt = await finalize(db,s,3); expect(receipt).toMatchObject({ final_grader_id: id(2), operation_count: 3 });
   expect(await db.rpc(2,'manual_receipt_v1',[s])).toEqual(receipt); expect(await finalize(db,s,3)).toEqual(receipt);
   expect((await db.admin.query('select count(*)::int n from assess.session_details')).rows[0].n).toBe(0);
   expect((await db.admin.query('select earned_n::text n,earned_d::text d from assess.results')).rows[0]).toEqual({ n: '4000003', d: '3000000' });
   await expect(scores(db,s,3,204)).rejects.toMatchObject({ code:'55000' });
   await expect(db.rpc(2,'manual_read_v1',[s])).rejects.toMatchObject({ code:'55000' });
  } finally { await db.close(); }
 },120000);
 it('100 operations, same-id replay without increment, reused content rejected, final at 100 and one winner in racing finalizes',async()=>{
  const {db,s}=await fixture(mode);
  try {
   const ack=await scores(db,s); expect(await scores(db,s)).toEqual(ack);
   await expect(scores(db,s,0,200,2,'initial','2')).rejects.toMatchObject({code:'22023'});
   for(let rev=1;rev<100;rev++) await scores(db,s,rev,200+rev,2,'correction',rev%2?'0':'3.000001');
   expect((await db.admin.query('select operation_count from assess.manual_work_v1')).rows[0].operation_count).toBe(100);
   await expect(scores(db,s,100,400)).rejects.toMatchObject({code:'54000'});
   const race=await Promise.allSettled([finalize(db,s,100,500),finalize(db,s,100,501)]);
   expect(race.filter(r=>r.status==='fulfilled')).toHaveLength(1); expect(race.find(r=>r.status==='rejected')).toMatchObject({reason:{code:'55000'}});
   expect((await db.admin.query('select count(*)::int n from assess.results')).rows[0].n).toBe(1);
  } finally {await db.close();}
 },120000);
 it.each(['other-group','student','unappointed','creator','revision','archive','expiry','starts','account-stop','account-suspend','student-stop','student-suspend','leave','rejoin','reconsent','policy','target','multi','unscoped'])('%s hides all refs before paging and denies every endpoint/replay',async(kind)=>{
  const {db,s}=await fixture(mode);
  try {
   await scores(db,s);
   let actor=2;
   if(kind==='other-group') {await db.admin.query("insert into auth.users values($1,'other@example.invalid',now(),$2)",[id(4),{display_name:'Other Synthetic Supervisor'}]);await db.admin.query("update public.profiles set status='approved' where user_id=$1",[id(4)]);await db.rpc(1,'appointment_v1',[id(4),true]);await db.rpc(4,'supervisor_group_v1',['create',null,null,'Other group',new Date(Date.now()+3600000).toISOString()]);actor=4;}
   if(kind==='student') actor=3;
   if(kind==='unappointed') await db.rpc(1,'appointment_v1',[id(2),false]);
   if(kind==='creator') {await db.admin.query('alter table assess.groups disable trigger assess_managed_group');await db.admin.query('update assess.groups set supervisor_id=$1',[id(1)]);}
   if(kind==='revision') {await db.rpc(1,'appointment_v1',[id(2),false]);await db.rpc(1,'appointment_v1',[id(2),true]);}
   if(kind==='archive') await db.rpc(2,'supervisor_group_v1',['end',db.group,(await db.admin.query('select scope_revision from assess.groups where id=$1',[db.group])).rows[0].scope_revision]);
   if(kind==='expiry'||kind==='starts') {await db.admin.query('alter table assess.groups disable trigger assess_managed_group');await db.admin.query(kind==='expiry'?"update assess.groups set starts_at=now()-interval '2 days',ends_at=now()-interval '1 day'":"update assess.groups set starts_at=now()+interval '1 minute'");}
   if(kind==='account-stop'||kind==='student-stop') await db.admin.query('insert into assess.account_stops(user_id) values($1)',[id(kind==='account-stop'?2:3)]);
   if(kind==='account-suspend'||kind==='student-suspend') await db.admin.query("update public.profiles set status='suspended' where user_id=$1",[id(kind==='account-suspend'?2:3)]);
   if(kind==='leave'||kind==='rejoin') await db.rpc(3,'group_leave_v1',[db.group]);
   if(kind==='rejoin') {await db.admin.query("select set_config('request.jwt.claim.sub',$1,false)",[id(2)]);await db.admin.query('insert into assess.memberships(group_id,user_id) values($1,$2)',[db.group,id(3)]);}
   if(kind==='reconsent') {await db.rpc(3,'sharing_consent_v1',[null,null,false]);await db.rpc(3,'sharing_consent_v1',['synthetic','a'.repeat(64),true]);}
   if(kind==='policy') await db.admin.query("update assess.sharing_policy set required_version='changed'");
   if(kind==='target') await db.admin.query('delete from assess.targets');
   if(kind==='multi') await db.admin.query('update assess.assignments set source_group_ids=array[$1::uuid,$2::uuid]',[db.group,id(999)]);
   if(kind==='unscoped') await db.admin.query('delete from assess.assignment_scopes');
   if(['student','unappointed','account-stop','account-suspend'].includes(kind)) await expect(db.rpc(actor,'manual_queue_v1',[null,1])).rejects.toMatchObject({code:'42501'});
   else expect(await db.rpc(actor,'manual_queue_v1',[null,1])).toEqual({rows:[],next:null});
   for(const run of [()=>db.rpc(actor,'manual_read_v1',[s]),()=>scores(db,s,0,200,actor),()=>finalize(db,s,1,300,actor),()=>db.rpc(actor,'manual_receipt_v1',[s])]) await expect(run()).rejects.toMatchObject({code:'42501'});
   expect((await db.admin.query('select operation_count from assess.manual_work_v1')).rows[0].operation_count).toBe(1);
  } finally {await db.close();}
 },120000);
 it('filters rejected rows before limit and cursor without counts or rejected refs',async()=>{
  const {db,s}=await fixture(mode);
  try {
   await db.admin.query("insert into auth.users values($1,'hidden@example.invalid',now(),$2)",[id(4),{display_name:'Hidden Synthetic Student'}]);
   await db.admin.query("update public.profiles set status='approved' where user_id=$1",[id(4)]);
   await db.rpc(4,'consent_v2',['assess-pilot-2026-10-20-v2']);
   await db.admin.query("insert into assess.sessions select (jsonb_populate_record(null::assess.sessions,to_jsonb(s)||jsonb_build_object('id',$2::uuid,'user_id',$3::uuid))).* from assess.sessions s where id=$1",[s,id(90),id(4)]);
   await db.admin.query('insert into assess.session_details select $2,publication,specs,answers,locked from assess.session_details where session_id=$1',[s,id(90)]);
   await db.admin.query('insert into assess.manual_work_v1(session_id,automatic_complete) values($1,true)',[id(90)]);
   const q=await db.rpc<ManualQueue>(2,'manual_queue_v1',[null,1]);expect(q.rows.map(r=>r.id)).toEqual([s]);expect(q.next).toBe(s);
   expect(Object.keys(q).sort()).toEqual(['next','rows']);expect(JSON.stringify(q)).not.toContain(id(90));expect(JSON.stringify(q)).not.toContain(id(4));
   expect(await db.rpc(2,'manual_queue_v1',[s,1])).toEqual({rows:[],next:null});
   await expect(db.rpc(2,'manual_read_v1',[id(90)])).rejects.toMatchObject({code:'42501'});
  }finally{await db.close();}
 },120000);
 it.each(['owner_id','manager'])('%s retains the original route for unscoped attempts after student scope loss',async(path)=>{
  const {db,s}=await fixture(mode);
  try {
   const actor=path==='owner_id'?2:1;
   if(path==='owner_id') await db.admin.query("update public.profiles set role='owner' where user_id=$1",[id(2)]);
   else await db.admin.query('insert into assess.assignment_managers values($1,$2)',[id(51),id(1)]);
   await db.admin.query('delete from assess.assignment_scopes; delete from assess.targets');
   expect((await db.rpc<ManualQueue>(actor,'manual_queue_v1')).rows.map(r=>r.id)).toEqual([s]);
   expect((await db.rpc<ManualRead>(actor,'manual_read_v1',[s])).attemptId).toBe(s);
   await scores(db,s,0,200,actor);expect(await finalize(db,s,1,300,actor)).toMatchObject({final_grader_id:id(actor)});
  }finally{await db.close();}
 },120000);
 it('owner rescues completed scores at 100 without a synthetic score event',async()=>{
  const {db,s}=await fixture(mode);
  try {
   for(let rev=0;rev<100;rev++) await scores(db,s,rev,200+rev,2,rev?'correction':'initial');
   const audit=(await db.admin.query('select bool_and(group_id is null and appointment_revision is null) ok from assess.manual_events_v1')).rows[0];expect(audit.ok).toBe(true);
   await db.rpc(1,'appointment_v1',[id(2),false]);
   expect(await finalize(db,s,100,500,1)).toMatchObject({final_grader_id:id(1),operation_count:100});
  }finally{await db.close();}
 },120000);
 it('student erasure removes attempts and historical queue refs with every endpoint denied',async()=>{
  const {db,s}=await fixture(mode);
  try {
   await db.call('erase_account_d3_v1',[id(3)],1);
   expect(await db.rpc(2,'manual_queue_v1')).toEqual({rows:[],next:null});
   for(const run of [()=>db.rpc(2,'manual_read_v1',[s]),()=>scores(db,s),()=>finalize(db,s),()=>db.rpc(2,'manual_receipt_v1',[s])]) await expect(run()).rejects.toMatchObject({code:'42501'});
  }finally{await db.close();}
 },120000);
 it('owner_id/managers unchanged; scoped orphan rescue requires takeover and ends when authority returns; supervisor cannot take over or read another grader receipt',async()=>{
  const {db,s}=await fixture(mode);
  try {
   await expect(scores(db,s,0,200,2,'owner-takeover')).rejects.toMatchObject({code:'42501'});
   await expect(db.rpc(1,'manual_read_v1',[s])).rejects.toMatchObject({code:'42501'});
   await db.rpc(1,'appointment_v1',[id(2),false]);
   expect((await db.rpc<ManualRead>(1,'manual_read_v1',[s])).attemptId).toBe(s);
   await expect(scores(db,s,0,200,1)).rejects.toMatchObject({code:'42501'});
   await scores(db,s,0,200,1,'owner-takeover');
   // Restore exactly the original appointment (test-only) to prove rescue ends, unlike reappointment revision.
   await db.admin.query('update assess.supervisor_appointments set revoked_at=null,revision=1 where user_id=$1',[id(2)]);
   await expect(db.rpc(1,'manual_read_v1',[s])).rejects.toMatchObject({code:'42501'});
   await db.admin.query('insert into assess.assignment_managers values($1,$2)',[id(51),id(1)]);
   const receipt=await finalize(db,s,1,300,1) as ManualFinalReceipt;expect(receipt.final_grader_id).toBe(id(1));
   await expect(db.rpc(2,'manual_receipt_v1',[s])).rejects.toMatchObject({code:'42501'});
   expect(await db.rpc(1,'manual_receipt_v1',[s])).toEqual(receipt);
  } finally {await db.close();}
 },120000);
});
