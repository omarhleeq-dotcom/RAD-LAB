import {createHash} from "node:crypto";
import {readdirSync,readFileSync} from "node:fs";
import {PGlite} from "@electric-sql/pglite";
import {expect,it} from "vitest";
const read=(p:string)=>readFileSync(`supabase/${p}`,"utf8");
const pre=read("checks/assess-f-preinstall.sql"),manual=read("manual/assess-original-f-install.sql"),source=read("migrations/20261020001000_assess_history_consent.sql");
const hash=(s:string)=>createHash("sha256").update(s).digest("hex");
const definitions=new Map<string,string>();
for(const f of readdirSync("supabase/migrations").filter(f=>f.endsWith(".sql")&&f>="20261020000600"&&f<="20261020001000_assess_history_consent.sql").sort())for(const d of read(`migrations/${f}`).matchAll(/create(?: or replace)? function assess\.([a-z_0-9]+)\([\s\S]*?\bas \$\$([\s\S]*?)\$\$;/gi))definitions.set(d[1]!,d[2]!);
it("F artifact contains exact migration bytes, finite reviewed source hashes and a committed verification row, with no prior replay or launch",()=>{
 expect(definitions.size).toBe(32);
 expect(manual.split(`-- SOURCE F BEGIN SHA256 ${hash(source)}\n`)[1]?.split("-- SOURCE F END")[0]).toBe(source);
 for(const [name,body] of definitions){
  // Independent lexical audit of the accepted variants; no multiline literal or nested dollar strings.
  const tokens=body.match(/--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|\$(?:[A-Za-z_][A-Za-z_0-9]*)?\$/g)??[];
  for(const t of tokens)if(t.startsWith("'"))expect(t).not.toMatch(/[\r\n]/);else expect(t.startsWith("$")).toBe(false);
  const tuple=`('${name}','${hash(body)}','${hash(body.replaceAll("\n","\r\n"))}')`;
  expect(manual).toContain(tuple);if(!["consent_v1","history_page_v1","require_consent_v1"].includes(name))expect(pre).toContain(tuple);
 }
 expect(manual).not.toMatch(/create role|create schema|insert into auth\.|insert into public\.|update assess\.launch_gate|PILOT_SCHEMA_VERIFIED|create table assess\.(sessions|versions|publications)\s*\(/i);
 expect(manual.replace(source,"")).not.toMatch(/insert into assess\.consents/i);
 expect(pre).toContain("begin read only;");expect(pre.trim().endsWith("rollback;")).toBe(true);
 expect(manual).toMatch(/commit;\n-- This final row[\s\S]*as installation_valid/);
});
it.each([false,true])("F refuses drift/partial installs, rolls back DDL failure and preserves B/C/D/E and Practice (CRLF editor=%s)",async(crlf)=>{
 const db=new PGlite();try{
 await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
 for(const f of readdirSync("supabase/migrations").filter(f=>f.endsWith(".sql")&&f<"20261020001000").sort()){
  const sql=read(`migrations/${f}`);await db.exec(crlf&&f>="20261020000600"?sql.replaceAll("\n","\r\n"):sql);
 }
 await db.exec(`insert into auth.users values('00000000-0000-0000-0000-000000000001','synthetic@example.test',now(),'{"display_name":"Preserved synthetic"}');`);
 const inspect=async()=>{const r=await db.exec(pre);return r.find(r=>r.fields.some(f=>f.name==="ready_for_f_install"))!.rows[0] as Record<string,unknown>;};
 const preserved=async()=>({functions:(await db.query<{id:string;def:string;acl:string|null}>("select oid::regprocedure::text id,pg_get_functiondef(oid) def,proacl::text acl from pg_proc where pronamespace in ('public'::regnamespace,'assess'::regnamespace) order by 1")).rows.filter(r=>!['assess.consent_v1(text)','assess.history_page_v1(uuid,integer)','assess.require_consent_v1()'].includes(r.id)),profiles:(await db.query("select to_jsonb(p) data from public.profiles p order by user_id")).rows,attempts:(await db.query("select to_jsonb(a) data from public.attempts a")).rows});
 const before=await preserved();expect(await inspect()).toMatchObject({read_only:true,bcde_catalogue_ready:true,bcde_source_bodies_match:true,schema_shape_matches:true,trigger_contract_matches:true,launch_gate_closed:true,f_absent:true,ready_for_f_install:true,recovery_verified:false,runtime_or_launch_verified:false});
 const run=crlf?manual.replaceAll("\n","\r\n"):manual;
 async function reject(change:string,field:string,restore:string){await db.exec(change);try{expect((await inspect())[field]).toBe(false);await expect(db.exec(run)).rejects.toThrow("F precondition failed");await db.exec("rollback");}finally{await db.exec(restore);}expect(await preserved()).toEqual(before);}
 await reject("grant select on assess.results to authenticated","bcde_catalogue_ready","revoke select on assess.results from authenticated");
 await reject("grant select(earned_n) on assess.results to authenticated","no_direct_column_grants","revoke select(earned_n) on assess.results from authenticated");
 await reject("create trigger unexpected_f_fixture before insert on assess.sessions for each row execute function public.handle_new_user()","trigger_contract_matches","drop trigger unexpected_f_fixture on assess.sessions");
 await reject("update assess.launch_gate set enabled=true","launch_gate_closed","update assess.launch_gate set enabled=false");
 await reject("create table assess.consents(id integer)","f_absent","drop table assess.consents");
 await reject("create index assess_sessions_history on assess.sessions(id)","f_absent","drop index assess.assess_sessions_history");
 await reject("alter table assess.sessions alter column user_id drop not null","schema_shape_matches","alter table assess.sessions alter column user_id set not null");
 await reject("drop index assess.assess_sessions_expiry","schema_shape_matches","create index assess_sessions_expiry on assess.sessions(expires_at,id)");
 const old=(await db.query<{definition:string;body:string}>("select pg_get_functiondef(oid) definition,prosrc body from pg_proc where oid='assess.read_practical_session_v1(uuid)'::regprocedure")).rows[0]!;
 for(const body of [` ${old.body}`,old.body.replace(crlf?"\r\n":"\n",crlf?"\n":"\r\n"),old.body.replaceAll(crlf?"\r\n":"\n","\r"),"begin return '{}'::jsonb;end"])
  await reject(old.definition.replace(old.body,()=>body),"bcde_source_bodies_match",old.definition);
 await reject("alter function assess.result_v1(uuid) rename to missing_result_fixture","bcde_catalogue_ready","alter function assess.missing_result_fixture(uuid) rename to result_v1");
 // Inject after every F statement but before the postcondition/COMMIT; no residue is allowed.
 const broken=run.replace(/-- SOURCE F END\r?\n/,()=>"-- SOURCE F END\ndo $$begin raise exception 'synthetic F rollback';end$$;\n");
 await expect(db.exec(broken)).rejects.toThrow("synthetic F rollback");await db.exec("rollback");expect((await inspect()).ready_for_f_install).toBe(true);expect(await preserved()).toEqual(before);
 const result=await db.exec(run);const row=result.findLast(r=>r.fields.some(f=>f.name==="installation_valid"))!.rows[0];
 expect(row).toMatchObject({contract:"assess-f-install/1",bcdef_catalogue_ready:true,bcdef_source_bodies_match:true,schema_shape_matches:true,trigger_contract_matches:true,launch_gate_closed:true,f_present:true,installation_valid:true,recovery_verified:false,runtime_or_launch_verified:false});
 expect(await preserved()).toEqual(before);expect((await db.query("select * from assess.consents")).rows).toEqual([]);
 const ready=await db.exec(read("checks/assess-history-ready.sql"));expect(ready[1]!.rows[0]).toEqual({read_only:true,consent_rls:true,no_direct_consent_grants:true,participant_rpc_grants:true,start_consent_guard:true,private_trigger:true,launch_gate_closed:true,runtime_or_launch_verified:false});
 expect((await inspect()).ready_for_f_install).toBe(false);await expect(db.exec(run)).rejects.toThrow("F precondition failed");await db.exec("rollback");expect(await preserved()).toEqual(before);
 }finally{await db.close();}
},40000);
