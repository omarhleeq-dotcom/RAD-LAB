// B8: disposable PostgreSQL only; all pre-RAD-085 migrations CRLF, each paste variant LF/CRLF.
import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';

for (const paste of ['lf', 'crlf']) it(`B8 ${paste}: remove active trial over CRLF history, reinstall, P1 and rollback preserve synthetic rows`, () => {
 const source = String.raw`
 import assert from 'node:assert/strict';
 import {readFileSync} from 'node:fs';
 import {openLocalDatabase} from './scripts/assess/local-database.mjs';
 const paste=process.argv[1];
 const db=await openLocalDatabase('postgres',{through:'pre-rad085',lineEndings:'crlf',allMigrationLineEndings:true});
 const read=p=>readFileSync(p,'utf8');
 const manual='supabase/manual/';
 const {createRequire}=await import('node:module');
 const require=createRequire('/tmp/radlab-ops-postgres/package.json');
 const {Client}=require('pg');
 const socket=(await db.query("select current_setting('unix_socket_directories') socket"))[0].socket;
 const c=new Client({host:socket,port:55432,user:'postgres',database:'postgres',password:'',ssl:false});await c.connect();
 const selectResults=async sql=>{const result=await c.query(sql);return (Array.isArray(result)?result:[result]).filter(r=>r.fields.length).map(r=>r.rows);};
 const catalogue=()=>db.query("select kind,name,replace(def,E'\\r','') def from (select 'function' kind,p.oid::regprocedure::text name,pg_get_functiondef(p.oid)||coalesce(p.proacl::text,'')||p.proowner::regrole::text def from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','assess') union all select 'relation',c.oid::regclass::text,concat_ws('|',c.relkind,c.relrowsecurity,c.relforcerowsecurity,c.relowner::regrole,coalesce(c.relacl::text,'')) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','assess') union all select 'column',a.attrelid::regclass::text||'.'||a.attname,concat_ws('|',format_type(a.atttypid,a.atttypmod),a.attnotnull,a.attidentity,a.attgenerated,pg_get_expr(d.adbin,d.adrelid),coalesce(a.attacl::text,'')) from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where n.nspname in ('public','assess') and a.attnum>0 and not a.attisdropped union all select 'constraint',conrelid::regclass::text||'.'||conname,pg_get_constraintdef(oid) from pg_constraint where connamespace in ('public'::regnamespace,'assess'::regnamespace) union all select 'index',indexrelid::regclass::text,pg_get_indexdef(indexrelid) from pg_index i join pg_class c on c.oid=i.indrelid where c.relnamespace in ('public'::regnamespace,'assess'::regnamespace) union all select 'trigger',t.tgrelid::regclass::text||'.'||t.tgname,pg_get_triggerdef(t.oid)||t.tgenabled::text from pg_trigger t join pg_class c on c.oid=t.tgrelid where not t.tgisinternal and c.relnamespace in ('public'::regnamespace,'assess'::regnamespace,'auth'::regnamespace) union all select 'policy',polrelid::regclass::text||'.'||polname,concat_ws('|',polcmd,polpermissive,polroles::text,pg_get_expr(polqual,polrelid),pg_get_expr(polwithcheck,polrelid)) from pg_policy where polrelid in (select oid from pg_class where relnamespace in ('public'::regnamespace,'assess'::regnamespace))) x order by 1,2");
 const nineChecks=async()=>{
  // RAD085-DB-DAY-PROMOTION-20261027: this fixture is pre-M1, even when the repository manifest is promoted.
  for(const file of JSON.parse(read('scripts/pages/frontend-schema.json')).checks.map(f=>f==='supabase/checks/rad085-p1-b-ready.sql'?'supabase/checks/assess-staging-ready.sql':f)){
   const results=await selectResults(read(file));assert(results.length>0,file);
   for(const rows of results)for(const row of rows)for(const [key,value] of Object.entries(row))
    if(typeof value==='boolean')assert.equal(value,!['runtime_or_launch_verified','restore_verified'].includes(key),file+':'+key);
  }
 };
 const assertRows=async rows=>{for(const [t,data] of rows)for(const {data:row} of data)assert((await db.query('select exists(select 1 from '+t+' x where to_jsonb(x) @> $1::jsonb) ok',[JSON.stringify(row)]))[0].ok,t);};

 const id=n=>'00000000-0000-0000-0000-'+String(n).padStart(12,'0');
 const asPasted=s=>paste==='crlf'?s.replaceAll('\n','\r\n'):s;
 const readySource=read('supabase/checks/rad085-d3-ready.sql');
 const ready=async phase=>{
  await db.exec(phase==='pre-initializer'?"set rad085.sharing_phase='pre-initializer'":"reset rad085.sharing_phase");
  const start=readySource.indexOf('with objects'),end=readySource.lastIndexOf('rollback;');
  await db.exec(readySource.slice(0,start));
  try{return await db.query(readySource.slice(start,end));}finally{await db.exec('rollback');}
 };
 const allReady=async phase=>{const rows=await ready(phase);assert.equal(rows.length,13);assert.deepEqual(rows.filter(r=>!r.ready),[]);assert(rows.some(r=>r.kind==='sharing_policy:'+phase));};
 const functions=()=>db.query("select p.oid::regprocedure::text sig,replace(pg_get_functiondef(p.oid),E'\\r','') def,p.proowner::regrole::text owner,p.proacl::text acl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','assess') order by 1");
 const tables=()=>db.query("select n.nspname||'.'||c.relname t from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','assess','auth') and c.relkind='r' order by 1");
 const hashes=async()=>{const rows=[];for(const {t} of await tables())rows.push([t,(await db.query('select coalesce(md5(string_agg(to_jsonb(x)::text,\'|\' order by to_jsonb(x)::text)),\'empty\') h from '+t+' x'))[0].h]);return rows;};
 const triggers=()=>db.query("select t.tgrelid::regclass::text tbl,t.tgname,pg_get_triggerdef(t.oid) def,t.tgenabled from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname in ('public','assess','auth') order by 1,2");
 try{
  await db.exec('alter table auth.users add column banned_until timestamptz,add column created_at timestamptz default now();create table auth.sessions(user_id uuid);create table auth.refresh_tokens(user_id text)');
  for(let n=1;n<=3;n++)await db.query("insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),'{\"display_name\":\"SYNTHETIC\",\"consent_version\":\"2026-10-24\"}')",[id(n),'b7-'+n+'@example.test']);
  await db.query("update public.profiles set status='approved',role=case when user_id=$1 then 'owner' else 'participant' end,last_seen_at=now()-interval '2 hours'",[id(1)]);
  const save=async(n,old=false)=>db.query("insert into public.attempts(id,user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale,started_at,finished_at) values($1,$2,$3,'synthetic','synthetic','v1','{}','{}','en',now()-$4::interval,now()-$4::interval)",[id(90+n),id(1),n,old?'2 hours':'0 seconds']);
  await save(1,true);
  await db.query("insert into public.feedback(user_id,exam_id,attempt_id,text,at) values($1,'synthetic',$2,'SYNTHETIC',now()-interval '2 hours')",[id(2),id(91)]);
  await db.query("insert into public.events(user_id,type,payload,at) values($1,'heartbeat','{}',now()-interval '2 hours')",[id(2)]);
  const plainCatalogue=await catalogue();
  const trial=read('scripts/assess/sql/trial-isolation.sql').replaceAll('\n','\r\n');
  await db.exec(trial);
  await db.query("insert into assess.trial_scope(id,owner_id,student_id,outsider_id,assessment_id,version_labels,active) values($1,$2,$3,$4,$5,array['visible','hidden'],true)",[id(80),id(1),id(2),id(3),id(10)]);
  // Rows belong to the original trial, including settled session details, receipts and results.
  await db.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track) values($1,$2,$3,'visible','SYNTHETIC trial','mixed')",[id(20),id(1),id(10)]);
  await db.query('insert into assess.assignments(id,owner_id,version_id) values($1,$2,$3)',[id(21),id(1),id(20)]);
  await db.query('insert into assess.targets values($1,$2)',[id(21),id(2)]);
  await db.port('authenticated',id(2)).call('consent_v2',{p_version:'assess-pilot-2026-10-20-v2'});
  await db.query("insert into assess.sessions(id,assignment_id,user_id,ordinal,state,started_at) values($1,$2,$3,1,'graded',now()-interval '2 hours')",[id(22),id(21),id(2)]);
  await db.query("insert into assess.session_details(session_id,publication,specs,answers) values($1,'{\"synthetic\":true}','[]','{\"a\":\"synthetic\"}')",[id(22)]);
  await db.query("insert into assess.receipts values($1,$2,'synthetic','{}')",[id(22),id(23)]);
  await db.query("insert into assess.results values($1,1,1,1,'SYNTHETIC','mixed','hidden')",[id(22)]);
  await c.query('begin read only');
  const [[saved]]=await selectResults(read(manual+'rad085-db-day-trial-scope-backup.sql'));await c.query('rollback');
  const originalTrialCatalogue=await catalogue();
  const trialRows=[];for(const {t} of await tables())if(t!=='assess.trial_scope')trialRows.push([t,await db.query('select to_jsonb(x) data from '+t+' x')]);
  await nineChecks();
  const backupCounts=await db.query(read(manual+'rad085-db-day-backup/00-counts-before.sql'));
  assert.equal(Number(backupCounts.find(r=>r.table==='assess.trial_scope').row_count),1);
  const removal=read(manual+'rad085-db-day-trial-remove.sql');
  const remove=async()=>{
   const results=await selectResults(removal);assert.equal(results.length,2);
   assert.deepEqual(results[0],[saved]);
   const [v]=results[1];assert.equal(v.trial_objects_absent_ok,true);assert.equal(v.launch_gate_closed_ok,true);assert.equal(v.row_counts_unchanged_ok,true);assert.deepEqual(v.row_counts_before,v.row_counts_after);
   const expected=trialRows.map(([t])=>t).filter(t=>!t.startsWith('auth.')).sort();
   assert.deepEqual(Object.keys(v.row_counts_before).sort(),expected);
   await assertRows(trialRows);await nineChecks();assert.deepEqual(await catalogue(),plainCatalogue);
  };
  const refuse=async(code='55000')=>{
   const before=await hashes(),cat=await catalogue();
   await assert.rejects(c.query(removal),{code});await c.query('rollback');
   assert.deepEqual(await hashes(),before);assert.deepEqual(await catalogue(),cat);
  };
  await db.exec('update assess.launch_gate set enabled=true');await refuse();await db.exec('update assess.launch_gate set enabled=false');
  for(const state of ['active','grading','grading-failed']){await db.query('update assess.sessions set state=$1 where id=$2',[state,id(22)]);await refuse();}
  await db.query("update assess.sessions set state='graded' where id=$1",[id(22)]);
  const precheck=read(manual+'rad085-db-day-precheck.sql');
  const [trialPre]=await db.query(precheck);assert.equal(trialPre.trial_scope_present,true);assert.equal(trialPre.trial_scope_active,true);
  for(const [key,value] of Object.entries(trialPre))if(key.endsWith('_ok'))assert.equal(value,true,key);
  await db.exec("create view public.b8_dependency as select assess.trial_health_v1('00000000-0000-0000-0000-000000000080'::uuid)");
  await refuse('2BP01');await db.exec('drop view public.b8_dependency');
  await remove();
  // Documented disaster-recovery path only: reinstall untouched SQL, then re-arm EXACT saved config.
  await db.exec(trial);
  await db.query('insert into assess.trial_scope select * from jsonb_populate_record(null::assess.trial_scope,$1::jsonb)',[JSON.stringify(saved)]);
  assert.deepEqual(await catalogue(),originalTrialCatalogue);assert.deepEqual(await db.query(read(manual+'rad085-db-day-trial-scope-backup.sql')),[saved]);await assertRows(trialRows);
  await remove();

  const [pre]=await db.query(precheck);assert.equal(pre.trial_scope_present,false);assert.equal(pre.trial_scope_active,null);
  for(const [k,v] of Object.entries(pre)){
   if(k.endsWith('_ok')||k.endsWith('_has_cr'))assert.equal(v,true,k);
   if(k.startsWith('recent_'))assert.equal(Number(v),0,k);
  }
  assert.equal(Object.keys(pre).filter(k=>k.endsWith('_has_cr')).length,4);
  const preFunctions=await functions(),preTriggers=await triggers();
  const preRows=[];for(const {t} of await tables())preRows.push([t,await db.query('select to_jsonb(x) data from '+t+' x')]);
  const before=await db.query(read(manual+'rad085-db-day-backup/00-counts-before.sql'));
  // A real body change still fails precheck; CR normalization grants no other exception.
  const original=(await db.query("select pg_get_functiondef('assess.close_assignment_v1(uuid)'::regprocedure) def"))[0].def;
  await db.exec(original.replace('begin','begin null;'));
  const [drift]=await db.query(precheck);assert.equal(drift.close_assignment_body_ok,false);
  await db.exec(original);
  const migrations=['20261026000100_assess_supervisor_scope.sql','20261026000200_assess_authoring_drafts.sql','20261026000300_assess_assignment_review.sql','20261027000100_assess_management_erasure.sql'];
  for(let i=0;i<migrations.length;i++){
   await db.exec(asPasted(read('supabase/migrations/'+migrations[i])));
   const [p]=await db.query(read(manual+'rad085-db-day-progress.sql'));
   assert.deepEqual([p.m1_scope,p.m2_drafts,p.m3_review,p.m4_d3],migrations.map((_,n)=>n<=i));
   assert.equal(p.trial_objects_absent_ok,true);assert.equal(p.launch_gate_closed,true);assert.equal(Number(p.new_triggers_expected_3_after_m1),3);assert.equal(p.sharing_policy_set,false);
  }
  assert.equal((await db.query("select position(E'\\r' in prosrc)>0 has_cr from pg_proc where oid='assess.appointment_v1(uuid,boolean)'::regprocedure"))[0].has_cr,paste==='crlf');
  await allReady('pre-initializer');
  await db.exec(asPasted(read(manual+'rad085-sharing-policy-live-p1.sql')));
  await allReady('initialized');
  assert.equal((await db.query(read(manual+'rad085-db-day-progress.sql')))[0].sharing_policy_set,true);
  // Both source drift and privilege drift still fail readiness, restored without repinning.
  const health=(await db.query("select pg_get_functiondef('assess.health_v1()'::regprocedure) def"))[0].def;
  await db.exec(health.replace("'failed'","'changed'"));
  assert((await ready('initialized')).some(r=>r.kind==='functions'&&!r.ready));await db.exec(health);
  await db.exec('grant execute on function assess.health_v1() to anon');
  const denied=await ready('initialized');for(const kind of ['functions','effective_privileges'])assert(denied.some(r=>r.kind===kind&&!r.ready));
  await db.exec('revoke execute on function assess.health_v1() from anon');await allReady('initialized');
  await save(2);
  const [smoke]=await db.query(read(manual+'rad085-db-day-smoke.sql'));
  for(const [k,v] of Object.entries(smoke))if(k.endsWith('_ok'))assert.equal(v,true,k);
  assert.equal(smoke.newest_attempt_id,id(92));assert.equal(Number(smoke.attempts_total_expect_before_plus_1),2);
  const counts=new Map((await db.query(read(manual+'rad085-db-day-counts-after.sql'))).map(r=>[r.table,Number(r.row_count)]));
  for(const r of before)assert(counts.get(r.table)>=Number(r.row_count),r.table);
  // Preserve nonempty new tables as well as every original synthetic row.
  assert.equal(Number((await db.query('select count(*) n from assess.practice_recordings'))[0].n),1);
  // P1 works with the launch gate STILL CLOSED: appoint outsider, create group, consent and join.
  const owner=db.port('authenticated',id(1)),supervisor=db.port('authenticated',id(3)),student=db.port('authenticated',id(2));
  await owner.call('appointment_v1',{p_user:id(3),p_appoint:true});
  const policy=(await db.query('select * from assess.sharing_policy'))[0];
  await student.call('sharing_consent_v1',{p_version:policy.required_version,p_digest:policy.text_digest,p_accept:true});
  const group=await supervisor.call('supervisor_group_v1',{p_action:'create',p_name:'SYNTHETIC B8 group',p_ends:new Date(Date.now()+3600000).toISOString()});
  const request=await student.call('join_request_v1',{p_code:group.code});assert.equal(request.outcome,'pending');
  await supervisor.call('join_decide_v1',{p_request:request.id,p_revision:request.revision,p_action:'approve'});
  assert.equal(Number((await db.query('select count(*) n from assess.memberships where group_id=$1 and user_id=$2',[group.id,id(2)]))[0].n),1);
  await assertRows(trialRows);
  const allHashes=await hashes();
  const rollback=read(manual+'rad085-db-day-rollback.sql'),closing=rollback.lastIndexOf('select\n');
  for(let run=0;run<2;run++){
   await db.exec(rollback.slice(0,closing));
   assert.deepEqual((await db.query(rollback.slice(closing)))[0],{triggers_removed:true,owner_id_not_null_not_restored:'0',new_rpc_closed_to_clients:true});
   assert.deepEqual(await hashes(),allHashes);
  }
  const restored=new Map((await functions()).map(f=>[f.sig,f]));for(const f of preFunctions)assert.deepEqual(restored.get(f.sig),f);
  assert.deepEqual(await triggers(),preTriggers);
  // Every original row survives even where RAD-085 added columns to the old table.
  for(const [t,rows] of preRows)for(const {data} of rows)assert((await db.query('select exists(select 1 from '+t+' x where to_jsonb(x) @> $1::jsonb) ok',[JSON.stringify(data)]))[0].ok,t);
  const bodies=await db.query("select position(E'\\r' in prosrc)>0 has_cr from pg_proc where oid in ('assess.assignment_terminal_v1()'::regprocedure,'assess.close_assignment_v1(uuid)'::regprocedure,'assess.content_submit_v1(jsonb)'::regprocedure,'public.owner_account_deletion_v1(text,uuid,uuid,integer)'::regprocedure)");
  assert.equal(bodies.length,4);assert(bodies.every(r=>!r.has_cr));
  await save(3);assert.equal(Number((await db.query('select count(*) n from assess.practice_recordings'))[0].n),1);
  await db.exec("set role authenticated;select set_config('request.jwt.claim.sub','"+id(1)+"',false)");
  await db.query("select public.owner_account_deletion_v1('list')");
  await assert.rejects(db.query('select assess.appointment_v1($1,true)',[id(2)]),{code:'42501'});
  await db.exec('reset role');
  await assertRows(trialRows);
 console.log(JSON.stringify({paste,outcome:'PASS',readyRows:13,rollback:'true/0/true'}));
 }finally{await c.end();await db.close();}
 `;
 const child = spawnSync(process.execPath, ['--input-type=module', '-e', source, paste], { encoding: 'utf8', timeout: 120000, maxBuffer: 100000 });
 expect(child.status, child.stdout + child.stderr).toBe(0);
 expect(JSON.parse(child.stdout)).toEqual({ paste, outcome: 'PASS', readyRows: 13, rollback: 'true/0/true' });
}, 125000);
