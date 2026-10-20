import { readdirSync,readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { expect,it } from "vitest";
import { fixtureId as id,mixedFixture } from "../../../scripts/assess/d-fixture";
import { installMixedContent,validateMixedContent } from "./server-presentation";
import { parseSession } from "./runner-data";
import { MixedRunner } from "./runner-state";
import type { AssessRpc } from "./server-service";

it("D SQL integrates owner staging, private validation, immutable versions, isolated paging and the C runner",async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
  const files=readdirSync("supabase/migrations").filter(f=>f.endsWith(".sql")).sort();
  for(const f of files.filter(f=>f<"20261020000800"))await db.exec(readFileSync(`supabase/migrations/${f}`,"utf8"));
  const publicState=async()=>(await db.query("select oid::regprocedure::text id,pg_get_functiondef(oid) def,proacl::text acl from pg_proc where pronamespace='public'::regnamespace order by 1")).rows;
  const before=await publicState();await db.exec(readFileSync("supabase/migrations/20261020000800_assess_mixed_ui.sql","utf8"));expect(await publicState()).toEqual(before);
  for(let n=1;n<=5;n++)await db.query("insert into auth.users values($1,$2,now(),$3)",[id(n),`fixture${n}@example.test`,JSON.stringify({display_name:"Fixture"})]);
  await db.exec(`update profiles set status='approved';update profiles set role='owner' where user_id in ('${id(1)}','${id(2)}')`);
  async function as<T>(who:number|"worker"|null,fn:()=>Promise<T>){await db.exec(`set role ${who==="worker"?"assess_worker":who===null?"anon":"authenticated"}`);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[typeof who==="number"?id(who):""]);try{return await fn();}finally{await db.exec("reset role");}}
  async function rpc<T>(fn:string,args:unknown[]=[]){return (await db.query<{v:T}>(`select assess.${fn}(${args.map((_,i)=>`$${i+1}`).join(",")}) v`,args)).rows[0]!.v;}
  const worker:AssessRpc={call:<T>(fn:string,args:Record<string,unknown>)=>as("worker",()=>rpc<T>(fn,Object.values(args)))};
  const pub=mixedFixture();validateMixedContent(pub);
  for(const who of [null,3,4])await expect(as(who,()=>rpc("content_submit_v1",[pub]))).rejects.toMatchObject({code:"42501"});
  const version=await as(1,()=>rpc<string>("content_submit_v1",[pub]));
  await expect(as(1,()=>rpc("content_submit_v1",[pub]))).rejects.toMatchObject({code:"23505"});
  await expect(as(2,()=>rpc("content_submit_v1",[mixedFixture("2")]))).rejects.toMatchObject({code:"42501"});
  expect(await as(2,()=>rpc("content_page_v1",[null,20]))).toEqual({rows:[],next:null});
  for(const who of [1,2,3,null]){
   await expect(as(who,()=>rpc("content_read_v1",[version]))).rejects.toMatchObject({code:"42501"});
   for(const table of ["content_submissions","publications","session_details","results"])
    await expect(as(who,()=>db.query(`select * from assess.${table}`))).rejects.toMatchObject({code:"42501"});
  }
  const metadata=await as(1,()=>rpc("content_page_v1",[null,20]));expect(JSON.stringify(metadata)).not.toMatch(/correctOption|privateItems|criteria|fixedSettings/);
  await expect(as(1,()=>rpc("assign_v1",[version,[id(3)],[]]))).rejects.toMatchObject({code:"42501"});
  await installMixedContent(worker,version);
  await expect(installMixedContent(worker,version)).rejects.toThrow();
  expect(await as(1,()=>rpc("content_page_v1",[null,20]))).toMatchObject({rows:[{state:"installed"}]});
  expect((await db.query("select document from assess.content_submissions")).rows).toEqual([{document:null}]);
  const assignment=await as(1,()=>rpc<string>("assign_v1",[version,[id(3)],[]]));
  expect(await as(4,()=>rpc("assigned_page_v1",[null,20]))).toEqual({rows:[],next:null});
  expect(await as(3,()=>rpc("assigned_page_v1",[null,1]))).toMatchObject({rows:[{id:assignment}],next:assignment});
  expect(await as(3,()=>rpc("assigned_page_v1",[assignment,1]))).toEqual({rows:[],next:null});
  await expect(as(3,()=>rpc("start_v1",[assignment,id(100)]))).rejects.toMatchObject({code:"55000"});
  await db.exec("update assess.launch_gate set enabled=true"); // disposable local DB only
  const attempt=(await as(3,()=>rpc<{attemptId:string}>("start_v1",[assignment,id(100)]))).attemptId;
  const read=()=>as(3,async()=>parseSession(await rpc("read_mixed_session_v1",[attempt])));
  const s=await read();expect(s.views!.distance!.controls).toEqual({sidCm:{kind:"number",min:100,max:200}});
  expect(s.assessment!.items[1]).toMatchObject({presentation:{controls:["sidCm"],sceneElements:[]}});
  expect(s.views!.distance!.sceneValues).toEqual({});expect(Object.keys(s.views!.distance!.initial)).toEqual(["sidCm"]);
  expect(JSON.stringify(s)).not.toMatch(/correctOption|privateItems|criteria|fixedSettings|caseRef|evaluatorVersion|review|itemMarks/);
  for(const who of [1,2,4,null])await expect(as(who,()=>rpc("read_mixed_session_v1",[attempt]))).rejects.toMatchObject({code:"42501"});
  const runner=new MixedRunner({start:async()=>attempt,read,command:async c=>{await as(3,()=>rpc("command_v1",[c.attemptId,c.operationId,c.expectedRevision,c.action]));}},()=>{});
  await runner.open(attempt);expect(runner.unresolved).toBe(3);
  runner.edit("letter",{type:"single-choice",optionId:"a"});expect(await runner.flush()).toBe(true);
  await runner.navigate(1);runner.edit("distance",{type:"simulator-part",values:{sidCm:150}});await runner.expose();
  expect(runner.session!.ack.lockedItemIds).toEqual(["distance"]);
  const resumed=await read();expect(resumed.answers!.distance).toMatchObject({values:{sidCm:150}});expect(resumed.ack.lockedItemIds).toEqual(["distance"]);
  // Installing a newer version does not change the existing snapshot.
  const next=await as(1,()=>rpc<string>("content_submit_v1",[mixedFixture("2")]));await installMixedContent(worker,next);expect((await read()).assessment!.ref.version).toBe("1");
  await runner.submit();expect(runner.session!.ack.state).toBe("grading");expect(runner.session!.assessment).toBeUndefined();
  await expect(as(3,()=>rpc("command_v1",[attempt,id(102),runner.session!.ack.revision,{type:"save",item:{id:"letter",version:"1"},answer:{type:"single-choice",optionId:"b"}}]))).rejects.toMatchObject({code:"55000"});
  runner.dispose();
  await db.query("update profiles set status='suspended' where user_id=$1",[id(3)]);await expect(read()).rejects.toMatchObject({code:"42501"});
  expect((await db.query("select count(*)::int n from public.attempts")).rows[0]).toEqual({n:0});
 }finally{await db.close();}
},40000);
