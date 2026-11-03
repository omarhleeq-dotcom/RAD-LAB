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
   await db.admin.query('drop schema assess cascade;drop schema public cascade;drop schema auth cascade;create schema public authorization postgres');
   const roles=[...readFileSync('supabase/fixtures/production-schema-2026-11-01/roles.sql','utf8').matchAll(/^CREATE ROLE ([a-z_]+);$/gm)].map(m=>m[1]);
   for(const role of roles)if(!(await db.admin.query('select 1 from pg_roles where rolname=$1',[role])).rowCount)await db.admin.query(`create role ${role} nologin`);
   await db.admin.query(productionApplicationSql());
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
    ["create function public.rls_auto_enable(integer) returns event_trigger language plpgsql as $$begin end$$",['functions']],
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
   const results=await db.admin.query(ready) as unknown as import('pg').QueryResult[];
   const rows=results.flatMap(r=>r.rows);
   expect(rows).toHaveLength(11);expect(rows.filter(r=>r.ok!==true)).toEqual([]);
  } finally {await db.close();}
 },120000);
});
