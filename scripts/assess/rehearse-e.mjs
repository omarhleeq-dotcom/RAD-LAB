// Local-only E rehearsal; no network listener, live credentials, publication or deployment.
// Node24: node --import ./scripts/assess/node-loader.mjs scripts/assess/rehearse-e.mjs
// Real parallel PostgreSQL transactions: append --postgres-container=LOCAL_DISPOSABLE_CONTAINER
import { readFileSync,readdirSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { attemptService,runAssessJobs } from '../../src/features/assess/server-service.ts';
import {practicalFixture} from './e-fixture.ts';
import {installPracticalContent} from '../../src/features/assess/server-practical.ts';

const container=process.argv.find(a=>a.startsWith('--postgres-container='))?.split('=')[1];
if(container&&!/^radlab-assess-e-[a-z0-9-]+$/.test(container))throw new Error('Disposable local container name required');
if(process.argv.slice(2).some(a=>!a.startsWith('--postgres-container=')))throw new Error('Unsupported argument');
const run=promisify(execFile),dbName=`assess_e_${randomUUID().replaceAll('-','')}`;
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
    const output=await psql(`begin;set local role ${role};set local request.jwt.claim.sub=${lit(user??'')};select to_jsonb(assess.${name}(${Object.entries(args).map(([k,v])=>`${k}=>${["p_users","p_groups"].includes(k)?`ARRAY[${v.map(lit).join(",")}]::uuid[]`:lit(v)}`).join(',')}));${hold?'select pg_sleep(0.25);':''}commit;`);
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
  for(const file of readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort())await query(readFileSync(`supabase/migrations/${file}`,'utf8'));
  await query(`insert into auth.users values('${uid(1)}','owner@example.test',now(),'{"display_name":"Synthetic owner"}'),('${uid(2)}','student@example.test',now(),'{"display_name":"Synthetic participant"}');update public.profiles set status='approved';update public.profiles set role='owner' where user_id='${uid(1)}';update assess.launch_gate set enabled=true;`);
  const worker=client('assess_worker'),owner=client('authenticated',uid(1)),student=client('authenticated',uid(2)),held=client('authenticated',uid(2),true);
  const doc=practicalFixture(),version=await owner.call('content_submit_v1',{p_document:doc});
  await installPracticalContent(worker,version);
  const assignment=await owner.call('assign_v1',{p_version:version,p_users:[uid(2)],p_groups:[]});
  const [a,b]=await Promise.all([attemptService(held).start(assignment,uid(100)),attemptService(student).start(assignment,uid(100))]);assert.equal(a.attemptId,b.attemptId);
  const session=a.attemptId,read=async()=>student.call('read_practical_session_v1',{p_session:session});
  const initial=await read(),item=initial.assessment.items[0],answer={type:'full-practical',values:initial.views[item.ref.id].initial};
  const command=(port,op,revision,action)=>port.call('command_v1',{p_session:session,p_operation:uid(op),p_revision:revision,p_action:action});
  const expose={type:'expose',item:item.ref,answer};
  const [e1,e2]=await Promise.all([command(held,101,0,expose),command(student,101,0,expose)]);assert.deepEqual(e1,e2);assert.equal(e1.revision,1);
  await assert.rejects(()=>command(student,102,1,expose));assert.deepEqual((await read()).ack.lockedItemIds,[item.ref.id]);
  const [s1,s2]=await Promise.all([command(held,103,1,{type:'submit'}),command(student,103,1,{type:'submit'})]);assert.deepEqual(s1,s2);
  const [w1,w2]=await Promise.all([runAssessJobs(worker,1),runAssessJobs(worker,1)]);assert.equal(w1.graded+w2.graded,1);
  assert.deepEqual((await attemptService(student).result(session)).grade,{visibility:'hidden'});assert.equal((await read()).assessment,undefined);
  const second=(await attemptService(student).start(assignment,uid(104))).attemptId;
  const save={type:'save',item:item.ref,answer};
  const competing=await Promise.allSettled([held.call('command_v1',{p_session:second,p_operation:uid(105),p_revision:0,p_action:save}),student.call('command_v1',{p_session:second,p_operation:uid(106),p_revision:0,p_action:save})]);assert.equal(competing.filter(r=>r.status==='fulfilled').length,1);
  const exposures=await Promise.allSettled([held.call('command_v1',{p_session:second,p_operation:uid(107),p_revision:1,p_action:expose}),student.call('command_v1',{p_session:second,p_operation:uid(108),p_revision:1,p_action:expose})]);assert.equal(exposures.filter(r=>r.status==='fulfilled').length,1);
  await query(`update assess.sessions set deadline=clock_timestamp()-interval '1 second' where id=${lit(second)};`);
  const race=await Promise.allSettled([runAssessJobs(worker,1),student.call('command_v1',{p_session:second,p_operation:uid(109),p_revision:2,p_action:{type:'submit'}})]);assert.equal(race[0].status,'fulfilled');assert.equal(race[0].value.graded,1);
  const terminal=await student.call('read_practical_session_v1',{p_session:second});assert.equal(terminal.assessment,undefined);
  // Private details and receipts are gone; this query contains only aggregate counts.
  if(container)assert.deepEqual(JSON.parse(await psql(`select jsonb_build_object('details',(select count(*) from assess.session_details),'receipts',(select count(*) from assess.receipts),'results',(select count(*) from assess.results));`)),{details:0,receipts:0,results:2});
  console.log(JSON.stringify({contract:'assess-e-rehearsal/1',backend:container?'postgres-parallel':'pglite-serialized',outcome:'PASS',checks:['immutable-content-install','start-race','exposure-replay','refresh-lock','submit-replay','two-workers','hidden-result','revision-race','distinct-exposure-race','expiry-submit-race','detail-erasure']}));
}finally{
  if(db)await db.close();
  if(container){await run('docker',[...dockerArgs,'-d','postgres','-c',`drop database if exists ${dbName} with (force);`],{env:dockerEnv});await psql('drop role if exists assess_worker;','postgres');}
}
