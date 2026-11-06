/** C1/C2 production-schema promotion and adversarial witnesses; synthetic local DB only. */
import {describe,expect,it} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import type {QueryResult} from 'pg';
import {openRad085Database} from './rad085-local-db';
import {catalogueFixture,modes,sql} from './rad062-m09-fixture';
import {fixture,id} from './selfservice-fixture';
import {executeGradingWorker} from './server-worker';
import {createGradingWorkerBinding} from './server-runtime';
import {gcsWitnessStore,type WitnessStore,type StoredWitness} from './witness';

const {productionApplicationSql}=await import('../../../scripts/assess/'+'rad085-production-shape.mjs') as {productionApplicationSql:()=>string};
import {ledger,successor,gatePredicate} from '../../../scripts/assess/selfservice-gate-checks.mjs';
const {checks}=await import('../../../scripts/assess/'+'rad062-db-day.mjs') as {checks:(db:unknown,files?:string[])=>Promise<{checks_passed:number}>};
const migration=sql('20261102000300_rad085_rights_write_disclosures.sql');
const old=execFileSync('git',['show','3d812890330b9f0d7bf7e0c943a5d988fa25e679:supabase/migrations/20261102000300_rad085_rights_write_disclosures.sql'],{encoding:'utf8'});
const preflight=(source:string)=>source.slice(source.indexOf('with functions as ('),source.indexOf(' ) reviewed),false)'));
const promoted=['20261105000100_rad105_windows.sql','20261105000200_rad105_witness.sql'];
const ready=readFileSync('supabase/checks/selfservice-rad085-review-ready.sql','utf8');
const flatten=(r:unknown)=>(r as QueryResult[]).flatMap(x=>x.rows);
it('byte-exact promotion, immutable originals, complete gate-reference classification, rendered successor pins',()=>{
 for(const [i,f] of promoted.entries()) expect(readFileSync('supabase/migrations/'+f)).toEqual(readFileSync('supabase/staged/self-service/'+['p1-windows.sql','p5-witness.sql'][i]));
 expect(Object.keys(ledger.files).sort()).toEqual(readdirSync('supabase/checks').filter(f=>f.endsWith('.sql')&&readFileSync('supabase/checks/'+f,'utf8').includes('launch_gate')).filter(f=>!f.startsWith('selfservice-')).sort());
 expect(Object.keys(ledger.files)).toHaveLength(20);
 for(const [f,entry] of Object.entries(ledger.files)) {
  const original=readFileSync('supabase/checks/'+f,'utf8');
  expect(createHash('sha256').update(original).digest('hex')).toBe(entry.sha256);
  expect(original).toBe(execFileSync('git',['show','6c4b985:supabase/checks/'+f],{encoding:'utf8'}));
  if(entry.kind==='expected-state') {expect(successor(f)).toContain(gatePredicate);expect(successor(f)).not.toMatch(/\bgate_closed\b/);}
  else expect(successor(f)).toBe(original);
 }
 for(const f of ['rad085-review-ready.sql',...['mixed','practical','history','retention'].map(x=>'assess-'+x+'-ready.sql')]) expect(readFileSync('supabase/checks/selfservice-'+f,'utf8')).toBe(successor(f));
});
describe.each(modes)('C1/C2 production promotion %s',mode=>{
 it('calibrated catalogue, readiness, expected gate state and mutation rejection',async()=>{
  const db=mode==='embedded'?await openRad085Database(undefined,[]):await catalogueFixture(mode);
  try {
   // Replace synthetic objects with byte-exact dump sections, including Auth FKs,
   // production function bodies and all ACL/default ACL statements in this scope.
   const roles=[...readFileSync('supabase/fixtures/production-schema-2026-11-01/roles.sql','utf8').matchAll(/^CREATE ROLE ([a-z_]+);$/gm)].map(m=>m[1]);
   const bootstrapSql='drop schema assess cascade;drop schema public cascade;drop schema auth cascade;create schema public authorization postgres;'+roles.map(role=>
    `do $$begin if not exists(select 1 from pg_roles where rolname='${role}') then create role ${role} nologin;end if;end$$;`).join('\n')+productionApplicationSql()+"grant assess_job_a to postgres with admin option, inherit false, set false;grant pg_signal_backend to postgres;";
   if(mode==='embedded'){
    // Preserve PG18's immutable initial superuser; execute application SQL as a
    // separate non-superuser postgres, matching the pinned provider image.
    await db.admin.query('create role rad085_fixture_bootstrap superuser login');
    const bootstrap=await db.connect('fixture-bootstrap','rad085_fixture_bootstrap');
    try{
     await bootstrap.query('alter role postgres rename to rad085_initial_superuser;create role postgres login nosuperuser createdb createrole;alter database postgres owner to postgres');
     await bootstrap.query(bootstrapSql);
    }finally{await bootstrap.end();}
    await db.admin.end();db.admin=await db.connect();
   }
   else {
    // Provider-owned dump objects require the local image's bootstrap identity.
    // Use its existing peer map inside the container; no host auth/HBA change.
    const names=execFileSync('docker',['ps','--filter',`name=rad062-m09-${process.pid}-`,'--format','{{.Names}}'],{encoding:'utf8'}).trim().split('\n');
    expect(names).toHaveLength(1);expect(names[0]).toMatch(new RegExp(`^rad062-m09-${process.pid}-[0-9]+$`));
    execFileSync('docker',['exec','-i',names[0]!,'psql','-X','-v','ON_ERROR_STOP=1','-U','supabase_admin','-d','rad_restore','-f','-'],{input:bootstrapSql,stdio:'pipe',timeout:120000,maxBuffer:64*1024*1024});
   }
   expect((await db.admin.query('select current_user,rolsuper from pg_roles where rolname=current_user')).rows[0]).toEqual({current_user:'postgres',rolsuper:false});
   for(const [file,table] of [
    ['20261020000700_assess_lifecycle.sql','launch_gate'],['20261026000100_assess_supervisor_scope.sql','scope_lock'],
    ['20261027000100_assess_management_erasure.sql','erasure_fk_contract'],['20261026000100_assess_supervisor_scope.sql','sharing_policy'],
   ]) {
    const statements=[...sql(file).matchAll(new RegExp(`^insert into assess\\.${table} [^;]+;`,'gm'))];
    expect(statements).toHaveLength(1);await db.admin.query(statements[0]![0]);
   }
   await db.admin.query(readFileSync('supabase/manual/rad085-sharing-policy-live-p1.sql','utf8'));
   for(const f of ['20261030000100_rad062_full_name.sql','20261030000200_rad062_provenance_v2.sql','20261030000300_rad062_authoring_limits.sql','20261030000400_rad062_random_pool.sql','20261030000500_rad062_manual_foundation_freeze.sql','20261030000600_rad062_lifecycle_v2.sql','20261030000700_rad062_manual_grading.sql','20261030000800_rad062_erasure_operations.sql'])await db.admin.query(sql(f));
   await db.admin.query(sql());await db.admin.query(sql('20261102000200_rad059_emergency_alternate.sql'));
   await db.admin.query('set search_path=public');
   expect((await db.admin.query(preflight(old))).rows.filter(r=>!r.ok).map(r=>r.check_name)).toEqual(['functions','relations']);
   await expect(db.admin.query(old)).rejects.toMatchObject({code:'55000',message:'RAD085 reviewed post-0200 catalogue required'});
   await db.admin.query('rollback;set search_path=public');
   const failures=async()=>(await db.admin.query(preflight(migration))).rows.filter(r=>r.ok!==true).map(r=>r.check_name);
   expect(await failures()).toEqual([]);
   // Only this exact regprocedure AND return type are exempt. Other platform-like
   // names/signatures and production body/ACL drift must remain visible.
   for(const [change,expected] of [
    ["create or replace function public.rls_auto_enable() returns event_trigger language plpgsql as $$begin end$$",[]],
    ["drop function public.rls_auto_enable();create function public.rls_auto_enable() returns text language sql as $$select 'synthetic'::text$$",['functions']],
    ["create function public.rls_auto_enable(integer) returns text language sql as $$select 'synthetic'::text$$",['functions']],
    ["create function public.other_platform_trigger() returns event_trigger language plpgsql as $$begin end$$",['functions']],
    ["drop function public.rls_auto_enable();create function public.other_platform_trigger() returns event_trigger language plpgsql as $$begin end$$",['functions']],
    ["revoke references,trigger,truncate,maintain on public.events from service_role",['relations']],
    ["do $x$declare r record;begin select prosrc,pg_get_functiondef(oid) def into r from pg_proc where oid='public.owner_list_participants()'::regprocedure;execute replace(r.def,r.prosrc,r.prosrc||E'\\n-- synthetic body drift');end$x$",['functions']],
   ] as const){
    await db.admin.query('begin');
    try{await db.admin.query(change);expect(await failures()).toEqual(expected);}
    finally{await db.admin.query('rollback');}
   }
   await db.admin.query(migration);

   const snapshot=async()=>{
    const prefix=ready.slice(ready.indexOf('with functions as ('),ready.indexOf('), fingerprints as ('));
    return (await db.admin.query(prefix+") select 'function' kind,signature name,to_jsonb(f) doc from functions f union all select 'relation',nspname||'.'||relname,to_jsonb(r) from relations r")).rows;
   };
   expect(flatten(await db.admin.query(readFileSync('supabase/checks/rad085-review-ready.sql','utf8'))).filter(r=>r.ok!==true)).toEqual([]);
   const beforePromotion=await snapshot();
   // Both promoted migrations require the closed gate and retain exact staged bytes.
   for(const file of promoted) await db.admin.query(sql(file));
   const afterPromotion=await snapshot();
   const added=afterPromotion.filter(r=>!beforePromotion.some(b=>b.kind===r.kind&&b.name===r.name)).map(r=>r.name).sort();
   expect(added).toEqual(['assess.assignment_status_v1(uuid,uuid,integer)','assess.assignment_window_set_v1(uuid,integer,timestamp with time zone,timestamp with time zone)','assess.assignment_windows','assess.my_windows_v1(uuid[])','assess.owner_resume_v1(text)','assess.restore_epoch','assess.window_deadline_v1(uuid,timestamp with time zone,integer)','assess.window_guard_v1(uuid)','assess.witness_accept_v1(text)'].sort());
   const changed=beforePromotion.filter(b=>JSON.stringify(b.doc)!==JSON.stringify(afterPromotion.find(a=>a.kind===b.kind&&a.name===b.name)?.doc));
   expect(changed.map(r=>r.name).sort()).toEqual(['assess.health_v1()','assess.start_v2(uuid,uuid)']);
   const setGate=async(state:boolean)=>db.admin.query('update assess.launch_gate set enabled=$1',[state]);
   const check=async()=>flatten(await db.admin.query(ready));
   expect((await db.admin.query('select '+gatePredicate+' ok')).rows[0].ok).toBe(false);
   await db.admin.query("set radlab.expected_gate='closed'");
   const rows=await check();
   console.info('C1 production fingerprints',mode,JSON.stringify(rows.filter(r=>r.actual)));
   expect(rows.filter(r=>r.ok!==true)).toEqual([]);expect(rows).toHaveLength(11);
   for(const file of ['selfservice-ready.sql']) expect(flatten(await db.admin.query(readFileSync('supabase/checks/'+file,'utf8'))).filter(r=>r.ok!==true)).toEqual([]);
   // Unspecified/invalid expectation, wrong state, absent row and corrupted multi-row gate all fail.
   for(const actual of [false,true]) {
    await setGate(actual);
    for(const expected of ['closed','open','','INVALID','true','OPEN']) {
     await db.admin.query("select set_config('radlab.expected_gate',$1,false)",[expected]);
     const ok=(await db.admin.query('select '+gatePredicate+' ok')).rows[0].ok;
     expect(ok).toBe(expected===(actual?'open':'closed'));
     expect((await check()).find(r=>r.check_name==='gate_state_expected')?.ok).toBe(ok);
     for(const file of ['mixed','practical','history','retention'].map(x=>'assess-'+x+'-ready.sql')) {
      const original=flatten(await db.admin.query(readFileSync('supabase/checks/'+file,'utf8')));
      const rendered=flatten(await db.admin.query(successor(file)));
      expect(rendered.map(({gate_state_expected,...rest})=>{expect(gate_state_expected,file).toBe(ok);return rest;})).toEqual(original.map(({launch_gate_closed: ignored,...rest})=>{void ignored;return rest;}));
     }
     // Every generated state assertion (including preinstall CTE form) evaluates the same strict predicate.
     for(const [file,entry] of Object.entries(ledger.files)) if(entry.kind==='expected-state') {
      const rendered=successor(file);
      const count=entry.replacements.reduce((n,x)=>n+x.count,0);
      expect(rendered.split(gatePredicate).length-1,file).toBe(count);
     }
    }
   }
   await db.admin.query("set radlab.expected_gate='closed'");await setGate(false);
   for(const change of [
    'delete from assess.launch_gate',
    'alter table assess.launch_gate drop constraint launch_gate_singleton_check;insert into assess.launch_gate values(false,false)',
    'alter table assess.launch_gate drop constraint launch_gate_singleton_check;update assess.launch_gate set singleton=false',
   ]) {
    await db.admin.query('begin');try {await db.admin.query(change);expect((await db.admin.query('select '+gatePredicate+' ok')).rows[0].ok).toBe(false);}finally{await db.admin.query('rollback');}
   }
   // Original emergency-stop packets must NOT accept an open gate.
   await setGate(true);
   for(const file of ['assess-emergency-stopped.sql','assess-emergency-stopped-v2.sql']) expect(successor(file)).toBe(readFileSync('supabase/checks/'+file,'utf8'));
   await setGate(false);
   // The existing installation runner explicitly declares CLOSED, restores its input, and cannot accept OPEN.
   await db.admin.query('reset radlab.expected_gate');
   expect(await checks(db.admin,['supabase/checks/selfservice-rad085-review-ready.sql','supabase/checks/selfservice-ready.sql'])).toEqual({checks_passed:2});
   expect((await db.admin.query('select '+gatePredicate+' ok')).rows[0].ok).toBe(false);
   for(const setting of ['open','INVALID']) {
    await db.admin.query("select set_config('radlab.expected_gate',$1,false)",[setting]);
    await expect(checks(db.admin,['supabase/checks/selfservice-ready.sql'])).rejects.toThrow('closed_installation_check_required');
    expect((await db.admin.query("select current_setting('radlab.expected_gate') v")).rows[0].v).toBe(setting);
   }
   await db.admin.query('reset radlab.expected_gate');await setGate(true);
   await expect(checks(db.admin,['supabase/checks/selfservice-rad085-review-ready.sql'])).rejects.toThrow('required_check_failed:');
   expect((await db.admin.query('select '+gatePredicate+' ok')).rows[0].ok).toBe(false);
   await setGate(false);await db.admin.query("set radlab.expected_gate='closed'");
   const w1="create role assess_grading_worker nologin;grant execute on function assess.maintain_v1(integer),assess.claim_v1(),assess.finish_v1(uuid,uuid,text,text),assess.fail_v1(uuid,uuid),assess.health_v1() to assess_grading_worker;";
   const mutations:[string,string[]][]=[
    [w1,[]],
    [w1+'grant execute on function assess.read_session_v2(uuid) to assess_grading_worker',['functions']],
    [w1+'grant execute on function assess.health_v1() to assess_grading_worker with grant option',['functions']],
    ['grant execute on function assess.window_guard_v1(uuid) to authenticated',['functions']],
    ["alter function assess.health_v1() set work_mem='8MB'",['functions']],
    ["do $x$declare r record;begin select prosrc,pg_get_functiondef(oid) def into r from pg_proc where oid='assess.start_v2(uuid,uuid)'::regprocedure;execute replace(r.def,r.prosrc,r.prosrc||E'\\n-- synthetic drift');end$x$",['functions']],
    ['grant select on assess.assignment_windows to authenticated',['relations']],
    ['alter table assess.restore_epoch disable row level security',['relations']],
    ["alter table assess.assignment_windows drop constraint assignment_windows_check",['relations']],
   ];
   for(const [change,expected] of mutations) {
    // ready owns BEGIN/ROLLBACK, so mutation and check share its transaction.
    const mutated=ready.replace('begin read only;','begin;'+change+';');
    expect(flatten(await db.admin.query(mutated)).filter(r=>r.ok!==true).map(r=>r.check_name),change).toEqual(expected);
   }
   // Readiness data invariant mutation, independent of catalogue fingerprints.
   const witness=readFileSync('supabase/checks/selfservice-ready.sql','utf8');
   expect(flatten(await db.admin.query(witness.replaceAll('begin read only;','begin;delete from assess.restore_epoch;'))).filter(r=>!r.ok).map(r=>r.check_name)).toEqual(['witness_singleton']);
   expect((await check()).filter(r=>r.ok!==true)).toEqual([]);
   // S2 is a separate forward migration. All S1 oracles above remain literal and independent.
   const beforeS2=await snapshot();
   await db.admin.query(sql('20261105000300_rad105_selfservice_s2.sql'));
   const afterS2=await snapshot();
   const deltaS2=beforeS2.filter(b=>JSON.stringify(b.doc)!==JSON.stringify(afterS2.find(a=>a.kind===b.kind&&a.name===b.name)?.doc)).map(r=>r.name).sort();
   console.info('S2 changed existing catalogue',mode,JSON.stringify(deltaS2));
   expect(deltaS2).toEqual(['assess.assignment_window_set_v1(uuid,integer,timestamp with time zone,timestamp with time zone)',
    'assess.assignment_windows','assess.assignments','assess.owner_resume_v1(text)','assess.sessions','assess.start_v2(uuid,uuid)',
    'assess.supervisor_appointments','assess.targets','assess.window_deadline_v1(uuid,timestamp with time zone,integer)','emergency.audit','emergency_alternate_read_v1(bigint,integer)'].sort());
   const addedS2=afterS2.filter(r=>!beforeS2.some(b=>b.kind===r.kind&&b.name===r.name)).map(r=>r.name).sort();
   console.info('S2 added catalogue',mode,JSON.stringify(addedS2));
   expect(addedS2).toEqual(['all_students_assignments','assessment_notices','assessment_notify_settings','assignment_accommodations','stop_active_attempts'].map(n=>'assess.'+n).concat([
    'assignment_schedule_v2(uuid,integer,timestamp with time zone,timestamp with time zone)','extra_time_v1(uuid,uuid,integer)','new_attempt_v1(uuid,uuid)',
    'notice_dispatch_v1()','notice_post_v1(text,timestamp with time zone)','notice_refresh_v1()','notice_switch_v1(boolean)','own_assignment_v1(uuid)',
    'pool_recommendation_v1(uuid)','quiz_capability_v1()','quiz_close_v1(uuid,integer)','quiz_page_v1(uuid,integer)','quiz_permission_reset_v1()',
    'quiz_permission_v1(uuid,boolean)','quiz_permissions_v1(uuid,integer)','quiz_publish_v1(uuid,uuid,timestamp with time zone,timestamp with time zone)',
    'quiz_recipient_v1(uuid)','s2_audit_v1(text,jsonb,bigint)','selfservice_audit_v1(bigint,integer)','stop_active_capture_v1()'].map(n=>'assess.'+n)).sort());
   const s2Ready=readFileSync('supabase/checks/selfservice-s2-rad085-review-ready.sql','utf8');
   const s2Rows=flatten(await db.admin.query(s2Ready));
   console.info('S2 fresh production fingerprints',mode,JSON.stringify(s2Rows.filter(r=>r.actual)));
   expect(s2Rows.filter(r=>r.ok!==true)).toEqual([]);
   for(const change of [
    'grant execute on function assess.notice_dispatch_v1() to authenticated',
    'grant execute on function assess.quiz_recipient_v1(uuid) to authenticated',
    "do $m$declare d text;begin d:=pg_get_functiondef('assess.quiz_publish_v1(uuid,uuid,timestamptz,timestamptz)'::regprocedure);execute replace(d,'and all_students)','and true)');end$m$",
    'alter table assess.assignment_accommodations disable row level security',
    'alter table assess.assignment_accommodations drop constraint assignment_accommodations_extra_seconds_check',
   ]) {
    const altered=s2Ready.replace('begin read only;','begin;'+change+';');
    expect(flatten(await db.admin.query(altered)).filter(r=>r.ok!==true).map(r=>r.check_name)).toEqual([change.startsWith('alter table')?'relations':'functions']);
   }
   expect(flatten(await db.admin.query(readFileSync('supabase/checks/selfservice-s2-ready.sql','utf8'))).filter(r=>r.ok!==true)).toEqual([]);
   // S3 is additive: every S1/S2 oracle above is preserved and runs first.
   const beforeS3=await snapshot();
   await db.admin.query(sql('20261105000400_rad105_eligibility_read.sql'));
   await db.admin.query(sql('20261105000500_rad105_ui_reads.sql'));
   const afterS3=await snapshot();
   expect(beforeS3.filter(b=>JSON.stringify(b.doc)!==JSON.stringify(afterS3.find(a=>a.kind===b.kind&&a.name===b.name)?.doc))).toEqual([]);
   expect(afterS3.filter(a=>!beforeS3.some(b=>b.kind===a.kind&&b.name===a.name)).map(a=>a.name).sort()).toEqual(['assess.attempt_eligibility_page_v1(uuid,uuid,integer)','assess.student_exams_page_v1(uuid,integer)','assess.history_page_v2(uuid,integer)','assess.selfservice_metadata_page_v1(text,uuid,integer)'].sort());
   const s3Ready=readFileSync('supabase/checks/selfservice-s3-rad085-review-ready.sql','utf8');
   const s3Rows=flatten(await db.admin.query(s3Ready));
   console.info('S3 fresh production fingerprints',mode,JSON.stringify(s3Rows.filter(r=>r.actual)));
   expect(s3Rows.filter(r=>r.ok!==true)).toEqual([]);
   for(const change of [
    'grant execute on function assess.attempt_eligibility_page_v1(uuid,uuid,integer) to anon',
    "alter function assess.attempt_eligibility_page_v1(uuid,uuid,integer) set work_mem='8MB'",
    "do $m$declare d text;begin d:=pg_get_functiondef('assess.attempt_eligibility_page_v1(uuid,uuid,integer)'::regprocedure);execute replace(d,'p_limit not between 1 and 100','p_limit not between 1 and 101');end$m$",
   ]) expect(flatten(await db.admin.query(s3Ready.replace('begin read only;','begin;'+change+';'))).filter(r=>r.ok!==true).map(r=>r.check_name)).toEqual(['functions']);
   expect(flatten(await db.admin.query(readFileSync('supabase/checks/selfservice-s3-ready.sql','utf8'))).filter(r=>r.ok!==true)).toEqual([]);
   const beforeS4=await snapshot();
   await db.admin.query(sql('20261105000600_rad105_worker_health.sql'));
   const afterS4=await snapshot();
   expect(beforeS4.filter(b=>JSON.stringify(b.doc)!==JSON.stringify(afterS4.find(a=>a.kind===b.kind&&a.name===b.name)?.doc))).toEqual([]);
   expect(afterS4.filter(a=>!beforeS4.some(b=>a.kind===b.kind&&a.name===b.name)).map(a=>a.name)).toEqual(['assess.worker_health_v2()']);
   const s4Ready=readFileSync('supabase/checks/selfservice-s4-rad085-review-ready.sql','utf8');
   const s4Rows=flatten(await db.admin.query(s4Ready));
   console.info('S4 independent production fingerprints',mode,JSON.stringify(s4Rows.filter(r=>r.actual)));
   expect(s4Rows.filter(r=>r.ok!==true)).toEqual([]);
   for(const change of [
    'grant execute on function assess.worker_health_v2() to authenticated',
    "alter function assess.worker_health_v2() set work_mem='8MB'",
    "do $m$declare d text;begin d:=pg_get_functiondef('assess.worker_health_v2()'::regprocedure);execute replace(d,'old-''witness''','old');end$m$",
   ])expect(flatten(await db.admin.query(s4Ready.replace('begin read only;','begin;'+change+';'))).filter(r=>r.ok!==true).map(r=>r.check_name)).toEqual(['functions']);


   // Successor calibration runs only AFTER every protected earlier oracle/mutation.
   // The approved W1 TEMP redistribution precedes backup creation, as in production.
   await db.admin.query(readFileSync('supabase/manual/assess-grading-worker-provision.sql','utf8'));
   await db.admin.query(readFileSync('supabase/manual/assess-grading-worker-public-temp.sql','utf8'));
   const {readInventory,grantPacket}=await import('../../../scripts/ops/'+'cloud-backup-contract.mjs') as {readInventory:(db:unknown)=>Promise<unknown>;grantPacket:(v:unknown)=>string};
   const backupPacket=grantPacket(await readInventory(db.admin));
   const applyBackup="set radlab.backup_apply='reviewed-select-only';"+backupPacket;
   if(mode==='embedded'){
    const bootstrap=await db.connect('backup-fixture-bootstrap','rad085_fixture_bootstrap');
    try{await bootstrap.query(applyBackup);}finally{await bootstrap.end();}
   }else{
    const name=execFileSync('docker',['ps','--filter',`name=rad062-m09-${process.pid}-`,'--format','{{.Names}}'],{encoding:'utf8'}).trim();
    expect(name).toMatch(new RegExp(`^rad062-m09-${process.pid}-[0-9]+$`));
    execFileSync('docker',['exec','-i',name,'psql','-X','-v','ON_ERROR_STOP=1','-U','supabase_admin','-d','rad_restore','-f','-'],{input:applyBackup,stdio:'pipe',timeout:120000});
   }
   await db.admin.query('set search_path=public');
   const backed=await snapshot();
   expect(afterS4.filter(b=>b.kind==='function'&&JSON.stringify(b.doc)!==JSON.stringify(backed.find(a=>a.kind===b.kind&&a.name===b.name)?.doc))).toEqual([]);
   // Only the approved relation ACL/policy fields may change; bodies/columns/FKs stay exact.
   for(const old of afterS4.filter(b=>b.kind==='relation')){
    const current=backed.find(a=>a.kind===old.kind&&a.name===old.name)!;
    const strip=(doc:Record<string,unknown>)=>Object.fromEntries(Object.entries(doc).filter(([k])=>!['acl','policies'].includes(k)));
    expect(strip(current.doc)).toEqual(strip(old.doc));
   }
   const backupReady=readFileSync('supabase/checks/selfservice-s4-backup-rad085-review-ready.sql','utf8');
   const backupRows=flatten(await db.admin.query(backupReady));
   console.info('S4 backup independent production fingerprints',mode,JSON.stringify(backupRows.filter(r=>r.actual)));
   expect(backupRows.filter(r=>r.ok!==true)).toEqual([]);
   for(const change of ['grant update on assess.sessions to assess_backup','alter policy assess_backup_read_v1 on assess.sessions using(false)','drop policy assess_backup_read_v1 on assess.sessions'])
    expect(flatten(await db.admin.query(backupReady.replace('begin read only;','begin;'+change+';'))).filter(r=>r.ok!==true).map(r=>r.check_name)).toEqual(['relations']);


  }finally{await db.close();}
 },300000);
});

// Independent fixtures and fixed pre-P5 oracle; no expectation is derived from the promoted SQL.
describe('independent counter/witness/privilege compatibility',()=>{
type Health={failed:number;alert:number;overdue:number;purgeDue:number;witness:Witness};
type Witness={epoch:string;seq:number;now:string;acceptedAt:string;credentialValidUntil:string|null};
const p5=()=>readFileSync('supabase/staged/self-service/p5-witness.sql','utf8');
const counters=({failed,alert,overdue,purgeDue}:Health)=>({failed,alert,overdue,purgeDue});
const expected={failed:1,alert:1,overdue:1,purgeDue:1};
const operations=['assess.claim_v1()','assess.fail_v1(uuid,uuid)','assess.finish_v1(uuid,uuid,text,text)','assess.health_v1()','assess.maintain_v1(integer)'];

it('pre-P5 exact compatibility; v2 exclusion; strict witness/clock/epoch/sequence; regression mutation',async()=>{
 const db=await fixture(['20261030000700_rad062_manual_grading.sql','20261030000800_rad062_erasure_operations.sql']);
 try{
  await db.rpc(2,'consent_v2',['assess-pilot-2026-10-20-v2']);
  await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,schema_version,available) values($1,$2,$1,'1','SYNTHETIC v1','mixed',1,true)",[id(550),id(2)]);
  await db.admin.query('insert into assess.assignments(id,owner_id,version_id) values($1,$2,$3)',[id(551),id(2),id(550)]);
  await db.admin.query('insert into assess.targets values($1,$2),($1,$3)',[id(551),id(2),id(3)]);
  // Independent mixed-lifecycle rows exercise ALL four counters with fixed expected values.
  for(const [n,version,state,user,ordinal] of [[600,1,'grading-failed',3,1],[601,2,'grading-failed',3,2],[602,1,'active',2,1],[603,2,'active',3,3]] as const)
   await db.admin.query(`insert into assess.sessions(id,assignment_id,user_id,ordinal,lifecycle_version,state,started_at,submitted_at,deadline,expires_at)
    values($1,$2,$3,$4,$5,$6,clock_timestamp()-interval '3 days',clock_timestamp()-interval '2 days',clock_timestamp()-interval '1 hour',case when $6='grading-failed' then clock_timestamp()-interval '1 minute' end)`,[id(n),id(version===1?551:51),id(user),ordinal,version,state]);
  const health=async()=>(await db.admin.query('select assess.health_v1() h')).rows[0].h as Health;
  // Keep the historical contract literal and independent of the corrected implementation.
  expect(await health()).toEqual({failed:1,alert:1,overdue:1,purgeDue:1});
  await db.admin.query(p5());
  const epoch=(await db.admin.query('select epoch::text,seq::int,accepted_at from assess.restore_epoch')).rows[0];
  let previous=epoch.seq as number;
  for(let n=0;n<3;n++){
   const before=(await db.admin.query('select clock_timestamp() t')).rows[0].t as Date;
   const h=await health();
   const after=(await db.admin.query('select clock_timestamp() t')).rows[0].t as Date;
   expect(Object.keys(h).sort()).toEqual(['alert','failed','overdue','purgeDue','witness']);
   expect(counters(h)).toEqual(expected);
   expect(Object.keys(h.witness).sort()).toEqual(['acceptedAt','credentialValidUntil','epoch','now','seq']);
   expect(h.witness.epoch).toBe(epoch.epoch);expect(h.witness.epoch).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
   expect(h.witness.seq).toBe(++previous);expect(Number.isSafeInteger(h.witness.seq)).toBe(true);
   expect(Date.parse(h.witness.now)).toBeGreaterThanOrEqual(before.getTime());expect(Date.parse(h.witness.now)).toBeLessThanOrEqual(after.getTime());
   expect(Date.parse(h.witness.acceptedAt)).toBe((epoch.accepted_at as Date).getTime());expect(h.witness.credentialValidUntil).toBeNull();
  }
  // Prove this independent oracle catches the exact missing-predicate regression.
  await db.admin.query('begin');
  try{
   await db.admin.query(`do $m$declare d text;begin d:=pg_get_functiondef('assess.health_v1()'::regprocedure);execute replace(d,'from assess.sessions where lifecycle_version=1','from assess.sessions');end$m$`);
   const mutated=counters(await health());
   expect(mutated).toEqual({failed:2,alert:2,overdue:2,purgeDue:2});
   expect(()=>expect(mutated).toEqual(expected)).toThrow();
  }finally{await db.admin.query('rollback');}
  expect(counters(await health())).toEqual(expected);
 }finally{await db.close();}
},300000);

it('real DB privileges remain exactly five operations, private epoch, and enforcing anomalies never claim',async()=>{
 const db=await fixture(['20261030000700_rad062_manual_grading.sql','20261030000800_rad062_erasure_operations.sql']);
 try{
  await db.admin.query(p5());
  await db.admin.query(`create role assess_grading_worker nologin noinherit;
   grant usage on schema assess to assess_grading_worker;
   grant execute on function assess.maintain_v1(integer),assess.claim_v1(),assess.finish_v1(uuid,uuid,text,text),assess.fail_v1(uuid,uuid),assess.health_v1() to assess_grading_worker;`);
  const allowed=(await db.admin.query("select oid::regprocedure::text f from pg_proc where pronamespace='assess'::regnamespace and has_function_privilege('assess_grading_worker',oid,'EXECUTE') order by 1")).rows.map(r=>r.f);
  expect(allowed).toEqual(operations);
  for(const role of ['anon','authenticated','service_role','assess_authoring_bridge','assess_grading_worker']){
   await db.admin.query('begin;set local role '+role);
   await expect(db.admin.query('select * from assess.restore_epoch')).rejects.toMatchObject({code:'42501'});await db.admin.query('rollback');
   if(role!=='assess_grading_worker'){
    await db.admin.query('begin;set local role '+role);
    await expect(db.admin.query('select assess.health_v1()')).rejects.toMatchObject({code:'42501'});await db.admin.query('rollback');
   }
  }
  const config={host:'synthetic.invalid',port:5432,database:'synthetic',user:'synthetic_worker',password:'SYNTHETIC_ONLY',ca:'-----BEGIN CERTIFICATE-----synthetic'};
  const binding=createGradingWorkerBinding(config);
  try{for(const name of ['witness_accept_v1','owner_resume_v1','window_guard_v1','claim_v2','recover_v1','content_submit_v1','unknown'])await expect(binding.call(name,{})).rejects.toMatchObject({code:'invalid'});}finally{await binding.close();}
  const row=(await db.admin.query('select epoch::text,seq::int,clock_timestamp() t from assess.restore_epoch')).rows[0];
  const stored:StoredWitness={projectRef:'abcdefghijklmnopqrst',epoch:row.epoch,seq:row.seq,updatedAt:(row.t as Date).toISOString()};
  const badJson=gcsWitnessStore('synthetic','witness',async()=>'SYNTHETIC',async()=>({status:200,headers:{get:()=> '1'},text:async()=>'{"bad":true}'}));
  for(const kind of ['missing','malformed-store','stale','malformed-db'] as const){
   const calls:string[]=[];
   if(kind==='malformed-db')await db.admin.query("update assess.restore_epoch set accepted_at='infinity'");
   const store:WitnessStore=kind==='malformed-store'?badJson:{read:async()=>({value:kind==='missing'?null:{...stored,seq:stored.seq+100},generation:'1'}),write:async()=>{throw Error('no write expected');}};
   const result=await executeGradingWorker(async()=>config,new AbortController().signal,async()=>{},()=>({close:async()=>{},call:async<T>(name:string):Promise<T>=>{
    calls.push(name);await db.admin.query('begin;set local role assess_grading_worker');
    try{const r=await db.admin.query('select assess.'+name+'() v');await db.admin.query('commit');return r.rows[0].v as T;}catch(e){await db.admin.query('rollback');throw e;}
   }}),undefined,{witness:{mode:'enforcing',projectRef:stored.projectRef,store}});
   expect(result).toMatchObject({outcome:'STOP',code:'restore_suspected',witness:{result:{missing:'witness-missing','malformed-store':'witness-unreadable',stale:'restore-suspected','malformed-db':'db-witness-missing'}[kind]}});
   expect(calls).toEqual(['health_v1']);expect(result).not.toHaveProperty('counts');
  }
 }finally{await db.close();}
},300000);

});
