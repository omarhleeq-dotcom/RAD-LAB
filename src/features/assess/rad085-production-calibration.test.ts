import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {openRad085Database} from './rad085-local-db';
import {catalogueFixture,modes,sql} from './rad062-m09-fixture';
const {productionApplicationSql}=await import('../../../scripts/assess/'+'rad085-production-shape.mjs') as {productionApplicationSql:()=>string};
const migration=sql('20261102000300_rad085_rights_write_disclosures.sql');
// Immutable old reviewed migration, not reconstructed from the new implementation.
const old=execFileSync('git',['show','3d812890330b9f0d7bf7e0c943a5d988fa25e679:supabase/migrations/20261102000300_rad085_rights_write_disclosures.sql'],{encoding:'utf8'});
const preflight=(source:string)=>source.slice(source.indexOf('with functions as ('),source.indexOf(' ) reviewed),false)'));
const ready=readFileSync('supabase/checks/rad085-review-ready.sql','utf8');
describe.each(modes)('production fixture 0200 -> 0300 calibration %s (required)',mode=>{
 it('old fails functions/relations, calibrated preflight and every successor row pass',async()=>{
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
   // W1 (DS-9) through the review-ready check itself: exactly the five EXECUTE grants to assess_grading_worker are
   // tolerated; any other ACL change must still fail. Each statement set is rolled back by the check's own rollback.
   const readyFailures=async(change:string)=>((await db.admin.query(change+';\n'+ready)) as unknown as import('pg').QueryResult[])
    .flatMap(r=>r.rows).filter(r=>r.ok!==true).map(r=>r.check_name);
   const w1="create role assess_grading_worker nologin;grant execute on function assess.maintain_v1(integer),assess.claim_v1(),assess.finish_v1(uuid,uuid,text,text),assess.fail_v1(uuid,uuid),assess.health_v1() to assess_grading_worker;";
   for(const [change,expected] of [
    [w1,[]],
    [w1+"grant execute on function assess.read_session_v2(uuid) to assess_grading_worker",['functions']],
    [w1+"grant execute on function assess.health_v1() to assess_grading_worker with grant option",['functions']],
    [w1+"grant execute on function assess.claim_v1() to authenticated",['functions']],
    ["create role assess_grading_worker_x nologin;grant execute on function assess.claim_v1() to assess_grading_worker_x",['functions']],
    ["do $x$declare r record;begin select prosrc,pg_get_functiondef(oid) def into r from pg_proc where oid='assess.claim_v1()'::regprocedure;execute replace(r.def,r.prosrc,r.prosrc||E'\\n-- synthetic body drift');end$x$",['functions']],
   ] as const) expect(await readyFailures(change)).toEqual(expected);
   const results=await db.admin.query(ready) as unknown as import('pg').QueryResult[];
   const rows=results.flatMap(r=>r.rows);
   expect(rows).toHaveLength(11);expect(rows.filter(r=>r.ok!==true)).toEqual([]);
  } finally {await db.close();}
 },120000);
});
