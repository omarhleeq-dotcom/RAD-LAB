import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { closeOneAssignment, installOneMixed, main } from "../../../scripts/assess/trial-tools";
import type { AssessmentPublication } from "./server-contracts";
import type { AssessRpc } from "./server-service";

const id = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12,"0")}`;
const config = { host:"db.example.test",port:5432,database:"postgres",user:"fixture_job",password:"PRIVATE",ca:"-----BEGIN CERTIFICATE-----PRIVATE" };
const jwt = (role: string) => `header.${Buffer.from(JSON.stringify({role})).toString("base64url")}.signature`;
const ownerConfig = { url:"https://vlacestfruxooznrcjqc.supabase.co",publicKey:jwt("anon"),accessToken:jwt("authenticated") };
const fixture: AssessmentPublication = {
 schemaVersion:1,assessment:{schemaVersion:1,ref:{id:id(10),version:"1"},name:"Synthetic letters",track:"mixed",maximum:"10",policy:{durationSeconds:300,maxAttempts:1,gradeVisibility:"after-submission"},items:[1,2].map(n=>({schemaVersion:1,ref:{id:`q${n}`,version:"1"},type:"single-choice",contentLanguage:"en",prompt:"Choose a synthetic letter",options:[{id:"a",text:"A"},{id:"b",text:"B"}]}))},
 itemMarks:[1,2].map(n=>({item:{id:`q${n}`,version:"1"},maximum:"5"})),privateItems:[1,2].map(n=>({schemaVersion:1,ref:{id:`q${n}`,version:"1"},type:"single-choice",correctOptionId:"a",review:{sources:[{reference:"Synthetic alphabet",licenceEvidence:"Own engineering fixture"}],reviewedBy:"Engineering fixture",reviewedAt:"2026-10-22T00:00:00.000Z",scope:"Non-clinical letters only"}})),
};

it.each(["bad",[id(1),id(2)],null])("rejects non-single identifiers before reading credentials: %j", async value=>{
 const load=vi.fn();expect(await installOneMixed(value,load)).toMatchObject({outcome:"STOP",code:"configuration"});
 expect(await closeOneAssignment(value,load)).toMatchObject({outcome:"STOP",code:"configuration"});expect(load).not.toHaveBeenCalled();
});
it("installs only the selected mixed candidate through validation and drains once",async()=>{
 const calls:unknown[]=[];const close=vi.fn();
 const result=await installOneMixed(id(20),async()=>config,()=>({close,async call<T>(name:string,args:Record<string,unknown>){calls.push([name,args]);return (name==="content_read_v1"?fixture:null) as T;}}));
 expect(result).toEqual({contract:"assess-trial-tools/1",outcome:"COMPLETE",code:"complete",runtimeOrLaunchVerified:false});
 expect(calls).toEqual([["content_read_v1",{p_version:id(20)}],["content_install_v1",{p_version:id(20),p_specs:{q1:{},q2:{}}}]]);expect(close).toHaveBeenCalledTimes(1);
});
it.each([null,{bad:"PRIVATE"}])("invalid/pending-missing content never reaches install and still closes",async document=>{
 const calls:string[]=[];const close=vi.fn();
 const result=await installOneMixed(id(20),async()=>config,()=>({close,async call<T>(name:string){calls.push(name);return document as T;}}));
 expect(result).toMatchObject({outcome:"STOP",code:"unavailable_or_uncertain"});expect(calls).toEqual(["content_read_v1"]);expect(close).toHaveBeenCalledTimes(1);expect(JSON.stringify(result)).not.toContain("PRIVATE");
});
it.each([false,true])("does not replay uncertain installation; reports cleanup failure separately (%s)",async cleanupFailure=>{
 const calls:string[]=[];
 const result=await installOneMixed(id(20),async()=>config,()=>({async close(){if(cleanupFailure)throw Error("PRIVATE");},async call<T>(name:string){calls.push(name);if(name==="content_install_v1")throw Error("PRIVATE lost commit ack");return fixture as T;}}));
 expect(result.code).toBe(cleanupFailure?"cleanup_failed":"unavailable_or_uncertain");expect(calls).toEqual(["content_read_v1","content_install_v1"]);expect(JSON.stringify(result)).not.toContain("PRIVATE");
});
it("rejects extra worker config and privileged owner keys before constructing a client",async()=>{
 const make=vi.fn();expect((await installOneMixed(id(1),async()=>({...config,userId:id(1)}),make)).code).toBe("configuration");
 for(const raw of [{...ownerConfig,publicKey:jwt("service_role")},{...ownerConfig,accessToken:jwt("service_role")},{...ownerConfig,url:"https://other.invalid"},{...ownerConfig,userId:id(1)}])expect((await closeOneAssignment(id(1),async()=>raw,make)).code).toBe("configuration");
 expect(make).not.toHaveBeenCalled();
});
it("requires server Auth verification before any assignment command",async()=>{
 const schema=vi.fn();const make=()=>({auth:{getUser:vi.fn(async()=>({data:{user:null},error:{message:"PRIVATE"}}))},schema}) as unknown as SupabaseClient;
 expect((await closeOneAssignment(id(1),async()=>ownerConfig,make)).code).toBe("unavailable_or_uncertain");expect(schema).not.toHaveBeenCalled();
});
it("rejects flags/remote selectors without reading a file or invoking a job",async()=>{
 for(const args of [[],["install",id(1)],["--authorized-install-mixed",id(1),"--url=PRIVATE"],["--authorized-close-assignment","bad"]])expect(await main(args)).toMatchObject({outcome:"STOP",code:"configuration"});
});

const db=new PGlite();
beforeAll(async()=>{
 await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
 for(const f of readdirSync("supabase/migrations").filter(f=>f.endsWith(".sql")).sort())await db.exec(readFileSync(`supabase/migrations/${f}`,"utf8"));
 for(const n of [1,2,3])await db.query("insert into auth.users values($1,$2,now(),$3)",[id(n),`synthetic${n}@example.test`,JSON.stringify({display_name:"Synthetic"})]);
 await db.exec(`update public.profiles set status='approved';update public.profiles set role='owner' where user_id in ('${id(1)}','${id(3)}');`);
},30000);
afterAll(async()=>{await db.close();});
function port(role:string,user=""):AssessRpc {
 return {async call<T>(name:string,args:Record<string,unknown>):Promise<T>{return db.transaction(async tx=>{
  await tx.exec(`set local role ${role}`);await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);
  return (await tx.query<{v:T}>(`select assess.${name}(${Object.keys(args).map((k,i)=>`${k}=>$${i+1}`).join(",")}) v`,Object.values(args))).rows[0]!.v;
 });}};
}
let assignment:string;
it("installs via real local SQL, and closes only under the owning approved identity",async()=>{
 const version=await port("authenticated",id(1)).call<string>("content_submit_v1",{p_document:fixture});
 expect((await installOneMixed(version,async()=>config,()=>({...port("assess_worker"),async close(){}}))).outcome).toBe("COMPLETE");
 expect((await installOneMixed(version,async()=>config,()=>({...port("assess_worker"),async close(){}}))).outcome).toBe("STOP"); // no implicit replay
 assignment=await port("authenticated",id(1)).call<string>("assign_v1",{p_version:version,p_users:[id(2)],p_groups:[]});
 for(const who of [2,3,1]){
  const client = {
   auth: {async getUser() {return {data:{user:{id:id(who)}},error:null};}},
   schema(schema:string) {
    expect(schema).toBe("assess");
    return {async rpc(name:string,args:Record<string,unknown>) {
     try {
      await port("authenticated",id(who)).call(name,args);
      // PostgREST's void response is null; the local SQL driver's void is "".
      return {data:null,error:null};
     } catch {return {data:null,error:{message:"PRIVATE"}};}
    }};
   },
  } as unknown as SupabaseClient;
  expect((await closeOneAssignment(assignment,async()=>ownerConfig,()=>client)).outcome).toBe(who===1?"COMPLETE":"STOP");
 }
 expect((await db.query<{closed:boolean}>("select closed_at is not null as closed from assess.assignments where id=$1",[assignment])).rows[0]!.closed).toBe(true);
});

const inventory=readFileSync("scripts/assess/sql/trial-inventory.sql","utf8");
async function counts(){const results=await db.exec(inventory);return results.flatMap(r=>r.rows).find(r=>"counts" in r)!.counts as Record<string,Record<string,number>>;}
it("returns only exact scalar counts in a read-only snapshot, without attempt/connection confusion",async()=>{
 const result=await counts();expect(result.attempts!.total).toBe(0);expect(result.assignments!.total).toBe(1);expect(result.content!.installed).toBe(1);
 for(const group of Object.values(result))for(const n of Object.values(group))expect(Number.isSafeInteger(n)&&n>=0).toBe(true);
 expect(JSON.stringify(result)).not.toMatch(/PRIVATE|synthetic|00000000-|earned|password|backend_sessions/);
});
it("accepts exactly 100 and aborts the entire inventory at sentinel 101",async()=>{
 await db.query("insert into assess.groups(owner_id,name) select $1,'Synthetic' from generate_series(1,100)",[id(1)]);
 expect((await counts()).metadata!.groups).toBe(100);
 await db.query("insert into assess.groups(owner_id,name) values($1,'Synthetic')",[id(1)]);
 await expect(counts()).rejects.toMatchObject({code:"54000",message:expect.stringContaining("inventory_ceiling_exceeded")});
 await db.exec("rollback;delete from assess.groups;");
});
it("refuses an RLS-restricted reader instead of reporting an empty database",async()=>{
 try {
  await db.exec("set role authenticated;");
  await expect(counts()).rejects.toMatchObject({code:"42501",message:"inventory_reader_required"});
 } finally {await db.exec("rollback;reset role;");}
});
it("uses a transaction mode that actually rejects database writes",async()=>{
 try {
  await db.exec("begin read only;");
  await expect(db.exec("update assess.launch_gate set enabled=true;")).rejects.toMatchObject({code:"25006"});
 } finally {await db.exec("rollback;");}
 expect((await counts()).controls!.gate_open_rows).toBe(0);
});
it("inventory mirrors globally due work: limit1 can affect other assignments with gate closed",async()=>{
 const version=(await db.query<{version_id:string}>("select version_id from assess.assignments where id=$1",[assignment])).rows[0]!.version_id;
 await port("authenticated",id(2)).call("consent_v2",{p_version:"assess-pilot-2026-10-20-v2"});
 const other=await port("authenticated",id(1)).call<string>("assign_v1",{p_version:version,p_users:[id(2)],p_groups:[]});
 for(const [n,a,state,submitted] of [[60,assignment,"grading","2 hours"],[61,other,"active",null],[62,other,"grading","8 days"]] as const){
  await db.query("insert into assess.sessions(id,assignment_id,user_id,ordinal,state,started_at,deadline,submitted_at) values($1,$2,$3,$4,$5,now()-interval '1 day',now()-interval '1 hour',case when $6::text is null then null else now()-$6::interval end)",[id(n),a,id(2),n,state,submitted]);
  await db.query("insert into assess.session_details(session_id,publication,specs) values($1,$2,'{}')",[id(n),fixture]);
 }
 const before=await counts();expect(before.controls!.gate_open_rows).toBe(0);expect(before.attempts!.total).toBe(3);expect(before.maintenance).toMatchObject({active_due:1,void_due:1,fail_due:1});expect(before.queue!.claimable_now).toBe(1);
 // Closed assignment still claimable; gate closed does not stop it.
 expect(await port("assess_worker").call("claim_v1",{})).toMatchObject({attemptId:id(60)});
 expect(await port("assess_worker").call("maintain_v1",{p_limit:1})).toMatchObject({expired:1,purged:1});
 expect((await db.query<{state:string}>("select state from assess.sessions where id=$1",[id(61)])).rows[0]!.state).toBe("grading");
 expect((await db.query("select id from assess.sessions where id=$1",[id(62)])).rows).toHaveLength(0);
});
