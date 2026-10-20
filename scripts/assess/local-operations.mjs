// Finite synthetic exercise, not a daemon, provider adapter, HTTP endpoint or deployment command.
import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { openLocalDatabase } from './local-database.mjs';
import { attemptService, runAssessJobs } from '../../src/features/assess/server-service.ts';
import { installMixedContent } from '../../src/features/assess/server-presentation.ts';

const contract='assess-local-operations/1',runId=randomUUID(),stop=new AbortController();
let phase='configuration',db,cleanup=true,outcome='STOP',ticks=0,backend;
const checks=[];
const onStop=()=>stop.abort();
// Drain both branches on error before finally closes the disposable database.
async function parallel(calls) {
  const settled=await Promise.allSettled(calls),failure=settled.find(r=>r.status==='rejected');
  if(failure)throw failure.reason;
  return settled.map(r=>r.value);
}
process.on('SIGINT',onStop);process.on('SIGTERM',onStop);
try {
  const args=process.argv.slice(2);
  assert.equal(args.length,2);
  assert(args.includes('--synthetic-disposable'));
  backend=args.find(a=>a.startsWith('--backend='))?.slice(10);
  assert(['pglite','postgres'].includes(backend));
  phase='setup';db=await openLocalDatabase(backend);
  const {query,exec,port}=db;
  const ensureRunning=()=>{if(stop.signal.aborted)throw new Error('stopped');};
  ensureRunning();
  const uid=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
  for(const n of [1,2])await query('insert into auth.users values($1,$2,now(),$3)',[uid(n),`synthetic${n}@example.test`,JSON.stringify({display_name:'Synthetic fixture'})]);
  await exec(`update public.profiles set status='approved';update public.profiles set role='owner' where user_id='${uid(1)}';`);
  const owner=port('authenticated',uid(1)),student=port('authenticated',uid(2));
  const worker=port('assess_worker'),worker2=port('assess_worker'),service=attemptService(student);
  const tick=async(w=worker)=>{
    ensureRunning();assert(++ticks<=24); // Fixed, versioned local ceiling. No periodic scheduler.
    return runAssessJobs(w,1,stop.signal);
  };
  const count=async(table,session)=>(await query(`select count(*)::int n from assess.${table} where session_id=$1`,[session]))[0].n;
  const state=async session=>(await query('select state from assess.sessions where id=$1',[session]))[0]?.state;
  const detailsGone=async session=>{assert.equal(await count('session_details',session),0);assert.equal(await count('receipts',session),0);};
  const privateRetained=async session=>{assert.equal(await count('session_details',session),1);assert.equal(await count('results',session),0);};

  phase='authority-and-install';
  // Only letters; no medical content/background, Practice data or externally supplied fixture.
  const item={schemaVersion:1,ref:{id:'q',version:'1'},type:'single-choice',contentLanguage:'en',prompt:'Choose a synthetic letter',options:[{id:'a',text:'A'},{id:'b',text:'B'}]};
  const document={schemaVersion:1,assessment:{schemaVersion:1,ref:{id:uid(10),version:'1'},name:'Synthetic local operations',track:'mixed',maximum:'10',policy:{durationSeconds:3600,maxAttempts:20,gradeVisibility:'hidden'},items:[item]},
    itemMarks:[{item:item.ref,maximum:'10'}],privateItems:[{schemaVersion:1,ref:item.ref,type:'single-choice',correctOptionId:'a',review:{sources:[{reference:'Synthetic alphabet',licenceEvidence:'Own engineering fixture'}],reviewedBy:'Engineering fixture',reviewedAt:'2026-10-20T00:00:00.000Z',scope:'Local non-clinical test only'}}]};
  const version=await owner.call('content_submit_v1',{p_document:document});
  await assert.rejects(()=>installMixedContent(student,version),{code:'42501'});
  await installMixedContent(worker,version);
  const assignment=await owner.call('assign_v1',{p_version:version,p_users:[uid(2)],p_groups:[]});
  for(const user of [owner,student,port('anon')])for(const rpc of ['claim_v1','maintain_v1','recover_v1'])
    await assert.rejects(()=>user.call(rpc,rpc==='maintain_v1'?{p_limit:1}:rpc==='recover_v1'?{p_session:uid(99)}:{}),{code:'42501'});
  await assert.rejects(()=>attemptService(worker).start(assignment,randomUUID()),{code:'denied'});
  assert.equal((await query('select enabled from assess.launch_gate'))[0].enabled,false);
  await assert.rejects(()=>service.start(assignment,randomUUID()),{code:'unavailable'});
  await student.call('consent_v2',{p_version:'assess-pilot-2026-10-20-v2'});
  // This handle can only refer to a cluster created above. No remote target/URL is accepted.
  await exec('update assess.launch_gate set enabled=true');
  checks.push('separate-user-worker-capabilities','existing-content-installer');
  let serial=100;
  const command=(session,revision,action,operation=randomUUID())=>JSON.stringify({schemaVersion:1,attemptId:session,operationId:operation,expectedRevision:revision,action});
  async function submitted() {
    ensureRunning();
    const operation=uid(++serial),a=await service.start(assignment,operation);
    assert.equal((await service.start(assignment,operation)).attemptId,a.attemptId);
    const save=command(a.attemptId,0,{type:'save',item:item.ref,answer:{type:'single-choice',optionId:'a'}});
    const ack=await service.command(save);assert.deepEqual(await service.command(save),ack);
    assert.equal((await service.read(a.attemptId)).ack.revision,1);
    const submit=command(a.attemptId,1,{type:'submit'});
    const [x,y]=await parallel([service.command(submit),service.command(submit)]);assert.deepEqual(x,y);
    return a.attemptId;
  }
  phase='parallel-workers-and-replay';
  const first=await submitted();let finish;
  const recording={async call(name,args){if(name==='finish_v1')finish=args;return worker.call(name,args);}};
  const jobs=await parallel([tick(recording),tick(worker2)]);
  assert.equal(jobs[0].graded+jobs[1].graded,1);
  // Either worker may win; capture the committed token privately if the other won.
  finish??={p_session:first,p_token:(await query('select lease from assess.sessions where id=$1',[first]))[0].lease,p_n:'10',p_d:'1'};
  await worker.call('finish_v1',finish);assert.equal(await count('results',first),1);
  await detailsGone(first);
  assert.deepEqual((await service.result(first)).grade,{visibility:'hidden'});
  assert.equal((await tick()).graded,0);
  checks.push('start-save-submit-replay','two-workers-one-result','finish-replay','atomic-erasure','hidden-result');

  phase='lease-expiry';
  const leased=await submitted(),old=await worker.call('claim_v1',{});
  assert.equal(old.attemptId,leased);assert.equal((await tick(worker2)).graded,0);
  await query("update assess.sessions set lease_until=clock_timestamp()-interval '1 second' where id=$1",[leased]);
  const stale={p_session:leased,p_token:old.token,p_n:'10',p_d:'1'};
  await assert.rejects(()=>worker.call('finish_v1',stale),{code:'40001'});
  assert.equal((await tick(worker2)).graded,1);
  await assert.rejects(()=>worker.call('finish_v1',stale),{code:'40001'});
  assert.equal(await count('results',leased),1);await detailsGone(leased);
  checks.push('active-lease-excludes-worker','expired-lease-reclaimed','stale-token-rejected');

  phase='grading-failure-and-recovery';
  const broken=await submitted();
  // Corrupt only the returned claim in memory; persisted immutable snapshot stays intact.
  const brokenGrader={async call(name,args){const value=await worker.call(name,args);return name==='claim_v1'&&value?{...value,publication:{invalid:true}}:value;}};
  const failure=await tick(brokenGrader);assert.equal(failure.failed,1);assert.equal(failure.graded,0);
  assert.equal(await state(broken),'grading-failed');await privateRetained(broken);
  assert.equal((await tick()).graded,0); // Existing retry_at is respected, no tight retry loop.
  await query("update assess.sessions set submitted_at=clock_timestamp()-interval '25 hours',retry_at=clock_timestamp()+interval '1 day' where id=$1",[broken]);
  assert.equal((await worker.call('health_v1',{})).alert,1);
  await worker.call('recover_v1',{p_session:broken});assert.equal((await tick()).graded,1);await detailsGone(broken);
  checks.push('grading-failure-preserves-snapshot','retry-window-respected','aggregate-alert','explicit-recovery');

  phase='lost-finalize-ack';
  const lost=await submitted();
  const lostAck={async call(name,args){const value=await worker.call(name,args);if(name==='finish_v1')throw new Error('PRIVATE simulated lost acknowledgement');return value;}};
  const uncertain=await tick(lostAck);
  assert.equal(uncertain.graded,0);assert.equal(uncertain.failed,1); // Delivery uncertainty, not proof of rollback.
  assert.equal(await state(lost),'graded');assert.equal(await count('results',lost),1);await detailsGone(lost);
  assert.equal((await tick()).graded,0);assert.equal(await count('results',lost),1);
  checks.push('lost-finish-ack-no-second-result');

  phase='atomic-rollback';
  const atomic=await submitted();
  await exec(`create function assess.ops_reject_delete() returns trigger language plpgsql as $$begin raise exception 'synthetic deletion failure';end$$;
    create trigger ops_reject_delete before delete on assess.session_details for each row execute function assess.ops_reject_delete();`);
  assert.equal((await tick()).failed,1);assert.equal(await state(atomic),'grading-failed');await privateRetained(atomic);
  await exec('drop trigger ops_reject_delete on assess.session_details;drop function assess.ops_reject_delete();');
  await worker.call('recover_v1',{p_session:atomic});assert.equal((await tick()).graded,1);await detailsGone(atomic);
  checks.push('delete-failure-rolls-back-result','atomic-recovery');

  phase='expiry-and-recovery-limit';
  const voided=await submitted();await worker.call('claim_v1',{});
  await query("update assess.sessions set submitted_at=clock_timestamp()-interval '8 days',lease_until=clock_timestamp()-interval '1 second' where id=$1",[voided]);
  await assert.rejects(()=>worker.call('recover_v1',{p_session:voided}),{code:'55000'});
  await tick();assert.equal(await state(voided),undefined);await detailsGone(voided);assert.equal(await count('results',voided),0);
  const active=(await service.start(assignment,uid(++serial))).attemptId;
  await query("update assess.sessions set deadline=clock_timestamp()-interval '1 second' where id=$1",[active]);
  const expired=await tick();assert.equal(expired.maintenance.expired,1);assert.equal(expired.graded,1);await detailsGone(active);
  checks.push('seven-day-void-without-grade','expiry-with-browser-absent');

  phase='purge';
  const reserved=(await query('select used from assess.reservations'))[0].used;
  const due=(await query('select count(*)::int n from assess.results'))[0].n;
  await exec("update assess.sessions set expires_at=clock_timestamp() where state='graded'");
  assert.deepEqual(await student.call('history_page_v1',{}),{rows:[],next:null});
  let purged=0;
  for(let i=0;i<due;i+=2){const pair=await parallel([tick(),tick(worker2)]);purged+=pair[0].maintenance.purged+pair[1].maintenance.purged;}
  assert.equal(purged,due);assert.equal((await tick()).maintenance.purged,0);
  assert.equal((await query('select used from assess.reservations'))[0].used,reserved);
  for(const table of ['results','sessions','session_details','receipts'])assert.equal((await query(`select count(*)::int n from assess.${table}`))[0].n,0);
  for(const table of ['attempts','events','feedback'])assert.equal((await query(`select count(*)::int n from public.${table}`))[0].n,0);
  checks.push('expired-read-blocked','two-purgers-idempotent','reservation-survives','no-practice-or-events');
  ensureRunning();await exec('update assess.launch_gate set enabled=false');
  assert.equal((await query('select enabled from assess.launch_gate'))[0].enabled,false);
  outcome='PASS';phase='complete';
}catch(error) {
  if(error?.code==='cleanup_failed'){cleanup=false;phase='cleanup_failed';}
  else if(stop.signal.aborted)phase='stopped';
}
finally {
  try{if(db)await db.close();}catch{cleanup=false;outcome='STOP';phase='cleanup_failed';}
  process.removeListener('SIGINT',onStop);process.removeListener('SIGTERM',onStop);
}
// Whitelist only: no raw exception, claim, answers, settings, grade, identity or student row.
console.log(JSON.stringify({contract,runId,backend:backend==='postgres'?'postgres-parallel':backend==='pglite'?'pglite-serialized':'invalid',outcome,code:phase,ticks,checks,cleanup,runtimeOrLaunchVerified:false}));
if(outcome!=='PASS')process.exitCode=phase==='stopped'?130:1;
