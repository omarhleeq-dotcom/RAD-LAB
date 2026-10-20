import {spawnSync} from "node:child_process";
import {PGlite} from "@electric-sql/pglite";
import {readFileSync,readdirSync} from "node:fs";
import {expect,it} from "vitest";
import {ASSESS_RETENTION_CONSENT_VERSION} from "./retention-consent";
import {ASSESS_CONSENT_VERSION} from "./history-data";
import {retentionService} from "./server-service";

it("runs the policy lifecycle on a disposable PGlite database; emits no private rows",()=>{
 const child=spawnSync(process.execPath,["--import","./scripts/assess/node-loader.mjs","scripts/assess/retention-rehearsal.mjs","--synthetic-disposable","--backend=pglite"],{encoding:"utf8",timeout:30000,maxBuffer:100000});
 expect(child.status,child.stdout+child.stderr).toBe(0);
 const r=JSON.parse(child.stdout);expect(r).toMatchObject({outcome:"PASS",code:"complete",backend:"pglite-serialized",cleanup:true,restoreVerified:false,runtimeOrLaunchVerified:false});
 expect(r.checks).toEqual(expect.arrayContaining(["v1-is-not-v2","terminal-replay-no-reopen","disable-start-race","metadata-failure-atomic-rollback","two-maintainers-idempotent","open-limit-after-result-purge","due-result-readable-after-close-disable","public-practice-contracts-identical"]));
 expect(child.stdout).not.toMatch(/@example|00000000-|optionId|correctOptionId|p_token|accepted_at/);
},40000);
it("rejects remote selectors and missing disposable acknowledgement before setup",()=>{
 for(const args of [["--backend=pglite"],["--synthetic-disposable","--backend=https://private.invalid"]]){
 const c=spawnSync(process.execPath,["--import","./scripts/assess/node-loader.mjs","scripts/assess/retention-rehearsal.mjs",...args],{encoding:"utf8",timeout:10000});
 expect(c.status).toBe(1);expect(JSON.parse(c.stdout)).toMatchObject({code:"configuration",checks:[],cleanup:true});expect(c.stdout).not.toContain("private.invalid");
 }
});
it("binds the distinct disclosure version in both languages without replacing v1",()=>{
 expect(ASSESS_CONSENT_VERSION).toBe("assess-pilot-2026-10-20-v1");expect(ASSESS_RETENTION_CONSENT_VERSION).toBe("assess-pilot-2026-10-20-v2");
 const policy=readFileSync("docs/ASSESS_RETENTION_POLICY.md","utf8");
 for(const locale of ["en","ar"]){const m=JSON.parse(readFileSync(`messages/${locale}.json`,"utf8"));for(const paragraph of Object.values(m.assessConsentV2))expect(policy).toContain(paragraph);}
});
it("sanitizes administrative failures and rejects malformed identifiers locally",async()=>{
 const service=retentionService({async call(){throw {code:"42501",message:"PRIVATE row"};}});
 expect(()=>service.close("bad")).toThrow("invalid");
 await expect(service.disable("00000000-0000-0000-0000-000000000002")).rejects.toMatchObject({code:"denied",message:"denied"});
});

// Upgrade witness: old migrations are installed once into a NEW empty fixture;
// the policy migration is then applied over actual synthetic v1 data, never replaying B–F.
it("upgrades existing v1 acceptance and an active attempt without fabricating v2 or blocking settlement",async()=>{
 const db=new PGlite(),id=(n:number)=>`00000000-0000-0000-0000-${String(n).padStart(12,"0")}`;
 try {
  await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
  for(const f of readdirSync("supabase/migrations").filter(f=>f.endsWith(".sql")&&f<"20261020001100").sort())await db.exec(readFileSync(`supabase/migrations/${f}`,"utf8"));
  for(const n of [1,2])await db.query("insert into auth.users values($1,$2,now(),$3)",[id(n),`fixture${n}@example.test`,JSON.stringify({display_name:"Synthetic"})]);
  await db.exec(`update public.profiles set status='approved';update public.profiles set role='owner' where user_id='${id(1)}';`);
  async function rpc(who:number,name:string,args:unknown[]=[]){return db.transaction(async tx=>{
   await tx.exec("set local role authenticated");await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[id(who)]);
   return (await tx.query<{v:unknown}>(`select assess.${name}(${args.map((_,i)=>`$${i+1}`).join(",")}) v`,args)).rows[0]!.v;
  });}
  await rpc(2,"consent_v1",[ASSESS_CONSENT_VERSION]);
  await db.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values($1,$2,$1,'1','Synthetic prior attempt','mixed',true)",[id(10),id(1)]);
  await db.query("insert into assess.assignments(id,owner_id,version_id) values($1,$2,$3)",[id(11),id(1),id(10)]);
  await db.query("insert into assess.targets values($1,$2)",[id(11),id(2)]);
  await db.query("insert into assess.reservations(assignment_id,user_id,used) values($1,$2,1)",[id(11),id(2)]);
  await db.query("insert into assess.sessions(id,assignment_id,user_id,ordinal,started_at,deadline) values($1,$2,$3,1,clock_timestamp(),clock_timestamp()+interval '1 hour')",[id(20),id(11),id(2)]);
  await db.query("insert into assess.session_details(session_id,publication,specs) values($1,'{\"assessment\":{}}','{}')",[id(20)]);
  const accepted=(await db.query("select * from assess.consents")).rows;
  const publicState=async()=>(await db.query("select oid::regprocedure::text id,pg_get_functiondef(oid) def,proacl::text acl from pg_proc where pronamespace='public'::regnamespace order by 1")).rows;
  const before=await publicState();
  await db.exec(readFileSync("supabase/migrations/20261020001100_assess_retention.sql","utf8"));
  expect((await db.query("select * from assess.consents")).rows).toEqual(accepted);expect(await publicState()).toEqual(before);
  expect(await rpc(2,"consent_v2")).toEqual({accepted:false});
  await rpc(1,"close_assignment_v1",[id(11)]);await rpc(2,"disable_account_v1",[id(2)]);
  await expect(rpc(2,"consent_v2",[ASSESS_RETENTION_CONSENT_VERSION])).rejects.toMatchObject({code:"42501"});
  expect(await rpc(2,"read_session_v1",[id(20)])).toMatchObject({ack:{state:"active"}});
  expect(await rpc(2,"command_v1",[id(20),id(30),0,{type:"submit"}])).toMatchObject({state:"grading"});
  expect((await db.query<{n:number}>("select count(*)::int n from assess.results")).rows[0]!.n).toBe(0);
  expect((await db.query("select * from assess.consents")).rows).toEqual(accepted);
 }finally{await db.close();}
},30000);
