import {createHash} from "node:crypto";
import {readdirSync,readFileSync} from "node:fs";
import {PGlite} from "@electric-sql/pglite";
import {expect,it} from "vitest";
const pre=readFileSync("supabase/checks/assess-e-preinstall.sql","utf8"),manual=readFileSync("supabase/manual/assess-original-e-install.sql","utf8");
const source=readFileSync("supabase/migrations/20261020000900_assess_practical_ui.sql","utf8");
it("the manual E artifact preserves exact migration bytes and excludes B/C/D replay, seeds, gate and attestation changes",()=>{
 const hash=createHash("sha256").update(source).digest("hex");
 expect(manual.split(`-- SOURCE E BEGIN SHA256 ${hash}\n`)[1]?.split("-- SOURCE E END")[0]).toBe(source);
 expect(manual).not.toMatch(/create role|create schema|insert into auth\.|insert into public\.|update assess\.launch_gate|PILOT_SCHEMA_VERIFIED|create table assess\.(sessions|versions|publications)\s*\(/i);
 expect(manual.trim().endsWith("commit;")).toBe(true);expect(pre).toContain("begin read only;");expect(pre.trim().endsWith("rollback;")).toBe(true);
});
it("E install requires exact C/D bodies and ACL, CLOSED gate and no partial E; rolls back errors and preserves Practice",async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
 for(const f of readdirSync("supabase/migrations").filter(f=>f.endsWith(".sql")&&f<"20261020000900").sort())await db.exec(readFileSync(`supabase/migrations/${f}`,"utf8"));
 await db.exec(`insert into auth.users values('00000000-0000-0000-0000-000000000001','synthetic@example.test',now(),'{"display_name":"Preserved synthetic profile"}');`);
 const inspect=async()=>{const rows=await db.exec(pre);return rows.find(r=>r.fields.some(f=>f.name==="ready_for_e_install"))!.rows[0] as Record<string,unknown>;};
 const publicState=async()=>({functions:(await db.query("select oid::regprocedure::text id,pg_get_functiondef(oid) def,proacl::text acl from pg_proc where pronamespace='public'::regnamespace order by 1")).rows,profiles:(await db.query("select to_jsonb(p) data from public.profiles p order by user_id")).rows,attempts:(await db.query("select to_jsonb(a) data from public.attempts a")).rows});
 const before=await publicState();
 expect(await inspect()).toMatchObject({read_only:true,cd_catalogue_ready:true,cd_source_bodies_match:true,launch_gate_closed:true,e_absent:true,ready_for_e_install:true,recovery_verified:false,runtime_or_launch_verified:false});
 async function reject(change:string,field:string,restore:string){
  await db.exec(change);try{expect((await inspect())[field]).toBe(false);await expect(db.exec(manual)).rejects.toThrow();await db.exec("rollback");expect(await publicState()).toEqual(before);}finally{await db.exec(restore);}
 }
 await reject("grant select on assess.publications to authenticated","cd_catalogue_ready","revoke select on assess.publications from authenticated");
 await reject("update assess.launch_gate set enabled=true","launch_gate_closed","update assess.launch_gate set enabled=false");
 await reject("create table assess.practical_presentations(id integer)","e_absent","drop table assess.practical_presentations");
 const original=(await db.query<{definition:string}>("select pg_get_functiondef('assess.read_session_v1(uuid)'::regprocedure) definition")).rows[0]!.definition;
 await reject(`create or replace function assess.read_session_v1(p_session uuid) returns jsonb language plpgsql security definer set search_path='' as $$begin return '{}';end$$;`,"cd_source_bodies_match",original);
 await reject("alter function assess.read_session_v1(uuid) rename to unavailable_session_fixture","cd_catalogue_ready","alter function assess.unavailable_session_fixture(uuid) rename to read_session_v1");
 // An error after all migration statements but before COMMIT restores both D's replaced function and all E DDL.
 await expect(db.exec(manual.replace(/commit;\s*$/,()=>"do $$begin raise exception 'synthetic failure before commit';end$$;\ncommit;"))).rejects.toThrow("synthetic failure before commit");await db.exec("rollback");
 expect((await inspect()).ready_for_e_install).toBe(true);expect(await publicState()).toEqual(before);
 await db.exec(manual);expect(await publicState()).toEqual(before);expect((await db.query("select enabled from assess.launch_gate")).rows).toEqual([{enabled:false}]);
 const catalogue=await db.exec(readFileSync("supabase/checks/assess-staging-ready.sql","utf8"));expect((catalogue.find(r=>r.fields.some(f=>f.name==="contract"))!.rows[0] as {catalogue_ready:boolean}).catalogue_ready).toBe(true);
 const ready=await db.exec(readFileSync("supabase/checks/assess-practical-ready.sql","utf8"));expect(ready[1]!.rows[0]).toEqual({read_only:true,presentation_rls:true,no_direct_grants:true,participant_read_grants:true,private_installer:true,launch_gate_closed:true,runtime_or_launch_verified:false});
 expect((await inspect()).ready_for_e_install).toBe(false);await expect(db.exec(manual)).rejects.toThrow("E precondition failed");await db.exec("rollback");expect(await publicState()).toEqual(before);
 }finally{await db.close();}
},40000);
