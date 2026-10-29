// Required synthetic-only PostgreSQL witnesses. Never accepts a URL or live selector.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openLocalDatabase } from './local-database.mjs';
import { renderPacket, stopTransport } from './emergency-stop-packet.mjs';

const read=p=>readFileSync(p,'utf8');
const stop=()=>stopTransport().join('');
const verify=read('supabase/checks/assess-emergency-stopped.sql');
const monitor=read('supabase/checks/assess-operations-monitor.sql');
const require=createRequire('/tmp/radlab-ops-postgres/package.json');
const {Client}=require('pg');
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const pause=ms=>new Promise(r=>setTimeout(r,ms));

async function fixture(history='lf') {
 const db=await openLocalDatabase('postgres',{lineEndings:history,allMigrationLineEndings:true});
 const clients=new Set();
 try {
  // The helper creates and owns this local-only Unix-socket server. No env PG input.
  const [socket]=await db.query('show unix_socket_directories');
  const host=socket.unix_socket_directories;
  assert(host.startsWith(join(tmpdir(),'radlab-assess-ops-')));
  const connect=async(user='postgres',database='postgres')=>{
   assert(['postgres','synthetic_other'].includes(database));
   const c=new Client({host,port:55432,database,user,password:'',ssl:false,connectionTimeoutMillis:3000,query_timeout:40000});
   c.on('error',()=>{});await c.connect();clients.add(c);return c;
  };
  const scalar=async(sql,args=[])=>Object.values((await db.query(sql,args))[0])[0];
  const run=async sql=>{
   const c=await connect();try{
    const results=await c.query(sql);const rows=(Array.isArray(results)?results:[results]).flatMap(r=>r.rows);
    assert.equal(rows.length,1);return rows[0];
   }finally{await c.end();clients.delete(c);}
  };
  await db.exec(read('supabase/manual/rad085-sharing-policy-live-p1.sql'));
  // Provider auth.created_at is absent from the minimal existing synthetic helper only.
  await db.exec('alter table auth.users add column created_at timestamptz not null default now()');
  await db.exec(`insert into auth.users values('${id(1)}','owner@example.test',now(),'{}'),('${id(2)}','student@example.test',now(),'{}');
   update public.profiles set status='approved',role=case when user_id='${id(1)}' then 'owner' else 'participant' end;
   insert into assess.consents(user_id,version) values('${id(2)}','assess-pilot-2026-10-20-v2');
   insert into assess.versions(id,owner_id,assessment_id,version,name,track,available)
    values('${id(10)}','${id(1)}','${id(10)}','1','Synthetic engineering','mixed',true);
   insert into assess.assignments(id,owner_id,version_id) values('${id(11)}','${id(1)}','${id(10)}');
   insert into assess.targets values('${id(11)}','${id(2)}');
   create role assess_job_a login noinherit connection limit -1 valid until '${new Date(Date.now()+86400000).toISOString()}';
   create role assess_job_b login noinherit connection limit -1 valid until '${new Date(Date.now()+86400000).toISOString()}';
   comment on role assess_job_a is 'radlab-assess-login/1 database=postgres';
   comment on role assess_job_b is 'radlab-assess-login/1 database=postgres';
   grant assess_worker to assess_job_a,assess_job_b with admin false,inherit false,set true;`);
  const document={assessment:{maximum:'100',name:'Synthetic',track:'mixed',policy:{durationSeconds:3600,maxAttempts:1000,gradeVisibility:'hidden'},items:[{ref:{id:'letter',version:'1'},type:'single-choice',options:[{id:'a'},{id:'b'}]}]}};
  await db.query('insert into assess.publications(version_id,document,specs) values($1,$2,$3)',[id(10),document,{letter:{}}]);
  async function seed(n,state='grading',age='1 hour') {
   await db.query(`insert into assess.sessions(id,assignment_id,user_id,ordinal,state,started_at,deadline,submitted_at,lease,lease_until)
    values($1,$2,$3,$4,$5,clock_timestamp()-interval '2 hours',clock_timestamp()+interval '1 hour',
    case when $5='active' then null else clock_timestamp()-$6::interval end,
    case when $5='grading' then gen_random_uuid() end,case when $5='grading' then clock_timestamp()+interval '5 minutes' end)`,[id(n),id(11),id(2),n,state,age]);
   await db.query('insert into assess.session_details values($1,$2,$3,$4,$5)',[id(n),document,{letter:{}}, {letter:{type:'single-choice',optionId:'a'}},[]]);
   await db.query('insert into assess.receipts values($1,$2,$3,$4)',[id(n),id(n+10000),'synthetic-digest',{synthetic:true}]);
  }
  await seed(100,'active');await seed(101);await seed(102,'grading-failed');await seed(103,'graded');await seed(104,'void');await seed(105,'grading-failed','8 days');
  await db.query('insert into assess.results values($1,37,1,100,$2,$3,$4)',[id(103),'Synthetic','mixed','hidden']);
  const unchanged=()=>db.query(`select
   (select jsonb_agg(to_jsonb(r) order by r.session_id) from assess.results r) results,
   (select jsonb_agg(to_jsonb(d) order by d.session_id) from assess.session_details d) details,
   (select jsonb_agg(to_jsonb(r) order by r.session_id,r.operation_id) from assess.receipts r) receipts,
   (select jsonb_agg(to_jsonb(r) order by r.user_id) from assess.reservations r) reservations,
   (select jsonb_agg(to_jsonb(p) order by p.user_id) from public.profiles p) profiles`);
  const catalogue=()=>db.query(`select p.oid,pg_get_functiondef(p.oid) definition,p.proowner,p.proacl::text acl,p.proconfig
   from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','assess') order by p.oid`);
  const ready=async()=>{
   const sql=read('supabase/checks/rad085-p1-b-ready.sql');
   const c=await connect();try{
    const out=await c.query(sql);const rows=out.flatMap(r=>r.rows);
    assert.equal(rows.length,13);assert.deepEqual(rows.filter(r=>!r.ready),[]);
   }finally{await c.end();clients.delete(c);}
  };
  return {...db,connect,run,scalar,seed,unchanged,catalogue,ready,async close(){
   await Promise.allSettled([...clients].map(c=>c.end()));await db.close();
  }};
 }catch(e){await Promise.allSettled([...clients].map(c=>c.end()));await db.close();throw e;}
}

test('phone transport preserves every DO byte, has bounded parts, and matches checked-in packet',()=>{
 const source=read('supabase/manual/assess-emergency-stop.sql');
 const parts=stopTransport();assert(parts.every(p=>p.length<15000));
 const blocks=[...source.matchAll(/do (\$[a-z_]+\$)[\s\S]*?\1;/g)].map(m=>m[0]);
 const encoded=[...parts.join('').matchAll(/decode\('([^']+)'/g)].map(m=>Buffer.from(m[1],'base64').toString('utf8'));
 assert.deepEqual(encoded,blocks);assert.equal(blocks.length,6);
 for(const line of parts.join('').split('\n').filter(l=>l.startsWith('DO $phone$')))assert(line.length<15000);
 assert.throws(()=>stopTransport('do $huge$ begin '+ ' '.repeat(15000)+'end $huge$;'),/oversized_phase/);
 assert.equal(renderPacket(),read('docs/RAD-059_PHONE_PACKET.md'));
 assert(!/create\s+(or replace\s+)?function|assess\.trial_scope/i.test(source));
});

for(const history of ['lf','crlf'])test(`PostgreSQL ${history}: stop, idempotence, no score/data/catalogue mutation, recovery and exact readiness`,async()=>{
 const db=await fixture(history);
 try{
  await db.ready();await db.exec('update assess.launch_gate set enabled=true');
  // Prove the old count ceilings do not refuse an actual emergency.
  for(let n=110;n<215;n++)await db.seed(n);
  const before=await db.unchanged(),catalogue=await db.catalogue();
  const terminals=await db.query("select * from assess.sessions where state in ('graded','void') order by id");
  await db.exec('create database synthetic_other');
  const workerConnections=[];
  for(let n=0;n<10;n++){const c=await db.connect(n%2?'assess_job_a':'assess_job_b',n===9?'synthetic_other':'postgres');await c.query('set role assess_worker');workerConnections.push(c);}
  const other=await db.connect();
  const heldStart=await db.query('select clock_timestamp() ts');
  const r=await db.run(stop());assert.equal(r.status,'STOPPED',JSON.stringify(r));assert.deepEqual(r.errors,[]);
  assert.deepEqual(r.verification,{gateClosed:true,loginDisabled:true,missingRoles:0,backendSessions:0,unheldSessions:0});
  for(const c of workerConnections)await assert.rejects(c.query('select 1'));
  assert.equal((await other.query('select 1 v')).rows[0].v,1);
  await assert.rejects(db.connect('assess_job_a'),e=>e.code==='28000');
  assert.deepEqual(await db.unchanged(),before);assert.deepEqual(await db.catalogue(),catalogue);
  assert.deepEqual(await db.query("select * from assess.sessions where state in ('graded','void') order by id"),terminals);
  const all=await db.query('select * from assess.sessions order by id');
  const active=all.find(s=>s.id===id(100));assert(active.submitted_at>=heldStart[0].ts);assert(active.submitted_at<active.deadline);
  assert.equal(await db.scalar('select assess.claim_v1()'),null);
  const second=await db.run(stop());assert.equal(second.status,'STOPPED');
  assert.deepEqual(await db.query('select * from assess.sessions order by id'),all);
  assert.equal((await db.run(verify)).status,'STOPPED');
  await assert.rejects(db.port('authenticated',id(2)).call('command_v1',{p_session:id(100),p_operation:id(999),p_revision:active.revision,p_action:{type:'submit'}}),/attempt frozen/);
  await assert.rejects(db.port('assess_worker').call('finish_v1',{p_session:id(101),p_token:id(999),p_n:'0',p_d:'1'}),/stale grading claim/);
  await db.port('assess_worker').call('recover_v1',{p_session:id(101)});
  assert((await db.scalar('select assess.claim_v1()')).attemptId===id(101));
  // A formerly active attempt and an already failed one use the same unchanged contract.
  for(const n of [100,102]){
   await db.port('assess_worker').call('recover_v1',{p_session:id(n)});
   assert.equal((await db.scalar('select assess.claim_v1()')).attemptId,id(n));
  }
  await assert.rejects(db.port('assess_worker').call('recover_v1',{p_session:id(105)}),/recovery unavailable/);
  // Resume is a separate local owner simulation. Scores remain as recorded.
  await db.run(stop());
  await db.exec('alter role assess_job_a login connection limit 2');await db.ready();
  const loginReady=read('supabase/checks/assess-worker-login-ready.sql');
  const c=await db.connect();try{
   await c.query("set assess.worker_login_target='assess_job_a'");
   const checks=(await c.query(loginReady)).flatMap(r=>r.rows);
   assert.equal(checks.length,1);assert.equal(checks[0].active_catalogue_valid,true);
  }finally{await c.end();}
  assert.deepEqual(await db.unchanged(),before);assert.deepEqual(await db.catalogue(),catalogue);
  await db.exec('alter role assess_job_a nologin;drop role assess_job_b');
  assert.equal((await db.run(stop())).verification.missingRoles,1);
  await db.exec('delete from assess.launch_gate');assert.equal((await db.run(stop())).status,'STOPPED');
 }finally{await db.close();}
});

test('timeouts return PARTIAL with SQLSTATE; committed gate/NOLOGIN survive; no silent hang',async()=>{
 const db=await fixture();const lock=await db.connect();
 try{
  await db.exec('update assess.launch_gate set enabled=true');
  await lock.query('begin;lock table assess.sessions in access share mode');
  let at=performance.now();let r=await db.run(stop());
  assert.equal(r.status,'PARTIAL');assert(r.errors.includes('freeze:55P03'));assert(performance.now()-at<8000);
  assert.equal(r.gate_ok,true);assert.equal(r.login_a_ok,true);assert.equal(Number((await db.run(verify)).unheld_sessions),4);
  await lock.query('rollback');
  await db.exec("create function public.synthetic_slow_stop() returns trigger language plpgsql as $$begin perform pg_sleep(6);return new;end$$;create trigger synthetic_slow before update on assess.sessions for each row execute function public.synthetic_slow_stop()");
  at=performance.now();r=await db.run(stop());
  assert.equal(r.status,'PARTIAL');assert(r.errors.includes('freeze:57014'));assert(performance.now()-at<9000);
  assert.equal(await db.scalar('select enabled from assess.launch_gate'),false);
  assert.equal(await db.scalar("select rolcanlogin from pg_roles where rolname='assess_job_a'"),false);
  await db.exec('drop trigger synthetic_slow on assess.sessions;drop function public.synthetic_slow_stop()');
  assert.equal((await db.run(stop())).status,'STOPPED');
  // Gate acquisition timeout also returns a row and does not prevent role/session containment.
  await lock.query('begin;lock table assess.launch_gate in access exclusive mode');
  r=await db.run(stop());assert.equal(r.status,'PARTIAL');assert(r.errors.includes('gate:55P03'));assert(r.errors.includes('verification:55P03'));assert.equal(r.freeze_ok,true);
  await lock.query('rollback');assert.equal((await db.run(stop())).status,'STOPPED');
 }finally{await lock.query('rollback');await db.close();}
});

test('restricted termination permission is explicit PARTIAL, preserves NOLOGIN/gate and leaves other backend alone',async()=>{
 const db=await fixture();
 try{
  const target=await db.connect('assess_job_a');await target.query('select 1');
  await db.exec(`create role synthetic_operator login createrole;grant usage on schema assess to synthetic_operator;
   grant select,update,insert on assess.launch_gate to synthetic_operator;
   grant select,update on assess.sessions to synthetic_operator;
   alter table assess.launch_gate disable row level security;alter table assess.sessions disable row level security;
   grant assess_job_a,assess_job_b to synthetic_operator with admin true,inherit false,set false;`);
  const c=await db.connect('synthetic_operator');
  const out=await c.query(stop());const r=out.flatMap(x=>x.rows)[0];
  assert.equal(r.status,'PARTIAL');assert(r.errors.includes('termination:42501'));assert.equal(r.gate_ok,true);assert.equal(r.login_a_ok,true);
  assert.equal((await target.query('select 1 v')).rows[0].v,1);
  assert.equal(await db.scalar("select rolcanlogin from pg_roles where rolname='assess_job_a'"),false);
  // With none of the required permissions, the same packet returns FAILED, not an exception/no row.
  await db.exec('create role synthetic_unprivileged login;alter role assess_job_a login;alter role assess_job_b login');
  const denied=await db.connect('synthetic_unprivileged');
  const failed=(await denied.query(stop())).flatMap(x=>x.rows)[0];
  assert.equal(failed.status,'FAILED');assert(failed.errors.includes('gate:42501'));assert(failed.errors.includes('freeze:42501'));
  const clean=await db.run(stop());assert.equal(clean.status,'STOPPED',JSON.stringify(clean));
 }finally{await db.close();}
});

test('in-flight start/save/finish drain before freezing; queued start sees closed gate',async()=>{
 const db=await fixture();const old=await db.connect(),blocked=await db.connect();
 try{
  await db.exec('update assess.launch_gate set enabled=true');
  // Warm the queued client's actual function plan before the contention witness.
  await blocked.query('begin;set local role authenticated');await blocked.query("select set_config('request.jwt.claim.sub',$1,true)",[id(2)]);
  await blocked.query('select assess.start_v1($1,$2)',[id(11),id(900)]);await blocked.query('commit');
  await old.query('begin;set local role authenticated');
  await old.query("select set_config('request.jwt.claim.sub',$1,true)",[id(2)]);
  await old.query('select assess.start_v1($1,$2)',[id(11),id(901)]); // Keeps gate ACCESS SHARE until commit.
  const stopping=db.run(stop());await pause(100);
  await blocked.query('begin;set local role authenticated');await blocked.query("select set_config('request.jwt.claim.sub',$1,true)",[id(2)]);
  const queued=blocked.query('select assess.start_v1($1,$2)',[id(11),id(902)]).then(()=>false,e=>e.message.includes('launch gate closed'));
  await old.query('commit');assert.equal((await stopping).status,'STOPPED');assert.equal(await queued,true);await blocked.query('rollback');
  // Separate save already holding a session row; stop waits for its real RPC commit.
  await db.exec("update assess.sessions set state='active',submitted_at=null,retry_at=null where id='"+id(100)+"'");
  await old.query('begin;set local role authenticated');await old.query("select set_config('request.jwt.claim.sub',$1,true)",[id(2)]);
  const rev=await db.scalar('select revision from assess.sessions where id=$1',[id(100)]);
  await old.query('select assess.command_v1($1,$2,$3,$4)',[id(100),id(903),rev,{type:'save',item:{id:'letter',version:'1'},answer:{type:'single-choice',optionId:'b'}}]);
  const saveStop=db.run(stop());await pause(100);await old.query('commit');assert.equal((await saveStop).status,'STOPPED');
  assert.equal(await db.scalar("select answers->'letter'->>'optionId' from assess.session_details where session_id=$1",[id(100)]),'b');
  // A legitimate finish committed before the exclusive session barrier stays graded.
  await db.exec("update assess.sessions set state='grading',lease='"+id(999)+"',lease_until=clock_timestamp()+interval '5 minutes' where id='"+id(101)+"'");
  await old.query('begin;set local role assess_worker');await old.query('select assess.finish_v1($1,$2,$3,$4)',[id(101),id(999),'12','1']);
  const finishing=db.run(stop());await pause(100);await old.query('commit');assert.equal((await finishing).status,'STOPPED');
  assert.equal(await db.scalar('select state from assess.sessions where id=$1',[id(101)]),'graded');
  assert.equal(await db.scalar('select earned_n::text from assess.results where session_id=$1',[id(101)]),'12');
 }finally{await old.query('rollback');await blocked.query('rollback');await db.close();}
});

test('monitor is read-only aggregate, does not call writes, and never reports partial counts as healthy',async()=>{
 const db=await fixture();
 try{
  const before=await db.unchanged();let r=await db.run(monitor);
  assert.equal(r.status,'OBSERVED');assert.equal(Number(r.signups_15m),2);assert.equal(r.health.active,1);assert.equal(r.client_receipt_lag_measurable,false);
  assert.deepEqual(await db.unchanged(),before);
  await db.exec(`insert into assess.sessions(id,assignment_id,user_id,ordinal,state,started_at,submitted_at)
   select gen_random_uuid(),'${id(11)}','${id(2)}',n,'grading',now(),now() from generate_series(1000,2000) n`);
  r=await db.run(monitor);assert.equal(r.status,'UNKNOWN_CEILING');assert.equal(r.health,null);
  await db.exec("insert into auth.users(id,email) select gen_random_uuid(),'synthetic'||n||'@example.test' from generate_series(1,1001) n");
  r=await db.run(monitor);assert.equal(r.status,'UNKNOWN_CEILING');assert.equal(r.signups_15m,null);assert.equal(r.signup_ceiling_exceeded,true);
  // Refuse writing even through a future accidental change to this query.
  await assert.rejects(db.exec('begin read only;update assess.launch_gate set enabled=true'),e=>e.code==='25006');await db.exec('rollback');
 }finally{await db.close();}
});
