/** S4 contracts: real isolated DB; no provider connection. */
import { expect,it } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { selfServiceS3Fixture,id,type Session } from './selfservice-fixture';
it('preflight reproduces successful v1 tick claim leaving submitted v2 work untouched',async()=>{
 const db=await selfServiceS3Fixture();
 try {
  const s=await db.rpc<Session>(3,'start_v2',[id(51),id(700)]);
  await db.rpc(3,'command_v2',[s.attemptId,id(701),s.ack.revision,{type:'submit'}]);
  expect((await db.admin.query('select assess.claim_v1() c')).rows[0].c).toBeNull();
  expect((await db.admin.query('select state,lifecycle_version from assess.sessions where id=$1',[s.attemptId])).rows[0]).toEqual({state:'grading',lifecycle_version:2});

 }finally{await db.close();}
},300000);
it('offline S4 plan safety and threshold proofs',()=>{
 expect(()=>execFileSync(process.execPath,['--test','scripts/assess/selfservice-ops-plan.test.mjs'],{stdio:'pipe',timeout:180000})).not.toThrow();
 const entries=[1,2,3].map(n=>readFileSync(`supabase/staged/self-service/p5-entry-r${n}.mjs`,'utf8'));
 for(const [n,s]of entries.entries()){expect(s).toContain(`manifest.selfservice !== 'selfservice-r${n+1}'`);expect(s).toContain('executeGradingWorker');}
},180000);
it('atomic role successor refuses unfinished v1, open gate and LOGIN; wrapper isolates counters and original contracts',async()=>{
 const db=await selfServiceS3Fixture();
 const packet=readFileSync('supabase/manual/selfservice-worker-v2-switch.sql','utf8');
 try{
  await db.admin.query('update assess.launch_gate set enabled=false');
  await db.admin.query(readFileSync('supabase/migrations/20261105000600_rad105_worker_health.sql','utf8'));
  await db.admin.query(`create role assess_grading_worker nologin noinherit;grant usage on schema assess to assess_grading_worker;
   alter role assess_job_b noinherit;grant assess_grading_worker to assess_job_b with admin false,inherit false,set true;
   grant execute on function assess.maintain_v1(integer),assess.claim_v1(),assess.finish_v1(uuid,uuid,text,text),assess.fail_v1(uuid,uuid),assess.health_v1() to assess_grading_worker;
   revoke create on schema public from public;revoke temporary on database postgres from public;
   insert into assess.versions(id,owner_id,assessment_id,version,name,track,schema_version,available) values('${id(800)}','${id(2)}','${id(800)}','1','SYNTHETIC','mixed',1,true);
   insert into assess.assignments(id,owner_id,version_id) values('${id(801)}','${id(2)}','${id(800)}');
   insert into assess.targets values('${id(801)}','${id(3)}');`);
  const grants=async()=>(await db.admin.query("select oid::regprocedure::text f from pg_proc where pronamespace='assess'::regnamespace and has_function_privilege('assess_grading_worker',oid,'EXECUTE') order by 1")).rows.map(r=>r.f);
  const original=await grants();expect(original).toHaveLength(5);
  await db.admin.query(packet);expect(await grants()).toEqual(original);
  await db.admin.query("set radlab.worker_switch_authorized='apply-reviewed-v2'");
  for(const state of ['active','grading','grading-failed','awaiting-manual']){
   await db.admin.query("insert into assess.sessions(id,assignment_id,user_id,ordinal,state,started_at,submitted_at) values($1,$2,$3,1,$4,clock_timestamp(),clock_timestamp())",[id(802),id(801),id(3),state]);
   await expect(db.admin.query(packet)).rejects.toMatchObject({code:'55000'});await db.admin.query('rollback');
   expect(await grants()).toEqual(original);await db.admin.query('delete from assess.sessions where id=$1',[id(802)]);
  }
  for(const field of ['held','leased']){
   await db.admin.query(`insert into assess.sessions(id,assignment_id,user_id,ordinal,state,started_at,submitted_at,emergency_held_at,lease,lease_until)
    values($1,$2,$3,1,'void',clock_timestamp(),clock_timestamp(),case when $4='held' then clock_timestamp() end,
    case when $4='leased' then $5::uuid end,case when $4='leased' then clock_timestamp()+interval '1 minute' end)`,[id(802),id(801),id(3),field,id(803)]);
   await expect(db.admin.query(packet)).rejects.toMatchObject({code:'55000'});await db.admin.query('rollback');expect(await grants()).toEqual(original);
   await db.admin.query('delete from assess.sessions where id=$1',[id(802)]);
  }
  await db.admin.query('alter role assess_job_b login');
  const backend=await db.connect('s4-existing-worker','assess_job_b');
  try{await db.admin.query('alter role assess_job_b nologin');await expect(db.admin.query(packet)).rejects.toMatchObject({code:'55000'});await db.admin.query('rollback');expect(await grants()).toEqual(original);}
  finally{await backend.end();}
  for(const mutation of ['update assess.launch_gate set enabled=true','alter role assess_job_b login']){
   await db.admin.query(mutation);await expect(db.admin.query(packet)).rejects.toMatchObject({code:'55000'});await db.admin.query('rollback');
   expect(await grants()).toEqual(original);await db.admin.query('update assess.launch_gate set enabled=false;alter role assess_job_b nologin');
  }
  await db.admin.query(packet);
  expect(await grants()).toEqual(['assess.claim_v2()','assess.fail_v2(uuid,uuid)','assess.finish_v2(uuid,uuid,text,text)','assess.maintain_v2(integer)','assess.worker_health_v2()']);
  await expect(db.admin.query(packet)).rejects.toMatchObject({code:'55000'});await db.admin.query('rollback');
  const h=(await db.admin.query('select assess.worker_health_v2() h')).rows[0].h;
  expect(Object.keys(h).sort()).toEqual(['v1','v2','witness']);expect(h.v1).toEqual({failed:0,alert:0,overdue:0,purgeDue:0});
  expect(Object.keys(h.v2).sort()).toEqual(['alert','awaitingManual','failed','held','overdue','purgeDue','voidDue','warningDue']);
  const rows=(await db.admin.query(readFileSync('supabase/checks/selfservice-s4-worker-ready.sql','utf8'))) as unknown as {rows:{ok:boolean}[]}[];
  expect(rows.flatMap(r=>r.rows).every(r=>r.ok===true)).toBe(true);
 }finally{await db.close();}
},300000);
