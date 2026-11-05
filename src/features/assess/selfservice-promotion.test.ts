/** C1/C2 production-schema promotion and adversarial witnesses; synthetic local DB only. */
import {describe,expect,it} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import type {QueryResult} from 'pg';
import {openRad085Database} from './rad085-local-db';
import {catalogueFixture,modes,sql} from './rad062-m09-fixture';
const {productionApplicationSql}=await import('../../../scripts/assess/'+'rad085-production-shape.mjs') as {productionApplicationSql:()=>string};
const {ledger,successor,gatePredicate}=await import('../../../scripts/assess/'+'selfservice-gate-checks.mjs') as {
 ledger:{files:Record<string,{sha256:string;kind:string;replacements:{from:string;count:number}[]}>};
 successor:(file:string)=>string; gatePredicate:string;
};
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
  if(entry.kind==='expected-state') expect(successor(f)).toContain(gatePredicate);
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
   for(const file of ['selfservice-windows-ready.sql','selfservice-witness-ready.sql']) expect(flatten(await db.admin.query(readFileSync('supabase/checks/'+file,'utf8'))).filter(r=>r.ok!==true)).toEqual([]);
   // Unspecified/invalid expectation, wrong state, absent row and corrupted multi-row gate all fail.
   for(const actual of [false,true]) {
    await setGate(actual);
    for(const expected of ['closed','open','','INVALID']) {
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
   ]) {
    await db.admin.query('begin');try {await db.admin.query(change);expect((await db.admin.query('select '+gatePredicate+' ok')).rows[0].ok).toBe(false);}finally{await db.admin.query('rollback');}
   }
   // Original emergency-stop packets must NOT accept an open gate.
   await setGate(true);
   for(const file of ['assess-emergency-stopped.sql','assess-emergency-stopped-v2.sql']) expect(successor(file)).toBe(readFileSync('supabase/checks/'+file,'utf8'));
   await setGate(false);
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
   const witness=readFileSync('supabase/checks/selfservice-witness-ready.sql','utf8');
   expect(flatten(await db.admin.query(witness.replace('begin read only;','begin;delete from assess.restore_epoch;'))).filter(r=>!r.ok).map(r=>r.check_name)).toEqual(['witness_singleton']);
   expect((await check()).filter(r=>r.ok!==true)).toEqual([]);
  }finally{await db.close();}
 },300000);
});
