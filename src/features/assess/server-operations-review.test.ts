import { spawnSync } from "node:child_process";
import { expect,it } from "vitest";
const run=(source:string)=>spawnSync(process.execPath,["--input-type=module","-e",source],{encoding:"utf8",timeout:40000,maxBuffer:100000});
it("reviews version/closure/leases and rejects stale, incomplete, private or contradictory evidence",()=>{
 const child=run(`
 import assert from 'node:assert/strict';
 import {inspectOperations} from './scripts/assess/operations-review.mjs';
 const now=Date.parse('2026-10-22T00:10:00.000Z'),at=new Date(now).toISOString();
 const image='sha256:'+'a'.repeat(64),source='a'.repeat(40);
 const base={contract:'assess-operations-evidence/1',phase:'closed',observedAt:at,
 job:{name:'projects/synthetic/locations/europe-west3/jobs/trial',taskCount:1,parallelism:1,maxRetries:0,guard:'0',kind:'scoped-trial',scopeBound:true,activeExecutions:0},
 scheduler:{state:'ABSENT',retryCount:null,targetJob:null},
 versions:{reviewedSource:source,uiSource:source,workerSource:source,expectedImage:image,observedImage:image,expectedSecretVersion:'1',observedSecretVersion:'1',sqlMatched:true},
 database:{contract:'assess-operations-health/1',observedAt:at,health:{activeAttempts:0,gradingAttempts:0,failed:0,alert:0,overdue:0,purgeDue:0,claimableNow:0,liveLeases:0,expiredLeases:0,retryWaiting:0},controls:{gateClosed:true,loginDisabled:true,loginExpired:true,backendSessions:0}},execution:null,tick:null};
 const review=e=>inspectOperations(e,{now});
 assert.equal(review(base).outcome,'CLEAR');assert.equal(review(base).liveAcceptanceVerified,false);
 const check=(change,code)=>{const e=structuredClone(base);change(e);const r=review(e);assert(r.findings.some(f=>f.code===code),code);assert.equal(r.runtimeOrLaunchVerified,false);assert(!JSON.stringify(r).includes('PRIVATE'));return r;};
 check(e=>{e.versions.uiSource=null},'version_evidence_missing');
 check(e=>{e.versions.observedImage='sha256:'+'b'.repeat(64)},'version_mismatch');
 check(e=>{e.versions.sqlMatched=false},'version_mismatch');
 check(e=>{e.versions.observedSecretVersion='2'},'version_mismatch');
 check(e=>{e.versions.observedSecretVersion='latest'},'invalid_evidence');
 check(e=>{e.versions.workerSource='b'.repeat(40)},'version_mismatch');
 check(e=>{e.job.kind='general'},'job_configuration_unverified');
 check(e=>{e.job.scopeBound=false},'job_configuration_unverified');
 check(e=>{e.job.maxRetries=3},'job_configuration_unverified');
 check(e=>{e.job.activeExecutions=2},'execution_overlap');
 check(e=>{e.job.activeExecutions=null},'execution_count_unknown');
 check(e=>{e.scheduler.state='ENABLED'},'scheduler_enabled_without_continuous_acceptance');
 check(e=>{e.scheduler={state:'PAUSED',retryCount:1,targetJob:e.job.name}},'scheduler_target_or_retries_unverified');
 check(e=>{e.observedAt='2026-10-22T00:00:00.000Z'},'evidence_stale_or_future');
 check(e=>{e.database.observedAt='2026-10-22T00:11:00.000Z'},'database_evidence_stale_or_future');
 check(e=>{e.database=null},'database_evidence_missing');
 check(e=>{e.database.controls.backendSessions=1},'database_not_closed');
 check(e=>{e.database.controls.loginDisabled=false},'database_not_closed');
 check(e=>{e.database.health.activeAttempts=1},'attempt_settlement_pending');
 check(e=>{e.database.health.expiredLeases=1},'expired_lease_requires_reconciliation');
 check(e=>{e.database.health.failed=1},'grading_requires_reconciliation');
 check(e=>{e.database.health.purgeDue=1},'retention_due');
 check(e=>{e.database.health.claimableNow=1},'queue_waiting');
 check(e=>{e.database.health.failed=101},'invalid_evidence');
 check(e=>{e.password='PRIVATE'},'invalid_evidence');
 const previous=structuredClone(base);previous.observedAt=previous.database.observedAt='2026-10-22T00:09:00.000Z';
 const current=structuredClone(base);previous.database.health.failed=current.database.health.failed=1;
 assert.equal(inspectOperations(current,{now,previous}).notificationRecommended,false);
 current.database.health.overdue=previous.database.health.overdue=1;
 assert(inspectOperations(current,{now,previous}).findings.some(f=>f.code==='overdue_persistent'));
 assert.equal(inspectOperations(current,{now,previous:base}).outcome,'BLOCKED');
 const e=structuredClone(base);e.phase='trial';e.job.guard='1';e.database.controls={gateClosed:false,loginDisabled:false,loginExpired:false,backendSessions:1};
 const name='projects/synthetic/locations/europe-west3/jobs/trial/executions/one';
 e.execution={name,state:'SUCCEEDED',startedAt:'2026-10-22T00:09:00.000Z',completedAt:at};
 e.tick={execution:name,at,report:{contract:'assess-job/1',outcome:'COMPLETE',code:'complete',runtimeOrLaunchVerified:false,counts:{expired:0,purged:0,graded:1,failed:0,healthFailed:0,alert:0,overdue:0,purgeDue:0}}};
 assert.equal(review(e).outcome,'CLEAR');
 e.execution.state='FAILED';assert(review(e).findings.some(f=>f.code==='execution_requires_reconciliation'));
 e.execution.state='SUCCEEDED';e.tick.execution='PRIVATE';assert.equal(review(e).findings[0].code,'invalid_evidence');
 e.tick.execution=name;e.execution.name='projects/synthetic/locations/europe-west3/jobs/other/executions/one';assert.equal(review(e).findings[0].code,'invalid_evidence');e.execution.name=name;
 e.tick.report.counts=null;assert.equal(review(e).findings[0].code,'invalid_evidence');
 e.tick.report={contract:'assess-job/1',outcome:'STOP',code:'unavailable',runtimeOrLaunchVerified:false};
 assert(review(e).findings.some(f=>f.code==='tick_requires_reconciliation'));
 console.log(JSON.stringify({outcome:'PASS'}));`);
 expect(child.status,child.stdout+child.stderr).toBe(0);expect(JSON.parse(child.stdout)).toEqual({outcome:"PASS"});
});
it("runs health SQL read-only on disposable data and fails instead of returning partial counts",()=>{
 const child=run(`
 import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
 import {openLocalDatabase} from './scripts/assess/local-database.mjs';
 const db=await openLocalDatabase('pglite');
 try{
 await db.exec("create role assess_job_a nologin noinherit valid until '2000-01-01';grant assess_worker to assess_job_a");
 const sql=readFileSync('scripts/assess/sql/operations-health.sql','utf8');
 const read=async()=>{await db.exec(sql.slice(0,sql.indexOf('with ts')));try{return (await db.query(sql.slice(sql.indexOf('with ts'),sql.lastIndexOf('rollback;')).replace(/;\\s*$/,'')))[0].observation;}finally{await db.exec('rollback')}};
 const observed=await read();assert.equal(observed.contract,'assess-operations-health/1');assert.equal(observed.controls.gateClosed,true);assert.equal(observed.controls.loginDisabled,true);assert.equal(observed.controls.backendSessions,0);assert(Object.values(observed.health).every(n=>n===0));
 assert(!/answers|publication|earned_|pg_get_functiondef/.test(sql));
 const id=n=>'00000000-0000-0000-0000-'+String(n).padStart(12,'0');
 await db.query('insert into auth.users values($1,$2,now(),$3)',[id(1),'synthetic@example.test',JSON.stringify({display_name:'Synthetic'})]);
 await db.exec("update public.profiles set status='approved'");
 await db.port('authenticated',id(1)).call('consent_v2',{p_version:'assess-pilot-2026-10-20-v2'});
 await db.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track) values($1,$2,$1,'1','Synthetic','mixed')",[id(10),id(1)]);
 await db.query('insert into assess.assignments(id,owner_id,version_id) values($1,$2,$3)',[id(20),id(1),id(10)]);
 await db.query("insert into assess.sessions(assignment_id,user_id,ordinal,state,started_at,deadline,submitted_at,lease_until,retry_at) values($1,$2,1,'grading',now()-interval '2 minutes',now()-interval '1 minute',now()-interval '1 minute',now()-interval '1 second',null)",[id(20),id(1)]);
 const due=await read();assert.equal(due.health.expiredLeases,1);assert.equal(due.health.claimableNow,1);
 await db.query("insert into assess.sessions(assignment_id,user_id,ordinal,state,started_at,deadline) select $1,$2,g,'graded',now(),now()+interval '1 hour' from generate_series(2,101) g",[id(20),id(1)]);
 await assert.rejects(read,{code:'54000'});await db.exec('rollback');
 await db.exec('begin read only');await assert.rejects(()=>db.exec('update assess.launch_gate set enabled=true'),{code:'25006'});await db.exec('rollback');
 assert.equal((await db.query('select enabled from assess.launch_gate'))[0].enabled,false);
 await db.exec('set role authenticated');await assert.rejects(read,{code:'42501'});await db.exec('rollback;reset role');
 }finally{await db.close()}
 console.log(JSON.stringify({outcome:'PASS'}));`);
 expect(child.status,child.stdout+child.stderr).toBe(0);expect(JSON.parse(child.stdout)).toEqual({outcome:"PASS"});
},45000);
it("rejects CLI flags and oversized, secret-bearing or linked input without leaking data",()=>{
 const child=run(`
 import assert from 'node:assert/strict';import {mkdtemp,writeFile,symlink,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
 import {main} from './scripts/assess/review-operations.mjs';
 const dir=await mkdtemp(join(tmpdir(),'radlab-ops-input-'));
 try{const secret=join(dir,'input.json');await writeFile(secret,JSON.stringify({password:'PRIVATE'}));
 const link=join(dir,'link.json');await symlink(secret,link);
 for(const args of [[],['--run',secret],['--evidence',secret],['--evidence',link],['--evidence',secret,'--retry']]){const r=await main(args);assert.equal(r.outcome,'BLOCKED');assert(!JSON.stringify(r).includes('PRIVATE'))}
 await writeFile(secret,'x'.repeat(65537));assert.equal((await main(['--evidence',secret])).outcome,'BLOCKED');
 }finally{await rm(dir,{recursive:true,force:true})}
 console.log(JSON.stringify({outcome:'PASS'}));`);
 expect(child.status,child.stdout+child.stderr).toBe(0);expect(JSON.parse(child.stdout)).toEqual({outcome:"PASS"});
});
