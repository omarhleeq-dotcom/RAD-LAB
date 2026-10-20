// Synthetic-only upgrade witness. No URL, project selector, credentials or remote DB support.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {openLocalDatabase} from './local-database.mjs';
const read=p=>readFileSync(`supabase/${p}`,'utf8');
const pre=read('checks/assess-retention-preinstall.sql'),post=read('checks/assess-retention-postinstall.sql');
const manual=read('manual/assess-original-retention-install.sql');
const checks=[];let db,backend,lineEndings,phase='configuration',outcome='STOP',cleanup=true;
try {
 const args=process.argv.slice(2);assert.equal(args.length,3);assert(args.includes('--synthetic-disposable'));
 backend=args.find(a=>a.startsWith('--backend='))?.slice(10);assert(['pglite','postgres'].includes(backend));
 lineEndings=args.find(a=>a.startsWith('--line-endings='))?.slice(15);assert(['lf','crlf'].includes(lineEndings));
 phase='setup';db=await openLocalDatabase(backend,{through:'f',lineEndings});const {exec,query,port}=db;
 const run=lineEndings==='crlf'?manual.replaceAll('\n','\r\n'):manual;
 const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
 for(const n of [1,2])await query('insert into auth.users values($1,$2,now(),$3)',[id(n),`fixture${n}@example.test`,JSON.stringify({display_name:'Synthetic',consent_version:'2026-10-17'})]);
 await exec(`update public.profiles set status='approved';update public.profiles set role='owner' where user_id='${id(1)}';`);
 const owner=port('authenticated',id(1)),student=port('authenticated',id(2));
 await student.call('consent_v1',{p_version:'assess-pilot-2026-10-20-v1'});
 await query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values($1,$2,$1,'1','Synthetic upgrade','mixed',true)",[id(10),id(1)]);
 await query('insert into assess.assignments(id,owner_id,version_id) values($1,$2,$3)',[id(11),id(1),id(10)]);
 await query('insert into assess.targets values($1,$2)',[id(11),id(2)]);
 await query('insert into assess.reservations(assignment_id,user_id,used) values($1,$2,1)',[id(11),id(2)]);
 await query("insert into assess.sessions(id,assignment_id,user_id,ordinal,started_at,deadline) values($1,$2,$3,1,clock_timestamp(),clock_timestamp()+interval '1 hour')",[id(20),id(11),id(2)]);
 await query("insert into assess.session_details(session_id,publication,specs) values($1,'{\"assessment\":{}}','{}')",[id(20)]);
 const practiceInsert="insert into public.attempts(user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale) values($1,1,'synthetic','synthetic','1','{}','{}','en')";
 await query(practiceInsert,[id(2)]);
 async function inspect(sql){
  await exec("begin read only;set local search_path=''");
  try{return (await query(sql.slice(sql.indexOf('with catalogue as ('),sql.lastIndexOf(';\nrollback;'))))[0];}
  finally{await exec('rollback');}
 }
 const state=async()=>{
  const functions=await query("select p.proname,pg_get_functiondef(p.oid) def,p.proacl::text acl from pg_proc p where (p.pronamespace='public'::regnamespace or (p.pronamespace='assess'::regnamespace and p.proname not in ('consent_v1','require_consent_v1','start_v1','maintain_v1','assignment_terminal_v1','close_assignment_v1','disable_account_v1','consent_v2'))) order by p.oid");
  // The administrative fixture connection is single; only port() opens independent transactions.
  const rows=[];
  for(const t of ['public.profiles','public.attempts','public.events','public.feedback','assess.versions','assess.assignments','assess.targets','assess.consents','assess.sessions','assess.reservations','assess.session_details','assess.receipts','assess.results'])rows.push(await query(`select to_jsonb(t)-'closed_at' v from ${t} t order by to_jsonb(t)::text`));
  return {functions,rows};
 };
 const before=await state();assert.equal((await inspect(pre)).baseline_matches,true);
 checks.push('existing-f-v1-active-practice-baseline');
 phase='preconditions';
 async function reject(change,field,restore){
  await exec(change);
  try{assert.equal((await inspect(pre))[field],false);await assert.rejects(()=>exec(run),/Retention precondition failed/);await exec('rollback');}
  finally{await exec('rollback');await exec(restore);}
  assert.equal((await inspect(pre)).baseline_matches,true);assert.deepEqual(await state(),before);
 }
 const drift=[
  ['grant select on assess.consents to authenticated','bcdef_catalogue_ready','revoke select on assess.consents from authenticated'],
  ['grant select(version) on assess.consents to authenticated','no_direct_column_grants','revoke select(version) on assess.consents from authenticated'],
  ['update assess.launch_gate set enabled=true','launch_gate_closed','update assess.launch_gate set enabled=false'],
  ['create table assess.account_stops(user_id uuid)','retention_absent','drop table assess.account_stops'],
  ['alter table assess.assignments add column closed_at timestamptz','retention_absent','alter table assess.assignments drop column closed_at'],
  ['create index assess_sessions_user on assess.sessions(user_id)','retention_absent','drop index assess.assess_sessions_user'],
  ['alter table assess.consents alter column accepted_at drop not null','schema_shape_matches','alter table assess.consents alter column accepted_at set not null'],
  ['alter table assess.consents disable row level security','bcdef_catalogue_ready','alter table assess.consents enable row level security'],
  ['alter table assess.sessions disable trigger assess_session_consent','trigger_contract_matches','alter table assess.sessions enable trigger assess_session_consent'],
  ['create trigger unexpected_fixture before insert on assess.sessions for each row execute function public.handle_new_user()','trigger_contract_matches','drop trigger unexpected_fixture on assess.sessions'],
  ['alter function assess.result_v1(uuid) rename to missing_result_fixture','bcdef_catalogue_ready','alter function assess.missing_result_fixture(uuid) rename to result_v1']
 ];
 for(const args of drift)await reject(...args);
 const old=(await query("select pg_get_functiondef(oid) definition,prosrc body from pg_proc where oid='assess.start_v1(uuid,uuid)'::regprocedure"))[0];
 for(const body of [` ${old.body}`,old.body.replace(lineEndings==='crlf'?'\r\n':'\n',lineEndings==='crlf'?'\n':'\r\n'),old.body.replaceAll(lineEndings==='crlf'?'\r\n':'\n','\r')])await reject(old.definition.replace(old.body,()=>body),'bcdef_source_bodies_match',old.definition);
 checks.push('drift-acl-column-rls-gate-source-schema-trigger-missing-partial-rejected');
 phase='atomic-rollback';
 const end=/-- SOURCE RETENTION END\r?\n/;
 await assert.rejects(()=>exec(run.replace(end,()=>"-- SOURCE RETENTION END\ndo $$begin raise exception 'synthetic retention rollback';end$$;\n")),/synthetic retention rollback/);await exec('rollback');
 assert.equal((await inspect(pre)).baseline_matches,true);assert.deepEqual(await state(),before);
 // Force postcondition failure AFTER all DDL, not just a statement exception.
 await assert.rejects(()=>exec(run.replace(end,'-- SOURCE RETENTION END\ngrant select on assess.account_stops to authenticated;\n')),/Retention postcondition failed/);await exec('rollback');
 assert.equal((await inspect(pre)).baseline_matches,true);assert.deepEqual(await state(),before);
 checks.push('ddl-exception-entire-upgrade-rollback','postcondition-entire-upgrade-rollback');
 phase='install';await exec(run);const installed=await inspect(post);
 assert.equal(installed.contract,'assess-retention-install/1');
 for(const k of ['read_only','retention_catalogue_ready','retention_source_bodies_match','schema_shape_matches','no_direct_column_grants','trigger_contract_matches','launch_gate_closed','installation_valid'])assert.equal(installed[k],true);
 for(const k of ['backup_verified','recovery_verified','provider_backups_verified','runtime_or_launch_verified'])assert.equal(installed[k],false);
 assert.deepEqual(await state(),before);assert.equal((await inspect(pre)).retention_absent,false);
 await assert.rejects(()=>exec(run),/Retention precondition failed/);await exec('rollback');assert.deepEqual(await state(),before);
 assert.deepEqual(await student.call('consent_v2',{}),{accepted:false});await assert.rejects(()=>student.call('consent_v2',{p_version:'assess-pilot-2026-10-20-v1'}),{code:'22023'});
 checks.push('committed-catalogue-and-private-acl-match','v1-active-data-and-practice-preserved','no-implicit-v2','replay-rejected');
 phase='post-drift';
 async function detect(change,field,restore){await exec(change);try{const row=await inspect(post);assert.equal(row[field],false);assert.equal(row.installation_valid,false);}finally{await exec(restore);}assert.equal((await inspect(post)).installation_valid,true);}
 await detect('grant select on assess.account_stops to authenticated','retention_catalogue_ready','revoke select on assess.account_stops from authenticated');
 await detect('grant select(disabled_at) on assess.account_stops to assess_worker','no_direct_column_grants','revoke select(disabled_at) on assess.account_stops from assess_worker');
 await detect('alter table assess.account_stops disable row level security','retention_catalogue_ready','alter table assess.account_stops enable row level security');
 await detect('alter table assess.assignments disable trigger assess_assignment_terminal','trigger_contract_matches','alter table assess.assignments enable trigger assess_assignment_terminal');
 await detect('drop trigger assess_assignment_terminal on assess.assignments;create trigger assess_assignment_terminal before update on assess.assignments for each row execute function assess.assignment_terminal_v1()','trigger_contract_matches','drop trigger assess_assignment_terminal on assess.assignments;create trigger assess_assignment_terminal before update or delete on assess.assignments for each row execute function assess.assignment_terminal_v1()');
 await detect('alter table assess.account_stops alter column disabled_at drop not null','schema_shape_matches','alter table assess.account_stops alter column disabled_at set not null');
 const terminal=(await query("select pg_get_functiondef(oid) definition,prosrc body from pg_proc where oid='assess.assignment_terminal_v1()'::regprocedure"))[0];
 await detect(terminal.definition.replace(terminal.body,()=>` ${terminal.body}`),'retention_source_bodies_match',terminal.definition);
 checks.push('postinstall-detects-acl-column-rls-trigger-shape-source-drift');
 phase='active-settlement';await owner.call('close_assignment_v1',{p_assignment:id(11)});await student.call('disable_account_v1',{p_user:id(2)});
 assert.equal((await student.call('read_session_v1',{p_session:id(20)})).ack.state,'active');
 assert.equal((await student.call('command_v1',{p_session:id(20),p_operation:id(30),p_revision:0,p_action:{type:'submit'}})).state,'grading');
 assert.equal((await query('select count(*)::int n from assess.results'))[0].n,0);
 await exec('begin;set local role authenticated');
 try{await query("select set_config('request.jwt.claim.sub',$1,true)",[id(2)]);await query(practiceInsert.replace(',1,',',2,'),[id(2)]);}
 finally{await exec('rollback');}
 assert.equal((await inspect(post)).installation_valid,true);
 checks.push('close-disable-preserve-active-settlement-no-fake-grade','practice-write-still-authorized','gate-remains-closed');
 outcome='PASS';phase='complete';
}catch{/* Never emit raw SQL exceptions, identifiers, rows, answers or grades. */}
finally{try{if(db)await db.close();}catch{cleanup=false;outcome='STOP';phase='cleanup_failed';}}
console.log(JSON.stringify({contract:'assess-retention-install-rehearsal/1',backend:backend==='postgres'?'postgres-local':backend==='pglite'?'pglite-serialized':'invalid',lineEndings,outcome,code:phase,checks,cleanup,backupVerified:false,restoreVerified:false,providerBackupsVerified:false,runtimeOrLaunchVerified:false}));
if(outcome!=='PASS')process.exitCode=1;
