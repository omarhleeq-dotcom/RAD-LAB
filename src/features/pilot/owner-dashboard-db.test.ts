import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";
import { EMPTY_FILTERS, exportOwnerPart, localDateBound, readOwnerPage, type OwnerPage } from "./owner-data";
import { directoryPage } from "./owner-dashboard-deferred";
import { directoryPage as currentDirectoryPage, examSummaryPage } from "./owner-dashboard-data";
import type { SupabaseClient } from "@supabase/supabase-js";

it("reads pending first across bounded pages, searches all accounts, counts statuses, aggregates saved outcomes and denies nonowners",async()=>{
 const db=new PGlite();
 const owner="00000000-0000-0000-0000-000000000001",participant="00000000-0000-0000-0000-000000000002";
 try {
  await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;
   create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
  for(const f of readdirSync("supabase/migrations").filter(f=>f.endsWith(".sql")).sort())await db.exec(readFileSync(`supabase/migrations/${f}`,"utf8"));
  await db.query("insert into auth.users values($1,'owner@example.test',now(),'{}'),($2,'trainee@example.test',now(),'{}')",[owner,participant]);
  await db.query("update profiles set role='owner',status='approved' where user_id=$1",[owner]);
  await db.exec(`insert into auth.users select ('00000000-0000-0000-0001-'||lpad(i::text,12,'0'))::uuid,'fixture'||i||'@example.test',now(),'{}' from generate_series(1,200) i;
   update profiles set display_name='Fixture trainee',created_at='2026-01-01';`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);await db.exec("set role authenticated");
  const first=(await db.query<{p:{rows:Record<string,unknown>[];counts:{pending:number};next:Record<string,string>;boundary:string}}>("select owner_dashboard_v1('participants') p")).rows[0]!.p;
  expect(first.rows).toHaveLength(20);expect(first.counts.pending).toBe(201);expect(first.rows.every(r=>r.status==="pending")).toBe(true);
  const second=(await db.query<{p:{rows:Record<string,unknown>[]}}>("select owner_dashboard_v1('participants',p_cursor:=$1,p_boundary:=$2) p",[JSON.stringify(first.next),first.boundary])).rows[0]!.p;
  expect(second.rows).toHaveLength(20);expect(second.rows.some(r=>first.rows.some(a=>a.user_id===r.user_id))).toBe(false);
  const found=(await db.query<{p:{rows:unknown[]}}>("select owner_dashboard_v1('participants',p_search:='fixture200@') p")).rows[0]!.p;
  expect(found.rows).toHaveLength(1);
  await db.exec("reset role");
  await db.query(`insert into attempts(id,user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale,started_at,finished_at)
   values('10000000-0000-0000-0000-000000000001',$1,1,'chest-pa-erect','default','fixture','{}',$2,'en','2026-10-16','2026-10-16')`,[participant,JSON.stringify({total:80,passed:true,checks:[{id:"fixture-check",o:"fail",credit:0}]})]);
  // The linked attempt is outside 17–24; notes must be filtered by their own date, without an inner join.
  await db.query(`insert into feedback(user_id,exam_id,attempt_id,text,at) values
   ($1,'chest-pa-erect','10000000-0000-0000-0000-000000000001','17 Oct local start','2026-10-16T21:30:00Z'),
   ($1,'chest-pa-erect',null,'24 Oct local end','2026-10-24T20:59:59.999Z'),
   ($1,'chest-pa-erect',null,'25 Oct excluded','2026-10-24T21:00:00Z')`,[participant]);
  await db.exec("set role authenticated");
  const old=process.env.TZ;process.env.TZ="Asia/Amman";
  let from:string,to:string;
  try {from=localDateBound("2026-10-17");to=localDateBound("2026-10-24",true);}finally{if(old===undefined)delete process.env.TZ;else process.env.TZ=old;}
  expect(from).toBe("2026-10-16T21:00:00.000Z");expect(to).toBe("2026-10-24T20:59:59.999999Z");
  const rpc=async(args:Record<string,unknown>)=>({error:null,data:(await db.query<{p:OwnerPage}>("select owner_page_v1($1,$2,$3,$4,$5,$6,$7,$8,$9) p",[args.p_stream,args.p_limit,args.p_cursor,args.p_participant,args.p_from,args.p_to,args.p_exam,args.p_boundary,args.p_export])).rows[0]!.p});
  const filters={...EMPTY_FILTERS,from,to,exam:"chest-pa-erect"};
  const shown=await readOwnerPage(rpc,"notes",filters,null,"2026-10-25T00:00:00Z"),exported=await readOwnerPage(rpc,"notes",filters,null,shown.boundary,true);
  expect(shown.total).toBe(2);expect(exported.total).toBe(2);
  const csv=exportOwnerPart("notes",exported);expect(csv.written).toBe(2);expect(csv.skipped).toBe(0);expect(csv.csv).toContain("17 Oct local start");expect(csv.csv).toContain("24 Oct local end");expect(csv.csv).not.toContain("25 Oct excluded");
  const utc=await readOwnerPage(rpc,"notes",{...filters,from:"2026-10-17T00:00:00Z",to:"2026-10-24T23:59:59.999Z"},null,"2026-10-25T00:00:00Z");
  expect(utc.rows.map(r=>r.text)).not.toEqual(shown.rows.map(r=>r.text));
  // Minimal reproduction of an empty 17–24 export: one note in the first local day's UTC overlap.
  await db.exec("reset role;delete from feedback where text<>'17 Oct local start';set role authenticated");
  const missed=await readOwnerPage(rpc,"notes",{...filters,from:"2026-10-17T00:00:00Z",to:"2026-10-24T23:59:59.999999Z"},null,"2026-10-25T00:00:00Z",true);
  const fixed=await readOwnerPage(rpc,"notes",filters,null,"2026-10-25T00:00:00Z",true);
  expect(exportOwnerPart("notes",missed).written).toBe(0);
  expect(exportOwnerPart("notes",fixed).written).toBe(1);
  const ready=readFileSync("supabase/checks/owner-dashboard-ready.sql","utf8");
  const checked=await db.exec(ready);
  expect(checked[1]?.rows[0]).toMatchObject({rpc_present:true,function_contract:true,authenticated_execute:true,anon_denied:true,index_ready:true});
  const summary=(await db.query<{p:{rows:{attempts:number;passed:number;wrong:unknown[]}[]}}>("select owner_dashboard_v1('summary') p")).rows[0]!.p;
  const enriched=(await db.query<{p:OwnerPage}>("select owner_dashboard_v1('attempts') p")).rows[0]!.p;
  expect(enriched.rows[0]).toMatchObject({comparison:null,comparison_verified:true,id:"10000000-0000-0000-0000-000000000001"});
  expect(summary.rows[0]).toMatchObject({attempts:1,passed:1,wrong:[{id:"fixture-check",count:1}]});
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[participant]);
  await expect(db.query("select owner_dashboard_v1('participants')")).rejects.toThrow(/owner only/);
  await db.exec("reset role");await db.query("update profiles set status='suspended' where user_id=$1",[owner]);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);await db.exec("set role authenticated");
  await expect(db.query("select owner_dashboard_v1('summary')")).rejects.toThrow(/owner only/);
 }finally{await db.close();}
},30000);

it("converts browser calendar dates over DST and rejects malformed dates",()=>{
 const old=process.env.TZ;process.env.TZ="America/New_York";
 try {expect(Date.parse(localDateBound("2026-11-01",true))-Date.parse(localDateBound("2026-11-01"))+1).toBe(25*3600000);expect(()=>localDateBound("2026-02-30")).toThrow();}finally{if(old===undefined)delete process.env.TZ;else process.env.TZ=old;}
});
it("falls back only for a missing RPC, with bounded server search and no broad error fallback",async()=>{
 const calls:string[]=[];
 const client={rpc:async(name:string,args:Record<string,unknown>)=>{
  calls.push(name);
  if(name==="owner_dashboard_v1")return {error:{code:"PGRST202"}};
  expect(args.p_limit).toBe(20);expect(args.p_search).toBe("remote@example.test");
  return {data:{version:1,boundary:"2026-01-01T00:00:00Z",summary:null,rows:[],next:null},error:null};
 },from:()=>({select:()=>({eq:async()=>({count:0,error:null})})})} as unknown as SupabaseClient;
 const page=await directoryPage(client,"remote@example.test","",{cursor:null,boundary:null});
 expect(page.legacy).toBe(true);expect(page.next).toBeNull();expect(calls).toEqual(["owner_dashboard_v1","training_page_v1_with_comparison","training_page_v1_with_comparison","training_page_v1_with_comparison"]);
 await expect(directoryPage({rpc:async()=>({error:{code:"42501"}})} as unknown as SupabaseClient,"","",{cursor:null,boundary:null})).rejects.toThrow();
});

it("uses only installed directory APIs and returns the summary waiting state without any future RPC",async()=>{
 const calls:Record<string,unknown>[]=[];
 const client={rpc:async(name:string,args:Record<string,unknown>)=>{
   expect(name).toBe("training_page_v1_with_comparison");calls.push(args);
   return {data:{version:1,boundary:"2026-01-01T00:00:00Z",summary:null,rows:[],next:null},error:null};
 },from:()=>({select:()=>({eq:async()=>({count:0,error:null})})})} as unknown as SupabaseClient;
 const p=await currentDirectoryPage(client,"outside-page@example.test","suspended",{cursor:{id:"00000000-0000-0000-0000-000000000001"},boundary:"2026-01-01T00:00:00Z"});
 expect(p.legacy).toBe(true);expect(p.next).toBeNull();
 expect(calls).toMatchObject([{p_search:"outside-page@example.test",p_status:"suspended",p_limit:20,p_cursor:{id:"00000000-0000-0000-0000-000000000001"}}]);
 const before=calls.length;
 expect(await examSummaryPage(client,EMPTY_FILTERS,{cursor:null,boundary:null})).toBeNull();
 expect(calls).toHaveLength(before);
});

it("searches the next status when the pending partition is empty, preserving bounded reads",async()=>{
 const statuses:string[]=[];
 const client={rpc:async(name:string,args:Record<string,unknown>)=>{
  expect(name).toBe("training_page_v1_with_comparison");expect(args.p_limit).toBe(20);statuses.push(String(args.p_status));
  return {data:{version:1,boundary:"2026-01-01T00:00:00Z",summary:null,rows:[],next:null},error:null};
 },from:()=>({select:()=>({eq:async()=>({count:0,error:null})})})} as unknown as SupabaseClient;
 expect((await currentDirectoryPage(client,"matching@example.test","",{cursor:null,boundary:null})).rows).toHaveLength(0);
 expect(statuses).toEqual(["pending","approved","suspended"]);
});

it("reads and exports notes against the installed migration ceiling without dashboard SQL",async()=>{
 const db=new PGlite(),owner="00000000-0000-0000-0000-000000000001";
 try{
  await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;
   create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
  for(const f of readdirSync("supabase/migrations").filter(f=>f.endsWith(".sql")&&f<"20261024000100").sort())await db.exec(readFileSync(`supabase/migrations/${f}`,"utf8"));
  expect((await db.query<{n:number}>("select count(*)::int n from pg_proc where proname='owner_dashboard_v1'")).rows[0]!.n).toBe(0);
  await db.query("insert into auth.users values($1,'fixture@example.test',now(),'{}')",[owner]);
  await db.query("update profiles set role='owner',status='approved' where user_id=$1",[owner]);
  await db.query("insert into feedback(user_id,exam_id,text,at) select $1,'chest-pa-erect','Fixture note '||i,'2026-10-18'::timestamptz + i*interval '1 minute' from generate_series(1,25) i",[owner]);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);await db.exec("set role authenticated");
  const rpc=async(a:Record<string,unknown>)=>({error:null,data:(await db.query<{p:OwnerPage}>("select owner_page_v1($1,$2,$3,$4,$5,$6,$7,$8,$9) p",[a.p_stream,a.p_limit,a.p_cursor,a.p_participant,a.p_from,a.p_to,a.p_exam,a.p_boundary,a.p_export])).rows[0]!.p});
  const filters={...EMPTY_FILTERS,exam:"chest-pa-erect",from:"2026-10-17T00:00:00Z",to:"2026-10-24T23:59:59.999999Z"};
  const first=await readOwnerPage(rpc,"notes",filters,null,"2026-10-25T00:00:00Z",false,20);
  expect(first.total).toBe(25);expect(first.rows).toHaveLength(20);expect(first.next).not.toBeNull();
  const second=await readOwnerPage(rpc,"notes",filters,first.next,first.boundary,false,20);
  expect(second.rows).toHaveLength(5);expect(second.next).toBeNull();
  const exported=await readOwnerPage(rpc,"notes",filters,null,first.boundary,true,1000);
  expect(exportOwnerPart("notes",exported).written).toBe(25);expect(exported.rows.every(r=>!Object.hasOwn(r,"user_id"))).toBe(true);
 }finally{await db.close();}
},30000);
