import {readFileSync,readdirSync} from "node:fs";
import {createHash} from "node:crypto";
import {PGlite} from "@electric-sql/pglite";
import {expect,it} from "vitest";
const diagnostic=readFileSync("supabase/checks/assess-e-source-diff.sql","utf8"),pre=readFileSync("supabase/checks/assess-e-preinstall.sql","utf8"),manual=readFileSync("supabase/manual/assess-original-e-install.sql","utf8");
it("pins all diagnostic baselines to unmodified B/C/D source bodies and never returns bodies",()=>{
 let n=0;
 for(const file of ["20261020000600_assess_assignments.sql","20261020000700_assess_lifecycle.sql","20261020000800_assess_mixed_ui.sql"]){
  for(const match of readFileSync(`supabase/migrations/${file}`,"utf8").matchAll(/create(?: or replace)? function assess\.([a-z_0-9]+)\([\s\S]*?\bas \$\$([\s\S]*?)\$\$;/gi)){
   n++;const hash=createHash("sha256").update(match[2]!).digest("hex");expect(diagnostic).toContain(`'${hash}',${Buffer.byteLength(match[2]!)},`);expect(diagnostic).toContain(`('${match[1]}','assess.${match[1]}(`);
  }
 }
 expect(n).toBe(26);expect(diagnostic).toContain("begin read only;");expect(diagnostic.trim().endsWith("rollback;")).toBe(true);
 expect(diagnostic.slice(diagnostic.lastIndexOf("select 'assess-e-source-diff/1'"))).not.toMatch(/prosrc|lf_body|student|answers|settings|grades/i);
});
it("diagnoses CRLF, boundary spaces, substantive drift and missing functions without approving installation or changing data",async()=>{
 const db=new PGlite();try{
  await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
  for(const file of readdirSync("supabase/migrations").filter(f=>f.endsWith(".sql")&&f<"20261020000900").sort())await db.exec(readFileSync(`supabase/migrations/${file}`,"utf8"));
  const inspect=async()=>{const results=await db.exec(diagnostic);return results.find(r=>r.fields.some(f=>f.name==="contract"))!.rows as Record<string,unknown>[];};
  expect(await inspect()).toEqual([]);
  const {definition,body}=(await db.query<{definition:string;body:string}>("select pg_get_functiondef(oid) definition,prosrc body from pg_proc where oid='assess.read_session_v1(uuid)'::regprocedure")).rows[0]!;
  const before=(await db.query("select pg_get_functiondef(oid) d,proacl::text acl from pg_proc where pronamespace='public'::regnamespace order by oid")).rows;
  for(const [changed,lf,trimmed] of [[body.replaceAll("\n","\r\n"),true,true],[` \t\n${body}\n `,false,true],["begin return '{}'::jsonb;end",false,false]] as const){
   await db.exec(definition.replace(body,()=>changed));
   const rows=await inspect();expect(rows).toHaveLength(1);expect(rows[0]).toMatchObject({contract:"assess-e-source-diff/1",read_only:true,name:"read_session_v1",language:"plpgsql",line_endings_normalized_match:lf,trimmed_line_endings_normalized_match:trimmed,function_missing:false,installation_approved:false,runtime_or_launch_verified:false});
   expect(Object.keys(rows[0]!)).not.toContain("prosrc");expect(Object.keys(rows[0]!)).not.toContain("lf_body");
   const ready=await db.exec(pre);expect((ready.find(r=>r.fields.some(f=>f.name==="ready_for_e_install"))!.rows[0] as {ready_for_e_install:boolean}).ready_for_e_install).toBe(false);
   await expect(db.exec(manual)).rejects.toThrow("E precondition failed");await db.exec("rollback");await db.exec(definition);
  }
  await db.exec("alter function assess.read_session_v1(uuid) rename to missing_function_fixture");expect((await inspect())[0]).toMatchObject({name:"read_session_v1",function_missing:true,installation_approved:false});await db.exec("alter function assess.missing_function_fixture(uuid) rename to read_session_v1");
  expect(await inspect()).toEqual([]);expect((await db.query("select pg_get_functiondef(oid) d,proacl::text acl from pg_proc where pronamespace='public'::regnamespace order by oid")).rows).toEqual(before);
  expect((await db.query("select enabled from assess.launch_gate")).rows).toEqual([{enabled:false}]);
 }finally{await db.close();}
},40000);
