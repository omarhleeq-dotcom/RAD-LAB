// Local-only C rehearsal; no network listener, live credentials, publication or deployment.
// Node24: node --import ./scripts/assess/node-loader.mjs scripts/assess/rehearse-c.mjs
// Real parallel PostgreSQL transactions: append --postgres-container=LOCAL_DISPOSABLE_CONTAINER
import { readFileSync,readdirSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { attemptService,publicationService,runAssessJobs } from '../../src/features/assess/server-service.ts';
import { ASSESS_EVALUATOR,caseVersion } from '../../src/features/assess/server-validation.ts';
import { chestPaErect as c } from '../../src/data/cases/chest-pa-erect.ts';

const container=process.argv.find(a=>a.startsWith('--postgres-container='))?.split('=')[1];
if(container&&!/^radlab-assess-c-[a-z0-9-]+$/.test(container))throw new Error('Disposable local container name required');
if(process.argv.slice(2).some(a=>!a.startsWith('--postgres-container=')))throw new Error('Unsupported argument');
const run=promisify(execFile),dbName=`assess_c_${randomUUID().replaceAll('-','')}`;
const dockerArgs=['--host=unix:///var/run/docker.sock','exec','-i',container??'','psql','-U','postgres','-X','-qAt','-v','ON_ERROR_STOP=1'];
const dockerEnv={...process.env};for(const name of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'])delete dockerEnv[name];
async function psql(sql,database=dbName){
  // stdin only: no secret/body argument or log; all data is synthetic and DB is freshly created by this script.
  const child=execFile('docker',[...dockerArgs,'-d',database],{env:dockerEnv,maxBuffer:4_000_000});
  const result=new Promise((resolve,reject)=>{let output='',errors='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>errors+=b);child.on('error',reject);child.on('close',code=>code?reject(new Error(errors)):resolve(output.trim()));});
  child.stdin.end(sql);return result;
}
const db=container?null:new PGlite();
const lit=v=>v===null?'null':typeof v==='number'?String(v):typeof v==='boolean'?String(v):`'${(typeof v==='string'?v:JSON.stringify(v)).replaceAll("'","''")}'`;
const uid=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const query=async(sql)=>container?psql(sql):db.exec(sql);
function client(role,user=null,hold=false){return {async call(name,args){
  if(!/^[a-z_0-9]+$/.test(name))throw new Error('Invalid local function');
  if(container){
    const output=await psql(`begin;set local role ${role};set local request.jwt.claim.sub=${lit(user??'')};select to_jsonb(assess.${name}(${Object.entries(args).map(([k,v])=>`${k}=>${lit(v)}`).join(',')}));${hold?'select pg_sleep(0.25);':''}commit;`);
    return output.split('\n').filter(Boolean).map(line=>{try{return JSON.parse(line);}catch{return null;}})[0]??null;
  }
  return db.transaction(async tx=>{await tx.exec(`set local role ${role}`);await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user??'']);
    return (await tx.query(`select assess.${name}(${Object.entries(args).map(([k],i)=>`${k}=>$${i+1}`).join(',')}) v`,Object.values(args))).rows[0].v;
  });
}};}
try {
  if(container)await psql(`create database ${dbName};`,'postgres');
  await query(`do $$begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin;end if;if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin;end if;end$$;
    create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
  // Worker role is cluster-scoped in PostgreSQL; this disposable container must be fresh per real rehearsal.
  // Historical C-through-B witness: future deferred parts are tested by explicit named apply.
  const deferred=JSON.parse(readFileSync('scripts/pages/frontend-schema.json','utf8')).deferredMigrations;
  for(const file of readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')&&!Object.hasOwn(deferred,f)&&f<'20261030000100').sort())await query(readFileSync(`supabase/migrations/${file}`,'utf8'));
  await query(`insert into auth.users values('${uid(1)}','owner@example.test',now(),'{"display_name":"Synthetic owner"}'),('${uid(2)}','student@example.test',now(),'{"display_name":"Synthetic participant"}');update public.profiles set status='approved';update public.profiles set role='owner' where user_id='${uid(1)}';
    insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values('${uid(10)}','${uid(1)}','${uid(10)}','1','Synthetic engineering','mixed',true);
    insert into assess.assignments(id,owner_id,version_id) values('${uid(11)}','${uid(1)}','${uid(10)}');insert into assess.targets values('${uid(11)}','${uid(2)}');`);
  await query("update assess.launch_gate set enabled=true"); // synthetic disposable database only
  const worker=client('assess_worker'),student=client('authenticated',uid(2)),held=client('authenticated',uid(2),true);
  const review={sources:[{reference:'Synthetic engineering fixture',licenceEvidence:'Test only'}],reviewedBy:'Engineering fixture',reviewedAt:'2026-10-19T00:00:00.000Z',scope:'Not clinical approval'};
  const sim={schemaVersion:1,ref:{id:'sim',version:'1'},type:'simulator-part',contentLanguage:'en',prompt:'Engineering fixture only',presentation:{controls:['sidCm'],sceneElements:[]}};
  const doc={schemaVersion:1,assessment:{schemaVersion:1,ref:{id:uid(10),version:'1'},name:'Synthetic engineering',track:'mixed',maximum:'10',policy:{durationSeconds:3600,maxAttempts:2,gradeVisibility:'hidden'},items:[sim]},
    itemMarks:[{item:sim.ref,maximum:'1'}],privateItems:[{schemaVersion:1,ref:sim.ref,type:'simulator-part',review,caseRef:{id:c.id,version:caseVersion(c)},evaluatorVersion:ASSESS_EVALUATOR,fixedSettings:c.initialSettings,mutablePaths:['sidCm'],criteria:[{ruleId:c.rules.find(r=>r.kind==='range'&&r.setting==='sidCm').id,part:'sidCm',maximum:'1'}]}]};
  await publicationService(worker).install(uid(10),doc);
  // Current migration chain includes F: explicit synthetic Assess consent, never Practice consent.
  const consentRace=await Promise.all([held.call('consent_v2',{p_version:'assess-pilot-2026-10-20-v2'}),student.call('consent_v2',{p_version:'assess-pilot-2026-10-20-v2'})]);
  assert.deepEqual(consentRace,[{accepted:true},{accepted:true}]);
  const [start1,start2]=await Promise.all([attemptService(held).start(uid(11),uid(100)),attemptService(student).start(uid(11),uid(100))]);
  assert.equal(start1.attemptId,start2.attemptId);const session=start1.attemptId;
  const action={type:'expose',item:sim.ref,answer:{type:'simulator-part',values:{sidCm:180}}};
  const command=(operation,revision,act=action)=>JSON.stringify({schemaVersion:1,attemptId:session,operationId:uid(operation),expectedRevision:revision,action:act});
  const [ack1,ack2]=await Promise.all([attemptService(held).command(command(101,0)),attemptService(student).command(command(101,0))]);
  assert.deepEqual(ack1,ack2);assert.equal(ack1.revision,1);
  await assert.rejects(()=>attemptService(student).command(command(102,1)),{code:'unavailable'});
  const resumed=await attemptService(student).read(session);assert.deepEqual(resumed.ack.lockedItemIds,['sim']);
  const [sub1,sub2]=await Promise.all([attemptService(held).command(command(103,1,{type:'submit'})),attemptService(student).command(command(103,1,{type:'submit'}))]);assert.deepEqual(sub1,sub2);
  const [job1,job2]=await Promise.all([runAssessJobs(worker,1),runAssessJobs(worker,1)]);assert.equal(job1.graded+job2.graded,1);
  const result=await attemptService(student).result(session);assert.deepEqual(result.grade,{visibility:'hidden'});assert.equal(Object.keys(result).length,4);
  assert.equal((await attemptService(student).start(uid(11),uid(100))).attemptId,session); // lost start ack after successful grade
  const after=await attemptService(student).read(session);assert.equal(after.answers,undefined);assert.equal(after.assessment,undefined);
  // Competing, distinct revisions on another reserved attempt: exactly one update wins.
  const next=(await attemptService(student).start(uid(11),uid(110))).attemptId;
  const act={type:'save',item:sim.ref,answer:{type:'simulator-part',values:{sidCm:180}}};
  const results=await Promise.allSettled([held.call('command_v1',{p_session:next,p_operation:uid(111),p_revision:0,p_action:act}),student.call('command_v1',{p_session:next,p_operation:uid(112),p_revision:0,p_action:act})]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  const exposeResults=await Promise.allSettled([held.call('command_v1',{p_session:next,p_operation:uid(113),p_revision:1,p_action:action}),student.call('command_v1',{p_session:next,p_operation:uid(114),p_revision:1,p_action:action})]);
  assert.equal(exposeResults.filter(r=>r.status==='fulfilled').length,1);
  // Browser closed and a late manual submission compete with expiry; one terminal result survives.
  await query(`update assess.sessions set deadline=clock_timestamp()-interval '1 second' where id=${lit(next)};`);
  const expiryRace=await Promise.allSettled([runAssessJobs(worker,1),student.call('command_v1',{p_session:next,p_operation:uid(115),p_revision:2,p_action:{type:'submit'}})]);
  assert.equal(expiryRace[0].status,'fulfilled');assert.equal(expiryRace[0].value.graded,1);
  assert.deepEqual((await attemptService(student).result(next)).grade,{visibility:'hidden'});
  console.log(JSON.stringify({contract:'assess-c-rehearsal/1',backend:container?'postgres-parallel':'pglite-serialized',outcome:'PASS',checks:['start-replay','expose-race','refresh-lock','submit-replay','worker-lease','hidden-result','atomic-detail-erasure','start-tombstone','revision-race','distinct-exposure-race','expiry-submit-race']}));
}finally{
  if(db)await db.close();
  if(container){await run('docker',[...dockerArgs,'-d','postgres','-c',`drop database if exists ${dbName} with (force);`],{env:dockerEnv});await psql('drop role if exists assess_worker;','postgres');}
}
