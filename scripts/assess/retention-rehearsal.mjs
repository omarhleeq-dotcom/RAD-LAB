// Bounded synthetic-only policy witness. Reuses C maintenance, grading and local transports.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {openLocalDatabase} from './local-database.mjs';
import {attemptService,publicationService,retentionService,runAssessJobs} from '../../src/features/assess/server-service.ts';
import {ASSESS_RETENTION_CONSENT_VERSION as version} from '../../src/features/assess/retention-consent.ts';
const checks=[];let db,backend,phase='configuration',outcome='STOP',cleanup=true;
async function parallel(calls){const results=await Promise.allSettled(calls);const bad=results.find(r=>r.status==='rejected');if(bad)throw bad.reason;return results.map(r=>r.value);}
try {
 const args=process.argv.slice(2);assert.equal(args.length,2);assert(args.includes('--synthetic-disposable'));
 backend=args.find(a=>a.startsWith('--backend='))?.slice(10);assert(['pglite','postgres'].includes(backend));
 phase='setup';db=await openLocalDatabase(backend);const {query,exec,port}=db;
 const uid=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
 for(const n of [1,2,3,4])await query('insert into auth.users values($1,$2,now(),$3)',[uid(n),`fixture${n}@example.test`,JSON.stringify({display_name:'Synthetic'})]);
 await exec(`update public.profiles set status='approved';update public.profiles set role='owner' where user_id='${uid(1)}';`);
 const owner=port('authenticated',uid(1)),student=port('authenticated',uid(2)),other=port('authenticated',uid(3)),worker=port('assess_worker');
 const service=attemptService(student),admin=retentionService(owner);
 const profile=await query('select to_jsonb(p) v from public.profiles p order by user_id');
 const practice=await query("select oid::regprocedure::text id,pg_get_functiondef(oid) def,proacl::text acl from pg_proc where pronamespace='public'::regnamespace order by 1");
 const count=async t=>(await query(`select count(*)::int n from assess.${t}`))[0].n;
 const item={schemaVersion:1,ref:{id:'q',version:'1'},type:'single-choice',contentLanguage:'en',prompt:'Synthetic alphabet',options:[{id:'a',text:'A'},{id:'b',text:'B'}]};
 const pub={schemaVersion:1,assessment:{schemaVersion:1,ref:{id:uid(10),version:'1'},name:'Synthetic retention',track:'mixed',maximum:'10',policy:{durationSeconds:3600,maxAttempts:1,gradeVisibility:'hidden'},items:[item]},itemMarks:[{item:item.ref,maximum:'10'}],privateItems:[{schemaVersion:1,ref:item.ref,type:'single-choice',correctOptionId:'a',review:{sources:[{reference:'Synthetic alphabet',licenceEvidence:'Own fixture'}],reviewedBy:'Engineering',reviewedAt:'2026-10-20T00:00:00.000Z',scope:'No clinical evidence'}}]};
 await query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values($1,$2,$1,'1','Synthetic retention','mixed',true)",[uid(10),uid(1)]);
 await publicationService(worker).install(uid(10),pub);
 const assign=()=>owner.call('assign_v1',{p_version:uid(10),p_users:[uid(2),uid(3),uid(4)],p_groups:[]});
 const assignment=await assign();
 assert.equal((await query('select enabled from assess.launch_gate'))[0].enabled,false);
 await query('begin read only');
 try {
  const readiness=readFileSync('supabase/checks/assess-retention-ready.sql','utf8').replace('begin transaction read only;','').replace('rollback;','');
  const ready=(await query(readiness))[0];
  for(const k of ['terminal_column','consent_v2','close_rpc','disable_rpc','stops_private','worker_cannot_consent','launch_gate_closed'])assert.equal(ready[k],true);
  assert.equal(ready.restore_verified,false);assert.equal(ready.runtime_or_launch_verified,false);
 }finally{await query('rollback');}
 checks.push('read-only-retention-catalogue');
 await assert.rejects(()=>service.start(assignment,randomUUID()),{code:'unavailable'});
 await exec('update assess.launch_gate set enabled=true'); // new disposable DB only
 phase='versioned-consent';
 await student.call('consent_v1',{p_version:'assess-pilot-2026-10-20-v1'});
 const old=await query("select accepted_at from assess.consents where version='assess-pilot-2026-10-20-v1'");
 assert.deepEqual(await student.call('consent_v2',{}),{accepted:false});
 await assert.rejects(()=>student.call('consent_v2',{p_version:'assess-pilot-2026-10-20-v1'}),{code:'22023'});
 await assert.rejects(()=>service.start(assignment,randomUUID()),{code:'denied'});
 assert.equal(await count('reservations'),0);
 const accept={p_version:version};assert.deepEqual(await parallel([student.call('consent_v2',accept),student.call('consent_v2',accept)]),[{accepted:true},{accepted:true}]);
 const stamps=await query('select * from assess.consents order by user_id,version');await student.call('consent_v2',accept);assert.deepEqual(await query('select * from assess.consents order by user_id,version'),stamps);
 assert.deepEqual(await query("select accepted_at from assess.consents where version='assess-pilot-2026-10-20-v1'"),old);
 await other.call('consent_v2',accept);
 checks.push('v1-is-not-v2','explicit-v2-replay-and-race','v1-stamp-preserved');
 phase='authority';
 for(const p of [student,other,worker,port('anon')])await assert.rejects(()=>retentionService(p).close(assignment),{code:'denied'});
 await assert.rejects(()=>retentionService(other).disable(uid(2)),{code:'denied'});
 await assert.rejects(()=>retentionService(worker).disable(uid(2)),{code:'denied'});
 for(const p of [owner,student,worker,port('anon')])await assert.rejects(()=>p.call('assignment_terminal_v1',{}),{code:'42501'});
 for(const table of ['consents','account_stops','reservations'])assert.equal((await query("select has_table_privilege('authenticated',$1,'SELECT') or has_table_privilege('assess_worker',$1,'DELETE') v",[`assess.${table}`]))[0].v,false);
 checks.push('authority-and-user-isolation');
 const startOp=randomUUID(),s=(await service.start(assignment,startOp)).attemptId;
 assert.equal((await service.start(assignment,startOp)).attemptId,s);
 await assert.rejects(()=>attemptService(other).read(s),{code:'denied'});
 // A retained in-memory-table snapshot witness, NOT a database backup/restore proof.
 await exec('create temporary table old_assignment as select * from assess.assignments;create temporary table old_consents as select * from assess.consents;create temporary table old_reservations as select * from assess.reservations;create temporary table old_stops as select * from assess.account_stops;');
 phase='close-and-disable';
 const races=await Promise.allSettled([admin.close(assignment),attemptService(other).start(assignment,randomUUID())]);
 assert.equal(races[0].status,'fulfilled');
 // Start either committed before close, or was rejected; after close neither user can start.
 for(const p of [student,other])await assert.rejects(()=>attemptService(p).start(assignment,randomUUID()),{code:'denied'});
 await admin.close(assignment);const closed=(await query('select closed_at,revision from assess.assignments where id=$1',[assignment]))[0];await admin.close(assignment);assert.deepEqual((await query('select closed_at,revision from assess.assignments where id=$1',[assignment]))[0],closed);
 await assert.rejects(()=>query('update assess.assignments set closed_at=null where id=$1',[assignment]),{code:'42501'});
 await assert.rejects(()=>query('delete from assess.assignments where id=$1',[assignment]),{code:'42501'});
 const next=await assign();assert.notEqual(next,assignment);
 const disabled=await parallel([retentionService(student).disable(uid(2)),service.start(next,randomUUID()).catch(e=>{assert.equal(e.code,'denied');return null;})]);assert.equal(disabled.length,2);
 await retentionService(student).disable(uid(2));await assert.rejects(()=>service.start(next,randomUUID()),{code:'denied'});
 await assert.rejects(()=>student.call('consent_v2',accept),{code:'42501'});
 assert.equal((await service.read(s)).ack.state,'active');
 await worker.call('maintain_v1',{p_limit:100});assert((await count('consents'))>=3);assert((await count('reservations'))>=1);
 checks.push('close-start-race','terminal-replay-no-reopen','new-assignment-same-version','disable-start-race','active-resume-after-disable','metadata-retained-before-settlement');
 phase='settlement-failure-recovery';
 const command=(session,operation)=>JSON.stringify({schemaVersion:1,attemptId:session,operationId:operation,expectedRevision:0,action:{type:'submit'}});
 const submit=command(s,randomUUID());await service.command(submit);await service.command(submit);
 const broken={async call(name,args){const v=await worker.call(name,args);return name==='claim_v1'&&v?{...v,publication:{invalid:true}}:v;}};
 const failed=await runAssessJobs(broken,100);assert.equal(failed.graded,0);assert(failed.failed>=1);assert.equal(await count('results'),0);
 assert((await count('session_details'))>=1);await worker.call('recover_v1',{p_session:s});
 await exec("create function assess.reject_details() returns trigger language plpgsql as $$begin raise exception 'synthetic';end$$;create trigger reject_details before delete on assess.session_details for each row execute function assess.reject_details();");
 assert.equal((await runAssessJobs(worker,100)).graded,0);assert.equal(await count('results'),0);
 await exec('drop trigger reject_details on assess.session_details;drop function assess.reject_details();');
 await worker.call('recover_v1',{p_session:s});assert.equal((await runAssessJobs(worker,100)).graded,1);
 assert.deepEqual((await service.result(s)).grade,{visibility:'hidden'});assert.equal(Object.keys(await service.result(s)).length,4);
 await worker.call('maintain_v1',{p_limit:100});assert((await count('consents'))>=3);
 checks.push('grading-failure-no-mark','finalize-delete-rollback','recover-existing-attempt','due-result-readable-after-close-disable');
 // Settle other users' active/pending attempts via C, never cancel or synthesize grades.
 await exec("update assess.sessions set deadline=clock_timestamp()-interval '1 second' where state='active';update assess.sessions set retry_at=clock_timestamp() where state='grading-failed';");
 await parallel([runAssessJobs(worker,100),runAssessJobs(port('assess_worker'),100)]);
 phase='reservation-limit-and-metadata-purge';
 // Other participant still enabled: result purge must not release their open-assignment limit.
 const otherStart=(await attemptService(other).start(next,randomUUID())).attemptId;
 await attemptService(other).command(command(otherStart,randomUUID()));await runAssessJobs(worker,100);
 const used=await query('select assignment_id,user_id,used from assess.reservations order by assignment_id,user_id');
 await exec("update assess.sessions set expires_at=clock_timestamp() where state='graded';");
 // Fault final metadata deletion; ALL earlier session/result deletions must roll back.
 await exec("create function assess.reject_consent() returns trigger language plpgsql as $$begin raise exception 'synthetic';end$$;create trigger reject_consent before delete on assess.consents for each row execute function assess.reject_consent();");
 const before=await count('sessions');await assert.rejects(()=>worker.call('maintain_v1',{p_limit:100}));assert.equal(await count('sessions'),before);assert.deepEqual(await query('select assignment_id,user_id,used from assess.reservations order by assignment_id,user_id'),used);
 await exec('drop trigger reject_consent on assess.consents;drop function assess.reject_consent();');
 const m=await parallel([worker.call('maintain_v1',{p_limit:100}),worker.call('maintain_v1',{p_limit:100})]);assert.equal(m[0].purged+m[1].purged,before);
 await worker.call('maintain_v1',{p_limit:100});
 assert.equal((await query('select count(*)::int n from assess.reservations where assignment_id=$1',[assignment]))[0].n,0);
 assert.equal((await query('select count(*)::int n from assess.consents where user_id=$1',[uid(2)]))[0].n,0);
 assert.equal((await query('select count(*)::int n from assess.consents where user_id=$1',[uid(3)]))[0].n,1);
 await assert.rejects(()=>attemptService(other).start(next,randomUUID()),{code:'limit'});
 await assert.rejects(()=>service.start(assignment,startOp),{code:'denied'});
 assert.equal((await query('select used from assess.reservations where assignment_id=$1 and user_id=$2',[next,uid(3)]))[0].used,1);
 checks.push('metadata-failure-atomic-rollback','two-maintainers-idempotent','closed-reservations-purged','disabled-consents-purged','enabled-consents-retained','open-limit-after-result-purge');
 phase='snapshot-risk-witness';
 assert.equal((await query('select closed_at from old_assignment where id=$1',[assignment]))[0].closed_at,null);
 assert((await query('select count(*)::int n from old_consents where user_id=$1',[uid(2)]))[0].n>0);
 assert.equal((await query('select count(*)::int n from old_reservations'))[0].n,1);
 assert.equal((await query('select count(*)::int n from old_stops'))[0].n,0);assert.equal(await count('account_stops'),1);
 // Purging expired results from such a snapshot would not reconstruct these newer controls.
 checks.push('old-snapshot-lacks-new-close-disable-deletions-restore-unproven');
 assert.deepEqual(await query('select to_jsonb(p) v from public.profiles p order by user_id'),profile);
 assert.deepEqual(await query("select oid::regprocedure::text id,pg_get_functiondef(oid) def,proacl::text acl from pg_proc where pronamespace='public'::regnamespace order by 1"),practice);
 for(const table of ['attempts','events','feedback'])assert.equal((await query(`select count(*)::int n from public.${table}`))[0].n,0);
 await exec('update assess.launch_gate set enabled=false');assert.equal((await query('select enabled from assess.launch_gate'))[0].enabled,false);
 checks.push('public-practice-contracts-identical','gate-reclosed');outcome='PASS';phase='complete';
}catch{/* Codes/counts only, never raw SQL exceptions or private rows. */}
finally{try{if(db)await db.close();}catch{cleanup=false;outcome='STOP';phase='cleanup_failed';}}
console.log(JSON.stringify({contract:'assess-retention-rehearsal/1',backend:backend==='postgres'?'postgres-parallel':backend==='pglite'?'pglite-serialized':'invalid',outcome,code:phase,checks,cleanup,restoreVerified:false,runtimeOrLaunchVerified:false}));
if(outcome!=='PASS')process.exitCode=1;
