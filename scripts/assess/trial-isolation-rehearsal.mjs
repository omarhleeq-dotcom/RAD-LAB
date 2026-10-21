// Disposable synthetic data only. No provider URL, login, secret or live selector.
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { openLocalDatabase } from './local-database.mjs';
import { installMixedContent } from '../../src/features/assess/server-presentation.ts';
import { attemptService, retentionService } from '../../src/features/assess/server-service.ts';
import { executeTrialJob, scopedTrialWorker } from './trial-isolation.ts';

let db, backend, phase='configuration', cleanup=true, outcome='STOP';
const checks=[], clients=[];
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const trial=id(90), scope=[trial,id(1),id(2),id(3),id(10),['visible','hidden']];
function fixture(label='visible',assessment=id(10)) {
 const review={sources:[{reference:'Synthetic letters',licenceEvidence:'Own engineering fixture'}],reviewedBy:'Engineering only',reviewedAt:'2026-10-22T00:00:00.000Z',scope:'Non-clinical engineering'};
 return {schemaVersion:1,assessment:{schemaVersion:1,ref:{id:assessment,version:label},name:'Synthetic trial',track:'mixed',maximum:'10',policy:{durationSeconds:label==='hidden'?120:300,maxAttempts:1,gradeVisibility:label==='hidden'?'hidden':'after-submission'},items:[1,2].map(n=>({schemaVersion:1,ref:{id:`q${n}`,version:'1'},type:'single-choice',contentLanguage:'en',prompt:'Choose a synthetic letter',options:[{id:'a',text:'A'},{id:'b',text:'B'}]}))},itemMarks:[1,2].map(n=>({item:{id:`q${n}`,version:'1'},maximum:'5'})),privateItems:[1,2].map(n=>({schemaVersion:1,ref:{id:`q${n}`,version:'1'},type:'single-choice',correctOptionId:'a',review}))};
}
try {
 const args=process.argv.slice(2);
 assert.equal(args.length,2);assert(args.includes('--synthetic-disposable'));
 backend=args.find(a=>a.startsWith('--backend='))?.slice(10);assert(['pglite','postgres'].includes(backend));
 phase='setup';db=await openLocalDatabase(backend);
 const {query,exec,port}=db;
 const original=await query("select oid::regprocedure::text id,pg_get_functiondef(oid) body,proacl::text acl from pg_proc where pronamespace in ('public'::regnamespace,'assess'::regnamespace) order by 1");
 for(const n of [1,2,3,4,5])await query('insert into auth.users values($1,$2,now(),$3)',[id(n),`synthetic${n}@example.test`,JSON.stringify({display_name:'Synthetic'})]);
 await exec(`update public.profiles set status='approved';update public.profiles set role='owner' where user_id in ('${id(1)}','${id(4)}')`);
 for(const n of [4,5])await port('authenticated',id(n)).call('consent_v2',{p_version:'assess-pilot-2026-10-20-v2'});
 const consents=await query('select * from assess.consents order by user_id,version');
 await exec(readFileSync('scripts/assess/sql/trial-isolation.sql','utf8'));
 const owner=port('authenticated',id(1)),student=port('authenticated',id(2)),outsider=port('authenticated',id(3)),otherOwner=port('authenticated',id(4));
 const worker=port('assess_worker'),scoped=scopedTrialWorker(trial,{...worker,async close(){}});
 const config={host:'synthetic.invalid',port:5432,database:'postgres',user:'synthetic_job',password:'PRIVATE',ca:'-----BEGIN CERTIFICATE-----SYNTHETIC'};
 const armSql='insert into assess.trial_scope(id,owner_id,student_id,outsider_id,assessment_id,version_labels,active) values($1,$2,$3,$4,$5,$6,true)';
 const arm=()=>query(armSql,scope);
 const command=(session,revision,action)=>JSON.stringify({schemaVersion:1,attemptId:session,operationId:randomUUID(),expectedRevision:revision,action});
 const job=()=>executeTrialJob(trial,async()=>config,new AbortController().signal,()=>({...worker,async close(){}}));

 phase='dormant-and-arming';
 await assert.rejects(()=>scoped.call('health_v1',{}),{code:'55000'});
 for(const who of [owner,student,outsider,port('anon')])for(const name of ['trial_claim_v1','trial_health_v1','trial_maintain_v1'])
  await assert.rejects(()=>who.call(name,{p_trial:trial,...(name==='trial_maintain_v1'?{p_limit:1}:{})}),{code:'42501'});
 await assert.rejects(()=>worker.call('trial_enter_v1',{p_trial:trial}),{code:'42501'});
 const foreign=await otherOwner.call('content_submit_v1',{p_document:fixture('visible',id(30))});
 await assert.rejects(arm,{code:'42501'});assert.equal((await query('select count(*)::int n from assess.trial_scope'))[0].n,0);
 await query('delete from assess.versions where id=$1',[foreign]);

 let clientA,clientB;
 if(backend==='postgres') {
  const require=createRequire(process.env.ASSESS_POSTGRES_MANIFEST??'/tmp/radlab-ops-postgres/package.json');
  const {Client}=require('pg');const socket=(await query("select current_setting('unix_socket_directories') socket"))[0].socket;
  for(let i=0;i<2;i++){const c=new Client({host:socket,port:55432,user:'postgres',password:'',database:'postgres',ssl:false,connectionTimeoutMillis:3000,query_timeout:3000});await c.connect();clients.push(c);}
  [clientA,clientB]=clients;
  phase='activation-race';
  await clientA.query('begin');
  // A normal dormant writer already in progress: no shared advisory protocol.
  await clientA.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track) values($1,$2,$1,'visible','Synthetic','mixed')",[id(31),id(4)]);
  await clientB.query('begin');await clientB.query("set local lock_timeout='150ms'");
  await assert.rejects(()=>clientB.query(armSql,scope),{code:'55P03'});await clientB.query('rollback');
  await clientA.query('commit');
  await assert.rejects(arm,{code:'42501'});
  await query('delete from assess.versions where id=$1',[id(31)]);
  checks.push('in-flight-dormant-writer-blocks-activation','post-lock-snapshot-rejects-committed-foreign-data');
 }
 if(clientA){
  await clientA.query('begin isolation level repeatable read');
  await clientA.query('select count(*) from assess.trial_scope'); // Deliberately old, empty snapshot.
  await arm();
  await assert.rejects(()=>clientA.query("insert into assess.groups(owner_id,name) values($1,'Synthetic')",[id(4)]),{code:'55000'});
  await clientA.query('rollback');
  checks.push('old-empty-snapshot-cannot-bypass-activation');
 }else await arm();
 assert.equal((await query('select enabled from assess.launch_gate'))[0].enabled,false);
 await assert.rejects(()=>query('update assess.trial_scope set student_id=$1',[id(5)]),{code:'42501'});
 await assert.rejects(()=>exec('delete from assess.consents'),{code:'42501'});
 await assert.rejects(()=>exec('truncate assess.consents'),{code:'42501'});
 await assert.rejects(()=>owner.call('group_write_v1',{p_name:'Synthetic'}),{code:'42501'});
 await assert.rejects(()=>otherOwner.call('content_submit_v1',{p_document:fixture('visible',id(30))}),{code:'42501'});
 assert.deepEqual(await query('select * from assess.consents order by user_id,version'),consents);
 checks.push('dormant-install','arming-rejects-foreign-data','worker-only-wrappers','immutable-scope','baseline-consents-retained','truncate-and-foreign-administration-denied');

 phase='scoped-authoring-and-start';
 const versions=[],assignments=[];
 for(const label of ['visible','hidden']){
  const version=await owner.call('content_submit_v1',{p_document:fixture(label)});versions.push(version);
  await installMixedContent(worker,version);
  assignments.push(await owner.call('assign_v1',{p_version:version,p_users:[id(2)],p_groups:[]}));
 }
 await assert.rejects(()=>query('update assess.versions set id=$1 where id=$2',[id(95),versions[0]]),{code:'42501'});
 await assert.rejects(()=>query('update assess.assignments set id=$1 where id=$2',[id(96),assignments[0]]),{code:'42501'});
 await assert.rejects(()=>owner.call('targets_write_v1',{p_assignment:assignments[0],p_revision:1,p_users:[id(3)],p_add:true}),{code:'42501'});
 await exec('update assess.launch_gate set enabled=true'); // NEW disposable fixture only.
 const service=attemptService(student);
 await assert.rejects(()=>service.start(assignments[0],randomUUID()),{code:'denied'});
 for(const who of [student,outsider])await who.call('consent_v2',{p_version:'assess-pilot-2026-10-20-v2'});
 await assert.rejects(()=>attemptService(outsider).start(assignments[0],randomUUID()),{code:'denied'});
 await assert.rejects(()=>query("insert into assess.sessions(assignment_id,user_id,ordinal,started_at,deadline) values($1,$2,1,now(),now()+interval '1 minute')",[assignments[0],id(3)]),{code:'42501'});
 checks.push('two-explicit-mixed-versions','no-target-expansion','consent-and-unassigned-start-denied','sql-start-guard');

 if(clientA){
  phase='worker-locks-versus-writers';
  await clientA.query('begin');await clientA.query('select assess.trial_enter_v1($1)',[trial]);
  await clientB.query('begin');await clientB.query("set local lock_timeout='150ms'");
  await assert.rejects(()=>clientB.query("insert into assess.groups(owner_id,name) values($1,'Synthetic')",[id(4)]),{code:'55P03'});
  await clientB.query('rollback');await clientA.query('rollback');
  await assert.rejects(()=>clientB.query("insert into assess.groups(owner_id,name) values($1,'Synthetic')",[id(4)]),{code:'42501'});
  checks.push('real-table-lock-blocks-uncooperative-writer','writer-rejected-after-lock-release');
 }
 phase='visible-and-hidden-cycle';
 const visible=(await service.start(assignments[0],randomUUID())).attemptId;
 await service.command(command(visible,0,{type:'save',item:{id:'q1',version:'1'},answer:{type:'single-choice',optionId:'a'}}));
 await service.command(command(visible,1,{type:'save',item:{id:'q2',version:'1'},answer:{type:'single-choice',optionId:'b'}}));
 await service.command(command(visible,2,{type:'submit'}));
 let r=await job();assert.equal(r.outcome,'COMPLETE');assert.equal(r.counts.graded,1);assert.equal(r.counts.failed,0);
 assert.equal((await query('select earned_n/earned_d as n from assess.results where session_id=$1',[visible]))[0].n,'5.0000000000000000');
 const hidden=(await service.start(assignments[1],randomUUID())).attemptId;
 await service.command(command(hidden,0,{type:'save',item:{id:'q1',version:'1'},answer:{type:'single-choice',optionId:'a'}}));
 await query("update assess.sessions set deadline=clock_timestamp()-interval '1 second' where id=$1",[hidden]);
 r=await job();assert.equal(r.outcome,'COMPLETE');assert.equal(r.counts.expired,1);assert.equal(r.counts.graded,1);
 assert.deepEqual((await service.result(hidden)).grade,{visibility:'hidden'});
 assert.equal((await query("select count(*)::int n from assess.sessions where expires_at is distinct from (((submitted_at at time zone 'UTC')+interval '6 months') at time zone 'UTC')"))[0].n,0);
 assert.equal((await query('select count(*)::int n from assess.session_details'))[0].n,0);
 assert.equal((await query('select count(*)::int n from assess.receipts'))[0].n,0);
 checks.push('scoped-known-grade','scoped-hidden-expiry','atomic-detail-erasure');

 phase='foreign-eligibility-and-metadata';
 // Explicit fault injection ONLY in this synthetic DB; no live instructions.
 await exec('alter table assess.account_stops disable trigger assess_trial_write_guard');
 await query('insert into assess.account_stops(user_id) values($1)',[id(4)]);
 await exec('alter table assess.account_stops enable trigger assess_trial_write_guard');
 const before=await query('select * from assess.consents order by user_id,version');
 for(const rpc of ['maintain_v1','claim_v1','health_v1'])await assert.rejects(()=>scoped.call(rpc,rpc==='maintain_v1'?{p_limit:1}:{}),{code:'42501'});
 r=await job();assert.equal(r.outcome,'STOP');assert.equal(r.code,'unavailable');assert.equal(r.counts,undefined);
 assert.deepEqual(await query('select * from assess.consents order by user_id,version'),before);
 await exec('alter table assess.account_stops disable trigger assess_trial_write_guard');await query('delete from assess.account_stops where user_id=$1',[id(4)]);await exec('alter table assess.account_stops enable trigger assess_trial_write_guard');
 // A foreign queue/session is rejected before expiry, void, failed or purge effects.
 const prior=(await query('select * from assess.sessions where id=$1',[hidden]))[0];
 for(const [state,age,expired] of [['active',null,false],['grading','1 hour',false],['grading','25 hours',false],['grading-failed','8 days',false],['graded',null,true]]){
  await exec('alter table assess.sessions disable trigger assess_trial_write_guard');
  await query("update assess.sessions set user_id=$1,state=$3,deadline=clock_timestamp()-interval '1 second',submitted_at=case when $4::text is null then null else clock_timestamp()-$4::interval end,expires_at=case when $5 then clock_timestamp()-interval '1 second' else null end where id=$2",[id(5),hidden,state,age,expired]);
  await exec('alter table assess.sessions enable trigger assess_trial_write_guard');
  const sessions=await query('select * from assess.sessions order by id');
  for(const rpc of ['maintain_v1','claim_v1','health_v1'])await assert.rejects(()=>scoped.call(rpc,rpc==='maintain_v1'?{p_limit:1}:{}),{code:'42501'});
  assert.deepEqual(await query('select * from assess.sessions order by id'),sessions);
 }
 await exec('alter table assess.sessions disable trigger assess_trial_write_guard');
 await query('update assess.sessions set user_id=$1,state=$3,deadline=$4,submitted_at=$5,expires_at=$6 where id=$2',[id(2),hidden,prior.state,prior.deadline,prior.submitted_at,prior.expires_at]);
 await exec('alter table assess.sessions enable trigger assess_trial_write_guard');
 // Ceiling precedes scope inspection, and no partial counts are substituted.
 await exec('alter table assess.groups disable trigger assess_trial_write_guard');
 await query("insert into assess.groups(owner_id,name) select $1,'Synthetic' from generate_series(1,101)",[id(4)]);
 await exec('alter table assess.groups enable trigger assess_trial_write_guard');
 await assert.rejects(()=>scoped.call('health_v1',{}),{code:'54000'});
 await exec('alter table assess.groups disable trigger assess_trial_write_guard;delete from assess.groups;alter table assess.groups enable trigger assess_trial_write_guard');
 await assert.rejects(()=>scopedTrialWorker(id(91),{...worker,async close(){}}).call('health_v1',{}),{code:'55000'});
 checks.push('all-worker-phases-reject-foreign-data','metadata-due-outside-trial-preserved','foreign-session-not-mutated','ceiling-fails-without-counts','scope-id-required');

 phase='retention-phases-and-close';
 for(const assignment of assignments)await retentionService(owner).close(assignment);
 await query("update assess.sessions set expires_at=clock_timestamp()-interval '1 second' where id=$1",[visible]);
 const purged=await scoped.call('maintain_v1',{p_limit:1});assert.equal(purged.purged,1);assert.equal(purged.reservationsPurged,1);
 // Exercise the original 24h and seven-day rules on a second synthetic snapshot.
 await query('insert into assess.session_details(session_id,publication,specs) values($1,$2,$3)',[hidden,fixture('hidden'),{q1:{},q2:{}}]);
 await query("update assess.sessions set state='grading',submitted_at=clock_timestamp()-interval '25 hours',expires_at=null,lease=null,lease_until=null where id=$1",[hidden]);
 await scoped.call('maintain_v1',{p_limit:1});assert.equal((await scoped.call('health_v1',{})).failed,1);
 await assert.rejects(()=>exec('update assess.trial_scope set active=false'),{code:'55000'}); // gate still open
 await exec('update assess.launch_gate set enabled=false');
 await assert.rejects(()=>exec('update assess.trial_scope set active=false'),{code:'55000'}); // settlement pending
 await query("update assess.sessions set submitted_at=clock_timestamp()-interval '8 days' where id=$1",[hidden]);
 assert.equal((await scoped.call('maintain_v1',{p_limit:1})).purged,1);
 for(const row of consents)assert.deepEqual((await query('select * from assess.consents where user_id=$1 and version=$2',[row.user_id,row.version]))[0],row);
 await exec('update assess.trial_scope set active=false');
 await assert.rejects(()=>scoped.call('health_v1',{}),{code:'55000'});
 await assert.rejects(()=>exec('truncate assess.trial_scope'),{code:'42501'});
 await exec('delete from assess.trial_scope'); // Inactive control metadata only; never domain data.
 assert.equal((await query('select count(*)::int n from assess.trial_scope'))[0].n,0);
 const after=await query("select oid::regprocedure::text id,pg_get_functiondef(oid) body,proacl::text acl from pg_proc where pronamespace in ('public'::regnamespace,'assess'::regnamespace) and proname not like 'trial_%' order by 1");
 assert.deepEqual(after,original);
 for(const t of ['attempts','events','feedback'])assert.equal((await query(`select count(*)::int n from public.${t}`))[0].n,0);
 checks.push('scoped-calendar-retention-unchanged','void-failed-purge-and-reservations','close-before-disarm','pending-settlement-blocks-disarm','inactive-control-metadata-removable','original-functions-and-practice-unchanged');
 phase='complete';outcome='PASS';
} catch { /* report only phase, never private snapshots or raw SQL/provider errors */ }
finally {
 const ended=await Promise.allSettled(clients.map(c=>c.end()));if(ended.some(r=>r.status==='rejected'))cleanup=false;
 try{if(db)await db.close();}catch{cleanup=false;}
 if(!cleanup){outcome='STOP';phase='cleanup_failed';}
}
console.log(JSON.stringify({contract:'assess-trial-isolation/1',backend:backend==='postgres'?'postgres-parallel':backend==='pglite'?'pglite-serialized':'invalid',outcome,code:phase,checks,cleanup,runtimeOrLaunchVerified:false}));
if(outcome!=='PASS')process.exitCode=1;
