// Additive S4 image proof, called AFTER all unchanged W4 v1 assertions. Same isolated
// pinned production catalogue/TLS/SCRAM identity. Fake metadata/GCS, never a cloud call.
import assert from 'node:assert/strict';
import { execFileSync,spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';
const read=p=>readFileSync(p,'utf8');
const sha=b=>createHash('sha256').update(b).digest('hex');
const dockerEnv={...process.env};for(const key of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'])delete dockerEnv[key];
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
export async function scheduledRehearsal(c) {
 const {docker,su,owner,config,inputs,worker,network,dir,owned,secretsVolume,prefix}=c;
 const images=[],contexts=[],checks=[];let caWrites=0;
 const mock=prefix+'-witness',ref=config.host.split('.')[1];
 const secretWrite=source=>{
  const name=prefix+'-ca-'+(++caWrites);owned.add(name);
  docker(['run','-i','--name',name,'--network=none','--read-only','--user=1000:1000','--cap-drop=ALL',
   '--mount',`type=volume,src=${secretsVolume},dst=/s`,'--entrypoint=node',images[0],'-e',
   "let s='';process.stdin.on('data',b=>s+=b);process.stdin.on('end',()=>require('fs').writeFileSync('/s/storage-ca.pem',s,{mode:0o600}));"],source);
 };
 try {
  // Required original v1 image finishes its last pending work before migration/switch.
  assert.equal((await worker()).report.counts.graded,1);
  owner('alter role assess_job_b nologin;');
  assert.equal(su("select count(*) from pg_stat_activity where usename in ('assess_job_a','assess_job_b')"),'0');
  // W4 provisions W1 on the historical catalogue. Rehearse the original migration
  // order with the slot closed: M09 precedes W1. Never relax its frozen ACL oracle.
  owner('revoke execute on function assess.maintain_v1(integer),assess.claim_v1(),assess.finish_v1(uuid,uuid,text,text),assess.fail_v1(uuid,uuid),assess.health_v1() from assess_grading_worker;');
  // The original W4 catalogue intentionally contains no application singleton data
  // beyond launch_gate. Seed the same reviewed baseline inserts as the independent
  // production-calibration test; do not weaken any migration precondition.
  for(const[file,table]of [['20261026000100_assess_supervisor_scope.sql','scope_lock'],
   ['20261027000100_assess_management_erasure.sql','erasure_fk_contract'],['20261026000100_assess_supervisor_scope.sql','sharing_policy']]){
   const statements=[...read('supabase/migrations/'+file).matchAll(new RegExp(`^insert into assess\\.${table} [^;]+;`,'gm'))];
   assert.equal(statements.length,1);owner(statements[0][0]);
  }
  owner(read('supabase/manual/rad085-sharing-policy-live-p1.sql'));
  // Match the reviewed fixture operator privileges, never worker membership.
  su('grant assess_job_a to postgres with admin option,inherit false,set false;grant pg_signal_backend to postgres;');
  assert.equal(su('select count(*) from assess.erasure_fk_contract where inventory=assess.d3_fk_inventory_v1()'),'1');
  const m=JSON.parse(read('scripts/pages/frontend-schema.json'));
  for(const file of m.requiredMigrations.filter(f=>f>='20261030000100_rad062_full_name.sql')){
   if(file==='20261102000100_rad062_supervisor_grading_authorization.sql')for(const row of owner(read('supabase/checks/rad062-ready.sql')))assert.match(row,/\|t$/,row);
   owner(read('supabase/migrations/'+file));
  }
  owner('grant execute on function assess.maintain_v1(integer),assess.claim_v1(),assess.finish_v1(uuid,uuid,text,text),assess.fail_v1(uuid,uuid),assess.health_v1() to assess_grading_worker;');
  assert.equal(su("select count(*) from pg_proc where pronamespace='assess'::regnamespace and has_function_privilege('assess_grading_worker',oid,'EXECUTE')"),'5');
  for(const n of [1,2,3]){
   const builds=[0,1].map(()=>JSON.parse(execFileSync(process.execPath,['scripts/assess/build-grading-worker.mjs',`--selfservice-r${n}`],{encoding:'utf8'})));
   contexts.push(...builds.map(b=>b.output));
   assert.equal(read(join(builds[0].output,'manifest.json')),read(join(builds[1].output,'manifest.json')));
   assert.ok(Object.keys(JSON.parse(read(join(builds[0].output,'manifest.json'))).sources).every(p=>!p.includes('cloud-backup')));
   const image=prefix+`-s4-r${n}:local`;images.push(image);docker(['build','--network=none','-t',image,builds[0].output]);
   const info=JSON.parse(docker(['image','inspect',image]))[0];assert.equal(info.Config.User,'node');
   assert.deepEqual(info.Config.Entrypoint,['node','/app/grading-worker-main.mjs']);
  }
  checks.push('three-reproducible-production-contexts-nonroot-original-dockerfile');
  owner("set radlab.worker_switch_authorized='apply-reviewed-v2';"+read('supabase/manual/selfservice-worker-v2-switch.sql'));
  for(const row of owner(read('supabase/checks/selfservice-s4-worker-ready.sql')))assert.match(row,/\|t$/);
  // Original v1 entry/binding refuses the new ACL rather than silently retaining both sets.
  su('alter role assess_job_b login;');
  assert.equal((await worker()).report.outcome,'STOP');
  // TLS witness fixture: same production URLs, HTTP metadata token and generation CAS.
  c.command('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-subj','/CN=storage.googleapis.com',
   '-addext','subjectAltName=DNS:storage.googleapis.com','-keyout',join(dir,'storage.key'),'-out',join(dir,'storage.crt')]);
  // A private named volume handles GitHub's uid1001 vs the production uid1000.
  // The fake TLS private key is mounted only in the witness fixture, never the worker.
  const mockVolume=prefix+'-mock-tls',init=prefix+'-mock-init';
  docker(['volume','create',mockVolume]);owned.add('volume:'+mockVolume);owned.add(init);
  docker(['run','-i','--name',init,'--network=none','--read-only','--user=0:0','--cap-drop=ALL','--cap-add=CHOWN',
   '--mount',`type=volume,src=${mockVolume},dst=/fixture`,'--entrypoint=node',images[0],'-e',
   "const fs=require('fs');let s='';process.stdin.on('data',b=>s+=b);process.stdin.on('end',()=>{const x=JSON.parse(s);fs.chmodSync('/fixture',0o700);for(const[k,v]of Object.entries(x)){fs.writeFileSync('/fixture/'+k,v,{mode:0o600});fs.chownSync('/fixture/'+k,1000,1000);}fs.chownSync('/fixture',1000,1000);});"],
   JSON.stringify({'storage.key':read(join(dir,'storage.key')),'storage.crt':read(join(dir,'storage.crt'))}));
  const source=`const http=require('http'),https=require('https'),fs=require('fs');let value=null,generation=0;
   const tls={key:fs.readFileSync('/fixture/storage.key'),cert:fs.readFileSync('/fixture/storage.crt')};const serve=(q,r)=>{let body='';q.on('data',b=>body+=b);q.on('end',()=>{
    if(q.url==='/fixture-state'){if(q.method==='POST'){const x=JSON.parse(body);value=x;generation++;}r.end(JSON.stringify(value));return;}
    if(q.url==='/computeMetadata/v1/instance/service-accounts/default/token'){if(q.headers['metadata-flavor']!=='Google'){r.writeHead(403);r.end();return;}r.end(JSON.stringify({access_token:'SYNTHETIC_TOKEN'}));return;}
    if(q.headers.authorization!=='Bearer SYNTHETIC_TOKEN'){r.writeHead(403);r.end();return;}
    if(q.method==='GET'){if(value===null){r.writeHead(404);r.end();}else{r.setHeader('x-goog-generation',String(generation));r.end(JSON.stringify(value));}return;}
    const u=new URL(q.url,'https://storage.googleapis.com');if(u.searchParams.get('ifGenerationMatch')!==String(generation)){r.writeHead(412);r.end();return;}
    value=JSON.parse(body);generation++;r.end('{}');});};http.createServer(serve).listen(80);https.createServer(tls,serve).listen(443);`;
  owned.add(mock);
  const child=docker(['run','-d','--name',mock,'--network',network,
   '--network-alias','metadata.google.internal','--network-alias','storage.googleapis.com','--read-only','--cap-drop=ALL','--cap-add=NET_BIND_SERVICE',
   '--security-opt=no-new-privileges','--mount',`type=volume,src=${mockVolume},dst=/fixture,readonly`,'--entrypoint=node',images[0],'-e',source]);
  assert.ok(child.trim());
  for(let n=0;;n++){try{docker(['exec',mock,'node','-e',"fetch('http://127.0.0.1/fixture-state').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1));"]);break;}catch{if(n>=100)throw Error('mock_not_ready');await new Promise(r=>setTimeout(r,25));}}
  const control=value=>docker(['exec','-i',mock,'node','-e',
   "let s='';process.stdin.on('data',b=>s+=b);process.stdin.on('end',async()=>{const r=await fetch('http://127.0.0.1/fixture-state',{method:'POST',body:s});if(!r.ok)process.exit(1);});"],JSON.stringify(value));
  const trustEnv=['--env','NODE_EXTRA_CA_CERTS=/run/secrets/storage-ca.pem'];
  const env=[...trustEnv,'--env','ASSESS_PLAN_LIMIT_BYTES=1'];
  const setInputs=n=>{
   const manifest=JSON.parse(read(join(contexts[(n-1)*2],'manifest.json'))),now=Date.now();
   inputs({config:JSON.stringify(config),...(n===3?{}:{recovery:JSON.stringify({contract:'assess-recovery-attestation/1',projectRef:ref,
    manifestSha256:sha(readFileSync(join(contexts[(n-1)*2],'manifest.json'))),baselineAt:new Date(now-3600000).toISOString(),issuedAt:new Date(now-60000).toISOString(),expiresAt:new Date(now+3600000).toISOString(),restoresSinceBaseline:0})})});
   secretWrite(read(join(dir,'storage.crt')));
   assert.equal(manifest.selfservice,`selfservice-r${n}`);
  };
  setInputs(2);
  let r=await worker(env,images[1]);assert.equal(r.report.witness.result,'witness-missing');assert.equal(r.report.outcome,'STOP');
  setInputs(1);r=await worker(env,images[0]);assert.equal(r.report.outcome,'COMPLETE',JSON.stringify(r.report));assert.equal(r.report.witness.result,'init');
  setInputs(2);r=await worker(env,images[1]);assert.equal(r.report.witness.result,'advance');assert.equal(r.report.outcome,'COMPLETE');
  checks.push('r1-shadow-creates-r2-missing-refuses-enforcing-advance');
  // Build the existing three engineering fixtures into v2 publications; no medical assertions.
  const corpus=join(dir,'s4-corpus.cjs');
  await build({stdin:{resolveDir:process.cwd(),sourcefile:'s4-corpus.ts',contents:`
   import {mixedFixture} from './scripts/assess/d-fixture';import {practicalFixture} from './scripts/assess/e-fixture';
   import {validatePublicationV2,settingsSpec,leafValues} from './src/features/assess/server-validation';
   import {gradePublicationV2} from './src/features/assess/server-grader-v2';import {CASES} from './src/data/cases';
   export function publications(){return ['questions','mixed','full-practical'].map((track,n)=>{
    const b=track==='full-practical'?practicalFixture():mixedFixture();if(track==='questions'){b.assessment.items=b.assessment.items.filter(i=>i.type==='single-choice');b.privateItems=b.privateItems.filter(i=>i.type==='single-choice');b.itemMarks=b.itemMarks.filter(m=>b.assessment.items.some(i=>i.ref.id===m.item.id));}
    b.assessment.maximum=b.itemMarks.reduce((a,m)=>a+Number(m.maximum),0).toString();
    const p=validatePublicationV2({...b,schemaVersion:2,assessment:{...b.assessment,schemaVersion:2,ref:{id:'00000000-0000-0000-0000-'+String(1000+n).padStart(12,'0'),version:'1'},items:b.assessment.items.map(i=>({...i,schemaVersion:2}))},privateItems:b.privateItems.map(k=>{const{review,...key}=k;return {...key,schemaVersion:2,provenance:k.type==='single-choice'?{kind:'uploader-authored',reviewStatus:'no-medical-review',sources:review.sources,licenceNotes:'Synthetic only',authorDisplayName:null}:{kind:'simulator-reviewed',review}};})}).publication;
    const specs=Object.fromEntries(p.privateItems.map(k=>{if(k.type==='single-choice')return[k.ref.id,{}];const c=CASES.find(c=>c.id===k.caseRef.id);return[k.ref.id,k.type==='full-practical'?settingsSpec(c):Object.fromEntries(k.mutablePaths.map(q=>[q,settingsSpec(c)[q]]))];}));
    return {track,p,specs};});}`},outfile:corpus,bundle:true,platform:'node',format:'cjs',logLevel:'silent'});
  const fixtures=createRequire(import.meta.url)(corpus).publications();
  su(`update public.profiles set display_name='SYNTHETIC Account Name',consent_version='2026-10-15',consented_at=clock_timestamp();
   insert into assess.consents(user_id,version) values('${id(2)}','assess-written-2026-11-02-v3') on conflict do nothing;`);
  const lit=x=>"'"+JSON.stringify(x).replaceAll("'","''")+"'::jsonb";
  for(const[n,{track,p,specs}]of fixtures.entries()){
   const v=id(1000+n),a=id(1100+n);
   su(`insert into assess.versions(id,owner_id,assessment_id,version,name,track,schema_version,available) values('${v}','${id(1)}','${v}','1','SYNTHETIC','${p.assessment.track}',2,true);
    insert into assess.publications(version_id,document,specs) values('${v}',${lit(p)},${lit(specs)});
    insert into assess.assignments(id,owner_id,version_id,audience) values('${a}','${id(1)}','${v}','all-students');
    insert into assess.all_students_assignments values('${a}');insert into assess.targets values('${a}','${id(2)}');
    insert into assess.assignment_windows(assignment_id,opens_at,closes_at) values('${a}',clock_timestamp()-interval '1 minute',clock_timestamp()+interval '1 hour');`);
   assert.ok(track);
  }
  let op=2000;
  const submit=n=>{
   const s=JSON.parse(su(`begin;set local role authenticated;select set_config('request.jwt.claim.sub','${id(2)}',true);
    select assess.start_v2('${id(1100+n)}','${id(++op)}');commit;`).split('\n').filter(x=>x.startsWith('{')).at(-1));
   su(`begin;set local role authenticated;select set_config('request.jwt.claim.sub','${id(2)}',true);
    select assess.command_v2('${s.attemptId}','${id(++op)}',${s.ack.revision},'{"type":"submit"}');commit;`);
   return s.attemptId;
  };
  su('update assess.launch_gate set enabled=true;');
  const sessions=[0,1,2].map(submit);
  setInputs(3);r=await worker(env,images[2],false);assert.equal(r.report.outcome,'COMPLETE',JSON.stringify(r.report));assert.equal(r.report.counts.graded,3);
  assert.equal(r.report.witness.result,'advance');assert.equal(r.report.health.v1.failed,0);assert.equal(r.report.health.v2.failed,0);
  for(const s of sessions){assert.equal(su(`select state from assess.sessions where id='${s}'`),'graded');assert.equal(su(`select count(*) from assess.results where session_id='${s}'`),'1');assert.equal(su(`select earned_n::text||'/'||earned_d::text from assess.results where session_id='${s}'`).replace(/\.0+(?=\/|$)/g,''),'0/1');assert.equal(su(`select count(*) from assess.session_details where session_id='${s}'`),'0');}
  checks.push('r3-no-attestation-three-start-v2-submit-tracks-grade-on-restricted-image');
  assert.equal(r.report.databaseSize.state,'MEASURED');assert.ok(Number.isSafeInteger(r.report.databaseSize.databaseBytes)&&r.report.databaseSize.databaseBytes>0);
  assert.equal(r.report.databaseSize.planLimitBytes,1);assert.equal(r.report.databaseSize.databaseSizeAlert70,true);
  for(const values of [trustEnv,[...trustEnv,'--env','ASSESS_PLAN_LIMIT_BYTES=NaN']]){
   const missing=await worker(values,images[2],false);assert.equal(missing.report.outcome,'COMPLETE');assert.equal(missing.report.counts.graded,0);
   assert.deepEqual(missing.report.databaseSize,{state:'UNKNOWN',reason:'plan_limit_unknown'});
  }
  assert.equal(su("select count(*) from pg_roles where rolname='assess_backup'"),'0');
  assert.equal(su("select count(*) from pg_proc where pronamespace='assess'::regnamespace and has_function_privilege('assess_grading_worker',oid,'EXECUTE')"),'5');
  checks.push('worker-size-measured-after-guarded-commit-no-backup-role-unknown-configuration-never-healthy');
  // Privilege drift and revocation stop before maintenance/claim; pending work survives.
  const pending=submit(0);
  for(const grant of ['grant execute on function assess.health_v1() to assess_grading_worker','grant select on assess.sessions to assess_grading_worker','grant execute on function assess.worker_health_v2() to assess_grading_worker with grant option','grant assess_worker to assess_grading_worker with admin false,inherit false,set true']){
   su(grant);r=await worker(env,images[2],false);assert.equal(r.report.outcome,'STOP');
   su(grant.startsWith('grant assess_worker')?'revoke assess_worker from assess_grading_worker':grant.includes('with grant option')?'revoke grant option for execute on function assess.worker_health_v2() from assess_grading_worker':grant.startsWith('grant execute')?'revoke execute on function assess.health_v1() from assess_grading_worker':'revoke select on assess.sessions from assess_grading_worker');
   assert.equal(su(`select state from assess.sessions where id='${pending}'`),'grading');
  }
  su('alter role assess_job_b nologin;');r=await worker(env,images[2],false);assert.equal(r.report.outcome,'STOP');su('alter role assess_job_b login;');
  const row=JSON.parse(su(`select jsonb_build_object('projectRef','${ref}','epoch',epoch,'seq',seq+100,'updatedAt',clock_timestamp()) from assess.restore_epoch`));
  control(row);r=await worker(env,images[2],false);assert.equal(r.report.witness.result,'restore-suspected');assert.equal(su(`select state from assess.sessions where id='${pending}'`),'grading');
  control({...row,seq:0});
  checks.push('acl-function-and-table-drift-nologin-stale-witness-no-claim');
  // Actual five-operation binding under the intended image tests stale lease + finish replay.
  const direct=prefix+'-direct';owned.add(direct);
  const code=`const expired=false;let sawFinish=false;const f=require('/app/worker.cjs'),fs=require('fs'),c=JSON.parse(fs.readFileSync('/run/secrets/assess-worker.json'));
   const project=c.host.split('.')[1];const store=f.gcsWitnessStore(project+'-assess-witness','witness.json',async()=>{
    const r=await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',{headers:{'Metadata-Flavor':'Google'}});if(!r.ok)throw Error();return(await r.json()).access_token;},fetch);
   (async()=>{const result=await f.executeGradingWorker(async()=>c,new AbortController().signal,async()=>{},config=>{
    const w=f.createScheduledWorkerBindingV2(config);return{close:()=>w.close(),call:async(name,args)=>{
     if(expired&&name==='finish_v2'){sawFinish=true;process.stdout.write('READY\\n');await new Promise(r=>process.stdin.once('data',r));}
     const value=await w.call(name,args);if(name==='finish_v2'){
      await w.call(name,args);const other=f.createScheduledWorkerBindingV2(config);let denied=false;
      try{await other.call(name,{...args,p_token:'00000000-0000-0000-0000-000000000000'});}catch{denied=true;}finally{await other.close();}
      if(!denied)throw Error();}return value;}};},undefined,{batch:expired?1:20,budgetMs:240000,witness:{mode:'enforcing',projectRef:project,store}});
    if(result.witness.result!=='advance'||(expired?(!sawFinish||result.outcome!=='STOP'||result.code!=='grading_uncertain'||result.counts.failed!==1):(result.outcome!=='COMPLETE'||result.counts.graded!==1)))throw Error();process.stdout.write('PASS');})().catch(()=>process.exitCode=1);`;
  assert.equal(docker(['run','--name',direct,'--network',network,'--read-only','--cap-drop=ALL',
   '--mount',`type=volume,src=${secretsVolume},dst=/run/secrets,readonly`,...env,'--entrypoint=node',images[2],'-e',code]),'PASS');
  assert.equal(su(`select count(*) from assess.results where session_id='${pending}'`),'1');
  const expiredSession=submit(2),expiryName=prefix+'-expired-lease';owned.add(expiryName);
  await new Promise((resolve,reject)=>{
   const child=spawn('docker',['--host=unix:///var/run/docker.sock','run','-i','--name',expiryName,'--network',network,'--read-only','--cap-drop=ALL',
    '--mount',`type=volume,src=${secretsVolume},dst=/run/secrets,readonly`,...env,'--entrypoint=node',images[2],'-e',code.replace('const expired=false','const expired=true')],{env:dockerEnv,stdio:['pipe','pipe','pipe']});
   let stdout='',stderr='',released=false;
   const timer=setTimeout(()=>{child.kill();reject(Error('lease_fixture_deadline'));},30000);
   child.once('error',error=>{clearTimeout(timer);reject(error);});child.stderr.on('data',b=>stderr+=b);
   child.stdout.on('data',b=>{stdout+=b;if(!released&&stdout.includes('READY\n')){released=true;
    try{assert.equal(su(`select count(*) from assess.sessions where id='${expiredSession}' and lease is not null and lease_until>clock_timestamp()`),'1');
     su(`update assess.sessions set lease_until=clock_timestamp()-interval '1 second' where id='${expiredSession}'`);child.stdin.end('continue\n');
    }catch(error){clearTimeout(timer);child.kill();reject(error);}}});
   child.once('exit',status=>{clearTimeout(timer);try{assert.equal(status,0);assert.equal(stderr,'');assert.equal(stdout,'READY\nPASS');resolve();}catch(error){reject(error);}});
  });
  assert.equal(su(`select count(*) from assess.results where session_id='${expiredSession}'`),'0');
  assert.equal(su(`select count(*) from assess.session_details where session_id='${expiredSession}'`),'1');
  checks.push('real-expired-lease-refused-through-enforcing-image-host-no-replay');
  const signalSession=submit(1);
  const holder=spawn('docker',['--host=unix:///var/run/docker.sock','exec','-i',c.db,'psql','-X','-q','-v','ON_ERROR_STOP=1','-U','supabase_admin','-d','postgres'],{env:dockerEnv,stdio:['pipe','pipe','pipe']});
  holder.stdin.write('begin;lock table assess.sessions in share mode;select 1;\n');
  try{
   for(let n=0;su("select count(*) from pg_locks where relation='assess.sessions'::regclass and mode='ShareLock' and granted")!=='1';n++){if(n>100)throw Error('signal_lock_missing');await new Promise(r=>setTimeout(r,25));}
   const before=new Set(owned),running=worker(env,images[2],false);
   for(let n=0;su("select count(*) from pg_stat_activity where usename='assess_job_b' and wait_event_type='Lock'")!=='1';n++){if(n>200)throw Error('signal_worker_not_waiting');await new Promise(r=>setTimeout(r,25));}
   const name=[...owned].find(x=>!before.has(x)&&x.startsWith(prefix+'-run-'));assert.ok(name);
   docker(['kill','--signal=TERM',name]);holder.stdin.end('commit;\n');
   r=await running;assert.equal(r.report.code,'stopped');assert.equal(r.report.outcome,'STOP');
   assert.equal(su(`select state from assess.sessions where id='${signalSession}'`),'grading');
   assert.equal(su(`select count(*) from assess.results where session_id='${signalSession}'`),'0');
  }finally{if(!holder.stdin.destroyed)holder.stdin.end('rollback;\n');}
  su('select assess.freeze_v2();alter role assess_job_b nologin;');
  r=await worker(env,images[2],false);assert.equal(r.report.outcome,'STOP');
  assert.equal(su("select count(*) from pg_stat_activity where usename='assess_job_b'"),'0');
  assert.equal(su(`select emergency_held_at is not null from assess.sessions where id='${signalSession}'`),'t');
  checks.push('finish-replay-exactly-one-stale-token-denied-emergency-stop-cleanup');
  return {contract:'rad105-scheduled-image-rehearsal/2',outcome:'PASS',checks,providerVerified:false};
 }finally{
  for(const name of owned)if((name===mock||name.startsWith(prefix+'-ca-')||name===prefix+'-direct'))try{docker(['rm','-fv',name]);}catch{/* outer cleanup rechecks */}
  for(const image of images){try{docker(['image','rm','-f',image]);}catch{/* verify below */}
   let present=false;try{docker(['image','inspect',image]);present=true;}catch{/* absent */}assert.equal(present,false,'successor image cleanup');}
  for(const path of contexts)rmSync(path,{recursive:true,force:true});
 }
}
