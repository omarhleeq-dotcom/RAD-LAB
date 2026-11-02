import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import type {Client,QueryResult} from 'pg';
import {catalogueFixture,fixture,blocked,modes,id,sql,type Mode} from './rad062-m09-fixture';
const name='20261102000300_rad085_rights_write_disclosures.sql';
const migration=sql(name),alternate=sql('20261102000200_rad059_emergency_alternate.sql');
const ready=readFileSync('supabase/checks/rad085-review-ready.sql','utf8');
async function slots(c:Client){await c.query("do $$begin if not exists(select 1 from pg_roles where rolname='assess_job_a') then create role assess_job_a nologin;end if;if not exists(select 1 from pg_roles where rolname='assess_job_b') then create role assess_job_b nologin;end if;end$$;");}
async function setup(mode:Mode){
 const db=await catalogueFixture(mode);
 try{await db.admin.query(sql());await slots(db.admin);await db.admin.query(alternate);await db.admin.query(migration);return db;}
 catch(e){await db.close();throw e;}
}
type Db=Awaited<ReturnType<typeof setup>>;
async function asUser<T>(db:Pick<Db,'connect'>,user:number,query:string,args:unknown[]=[],timeZone='UTC'):Promise<T>{
 const c=await db.connect();
 try{await c.query('begin;set local role authenticated');await c.query("select set_config('TimeZone',$1,true)",[timeZone]);await c.query("select set_config('request.jwt.claim.sub',$1,true)",[id(user)]);const r=await c.query(query,args);await c.query('commit');return r.rows[0]?.v as T;}
 catch(e){await c.query('rollback');throw e;}finally{await c.end();}
}
const erase=(db:Db,action:string,target:number|null=null,limit=100,after:string|null=null)=>asUser<{processed:number;blocked:{user_id:string;code:string}[];alert:boolean;next:string|null}>(db,1,'select public.owner_account_deletion_v1($1,$2,$3,$4) v',[action,target===null?null:id(target),after,limit]);
async function pending(db:Db){
 await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values($1,$2,$1,'1','SYNTHETIC','mixed',true)",[id(50),id(2)]);
 await db.admin.query('insert into assess.assignments(id,owner_id,version_id) values($1,$2,$3)',[id(51),id(2),id(50)]);
 for(const n of [4,5])await db.admin.query('insert into auth.users values($1,$2,now(),$3)',[id(n),`synthetic${n}@example.invalid`,{display_name:'SYNTHETIC Account Name'}]);
 await db.admin.query("update public.profiles set status='approved' where user_id=any($1)",[[id(4),id(5)]]);
 await db.admin.query('alter table auth.users add column banned_until timestamptz');
 for(const n of [2,3,4,5])await erase(db,'deactivate',n);
 await db.admin.query("update public.c2_account_deletions set requested_at=clock_timestamp()-interval '38 days' where user_id<>$1",[id(5)]);
}
async function join(db:Db,short=false){
 if(short)db.group=(await db.rpc<{id:string}>(2,'supervisor_group_v1',['create',null,null,'SYNTHETIC expiry',new Date(Date.now()+1500).toISOString()])).id;
 await db.admin.query("update assess.sharing_policy set required_version='synthetic',text_digest=repeat('a',64)");
 await db.rpc(3,'sharing_consent_v1',['synthetic','a'.repeat(64),true]);
 await db.admin.query("insert into assess.group_join_requests(group_id,user_id,state,requested_at) values($1,$2,'pending',clock_timestamp())",[db.group,id(3)]);
 return (await db.admin.query('select id,revision from assess.group_join_requests where user_id=$1',[id(3)])).rows[0] as {id:string;revision:number};
}
describe.each(modes)('RAD085 ordering and account isolation %s',mode=>{
 it('M09 -> 0200 -> 0300; 0300 before 0200 is refused without partial objects; exact successor',async()=>{
  const db=await catalogueFixture(mode);
  try{
   await db.admin.query(sql());await slots(db.admin);
   const snapshot=async()=>(await db.admin.query("select p.oid::regprocedure::text signature,pg_get_functiondef(p.oid) def,p.proacl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','assess') order by 1")).rows;
   const before=await snapshot();
   await expect(db.admin.query(migration)).rejects.toMatchObject({code:'55000',message:'RAD085 post-0200 catalogue required'});
   await db.admin.query('rollback');expect(await snapshot()).toEqual(before);
   expect((await db.admin.query("select to_regclass('assess.pilot_write_usage') missing")).rows[0].missing).toBeNull();
   await db.admin.query(alternate);await db.admin.query(migration);
   const rows=(await db.admin.query(ready) as unknown as QueryResult[]).flatMap(r=>r.rows);
   expect(rows.length).toBeGreaterThan(5);expect(rows.filter(r=>!r.ok)).toEqual([]);
  }finally{await db.close();}
 },120000);
 it('retains M08 exclusive capacity before taking any profile/table locks',async()=>{
  const db=await setup(mode),hold=await db.connect();
  try{
   await hold.query("begin;select pg_advisory_xact_lock_shared(hashtextextended('rad062-capacity',0))");
   const pid=(await hold.query('select pg_backend_pid() pid')).rows[0].pid;
   const result=erase(db,'list').then(v=>({value:v}),e=>({error:e}));
   await blocked(db,pid);
   await db.admin.query("begin;set local statement_timeout='1s'");
   await db.admin.query('update public.profiles set display_name=display_name where user_id=$1',[id(3)]);
   await db.admin.query('commit');
   await hold.query('commit');expect(await result).toMatchObject({value:{rows:[],next:null}});
  }finally{await db.admin.query('rollback');await hold.query('rollback');await hold.end();await db.close();}
 },120000);
 it('post-0200 ACL drift refuses before any objects, preserving all catalogue changes',async()=>{
  const db=await catalogueFixture(mode);
  try{
   await db.admin.query(sql());await slots(db.admin);await db.admin.query(alternate);
   await db.admin.query('revoke insert on public.events from authenticated');
   await expect(db.admin.query(migration)).rejects.toMatchObject({code:'55000'});await db.admin.query('rollback');
   expect((await db.admin.query("select to_regclass('assess.pilot_write_limits') missing")).rows[0].missing).toBeNull();
   await db.admin.query('grant insert on public.events to authenticated');await db.admin.query(migration);
  }finally{await db.close();}
 },120000);
 it('unreviewed future-table default ACL aborts the entire install without partial objects',async()=>{
  const db=await catalogueFixture(mode);
  try{
   await db.admin.query(sql());await slots(db.admin);await db.admin.query(alternate);
   await db.admin.query('create role rad085_synthetic_grantee nologin;alter default privileges in schema assess grant select on tables to rad085_synthetic_grantee');
   const before=(await db.admin.query("select pg_get_functiondef('public.owner_account_deletion_v1(text,uuid,uuid,integer)'::regprocedure) def")).rows[0].def;
   await expect(db.admin.query(migration)).rejects.toMatchObject({code:'55000',message:'RAD085 unreviewed new-object ACL'});await db.admin.query('rollback');
   expect((await db.admin.query("select to_regclass('assess.pilot_write_usage') missing")).rows[0].missing).toBeNull();
   expect((await db.admin.query("select pg_get_functiondef('public.owner_account_deletion_v1(text,uuid,uuid,integer)'::regprocedure) def")).rows[0].def).toBe(before);
  }finally{await db.close();}
 },120000);
 it('one unresolved account alerts and remains visible; others erase; all deadlines unchanged',async()=>{
  const db=await setup(mode);
  try{
   await asUser(db,3,inserts.events);
   await pending(db);
   const deadlines=(await db.admin.query('select user_id,requested_at,requested_at+interval \'37 days\' erase_by from public.c2_account_deletions where user_id=any($1) order by user_id',[[id(2),id(5)]])).rows;
   const listener=await db.connect(),alerts:unknown[]=[];await listener.query('listen rad085_erasure_blocked');listener.on('notification',m=>alerts.push(JSON.parse(m.payload!)));
   const r=await erase(db,'finalise');expect(r.processed).toBe(2);expect(r.blocked).toEqual([{user_id:id(2),code:'55000'}]);expect(r.alert).toBe(true);
   expect((await db.admin.query('select count(*) n from assess.pilot_write_usage where user_id=$1',[id(3)])).rows[0].n).toBe('0');
   await listener.query('select 1');expect(alerts).toEqual([{blocked:1}]);await listener.end();
   expect((await db.admin.query('select user_id,requested_at,requested_at+interval \'37 days\' erase_by from public.c2_account_deletions order by user_id')).rows).toEqual(deadlines);
   expect((await erase(db,'list')).processed).toBeUndefined();
   expect((await asUser<{rows:unknown[]}>(db,1,"select public.owner_account_deletion_v1('list') v")).rows).toHaveLength(2);
   const health=(await db.admin.query(readFileSync('supabase/checks/rad085-erasure-health.sql','utf8')) as unknown as QueryResult[]).flatMap(r=>r.rows);
   expect(health[0]).toMatchObject({pending:'2',approaching_day30:'1',finalise_due:'1',approaching_day37:'1',overdue:'1',unresolved_rights:'1',transfer_alert:'1'});
  }finally{await db.close();}
 },120000);
 it('batch size 1 can continue past the blocked oldest account, never deletes before day30',async()=>{
  const db=await setup(mode);
  try{
   await pending(db);
   const first=await erase(db,'finalise',null,1);expect(first).toMatchObject({processed:0,alert:true,next:id(2)});
   const second=await erase(db,'finalise',null,1,first.next);expect(second.processed).toBe(1);expect(second.next).toBe(id(3));
   expect((await db.admin.query('select count(*) n from public.profiles where user_id=$1',[id(5)])).rows[0].n).toBe('1');
   await expect(erase(db,'restore',2)).rejects.toMatchObject({code:'22023'});
   expect((await db.admin.query('select count(*) n from public.c2_account_deletions where user_id=$1',[id(2)])).rows[0].n).toBe('1');
  }finally{await db.close();}
 },120000);
});
describe.each(modes)('RAD085 join expiry and request privacy %s',mode=>{
 it('profile lock held beyond ends_at denies approval and leaves request/membership unchanged',async()=>{
  const db=await setup(mode),locker=await db.connect();
  try{
   const r=await join(db,true);
   await locker.query('begin');await locker.query('select * from public.profiles where user_id=$1 for update',[id(3)]);
   const pid=(await locker.query('select pg_backend_pid() pid')).rows[0].pid;
   const result=db.rpc(2,'join_decide_v1',[r.id,r.revision,'approve']).then(()=>({code:'unexpected success'}),e=>e);
   await blocked(db,pid);await db.admin.query("select pg_sleep(greatest(0,extract(epoch from(ends_at-clock_timestamp())))+0.05) from assess.groups where id=$1",[db.group]);
   await locker.query('commit');expect(await result).toMatchObject({code:'55000'});
   expect((await db.admin.query('select state,revision from assess.group_join_requests where id=$1',[r.id])).rows[0]).toEqual({state:'pending',revision:r.revision});
   expect((await db.admin.query('select count(*) n from assess.memberships where group_id=$1',[db.group])).rows[0].n).toBe('0');
  }finally{await locker.query('rollback');await locker.end();await db.close();}
 },120000);
 it('expiry while membership write waits also rolls back approval and period',async()=>{
  const db=await setup(mode),locker=await db.connect();
  try{
   const r=await join(db,true);
   await locker.query('begin');await locker.query('select * from assess.groups where id=$1 for update',[db.group]);
   const pid=(await locker.query('select pg_backend_pid() pid')).rows[0].pid;
   const result=db.rpc(2,'join_decide_v1',[r.id,r.revision,'approve']).then(()=>({code:'unexpected success'}),e=>e);
   await blocked(db,pid);await db.admin.query("select pg_sleep(greatest(0,extract(epoch from(ends_at-clock_timestamp())))+0.05) from assess.groups where id=$1",[db.group]);
   await locker.query('commit');expect(await result).toMatchObject({code:'55000'});
   expect((await db.admin.query('select count(*) n from assess.membership_periods where group_id=$1',[db.group])).rows[0].n).toBe('0');
  }finally{await locker.query('rollback');await locker.end();await db.close();}
 },120000);
 it('supervisor receives opaque request id/name/revision only; S3 withdrawal/history filters remain',async()=>{
  const db=await setup(mode);
  try{
   const r=await join(db);
   const page=await db.rpc<{rows:unknown[]}>(2,'scope_page_v1',['requests',db.group,null,20]);
   expect(page.rows).toEqual([{id:r.id,state:'pending',revision:r.revision,display_name:'SYNTHETIC Account Name'}]);
   await db.rpc(3,'sharing_consent_v1',['synthetic','a'.repeat(64),false]);
   expect((await db.rpc<{rows:unknown[]}>(2,'scope_page_v1',['requests',db.group,null,20])).rows).toEqual([]);
   await db.rpc(3,'sharing_consent_v1',['synthetic','a'.repeat(64),true]);
   await db.admin.query("update assess.group_join_requests set state='rejected' where id=$1",[r.id]);
   expect((await db.rpc<{rows:unknown[]}>(2,'scope_page_v1',['requests',db.group,null,20])).rows).toEqual([]);
  }finally{await db.close();}
 },120000);
});
const inserts={
 events:"insert into public.events(type,at) values('heartbeat','1900-01-01') returning id v",
 attempts:"insert into public.attempts(attempt_no,exam_id,case_id,definition_version,settings,result,locale,finished_at) values(1,'synthetic','default','1','{}','{}','en','1900-01-01') returning id v",
 feedback:"insert into public.feedback(exam_id,text,at) values('synthetic','SYNTHETIC','1900-01-01') returning id v",
} as const;
const streams=['events','attempts','feedback'] as const;
async function practiceSetup(mode:Mode){
 const db=await setup(mode);
 await db.admin.query("update public.profiles set consent_version='2026-10-27',consented_at=now()");
 return db;
}
async function beginUser(c:Client,user:number){
 await c.query("begin;set local role authenticated;set local statement_timeout='4s'");
 await c.query("select set_config('request.jwt.claim.sub',$1,true)",[id(user)]);
 return (await c.query('select pg_backend_pid() pid')).rows[0].pid as number;
}
async function waitsFor(db:Db,waiting:number,holding:number){
 for(let n=0;n<200;n++){
  if((await db.admin.query('select $1=any(pg_blocking_pids($2)) waiting',[holding,waiting])).rows[0].waiting)return;
  await new Promise(r=>setTimeout(r,10));
 }
 throw Error('missing directed PostgreSQL lock witness');
}
const outcome=<T>(p:Promise<T>)=>p.then(value=>({value}),error=>({error}));
async function writeCounts(db:Db,user=3){
 return (await db.admin.query(`select
  (select count(*) from public.profiles where user_id=$1) profiles,
  (select count(*) from assess.pilot_write_usage where user_id=$1) usage,
  (select count(*) from public.events where user_id=$1) events,
  (select count(*) from public.attempts where user_id=$1) attempts,
  (select count(*) from public.feedback where user_id=$1) feedback,
  (select count(*) from assess.practice_recordings where user_id=$1) recordings`,[id(user)])).rows[0];
}
describe.each(modes)('RAD085 account-only write ordering %s',mode=>{
 it('events, attempts and feedback complete under 500ms while exclusive capacity stays held',async()=>{
  const db=await practiceSetup(mode),capacity=await db.connect(),writer=await db.connect();
  try{
   await capacity.query("begin;select pg_advisory_xact_lock(hashtextextended('rad062-capacity',0))");
   const timings:Record<string,number>={};
   for(const stream of streams){
    await beginUser(writer,3);await writer.query("set local statement_timeout='400ms'");
    const start=performance.now();await writer.query(inserts[stream]);
    expect((await writer.query("select count(*) n from pg_locks where pid=pg_backend_pid() and locktype='advisory'")).rows[0].n).toBe('1');
    await writer.query('commit');
    timings[stream]=performance.now()-start;expect(timings[stream]).toBeLessThan(500);
    // The exclusive lock is still owned by the other session throughout each INSERT.
    expect((await capacity.query("select exists(select 1 from pg_locks where pid=pg_backend_pid() and locktype='advisory' and mode='ExclusiveLock' and granted) held")).rows[0].held).toBe(true);
   }
   expect(await writeCounts(db)).toEqual({profiles:'1',usage:'3',events:'1',attempts:'1',feedback:'1',recordings:'1'});
   console.info('RAD085 exclusive capacity write milliseconds',mode,JSON.stringify(timings));
  }finally{await writer.query('rollback');await capacity.query('rollback');await writer.end();await capacity.end();await db.close();}
 },120000);
 for(const path of ['d3','finalise'] as const)for(const stream of streams)for(const first of ['write','erase'] as const){
  it(`${path} vs ${stream}: ${first} commits first; profile precedes usage and cascades leave no partial rows`,async()=>{
   const db=await practiceSetup(mode),writer=await db.connect(),eraser=await db.connect();
   try{
    if(path==='finalise'){
     // Trusted adversarial due ledger keeps the account approved so the INSERT
     // reaches the profile wait; normal C2 suspension rejects it even earlier.
     await db.admin.query('alter table auth.users add column banned_until timestamptz');
     await db.admin.query("insert into public.c2_account_deletions(user_id,restore_status,previous_banned_until,requested_at) values($1,'approved','-infinity',clock_timestamp()-interval '31 days')",[id(3)]);
    }
    const writerPid=await beginUser(writer,3);
    await eraser.query("begin;set local statement_timeout='4s'");
    await eraser.query("select set_config('request.jwt.claim.sub',$1,true)",[id(1)]);
    const eraserPid=(await eraser.query('select pg_backend_pid() pid')).rows[0].pid as number;
    const eraseQuery=()=>path==='d3'
     ?eraser.query('select assess.erase_account_d3_v1($1) v',[id(3)])
     :eraser.query("select public.owner_account_deletion_v1('finalise') v");
    if(first==='write'){
     await writer.query(inserts[stream]);
     const erasing=outcome(eraseQuery());await waitsFor(db,eraserPid,writerPid);
     // Neither the usage nor the Practice row is visible before writer COMMIT.
     expect(await writeCounts(db)).toEqual({profiles:'1',usage:'0',events:'0',attempts:'0',feedback:'0',recordings:'0'});
     await writer.query('commit');const r=await erasing;expect(r).toHaveProperty('value');
     if(path==='finalise'&&'value' in r)expect(r.value.rows[0].v).toMatchObject({processed:1,blocked:[],alert:false});
     await eraser.query('commit');
    }else{
     const r=await eraseQuery();if(path==='finalise')expect(r.rows[0].v).toMatchObject({processed:1,blocked:[],alert:false});
     const writing=outcome(writer.query(inserts[stream]));await waitsFor(db,writerPid,eraserPid);
     await eraser.query('commit');expect(await writing).toMatchObject({error:{code:'42501'}});
     await writer.query('rollback');
    }
    expect(await writeCounts(db)).toEqual({profiles:'0',usage:'0',events:'0',attempts:'0',feedback:'0',recordings:'0'});
    expect((await db.admin.query('select count(*) n from auth.users where id=$1',[id(3)])).rows[0].n).toBe('0');
   }finally{await writer.query('rollback');await eraser.query('rollback');await writer.end();await eraser.end();await db.close();}
  },120000);
 }
 for(const stream of streams){
  it.each(['commit','rollback'] as const)(`${stream}: concurrent first inserts serialize before usage; first writer %s`,async finish=>{
   const db=await practiceSetup(mode),first=await db.connect(),second=await db.connect();
   try{
    const firstPid=await beginUser(first,3),secondPid=await beginUser(second,3);
    await first.query(inserts[stream]);const writing=outcome(second.query(inserts[stream]));
    await waitsFor(db,secondPid,firstPid);
    // SHARE profile locks coexist, so the observed wait must be per-account advisory.
    expect((await db.admin.query("select wait_event from pg_stat_activity where pid=$1",[secondPid])).rows[0].wait_event).toBe('advisory');
    await first.query(finish);expect(await writing).toHaveProperty('value');await second.query('commit');
    const count=finish==='commit'?2:1;
    expect((await db.admin.query('select stream,hour_count,day_count from assess.pilot_write_usage where user_id=$1',[id(3)])).rows).toEqual([{stream,hour_count:count,day_count:count}]);
    expect((await db.admin.query(`select count(*) n from public.${stream} where user_id=$1`,[id(3)])).rows[0].n).toBe(String(count));
    // A later failing row rolls back the earlier row and its counter increment.
    const invalid=stream==='events'?"insert into public.events(type) values('heartbeat'),('INVALID')"
     :stream==='attempts'?"insert into public.attempts(attempt_no,exam_id,case_id,definition_version,settings,result,locale,finished_at) values(1,'synthetic','default','1','{}','{}','en','1900-01-01'),(0,'synthetic','default','1','{}','{}','en','1900-01-01')"
     :"insert into public.feedback(exam_id,text) values('synthetic','SYNTHETIC'),('synthetic','')";
    await expect(asUser(db,3,invalid)).rejects.toMatchObject({code:'23514'});
    expect((await db.admin.query('select hour_count,day_count from assess.pilot_write_usage where user_id=$1',[id(3)])).rows).toEqual([{hour_count:count,day_count:count}]);
    expect((await db.admin.query(`select count(*) n from public.${stream} where user_id=$1`,[id(3)])).rows[0].n).toBe(String(count));
   }finally{await first.query('rollback');await second.query('rollback');await first.end();await second.end();await db.close();}
  },120000);
 }
 for(const stream of streams){
  it(`${stream}: C2 deactivation commits first; approval is rechecked after the profile wait`,async()=>{
   const db=await practiceSetup(mode),writer=await db.connect(),eraser=await db.connect();
   try{
    await db.admin.query('alter table auth.users add column banned_until timestamptz');
    const writerPid=await beginUser(writer,3),eraserPid=await beginUser(eraser,1);
    await eraser.query("select public.owner_account_deletion_v1('deactivate',$1)",[id(3)]);
    const writing=outcome(writer.query(inserts[stream]));await waitsFor(db,writerPid,eraserPid);
    await eraser.query('commit');expect(await writing).toMatchObject({error:{code:'42501'}});await writer.query('rollback');
    expect(await writeCounts(db)).toEqual({profiles:'1',usage:'0',events:'0',attempts:'0',feedback:'0',recordings:'0'});
   }finally{await writer.query('rollback');await eraser.query('rollback');await writer.end();await eraser.end();await db.close();}
  },120000);
 }
 it.each(['write','stop'] as const)('all six 0200 stop phases coexist with uncommitted writes: %s first',async first=>{
  const db=await practiceSetup(mode),writer=await db.connect(),stopper=await db.connect();
  try{
   // The writing account is also the appointed alternate: profile SHARE is compatible.
   await asUser(db,1,'select public.emergency_alternate_set_v1($1) v',[id(3)]);
   await asUser(db,3,'select public.emergency_stop_v1($1) v',[id(900)]);
   for(let phase=1;phase<=6;phase++){
     await beginUser(writer,3);await beginUser(stopper,3);
     const stop=async()=>{
      const r=(await stopper.query('select public.emergency_stop_phase_v1($1::uuid,$2::smallint) v',[id(900),phase])).rows[0].v;
      expect(r.phases).toHaveLength(phase);expect(r.phases.every((p:{ok:boolean})=>p.ok)).toBe(true);
      if(phase===6)expect(r.status).toBe('STOPPED');
     };
     const write=async()=>{for(const stream of streams)await writer.query(inserts[stream]);};
     if(first==='write'){await write();await stop();await stopper.query('commit');await writer.query('commit');}
     else{await stop();await write();await writer.query('commit');await stopper.query('commit');}
   }
   expect((await db.admin.query('select stream,hour_count,day_count from assess.pilot_write_usage order by stream')).rows).toEqual(
    ['attempts','events','feedback'].map(stream=>({stream,hour_count:6,day_count:6})));
   expect(await writeCounts(db)).toEqual({profiles:'1',usage:'3',events:'6',attempts:'6',feedback:'6',recordings:'6'});
  }finally{await writer.query('rollback');await stopper.query('rollback');await writer.end();await stopper.end();await db.close();}
 },120000);
});
describe.each(modes)('RAD085 server write limits %s',mode=>{
 it('reviewed hourly/day values are 5x and 20x the recorded actual 3600-second UI counts',async()=>{
  const db=await setup(mode);
  try{
   const report=readFileSync('docs/RAD-085_FIXES_REPORT_2026-11-02.md','utf8');
   const record=report.match(/<!-- RAD085-MEASUREMENT:BEGIN -->\s*```json\s*([\s\S]*?)\s*```/);
   expect(record).not.toBeNull();
   const measured=JSON.parse(record![1]!) as {windowSeconds:number;counts:Record<string,number>};
   expect(measured.windowSeconds).toBe(3600);
   const rows=(await db.admin.query('select stream,per_hour,per_day from assess.pilot_write_limits order by stream')).rows;
   expect(rows).toEqual(['attempts','events','feedback'].map(stream=>({stream,per_hour:5*measured.counts[stream]!,per_day:20*measured.counts[stream]!})));
  }finally{await db.close();}
 },120000);
 for(const stream of ['events','attempts','feedback'] as const)for(const window of ['hour','day'] as const){
  it(`${stream} ${window}: just under, at, over; direct inserts and fake timestamps cannot bypass`,async()=>{
   const db=await setup(mode);
   try{
    await db.admin.query("update public.profiles set consent_version='2026-10-27',consented_at=now()");
    const lim=(await db.admin.query(`select per_${window==='hour'?'hour':'day'} lim from assess.pilot_write_limits where stream=$1`,[stream])).rows[0].lim as number;
    // Trusted boundary setup avoids thousands of writes; the three boundary writes
    // all use the real authenticated INSERT, trigger, constraints and RLS.
    await db.admin.query(`insert into assess.pilot_write_usage values($1,$2,date_trunc('hour',clock_timestamp()),date_trunc('day',clock_timestamp()),$3,$4)`,[id(3),stream,window==='hour'?lim-2:0,window==='day'?lim-2:0]);
    await asUser(db,3,inserts[stream]);await asUser(db,3,inserts[stream]);
    await expect(asUser(db,3,inserts[stream])).rejects.toMatchObject({code:window==='hour'?'P0851':'P0852'});
    expect((await db.admin.query(`select ${window}_count n from assess.pilot_write_usage where user_id=$1 and stream=$2`,[id(3),stream])).rows[0].n).toBe(lim);
    expect((await db.admin.query(`select count(*) n from public.${stream} where user_id=$1`,[id(3)])).rows[0].n).toBe('2');
    await asUser(db,2,inserts[stream]); // independent account budget
    await expect(asUser(db,3,'select * from assess.pilot_write_usage')).rejects.toMatchObject({code:'42501'});
   }finally{await db.close();}
  },120000);
 }
 it('a writing transaction protects profile/usage until commit; deactivation waits in capacity order',async()=>{
  const db=await setup(mode),writer=await db.connect();
  try{
   await db.admin.query('alter table auth.users add column banned_until timestamptz');
   await writer.query('begin;set local role authenticated');await writer.query("select set_config('request.jwt.claim.sub',$1,true)",[id(3)]);
   await writer.query(inserts.events);
   const pid=(await writer.query('select pg_backend_pid() pid')).rows[0].pid;
   const deleting=erase(db,'deactivate',3).then(v=>({value:v}),e=>({error:e}));
   await blocked(db,pid);await writer.query('commit');
   expect(await deleting).toMatchObject({value:{processed:1,blocked:[],alert:false}});
   expect((await db.admin.query('select status from public.profiles where user_id=$1',[id(3)])).rows[0].status).toBe('suspended');
  }finally{await writer.query('rollback');await writer.end();await db.close();}
 },120000);
 it('concurrent direct inserts share one counter; failed multi-row INSERT is atomic; old buckets reset',async()=>{
  const db=await setup(mode);
  try{
   const lim=(await db.admin.query("select per_hour from assess.pilot_write_limits where stream='events'")).rows[0].per_hour;
   await db.admin.query("insert into assess.pilot_write_usage values($1,'events',date_trunc('hour',clock_timestamp()),date_trunc('day',clock_timestamp()),$2,$2)",[id(3),lim-1]);
   const results=await Promise.allSettled([asUser(db,3,inserts.events),asUser(db,3,inserts.events)]);
   expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
   expect(results.filter(r=>r.status==='rejected').map(r=>(r as PromiseRejectedResult).reason.code)).toEqual(['P0851']);
   await expect(asUser(db,3,"insert into public.events(type) values('heartbeat'),('heartbeat')")).rejects.toMatchObject({code:'P0851'});
   await db.admin.query("update assess.pilot_write_usage set hour_at=hour_at-interval '1 day',day_at=day_at-interval '1 day' where user_id=$1",[id(3)]);
   await asUser(db,3,inserts.events);
   expect((await db.admin.query("select hour_count,day_count from assess.pilot_write_usage where user_id=$1",[id(3)])).rows[0]).toEqual({hour_count:1,day_count:1});
  }finally{await db.close();}
 },120000);
});
describe.each(modes)('RAD085 personal written-answer consent %s',mode=>{
 it('v2 is insufficient for supervisor and owner; personal v3 restores grading; stale versions denied',async()=>{
  const {db,s}=await fixture(mode);
  try{
   await slots(db.admin);await db.admin.query(alternate);await db.admin.query(migration);
   expect(await db.rpc(3,'consent_v3')).toEqual({accepted:false});
   for(const who of [1,2]){
    await expect(db.rpc(who,'manual_read_v1',[s])).rejects.toMatchObject({code:'42501'});
    expect((await db.rpc<{rows:unknown[]}>(who,'manual_queue_v1')).rows).toEqual([]);
   }
   await expect(db.rpc(3,'consent_v3',['assess-pilot-2026-10-20-v2'])).rejects.toMatchObject({code:'22023'});
   await db.rpc(2,'consent_v3',['assess-written-2026-11-02-v3']);
   expect(await db.rpc(3,'consent_v3')).toEqual({accepted:false});
   await db.rpc(3,'consent_v3',['assess-written-2026-11-02-v3']);
   expect(await db.rpc(3,'consent_v3')).toEqual({accepted:true});
   await db.rpc(2,'manual_read_v1',[s]);
   expect((await db.rpc<{rows:unknown[]}>(2,'manual_queue_v1')).rows).toHaveLength(1);
   await db.admin.query("update assess.sessions set submitted_at=clock_timestamp()-interval '167 hours' where id=$1",[s]);
   const viewed=await asUser<{finalizeBefore:string}>(db,2,'select assess.manual_read_v1($1) v',[s],'America/New_York');
   const submitted=(await db.admin.query('select submitted_at from assess.sessions where id=$1',[s])).rows[0].submitted_at as Date;
   expect(Date.parse(viewed.finalizeBefore)-submitted.getTime()).toBe(168*3600000);
   await db.admin.query("update assess.sessions set submitted_at=clock_timestamp()-interval '168 hours'-interval '1 second' where id=$1",[s]);
   await expect(asUser(db,2,'select assess.manual_read_v1($1) v',[s],'America/New_York')).rejects.toMatchObject({code:'55000'});
   await db.admin.query('update assess.sessions set submitted_at=clock_timestamp() where id=$1',[s]);
   await db.admin.query('delete from assess.consents where user_id=$1 and version=$2',[id(3),'assess-written-2026-11-02-v3']);
   await expect(db.rpc(2,'manual_receipt_v1',[s])).rejects.toMatchObject({code:'42501'});
  }finally{await db.close();}
 },120000);
});
