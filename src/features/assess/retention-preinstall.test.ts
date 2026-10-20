import {createHash} from "node:crypto";
import {readFileSync,readdirSync} from "node:fs";
import {PGlite} from "@electric-sql/pglite";
import {expect,it} from "vitest";
const read=(p:string)=>readFileSync(`supabase/${p}`,"utf8");
const sql=read("checks/assess-retention-preinstall.sql");
const hash=(s:string)=>createHash("sha256").update(s).digest("hex");
const expectedKeys=["contract","read_only","bcdef_catalogue_ready","bcdef_source_bodies_match","schema_shape_matches","no_direct_column_grants","trigger_contract_matches","launch_gate_closed","retention_absent","baseline_matches","backup_verified","recovery_verified","provider_backups_verified","apply_authorized","manual_review_required","runtime_or_launch_verified"].sort();
it("keeps the reviewed F source baseline and is a read-only diagnostic without install authorization",()=>{
 const manual=read("manual/assess-original-f-install.sql");
 const baseline=manual.slice(manual.lastIndexOf("with catalogue as (")).split("\nselect 'assess-f-install/1' as contract,")[0];
 expect(sql).toContain(baseline);
 const definitions=new Map<string,string>();
 for(const f of readdirSync("supabase/migrations").filter(f=>f.endsWith(".sql")&&f>="20261020000600"&&f<"20261020001100").sort())
  for(const d of read(`migrations/${f}`).matchAll(/create(?: or replace)? function assess\.([a-z_0-9]+)\([\s\S]*?\bas \$\$([\s\S]*?)\$\$;/gi))definitions.set(d[1]!,d[2]!);
 expect(definitions.size).toBe(32);
 for(const [name,body] of definitions){
  // CRLF is a finite reviewed lexical variant, not normalization of arbitrary source.
  for(const token of body.match(/--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|\$(?:[A-Za-z_][A-Za-z_0-9]*)?\$/g)??[])
   if(token.startsWith("'"))expect(token).not.toMatch(/[\r\n]/);else expect(token.startsWith("$")).toBe(false);
  expect(sql).toContain(`('${name}','${hash(body)}','${hash(body.replaceAll("\n","\r\n"))}')`);
 }
 const executable=sql.replace(/--[^\n]*|'(?:''|[^'])*'/g,"");
 expect(executable).not.toMatch(/\b(?:insert|update|delete|create|alter|drop|grant|revoke|truncate|call|do)\b/i);
 expect(executable).not.toMatch(/\b(?:from|join)\s+(?:public|auth)\./i);
 expect(sql).toContain("begin read only;");expect(sql.trim().endsWith("rollback;")).toBe(true);
 expect(sql).toContain("false as apply_authorized,true as manual_review_required");
});
it.each([false,true])("detects source/schema/ACL/gate/partial drift, preserves v1 and refuses an installed policy (CRLF=%s)",async crlf=>{
 const db=new PGlite();try{
  await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
  for(const f of readdirSync("supabase/migrations").filter(f=>f.endsWith(".sql")&&f<"20261020001100").sort()){
   const migration=read(`migrations/${f}`);await db.exec(crlf&&f>="20261020000600"?migration.replaceAll("\n","\r\n"):migration);
  }
  const id="00000000-0000-0000-0000-000000000001";
  await db.query("insert into auth.users values($1,'synthetic@example.test',now(),'{\"display_name\":\"Synthetic\"}')",[id]);
  await db.exec(`update public.profiles set status='approved';set role authenticated;select set_config('request.jwt.claim.sub','${id}',false);select assess.consent_v1('assess-pilot-2026-10-20-v1');reset role;`);
  const state=async()=>({functions:(await db.query("select oid::regprocedure::text id,pg_get_functiondef(oid) def,proacl::text acl from pg_proc where pronamespace in ('public'::regnamespace,'assess'::regnamespace) order by 1")).rows,profiles:(await db.query("select to_jsonb(p) data from public.profiles p order by user_id")).rows,consents:(await db.query("select * from assess.consents order by user_id")).rows,practice:(await db.query("select * from public.attempts")).rows});
  const before=await state();
  const inspect=async()=>{
   const rows=await db.exec(sql);const row=rows.find(r=>r.fields.some(f=>f.name==="baseline_matches"))!.rows[0] as Record<string,unknown>;
   expect(Object.keys(row).sort()).toEqual(expectedKeys);expect(row).toMatchObject({contract:"assess-retention-preinstall/1",read_only:true,backup_verified:false,recovery_verified:false,provider_backups_verified:false,apply_authorized:false,manual_review_required:true,runtime_or_launch_verified:false});
   for(const [k,v] of Object.entries(row))if(k!=="contract")expect(typeof v).toBe("boolean");return row;
  };
  expect(await inspect()).toMatchObject({baseline_matches:true,retention_absent:true,bcdef_source_bodies_match:true,schema_shape_matches:true});expect(await state()).toEqual(before);
  async function drift(change:string,field:string,restore:string){
   await db.exec(change);try{const row=await inspect();expect(row[field]).toBe(false);expect(row.baseline_matches).toBe(false);}finally{await db.exec(restore);}
   expect((await inspect()).baseline_matches).toBe(true);expect(await state()).toEqual(before);
  }
  await drift("grant select on assess.consents to authenticated","bcdef_catalogue_ready","revoke select on assess.consents from authenticated");
  await drift("grant select(version) on assess.consents to authenticated","no_direct_column_grants","revoke select(version) on assess.consents from authenticated");
  await drift("update assess.launch_gate set enabled=true","launch_gate_closed","update assess.launch_gate set enabled=false");
  await drift("create table assess.account_stops(user_id uuid)","retention_absent","drop table assess.account_stops");
  await drift("alter table assess.assignments add column closed_at timestamptz","retention_absent","alter table assess.assignments drop column closed_at");
  await drift("create table assess.unreviewed_fixture(id uuid)","bcdef_catalogue_ready","drop table assess.unreviewed_fixture");
  await drift("alter table assess.consents alter column accepted_at drop not null","schema_shape_matches","alter table assess.consents alter column accepted_at set not null");
  await drift("alter table assess.consents disable row level security","bcdef_catalogue_ready","alter table assess.consents enable row level security");
  await drift("alter table assess.sessions disable trigger assess_session_consent","trigger_contract_matches","alter table assess.sessions enable trigger assess_session_consent");
  const fn=(await db.query<{definition:string;body:string}>("select pg_get_functiondef(oid) definition,prosrc body from pg_proc where oid='assess.start_v1(uuid,uuid)'::regprocedure")).rows[0]!;
  for(const body of [` ${fn.body}`,fn.body.replace(crlf?"\r\n":"\n",crlf?"\n":"\r\n"),fn.body.replaceAll(crlf?"\r\n":"\n","\r")])await drift(fn.definition.replace(fn.body,()=>body),"bcdef_source_bodies_match",fn.definition);
  // Missing F object is a diagnostic failure; never propose replaying historical SQL.
  await drift("alter function assess.consent_v1(text) rename to missing_consent_fixture","bcdef_catalogue_ready","alter function assess.missing_consent_fixture(text) rename to consent_v1");
  expect(await state()).toEqual(before);
  await db.exec(read("migrations/20261020001100_assess_retention.sql"));
  const installed=await inspect();expect(installed.baseline_matches).toBe(false);expect(installed.retention_absent).toBe(false);expect(installed.bcdef_source_bodies_match).toBe(false);
  expect((await db.query("select * from assess.consents order by user_id")).rows).toEqual(before.consents);
 }finally{await db.close();}
},40000);
