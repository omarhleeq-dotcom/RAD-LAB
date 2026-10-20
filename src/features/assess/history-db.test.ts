import {readdirSync,readFileSync} from "node:fs";
import {PGlite} from "@electric-sql/pglite";
import {expect,it} from "vitest";
import {ASSESS_CONSENT_VERSION,parseHistoryPage} from "./history-data";
import {resultExpiresAt} from "./policies";
import {validatePublication} from "./server-validation";
import {runAssessJobs,type AssessRpc} from "./server-service";
import type {AssessmentPublication} from "./server-contracts";
const id=(n:number)=>`00000000-0000-0000-0000-${String(n).padStart(12,"0")}`;
it("F preserves C/Practice and exercises consent, bounded isolated history, exact calendar expiry and idempotent purge",async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
 for(const f of readdirSync("supabase/migrations").filter(f=>f.endsWith(".sql")&&f<"20261020001000").sort())await db.exec(readFileSync(`supabase/migrations/${f}`,"utf8"));
 const state=async()=>(await db.query<{id:string;def:string;acl:string|null}>("select oid::regprocedure::text id,pg_get_functiondef(oid) def,proacl::text acl from pg_proc where pronamespace in ('public'::regnamespace,'assess'::regnamespace) order by 1")).rows;
 const before=await state();await db.exec(readFileSync("supabase/migrations/20261020001000_assess_history_consent.sql","utf8"));expect((await state()).filter(r=>before.some(b=>b.id===r.id))).toEqual(before);
 for(let n=1;n<=5;n++)await db.query("insert into auth.users values($1,$2,now(),$3)",[id(n),`synthetic${n}@example.test`,JSON.stringify({display_name:"Synthetic"})]);
 await db.exec(`update profiles set status='approved';update profiles set role='owner' where user_id='${id(1)}';update profiles set status='suspended' where user_id='${id(5)}';`);
 async function as<T>(who:number|"worker"|null,fn:()=>Promise<T>){await db.exec(`set role ${who==="worker"?"assess_worker":who===null?"anon":"authenticated"}`);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[typeof who==="number"?id(who):""]);try{return await fn();}finally{await db.exec("reset role");}}
 async function rpc<T=unknown>(fn:string,args:unknown[]=[]){return (await db.query<{v:T}>(`select assess.${fn}(${args.map((_,i)=>`$${i+1}`).join(",")}) v`,args)).rows[0]!.v;}
 const worker:AssessRpc={call:<T>(fn:string,args:Record<string,unknown>)=>as("worker",()=>rpc<T>(fn,Object.values(args)))};
 for(const who of [null,5,"worker"] as const)for(const fn of ["consent_v1","history_page_v1"])await expect(as(who,()=>rpc(fn))).rejects.toMatchObject({code:"42501"});
 for(const who of [null,1,3,4,"worker"] as const)for(const table of ["consents","results","sessions","session_details","receipts"]){
  await expect(as(who,()=>db.query(`select * from assess.${table}`))).rejects.toMatchObject({code:"42501"});
  await expect(as(who,()=>db.exec(`delete from assess.${table}`))).rejects.toMatchObject({code:"42501"});
 }
 expect(await as(3,()=>rpc("consent_v1"))).toEqual({accepted:false});
 await expect(as(3,()=>rpc("consent_v1",["practice-consent"])) ).rejects.toMatchObject({code:"22023"});
 const pub:AssessmentPublication={schemaVersion:1,assessment:{schemaVersion:1,ref:{id:id(10),version:"1"},name:"Synthetic alphabet",track:"mixed",maximum:"10",policy:{durationSeconds:3600,maxAttempts:20,gradeVisibility:"hidden"},items:[{schemaVersion:1,ref:{id:"q",version:"1"},contentLanguage:"en",type:"single-choice",prompt:"Choose a synthetic letter",options:[{id:"a",text:"A"},{id:"b",text:"B"}]}]},itemMarks:[{item:{id:"q",version:"1"},maximum:"10"}],privateItems:[{schemaVersion:1,ref:{id:"q",version:"1"},type:"single-choice",correctOptionId:"a",review:{sources:[{reference:"Synthetic alphabet",licenceEvidence:"Own fixture"}],reviewedBy:"Synthetic test",reviewedAt:"2026-10-20T00:00:00.000Z",scope:"Engineering only"}}]};
 await db.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values($1,$2,$1,'1','Synthetic alphabet','mixed',true)",[id(10),id(1)]);
 await as("worker",()=>rpc("install_publication_v1",[id(10),pub,validatePublication(pub).specs]));
 const assignment=await as(1,()=>rpc<string>("assign_v1",[id(10),[id(3),id(4)],[]]));
 const ready=await db.exec(readFileSync("supabase/checks/assess-history-ready.sql","utf8"));expect(ready[1]!.rows[0]).toEqual({read_only:true,consent_rls:true,no_direct_consent_grants:true,participant_rpc_grants:true,start_consent_guard:true,private_trigger:true,launch_gate_closed:true,runtime_or_launch_verified:false});
 await db.exec("update assess.launch_gate set enabled=true"); // disposable local synthetic DB only
 await expect(as(3,()=>rpc("start_v1",[assignment,id(100)]))).rejects.toMatchObject({code:"42501"});
 expect((await db.query("select count(*)::int n from assess.reservations")).rows[0]).toEqual({n:0});
 expect(await as(3,()=>rpc("consent_v1",[ASSESS_CONSENT_VERSION]))).toEqual({accepted:true});
 const acceptance=(await db.query("select * from assess.consents")).rows;
 await as(3,()=>rpc("consent_v1",[ASSESS_CONSENT_VERSION]));expect((await db.query("select * from assess.consents")).rows).toEqual(acceptance);expect(await as(4,()=>rpc("consent_v1"))).toEqual({accepted:false});
 async function attempt(op:number){return (await as(3,()=>rpc<{attemptId:string}>("start_v1",[assignment,id(op)]))).attemptId;}
 async function finish(s:string,op:number){await as(3,()=>rpc("command_v1",[s,id(op),0,{type:"submit"}]));expect((await runAssessJobs(worker,100)).graded).toBe(1);}
 const hidden=await attempt(101);await finish(hidden,201);
 const a=await as(3,()=>rpc("history_page_v1",[null,1]));expect(parseHistoryPage(a).rows).toEqual([{name:"Synthetic alphabet",track:"mixed",submittedAt:expect.any(String),grade:{visibility:"hidden"}}]);
 expect(await as(4,()=>rpc("history_page_v1"))).toEqual({rows:[],next:null});expect(await as(1,()=>rpc("history_page_v1"))).toEqual({rows:[],next:null});
 for(const limit of [0,101,null])await expect(as(3,()=>rpc("history_page_v1",[null,limit]))).rejects.toMatchObject({code:"22023"});
 const shown=await attempt(102);await finish(shown,202);await db.query("update assess.results set visibility='after-submission',earned_n=1,earned_d=8,track='full-practical' where session_id=$1",[shown]);
 const all=parseHistoryPage(await as(3,()=>rpc("history_page_v1")));expect(all.rows).toHaveLength(2);expect(all.rows.find(r=>r.track==="full-practical")!.grade).toEqual({visibility:"shown",earned:"0.13",maximum:"10.00"});
 const first=parseHistoryPage(await as(3,()=>rpc("history_page_v1",[null,1]))),second=parseHistoryPage(await as(3,()=>rpc("history_page_v1",[first.next,1])));expect(second.rows).toHaveLength(1);expect(first.rows).not.toEqual(second.rows);expect(parseHistoryPage(await as(3,()=>rpc("history_page_v1",[second.next,1]))).rows).toEqual([]);
 await as(1,()=>rpc("targets_write_v1",[assignment,1,[id(3)],false]));expect(parseHistoryPage(await as(3,()=>rpc("history_page_v1"))).rows).toEqual([]);await as(1,()=>rpc("targets_write_v1",[assignment,2,[id(3)],true]));
 await db.query("update profiles set status='suspended' where user_id=$1",[id(3)]);await expect(as(3,()=>rpc("history_page_v1"))).rejects.toMatchObject({code:"42501"});await db.query("update profiles set status='approved' where user_id=$1",[id(3)]);
 // Exercise C finish's SQL calendar calculation, not an invented days count, under a non-UTC session zone.
 await db.exec("set timezone='Pacific/Auckland'");
 for(const [n,date,expected] of [[301,"2095-08-31T23:59:59.123Z","2096-02-29T23:59:59.123Z"],[302,"2096-08-31T05:30:00.000Z","2097-02-28T05:30:00.000Z"],[303,"2098-10-31T12:00:00.000Z","2099-04-30T12:00:00.000Z"],[304,"2099-12-31T12:00:00.000Z","2100-06-30T12:00:00.000Z"]] as const){
  const s=await attempt(n);await as(3,()=>rpc("command_v1",[s,id(n+100),0,{type:"submit"}]));const claim=await as("worker",()=>rpc<{token:string}>("claim_v1"));await db.query("update assess.sessions set submitted_at=$2 where id=$1",[s,date]);await as("worker",()=>rpc("finish_v1",[s,claim.token,"0","1"]));
  const expiry=(await db.query<{v:string}>(`select to_char(expires_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') v from assess.sessions where id=$1`,[s])).rows[0]!.v;expect(expiry).toBe(expected);expect(expiry).toBe(resultExpiresAt(date));
 }
 await db.query("update assess.sessions set expires_at=clock_timestamp() where id in ($1,$2)",[hidden,shown]);
 expect(parseHistoryPage(await as(3,()=>rpc("history_page_v1"))).rows.every(r=>r.name!=="Synthetic alphabet"||r.submittedAt!==all.rows[0]!.submittedAt)).toBe(true);
 await expect(as(3,()=>rpc("result_v1",[hidden]))).rejects.toMatchObject({code:"42501"});
 const used=(await db.query("select used from assess.reservations")).rows;
 await as("worker",()=>rpc("maintain_v1",[100]));await as("worker",()=>rpc("maintain_v1",[100]));expect((await db.query("select * from assess.results where session_id in ($1,$2)",[hidden,shown])).rows).toEqual([]);expect((await db.query("select used from assess.reservations")).rows).toEqual(used);
 expect((await db.query("select * from assess.session_details")).rows).toEqual([]);expect((await db.query("select * from assess.receipts")).rows).toEqual([]);expect((await db.query("select * from public.attempts")).rows).toEqual([]);
 }finally{await db.close();}
},40000);
