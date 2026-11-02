import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {Client,type QueryResult} from 'pg';
import { catalogueFixture, modes, id, sql, syntheticWorkerPassword } from './rad062-m09-fixture';
const migration = readFileSync('supabase/migrations/20261102000200_rad059_emergency_alternate.sql', 'utf8');
const ready = () => readFileSync('supabase/checks/rad059-alternate-ready.sql', 'utf8');
type Receipt = {operation:string;nextPhase:number;status:string;phases:{phase:number;ok:boolean}[];verification:Record<string,unknown>|null};
type Db = Awaited<ReturnType<typeof catalogueFixture>>;
async function setup(mode:typeof modes[number]) {
 const db=await catalogueFixture(mode);
 try {
  await db.admin.query(sql());
  // Synthetic local PostgREST configuration only; migration never changes settings.
  await db.admin.query("alter role authenticated set statement_timeout='8s'; do $$begin if not exists(select 1 from pg_roles where rolname='assess_job_a') then create role assess_job_a nologin;end if;if not exists(select 1 from pg_roles where rolname='assess_job_b') then create role assess_job_b nologin;end if;end$$; alter role assess_job_a nologin;alter role assess_job_b nologin;");
  await db.admin.query(migration);
  async function rpc<T=unknown>(user:number|'anon',name:string,args:unknown[]=[]) {
   const c=await db.connect();
   try {
    await c.query('begin');
    const config=(await c.query("select unnest(rolconfig) setting from pg_roles where rolname='authenticated'")).rows.map(r=>r.setting as string).find(v=>v.startsWith('statement_timeout='));
    if(!config)throw Error('missing synthetic PostgREST timeout');
    // Separate command BEFORE the SELECT, matching PostgREST's request transaction.
    await c.query(`set local statement_timeout = '${config.split('=')[1]}'`);
    await c.query(`set local role ${user==='anon'?'anon':'authenticated'}`);
    await c.query("set local timezone='America/New_York'");
    await c.query("select set_config('request.jwt.claim.sub',$1,true)",[typeof user==='number'?id(user):'']);
    const casts=name==='emergency_stop_phase_v1'?['uuid','smallint']:[];
    const result=(await c.query(`select public.${name}(${args.map((_,n)=>'$'+(n+1)+(casts[n]?'::'+casts[n]:'')).join(',')}) v`,args)).rows[0].v as T;
    await c.query('commit');return result;
   }catch(error){await c.query('rollback');throw error;}finally{await c.end();}
  }
  return {...db,rpc};
 }catch(error){await db.close();throw error;}
}
async function seed(db:Pick<Db,'admin'|'call'>) {
 await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values($1,$2,$1,'1','SYNTHETIC','mixed',true)",[id(50),id(1)]);
 await db.admin.query('insert into assess.assignments(id,owner_id,version_id) values($1,$2,$3)',[id(51),id(1),id(50)]);
 await db.call('consent_v2',['assess-pilot-2026-10-20-v2'],3);
 for(const [n,state] of ['active','grading','grading-failed','awaiting-manual'].entries())await db.admin.query(`insert into assess.sessions(id,assignment_id,user_id,ordinal,state,started_at,deadline,submitted_at,lease,lease_until)
 values($1,$2,$3,$4,$5,now()-interval '2 hours',now()+interval '1 hour',case when $5='active' then null else now()-interval '1 hour' end,case when $5='grading' then gen_random_uuid() end,case when $5='grading' then now()+interval '5 minutes' end)`,[id(100+n),id(51),id(3),n+1,state]);
}
describe.each(modes)('RAD059 stop-only %s',mode=>{
 it('atomic M09 prerequisite and exact successor catalogue, ACL and private schema',async()=>{
  const db=await setup(mode);
  try{
   const result=await db.admin.query(ready()) as unknown as QueryResult[];
   expect(result.flatMap(r=>r.rows).every(r=>r.ok)).toBe(true);
  }finally{await db.close();}
 },120000);
 it('owner appoints one; ordered committed phases, lost reply, replay and owner-only audit',async()=>{
  const db=await setup(mode);
  try{
   await seed(db);
   // Cross the US DST fall-back: seven UTC days must remain exactly 168 hours.
   await db.admin.query("update assess.sessions set submitted_at='2026-10-31T12:00:00Z' where state<>'active'");
   await expect(db.rpc(3,'emergency_alternate_set_v1',[id(3)])).rejects.toMatchObject({code:'42501'});
   await db.rpc(1,'emergency_alternate_set_v1',[id(3)]);
   expect(await db.rpc(3,'emergency_access_v1')).toBe(true);
   expect(await db.rpc(2,'emergency_access_v1')).toBe(false);
   const op=id(900);await db.rpc(3,'emergency_stop_v1',[op]);
   await expect(db.rpc(3,'emergency_stop_phase_v1',[op,2])).rejects.toMatchObject({code:'22023'});
   await db.admin.query('update assess.launch_gate set enabled=true; alter role assess_job_a login; alter role assess_job_b login');
   await db.rpc(3,'emergency_stop_phase_v1',[op,1]); // Deliberately discard this committed reply.
   const partial=await db.rpc<Receipt>(3,'emergency_stop_receipt_v1',[op]);expect(partial.status).toBe('PARTIAL');expect(partial.nextPhase).toBe(2);
   for(let phase=2;phase<=6;phase++)await db.rpc(3,'emergency_stop_phase_v1',[op,phase]);
   const stopped=await db.rpc<Receipt>(3,'emergency_stop_v1',[op]);expect(stopped.status).toBe('STOPPED');expect(stopped.phases.every(p=>p.ok)).toBe(true);
   expect(stopped.verification).toMatchObject({gateClosed:true,loginDisabled:true,backendSessions:0,unheldSessions:0});
   expect(await db.rpc(3,'emergency_stop_phase_v1',[op,1])).toEqual(stopped);
   expect((await db.rpc<Receipt>(3,'emergency_stop_v1',[id(901)])).operation).toBe(op);
   await db.admin.query('update assess.launch_gate set enabled=true');
   expect((await db.rpc<Receipt>(3,'emergency_stop_v1',[id(902)])).operation).toBe(id(902));
   await db.admin.query('update assess.launch_gate set enabled=false');
   expect((await db.admin.query('select count(*) n from emergency.phases')).rows[0].n).toBe('6');
   await expect(db.rpc(3,'emergency_alternate_read_v1')).rejects.toMatchObject({code:'42501'});
   expect((await db.rpc<{audit:unknown[]}>(1,'emergency_alternate_read_v1')).audit).toHaveLength(3);
   expect((await db.admin.query("select bool_and(state='grading-failed' and emergency_held_at is not null and lease is null and retry_at-submitted_at=interval '168 hours') ok from assess.sessions")).rows[0].ok).toBe(true);
  }finally{await db.close();}
 },120000);
});

async function waitForBlock(db:Pick<Db,'admin'>,blocker:number) {
 for(let n=0;n<150;n++){
  if((await db.admin.query('select exists(select 1 from pg_stat_activity where $1=any(pg_blocking_pids(pid))) waiting',[blocker])).rows[0].waiting)return;
  await new Promise(resolve=>setTimeout(resolve,10));
 }
 throw Error('missing synthetic lock witness');
}
async function session(db:Pick<Db,'connect'>,user:number) {
 const c=await db.connect();await c.query('begin');
 const config=(await c.query("select unnest(rolconfig) setting from pg_roles where rolname='authenticated'")).rows.map(r=>r.setting as string).find(v=>v.startsWith('statement_timeout='));
 if(!config)throw Error('missing configured timeout');
 await c.query(`set local statement_timeout = '${config.split('=')[1]}'`);
 await c.query('set local role authenticated');await c.query("select set_config('request.jwt.claim.sub',$1,true)",[id(user)]);return c;
}
describe.each(modes)('RAD059 revocation, deadlines and privacy %s',mode=>{
 it('probe is read-only without row locks even while caller and appointment rows are being written',async()=>{
  const db=await setup(mode);const blocker=await db.connect(),probe=await db.connect();
  try{
   await db.rpc(1,'emergency_alternate_set_v1',[id(3)]);
   await blocker.query('begin');
   await blocker.query('update public.profiles set display_name=display_name where user_id=$1',[id(3)]);
   await blocker.query('select * from emergency.appointment for update');
   await probe.query('begin read only;set local role authenticated');
   await probe.query("select set_config('request.jwt.claim.sub',$1,true)",[id(3)]);
   const start=performance.now();
   expect((await probe.query('select public.emergency_access_v1() v')).rows[0].v).toBe(true);
   expect(performance.now()-start).toBeLessThan(1000);
  }finally{await probe.query('rollback');await blocker.query('rollback');await probe.end();await blocker.end();await db.close();}
 },120000);
 it('uncommitted unrelated owner profile UPDATE does not block access, stop or any phase',async()=>{
  const db=await setup(mode);const blocker=await db.connect();
  try{
   await db.rpc(1,'emergency_alternate_set_v1',[id(3)]);
   await blocker.query('begin');await blocker.query('update public.profiles set display_name=display_name where user_id=$1',[id(1)]);
   const timings:number[]=[];
   let start=performance.now();expect(await db.rpc(3,'emergency_access_v1')).toBe(true);timings.push(performance.now()-start);
   start=performance.now();await db.rpc(3,'emergency_stop_v1',[id(900)]);timings.push(performance.now()-start);
   for(let phase=1;phase<=6;phase++){
    start=performance.now();const result=await db.rpc<Receipt>(3,'emergency_stop_phase_v1',[id(900),phase]);timings.push(performance.now()-start);
    expect(result.phases.every(p=>p.ok)).toBe(true);
   }
   expect(timings.every(ms=>ms<1000)).toBe(true);
   console.info('RAD059 unrelated profile contention milliseconds',mode,JSON.stringify(timings.map(Math.round)));
  }finally{await blocker.query('rollback');await blocker.end();await db.close();}
 },120000);
 it('cheap rejection precedes capacity, profile and appointment waits for anon, non-appointed, pending and suspended callers',async()=>{
  const db=await setup(mode);const blocker=await db.connect();
  try{
   for(const status of ['approved','pending','suspended']){
    await db.admin.query('update public.profiles set status=$1 where user_id=$2',[status,id(2)]);
    await blocker.query("begin;select pg_advisory_xact_lock(hashtextextended('rad062-capacity',0));select * from public.profiles for update;select * from emergency.appointment for update");
    const start=performance.now();
    expect(await db.rpc(2,'emergency_access_v1')).toBe(false);
    await expect(db.rpc(2,'emergency_stop_v1',[id(900)])).rejects.toMatchObject({code:'42501'});
    await expect(db.rpc(2,'emergency_alternate_set_v1',[id(3)])).rejects.toMatchObject({code:'42501'});
    await expect(db.rpc('anon','emergency_stop_v1',[id(900)])).rejects.toMatchObject({code:'42501'});
    expect(performance.now()-start).toBeLessThan(1000);
    await blocker.query('rollback');
   }
  }finally{await blocker.query('rollback');await blocker.end();await db.close();}
 },120000);
 it.each(['suspend','erase'] as const)('caller %s racing a phase denies deterministically in both commit orders',async(kind)=>{
  const db=await setup(mode);let locker:Client|undefined,writer:Client|undefined;
  const mutate=async(c:Client)=>{
   if(kind==='suspend')await c.query("update public.profiles set status='suspended' where user_id=$1",[id(3)]);
   else{await c.query("select set_config('request.jwt.claim.sub',$1,true)",[id(1)]);await c.query('select assess.erase_account_d3_v1($1)',[id(3)]);}
  };
  try{
   await db.rpc(1,'emergency_alternate_set_v1',[id(3)]);await db.rpc(3,'emergency_stop_v1',[id(900)]);
   // Emergency first: caller SHARE and appointment locks survive the RPC until COMMIT.
   locker=await session(db,3);const pid=(await locker.query('select pg_backend_pid() pid')).rows[0].pid;
   await locker.query('select public.emergency_stop_phase_v1($1::uuid,1::smallint)',[id(900)]);
   writer=await db.connect();await writer.query('begin');const pending=mutate(writer);
   await waitForBlock(db,pid);await locker.query('commit');await pending;await writer.query('rollback');
   // Mutation first: the old committed identity may pass the cheap check, but
   // must be rejected after waiting for the profile/capacity lock and COMMIT.
   await writer.query('begin');await mutate(writer);const writerPid=(await writer.query('select pg_backend_pid() pid')).rows[0].pid;
   const denied=db.rpc(3,'emergency_stop_phase_v1',[id(900),2]).catch(error=>error);
   await waitForBlock(db,writerPid);await writer.query('commit');expect(await denied).toMatchObject({code:'42501'});
   expect(await db.rpc(3,'emergency_access_v1')).toBe(false);
  }finally{if(locker){await locker.query('rollback');await locker.end();}if(writer){await writer.query('rollback');await writer.end();}await db.close();}
 },120000);
 it.each(['suspend','c2-erase'] as const)('appointment target SHARE precedes appointment wait and serializes %s until COMMIT',async(kind)=>{
  const db=await setup(mode);let appointment:Client|undefined,setter:Client|undefined,writer:Client|undefined;
  try{
   await db.admin.query('alter table auth.users add column banned_until timestamptz');
   await db.rpc(1,'emergency_alternate_set_v1',[id(3)]);
   appointment=await session(db,1);await appointment.query('select public.emergency_alternate_remove_v1()');
   const appointmentPid=(await appointment.query('select pg_backend_pid() pid')).rows[0].pid;
   setter=await session(db,1);const setterPid=(await setter.query('select pg_backend_pid() pid')).rows[0].pid;
   const setting=setter.query('select public.emergency_alternate_set_v1($1)',[id(3)]);
   await waitForBlock(db,appointmentPid);
   writer=await db.connect();await writer.query('begin');
   await writer.query("select set_config('request.jwt.claim.sub',$1,true)",[id(1)]);
   const writerPid=(await writer.query('select pg_backend_pid() pid')).rows[0].pid;
   const mutation=async()=>{
    if(kind==='suspend')await writer!.query("update public.profiles set status='suspended' where user_id=$1",[id(3)]);
    else{
     await writer!.query("select public.owner_account_deletion_v1('deactivate',$1)",[id(3)]);
     await writer!.query("update public.c2_account_deletions set requested_at=clock_timestamp()-interval '31 days' where user_id=$1",[id(3)]);
     await writer!.query("select public.owner_account_deletion_v1('finalise')");
    }
   };
   const changing=mutation();await waitForBlock(db,setterPid);
   await appointment.query('commit');await setting;
   // Locks survive function return, including the target row and shared capacity.
   expect((await db.admin.query('select $1=any(pg_blocking_pids($2)) blocked',[setterPid,writerPid])).rows[0].blocked).toBe(true);
   await setter.query('commit');await changing;await writer.query('commit');
   expect(await db.rpc(3,'emergency_access_v1')).toBe(false);
  }finally{for(const c of [appointment,setter,writer])if(c){await c.query('rollback');await c.end();}await db.close();}
 },120000);
 it('target suspension committed before appointment is rejected after the profile wait',async()=>{
  const db=await setup(mode);const writer=await db.connect();
  try{
   await writer.query('begin');await writer.query("update public.profiles set status='suspended' where user_id=$1",[id(3)]);
   const pid=(await writer.query('select pg_backend_pid() pid')).rows[0].pid;
   const setting=db.rpc(1,'emergency_alternate_set_v1',[id(3)]).catch(error=>error);
   await waitForBlock(db,pid);await writer.query('commit');expect(await setting).toMatchObject({code:'22023'});
   expect((await db.admin.query('select revision from emergency.appointment')).rows[0].revision).toBe('0');
  }finally{await writer.query('rollback');await writer.end();await db.close();}
 },120000);
 it('missing M09 prerequisite aborts the whole migration without creating objects',async()=>{
  const db=await catalogueFixture(mode);
  try{
   await expect(db.admin.query(migration)).rejects.toMatchObject({code:'55000'});await db.admin.query('rollback');
   expect((await db.admin.query("select to_regnamespace('emergency') n,to_regprocedure('public.emergency_stop_v1(uuid)') f")).rows[0]).toEqual({n:null,f:null});
   expect((await db.admin.query('select inventory=assess.d3_fk_inventory_v1() ok from assess.erasure_fk_contract')).rows[0].ok).toBe(true);
  }finally{await db.close();}
 },120000);
 it('phase-level lock_timeout really bounds a wait within the RPC at two seconds',async()=>{
  const db=await setup(mode);const blocker=await db.connect();
  try{
   await db.rpc(1,'emergency_alternate_set_v1',[id(3)]);await db.rpc(3,'emergency_stop_v1',[id(900)]);
   await blocker.query('begin; lock table assess.launch_gate in access exclusive mode');
   const start=performance.now();const result=await db.rpc<Receipt>(3,'emergency_stop_phase_v1',[id(900),1]);const elapsed=performance.now()-start;
   expect(elapsed).toBeGreaterThanOrEqual(1900);expect(elapsed).toBeLessThan(6000);
   expect(result.phases).toEqual([{phase:1,ok:false}]);expect(result.nextPhase).toBe(2);
  }finally{await blocker.query('rollback');await blocker.end();await db.close();}
 },120000);
 it('phase 5 is cancelled by the existing eight-second request bound; phases 1–4 stay committed and unfinished phase resumes',async()=>{
  const db=await setup(mode);
  try{
   await seed(db);await db.rpc(1,'emergency_alternate_set_v1',[id(3)]);await db.rpc(3,'emergency_stop_v1',[id(900)]);
   for(let phase=1;phase<=4;phase++)await db.rpc(3,'emergency_stop_phase_v1',[id(900),phase]);
   await db.admin.query(`create function public.synthetic_slow_freeze() returns trigger language plpgsql as $$begin perform pg_sleep(12);return new;end$$;
    create trigger synthetic_slow before update on assess.sessions for each row execute function public.synthetic_slow_freeze()`);
   const start=performance.now();await expect(db.rpc(3,'emergency_stop_phase_v1',[id(900),5])).rejects.toMatchObject({code:'57014'});
   expect(performance.now()-start).toBeGreaterThanOrEqual(7800);expect(performance.now()-start).toBeLessThan(11500);
   const result=await db.rpc<Receipt>(3,'emergency_stop_receipt_v1',[id(900)]);expect(result.status).toBe('PARTIAL');expect(result.nextPhase).toBe(5);expect(result.phases).toEqual([1,2,3,4].map(phase=>({phase,ok:true})));
   expect((await db.admin.query('select count(*) n from assess.sessions where emergency_held_at is not null')).rows[0].n).toBe('0');
   await db.admin.query('drop trigger synthetic_slow on assess.sessions;drop function public.synthetic_slow_freeze()');
   await db.rpc(3,'emergency_stop_phase_v1',[id(900),5]);expect((await db.rpc<Receipt>(3,'emergency_stop_phase_v1',[id(900),6])).status).toBe('STOPPED');
  }finally{await db.close();}
 },120000);
 it.each(['remove','suspend','pending-delete'] as const)('%s revokes the alternate between committed phases',async(kind)=>{
  const db=await setup(mode);
  try{
   await db.rpc(1,'emergency_alternate_set_v1',[id(3)]);await db.rpc(3,'emergency_stop_v1',[id(900)]);await db.rpc(3,'emergency_stop_phase_v1',[id(900),1]);
   if(kind==='remove')await db.rpc(1,'emergency_alternate_remove_v1');
   if(kind==='suspend')await db.admin.query("update public.profiles set status='suspended' where user_id=$1",[id(3)]);
   if(kind==='pending-delete'){await db.admin.query('alter table auth.users add column banned_until timestamptz');await db.rpc(1,'owner_account_deletion_v1',['deactivate',id(3)]);}
   for(const name of ['emergency_stop_v1','emergency_stop_receipt_v1'])await expect(db.rpc(3,name,[id(900)])).rejects.toMatchObject({code:'42501'});
   await expect(db.rpc(3,'emergency_stop_phase_v1',[id(900),2])).rejects.toMatchObject({code:'42501'});
   expect((await db.admin.query('select next_phase from emergency.operations')).rows[0].next_phase).toBe(2);
  }finally{await db.close();}
 },120000);
 it.each(['remove-first','phase-first'] as const)('serializes removal and phase: %s',async(order)=>{
  const db=await setup(mode);let locker:Client|undefined;
  try{
   await db.rpc(1,'emergency_alternate_set_v1',[id(3)]);await db.rpc(3,'emergency_stop_v1',[id(900)]);
   locker=await session(db,order==='remove-first'?1:3);
   const pid=(await locker.query('select pg_backend_pid() pid')).rows[0].pid as number;
   if(order==='remove-first'){
    await locker.query('select public.emergency_alternate_remove_v1()');
    const pending=db.rpc(3,'emergency_stop_phase_v1',[id(900),1]).catch(error=>error);
    await waitForBlock(db,pid);await locker.query('commit');expect(await pending).toMatchObject({code:'42501'});
    expect((await db.admin.query('select count(*) n from emergency.phases')).rows[0].n).toBe('0');
   }else{
    await locker.query('select public.emergency_stop_phase_v1($1::uuid,1::smallint)',[id(900)]);
    const pending=db.rpc(1,'emergency_alternate_remove_v1');
    await waitForBlock(db,pid);await locker.query('commit');await pending;
    expect((await db.admin.query('select count(*) n from emergency.phases')).rows[0].n).toBe('1');
   }
   await expect(db.rpc(3,'emergency_stop_phase_v1',[id(900),2])).rejects.toMatchObject({code:'42501'});
  }finally{if(locker){await locker.query('rollback');await locker.end();}await db.close();}
 },120000);
 it('terminates worker session_user after SET ROLE, preserves other backends and never provisions roles',async()=>{
  const db=await setup(mode);let worker:Client|undefined,other:Client|undefined;
  try{
   await db.admin.query('alter role assess_job_a login;grant assess_worker to assess_job_a with admin false,inherit false,set true;');
   const params=(db.admin as unknown as {connectionParameters:{host:string;port:number;database:string}}).connectionParameters;
   const password=mode==='supabase17'?await syntheticWorkerPassword():'';
   worker=new Client({host:params.host,port:params.port,database:params.database,user:'assess_job_a',password,ssl:false});worker.on('error',()=>{});await worker.connect();await worker.query('set role assess_worker');
   other=await db.connect();const otherPid=(await other.query('select pg_backend_pid() pid')).rows[0].pid;
   await db.rpc(1,'emergency_alternate_set_v1',[id(3)]);await db.rpc(3,'emergency_stop_v1',[id(900)]);
   for(let phase=1;phase<=4;phase++)await db.rpc(3,'emergency_stop_phase_v1',[id(900),phase]);
   expect((await db.admin.query("select count(*) n from pg_stat_activity where usename in ('assess_job_a','assess_job_b')")).rows[0].n).toBe('0');
   expect((await other.query('select pg_backend_pid() pid')).rows[0].pid).toBe(otherPid);
   expect((await db.admin.query("select bool_and(not rolcanlogin) ok from pg_roles where rolname in ('assess_job_a','assess_job_b')")).rows[0].ok).toBe(true);
  }finally{await worker?.end();await other?.end();await db.close();}
 },120000);
 it('account erasure uses existing C2/D3, retains events with NULL actor, and pilot-end cleanup removes them',async()=>{
  const db=await setup(mode);
  try{
   await db.rpc(1,'emergency_alternate_set_v1',[id(3)]);await db.rpc(3,'emergency_stop_v1',[id(900)]);await db.rpc(3,'emergency_stop_phase_v1',[id(900),1]);
   await db.admin.query('alter table auth.users add column banned_until timestamptz');
   await db.rpc(1,'owner_account_deletion_v1',['deactivate',id(3)]);
   await db.admin.query("update public.c2_account_deletions set requested_at=clock_timestamp()-interval '31 days' where user_id=$1",[id(3)]);
   expect(await db.rpc(1,'owner_account_deletion_v1',['finalise'])).toEqual({processed:1});
   expect((await db.admin.query('select actor from emergency.audit where action=\'stop\'')).rows).toEqual([{actor:null}]);
   expect((await db.admin.query('select actor from emergency.operations')).rows).toEqual([{actor:null}]);
   expect((await db.admin.query('select user_id from emergency.appointment')).rows).toEqual([{user_id:null}]);
   await expect(db.rpc(3,'emergency_stop_phase_v1',[id(900),2])).rejects.toMatchObject({code:'42501'});
   const keys=(await db.admin.query("select column_name from information_schema.columns where table_schema='emergency' and table_name='audit' order by ordinal_position")).rows.map(r=>r.column_name);
   expect(keys).toEqual(['id','actor','action','at','authorization_revision','operation','phases']);
   await expect(db.admin.query("select emergency.purge_after_pilot_v1(now()+interval '1 day')")).rejects.toMatchObject({code:'22023'});
   await db.admin.query("select emergency.purge_after_pilot_v1(now()-interval '7 months')");
   expect((await db.admin.query('select count(*) n from emergency.audit')).rows[0].n).toBe('0');
  }finally{await db.close();}
 },120000);
 it('denies other/anon/forbidden actions, asserts SECURITY DEFINER/search_path/ACL and accepts owners without appointment',async()=>{
  const db=await setup(mode);
  try{
   for(const user of [2,'anon'] as const)for(const name of ['emergency_stop_v1','emergency_stop_receipt_v1'])await expect(db.rpc(user,name,[id(900)])).rejects.toMatchObject({code:'42501'});
   await db.rpc(1,'emergency_alternate_set_v1',[id(3)]);
   await expect(db.rpc(3,'emergency_alternate_remove_v1')).rejects.toMatchObject({code:'42501'});
   await expect(db.rpc(3,'set_participant_status',[id(2),'approved'])).rejects.toMatchObject({code:'42501'});
   const c=await session(db,3);
   try{await expect(c.query('update assess.launch_gate set enabled=true')).rejects.toMatchObject({code:'42501'});}finally{await c.query('rollback');await c.end();}
   const acl=await db.admin.query("select p.proname,p.prosecdef,p.proconfig,has_function_privilege('authenticated',p.oid,'EXECUTE') auth,has_function_privilege('anon',p.oid,'EXECUTE') anon,exists(select 1 from aclexplode(p.proacl) x where x.grantee=0 and x.privilege_type='EXECUTE') public from pg_proc p where p.pronamespace='public'::regnamespace and p.proname like 'emergency_%'");
   expect(acl.rows).toHaveLength(7);expect(acl.rows.every(r=>r.prosecdef&&r.proconfig.includes('search_path=""')&&r.proconfig.includes('lock_timeout=2s')&&r.auth&&!r.anon&&!r.public)).toBe(true);
   expect((await db.admin.query("select has_function_privilege('authenticated','assess.freeze_v2()','EXECUTE') ok")).rows[0].ok).toBe(false);
   for(const forbidden of ["select assess.manual_queue_v1(null::uuid,1)","select assess.appointment_v1('00000000-0000-0000-0000-000000000002'::uuid,true)","select assess.account_management_v1('list')","alter role assess_job_a login"]){
    const actor=await session(db,3);
    try{await expect(actor.query(forbidden)).rejects.toMatchObject({code:'42501'});}finally{await actor.query('rollback');await actor.end();}
   }
   await db.rpc(1,'emergency_stop_v1',[id(901)]);for(let phase=1;phase<=6;phase++)await db.rpc(1,'emergency_stop_phase_v1',[id(901),phase]);
   expect((await db.rpc<Receipt>(1,'emergency_stop_receipt_v1',[id(901)])).status).toBe('STOPPED');
  }finally{await db.close();}
 },120000);
});
