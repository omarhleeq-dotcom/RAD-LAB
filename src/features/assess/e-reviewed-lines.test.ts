import {createHash} from "node:crypto";
import {readFileSync,readdirSync} from "node:fs";
import {PGlite} from "@electric-sql/pglite";
import {expect,it} from "vitest";
const read=(p:string)=>readFileSync(`supabase/${p}`,"utf8");
const pre=read("checks/assess-e-preinstall-reviewed-lines.sql"),manual=read("manual/assess-original-e-install-reviewed-lines.sql");
const hash=(s:string)=>createHash("sha256").update(s).digest("hex");
const definitions=["20261020000600_assess_assignments.sql","20261020000700_assess_lifecycle.sql","20261020000800_assess_mixed_ui.sql","20261020000900_assess_practical_ui.sql"].flatMap(f=>[...read(`migrations/${f}`).matchAll(/create(?: or replace)? function assess\.([a-z_0-9]+)\([\s\S]*?\bas \$\$([\s\S]*?)\$\$;/gi)]);
it("bounds accepted source variants to reviewed LF/CRLF hashes and preserves every other installer byte",()=>{
 expect(definitions).toHaveLength(30);
 for(const d of definitions){
  // Comment-aware lexical audit: no literal value spans a newline, no nested dollar strings.
  const tokens=d[2]!.match(/--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|\$(?:[A-Za-z_][A-Za-z_0-9]*)?\$/g)??[];
  for(const t of tokens){if(t.startsWith("'"))expect(t).not.toMatch(/[\r\n]/);else expect(t.startsWith("$")).toBe(false);}
 }
 for(const [oldPath,artifact] of [["checks/assess-e-preinstall.sql",pre],["manual/assess-original-e-install.sql",manual]]){
  let expected=read(oldPath!).replaceAll("expected_bodies(name,digest)","expected_bodies(name,digest,crlf_digest)");
  for(const d of definitions){const digest=hash(d[2]!);expected=expected.replaceAll(`('${d[1]}','${digest}')`,`('${d[1]}','${digest}','${hash(d[2]!.replaceAll("\n","\r\n"))}')`);}
  expected=expected.replaceAll("encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') is distinct from e.digest","coalesce(encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') in (e.digest,e.crlf_digest),false)=false").replaceAll("assess-e-preinstall/1","assess-e-preinstall-reviewed-lines/1");
  expect(artifact!.split("\n").slice(2).join("\n")).toBe(expected);
 }
});
it.each([false,true])("accepts exact CRLF C/D, rejects all other drift and atomically installs E (editor CRLF=%s)",async(editorCrlf)=>{
 const db=new PGlite();try{
  await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
  for(const f of readdirSync("supabase/migrations").filter(f=>f.endsWith(".sql")&&f<"20261020000900").sort()){
   const sql=read(`migrations/${f}`);await db.exec(f>="20261020000600"?sql.replaceAll("\n","\r\n"):sql);
  }
  const inspect=async()=>{const r=await db.exec(pre);return r.find(r=>r.fields.some(f=>f.name==="ready_for_e_install"))!.rows[0] as Record<string,unknown>;};
  const publicState=async()=>(await db.query("select pg_get_functiondef(oid) d,proacl::text acl from pg_proc where pronamespace='public'::regnamespace order by oid")).rows;
  const before=await publicState();expect(await inspect()).toMatchObject({ready_for_e_install:true,read_only:true,launch_gate_closed:true,recovery_verified:false,runtime_or_launch_verified:false});
  const original=(await db.query<{definition:string;body:string}>("select pg_get_functiondef(oid) definition,prosrc body from pg_proc where oid='assess.read_session_v1(uuid)'::regprocedure")).rows[0]!;
  const run=editorCrlf?manual.replaceAll("\n","\r\n"):manual;
  for(const changed of [` ${original.body}`,original.body.replace("\r\n","\n"),original.body.replaceAll("\r\n","\r"),"begin return '{}'::jsonb;end"]){
   await db.exec(original.definition.replace(original.body,()=>changed));expect((await inspect()).ready_for_e_install).toBe(false);
   await expect(db.exec(run)).rejects.toThrow("E precondition failed");await db.exec("rollback");await db.exec(original.definition);
  }
  for(const [change,restore] of [["grant select on assess.sessions to authenticated","revoke select on assess.sessions from authenticated"],["update assess.launch_gate set enabled=true","update assess.launch_gate set enabled=false"],["create table assess.practical_presentations(id integer)","drop table assess.practical_presentations"],["alter function assess.read_session_v1(uuid) rename to unavailable_fixture","alter function assess.unavailable_fixture(uuid) rename to read_session_v1"]]){
   await db.exec(change!);expect((await inspect()).ready_for_e_install).toBe(false);await expect(db.exec(run)).rejects.toThrow("E precondition failed");await db.exec("rollback");await db.exec(restore!);
  }
  await expect(db.exec(run.replace(/commit;\s*$/,()=>"do $$begin raise exception 'synthetic rollback';end$$;commit;"))).rejects.toThrow("synthetic rollback");await db.exec("rollback");expect((await inspect()).ready_for_e_install).toBe(true);expect(await publicState()).toEqual(before);
  await db.exec(run);expect(await publicState()).toEqual(before);expect((await db.query("select enabled from assess.launch_gate")).rows).toEqual([{enabled:false}]);
  const ready=await db.exec(read("checks/assess-practical-ready.sql"));expect(ready[1]!.rows[0]).toEqual({read_only:true,presentation_rls:true,no_direct_grants:true,participant_read_grants:true,private_installer:true,launch_gate_closed:true,runtime_or_launch_verified:false});
  expect((await inspect()).ready_for_e_install).toBe(false);await expect(db.exec(run)).rejects.toThrow("E precondition failed");await db.exec("rollback");
 }finally{await db.close();}
},40000);
