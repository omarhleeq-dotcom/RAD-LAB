// RAD085-DEFERRED-SCHEMA-TESTS-20261027: only deferred RAD-085 expectations / historical input isolation.
import {historicalRad085Input} from "./server-rad085-contracts";
import { readFileSync,readdirSync } from "node:fs";
import { expect,it } from "vitest";
import { PGlite } from "@electric-sql/pglite";

it("the read-only staging catalogue detects absent objects, ACL and security regressions without claiming runtime or launch readiness",async()=>{
  const db=new PGlite();
  const sql=readFileSync("supabase/checks/assess-staging-ready.sql","utf8");
  const inspect=async()=>{
    const results=await db.exec(sql);
    const row=results.find(r=>r.fields.some(f=>f.name==="contract"))!.rows[0] as Record<string,unknown>;
    expect(row.contract).toBe("assess-staging-catalogue/1");expect(row.read_only).toBe(true);expect(row.runtime_or_launch_verified).toBe(false);return row;
  };
  try {
    expect((await inspect()).catalogue_ready).toBe(false);
    await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
    for(const file of historicalRad085Input(readdirSync("supabase/migrations")).filter(f=>f.endsWith(".sql")).sort()) await db.exec(readFileSync(`supabase/migrations/${file}`,"utf8"));
    const before=(await db.query("select count(*)::int n from public.profiles")).rows;
    expect((await inspect()).catalogue_ready).toBe(true);
    expect((await db.query("select enabled from assess.launch_gate")).rows).toEqual([{enabled:false}]);
    async function regression(change:string,field:string,restore:string){
      await db.exec(change);try{const row=await inspect();expect(row[field]).toBe(false);expect(row.catalogue_ready).toBe(false);}finally{await db.exec(restore);}
    }
    for(const role of ["anon","authenticated","assess_worker"]) await regression(`grant select on assess.publications to ${role}`,"no_direct_table_privileges",`revoke select on assess.publications from ${role}`);
    await regression("grant execute on function assess.claim_v1() to authenticated","execute_matrix","revoke execute on function assess.claim_v1() from authenticated");
    await regression("grant execute on function assess.session_ack_v1(uuid,uuid) to assess_worker","execute_matrix","revoke execute on function assess.session_ack_v1(uuid,uuid) from assess_worker");
    await regression("grant execute on function assess.content_read_v1(uuid) to public","no_public_execute","revoke execute on function assess.content_read_v1(uuid) from public");
    await regression("alter table assess.content_submissions disable row level security","rls_enabled","alter table assess.content_submissions enable row level security");
    await regression("alter function assess.claim_v1() set search_path=public","definer_and_empty_search_path","alter function assess.claim_v1() set search_path=''");
    await regression("grant usage on schema assess to anon","schema_privileges","revoke usage on schema assess from anon");
    await regression("grant assess_worker to authenticated","users_not_worker_members","revoke assess_worker from authenticated");
    await regression("alter role assess_worker login","worker_nonlogin_noinherit","alter role assess_worker nologin");
    await regression("create table assess.unreviewed_fixture(id integer)","no_unreviewed_relations","drop table assess.unreviewed_fixture");
    const definition=(await db.query<{definition:string}>("select pg_get_functiondef('assess.health_v1()'::regprocedure) definition")).rows[0]!.definition;
    await regression("drop function assess.health_v1()","functions_present",definition+";revoke all on function assess.health_v1() from public,anon,authenticated;grant execute on function assess.health_v1() to assess_worker");
    expect((await inspect()).catalogue_ready).toBe(true);
    expect((await db.query("select count(*)::int n from public.profiles")).rows).toEqual(before);
    // Catalogue does not inspect the launch value; the separate existing check must still prove CLOSED.
    await db.exec("update assess.launch_gate set enabled=true"); // disposable local DB, never a staging/production instruction
    const row=await inspect();expect(row.catalogue_ready).toBe(true);expect(row.runtime_or_launch_verified).toBe(false);
    const gateResults=await db.exec(readFileSync("supabase/checks/assess-mixed-ready.sql","utf8"));
    expect((gateResults.find(r=>r.fields.some(f=>f.name==="launch_gate_closed"))!.rows[0] as {launch_gate_closed:boolean}).launch_gate_closed).toBe(false);
  }finally{await db.close();}
},40000);
