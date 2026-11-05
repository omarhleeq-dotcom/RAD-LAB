/** Independent counter/witness/privilege regression proofs on synthetic PostgreSQL only. */
import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {fixture,id} from './selfservice-fixture';
import {executeGradingWorker} from './server-worker';
import {createGradingWorkerBinding} from './server-runtime';
import {gcsWitnessStore,type WitnessStore,type StoredWitness} from './witness';

type Health={failed:number;alert:number;overdue:number;purgeDue:number;witness:Witness};
type Witness={epoch:string;seq:number;now:string;acceptedAt:string;credentialValidUntil:string|null};
const p5=()=>readFileSync('supabase/staged/self-service/p5-witness.sql','utf8');
const counters=({failed,alert,overdue,purgeDue}:Health)=>({failed,alert,overdue,purgeDue});
const expected={failed:1,alert:1,overdue:1,purgeDue:1};
const operations=['assess.claim_v1()','assess.fail_v1(uuid,uuid)','assess.finish_v1(uuid,uuid,text,text)','assess.health_v1()','assess.maintain_v1(integer)'];

it('pre-P5 exact compatibility; v2 exclusion; strict witness/clock/epoch/sequence; regression mutation',async()=>{
 const db=await fixture(['20261030000700_rad062_manual_grading.sql','20261030000800_rad062_erasure_operations.sql']);
 try{
  await db.rpc(2,'consent_v2',['assess-pilot-2026-10-20-v2']);
  await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,schema_version,available) values($1,$2,$1,'1','SYNTHETIC v1','mixed',1,true)",[id(550),id(2)]);
  await db.admin.query('insert into assess.assignments(id,owner_id,version_id) values($1,$2,$3)',[id(551),id(2),id(550)]);
  await db.admin.query('insert into assess.targets values($1,$2),($1,$3)',[id(551),id(2),id(3)]);
  // Independent mixed-lifecycle rows exercise ALL four counters with fixed expected values.
  for(const [n,version,state,user,ordinal] of [[600,1,'grading-failed',3,1],[601,2,'grading-failed',3,2],[602,1,'active',2,1],[603,2,'active',3,3]] as const)
   await db.admin.query(`insert into assess.sessions(id,assignment_id,user_id,ordinal,lifecycle_version,state,started_at,submitted_at,deadline,expires_at)
    values($1,$2,$3,$4,$5,$6,clock_timestamp()-interval '3 days',clock_timestamp()-interval '2 days',clock_timestamp()-interval '1 hour',case when $6='grading-failed' then clock_timestamp()-interval '1 minute' end)`,[id(n),id(version===1?551:51),id(user),ordinal,version,state]);
  const health=async()=>(await db.admin.query('select assess.health_v1() h')).rows[0].h as Health;
  // Keep the historical contract literal and independent of the corrected implementation.
  expect(await health()).toEqual({failed:1,alert:1,overdue:1,purgeDue:1});
  await db.admin.query(p5());
  const epoch=(await db.admin.query('select epoch::text,seq::int,accepted_at from assess.restore_epoch')).rows[0];
  let previous=epoch.seq as number;
  for(let n=0;n<3;n++){
   const before=(await db.admin.query('select clock_timestamp() t')).rows[0].t as Date;
   const h=await health();
   const after=(await db.admin.query('select clock_timestamp() t')).rows[0].t as Date;
   expect(Object.keys(h).sort()).toEqual(['alert','failed','overdue','purgeDue','witness']);
   expect(counters(h)).toEqual(expected);
   expect(Object.keys(h.witness).sort()).toEqual(['acceptedAt','credentialValidUntil','epoch','now','seq']);
   expect(h.witness.epoch).toBe(epoch.epoch);expect(h.witness.epoch).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
   expect(h.witness.seq).toBe(++previous);expect(Number.isSafeInteger(h.witness.seq)).toBe(true);
   expect(Date.parse(h.witness.now)).toBeGreaterThanOrEqual(before.getTime());expect(Date.parse(h.witness.now)).toBeLessThanOrEqual(after.getTime());
   expect(Date.parse(h.witness.acceptedAt)).toBe((epoch.accepted_at as Date).getTime());expect(h.witness.credentialValidUntil).toBeNull();
  }
  // Prove this independent oracle catches the exact missing-predicate regression.
  await db.admin.query('begin');
  try{
   await db.admin.query(`do $m$declare d text;begin d:=pg_get_functiondef('assess.health_v1()'::regprocedure);execute replace(d,'from assess.sessions where lifecycle_version=1','from assess.sessions');end$m$`);
   const mutated=counters(await health());
   expect(mutated).toEqual({failed:2,alert:2,overdue:2,purgeDue:2});
   expect(()=>expect(mutated).toEqual(expected)).toThrow();
  }finally{await db.admin.query('rollback');}
  expect(counters(await health())).toEqual(expected);
 }finally{await db.close();}
},300000);

it('real DB privileges remain exactly five operations, private epoch, and enforcing anomalies never claim',async()=>{
 const db=await fixture(['20261030000700_rad062_manual_grading.sql','20261030000800_rad062_erasure_operations.sql']);
 try{
  await db.admin.query(p5());
  await db.admin.query(`create role assess_grading_worker nologin noinherit;
   grant usage on schema assess to assess_grading_worker;
   grant execute on function assess.maintain_v1(integer),assess.claim_v1(),assess.finish_v1(uuid,uuid,text,text),assess.fail_v1(uuid,uuid),assess.health_v1() to assess_grading_worker;`);
  const allowed=(await db.admin.query("select oid::regprocedure::text f from pg_proc where pronamespace='assess'::regnamespace and has_function_privilege('assess_grading_worker',oid,'EXECUTE') order by 1")).rows.map(r=>r.f);
  expect(allowed).toEqual(operations);
  for(const role of ['anon','authenticated','service_role','assess_authoring_bridge','assess_grading_worker']){
   await db.admin.query('begin;set local role '+role);
   await expect(db.admin.query('select * from assess.restore_epoch')).rejects.toMatchObject({code:'42501'});await db.admin.query('rollback');
   if(role!=='assess_grading_worker'){
    await db.admin.query('begin;set local role '+role);
    await expect(db.admin.query('select assess.health_v1()')).rejects.toMatchObject({code:'42501'});await db.admin.query('rollback');
   }
  }
  const config={host:'synthetic.invalid',port:5432,database:'synthetic',user:'synthetic_worker',password:'SYNTHETIC_ONLY',ca:'-----BEGIN CERTIFICATE-----synthetic'};
  const binding=createGradingWorkerBinding(config);
  try{for(const name of ['witness_accept_v1','owner_resume_v1','window_guard_v1','claim_v2','recover_v1','content_submit_v1','unknown'])await expect(binding.call(name,{})).rejects.toMatchObject({code:'invalid'});}finally{await binding.close();}
  const row=(await db.admin.query('select epoch::text,seq::int,clock_timestamp() t from assess.restore_epoch')).rows[0];
  const stored:StoredWitness={projectRef:'abcdefghijklmnopqrst',epoch:row.epoch,seq:row.seq,updatedAt:(row.t as Date).toISOString()};
  const badJson=gcsWitnessStore('synthetic','witness',async()=>'SYNTHETIC',async()=>({status:200,headers:{get:()=> '1'},text:async()=>'{"bad":true}'}));
  for(const kind of ['missing','malformed-store','stale','malformed-db'] as const){
   const calls:string[]=[];
   if(kind==='malformed-db')await db.admin.query("update assess.restore_epoch set accepted_at='infinity'");
   const store:WitnessStore=kind==='malformed-store'?badJson:{read:async()=>({value:kind==='missing'?null:{...stored,seq:stored.seq+100},generation:'1'}),write:async()=>{throw Error('no write expected');}};
   const result=await executeGradingWorker(async()=>config,new AbortController().signal,async()=>{},()=>({close:async()=>{},call:async<T>(name:string):Promise<T>=>{
    calls.push(name);await db.admin.query('begin;set local role assess_grading_worker');
    try{const r=await db.admin.query('select assess.'+name+'() v');await db.admin.query('commit');return r.rows[0].v as T;}catch(e){await db.admin.query('rollback');throw e;}
   }}),undefined,{witness:{mode:'enforcing',projectRef:stored.projectRef,store}});
   expect(result).toMatchObject({outcome:'STOP',code:'restore_suspected',witness:{result:{missing:'witness-missing','malformed-store':'witness-unreadable',stale:'restore-suspected','malformed-db':'db-witness-missing'}[kind]}});
   expect(calls).toEqual(['health_v1']);expect(result).not.toHaveProperty('counts');
  }
 }finally{await db.close();}
},300000);
