import {readdirSync,readFileSync} from "node:fs";
import {PGlite} from "@electric-sql/pglite";
import {expect,it} from "vitest";
import {practicalFixture,fixtureId as id} from "../../../scripts/assess/e-fixture";
import {mixedFixture} from "../../../scripts/assess/d-fixture";
import {installPracticalContent} from "./server-practical";
import {installMixedContent} from "./server-presentation";
import {parsePracticalSession} from "./practical-data";
import {runAssessJobs,type AssessRpc} from "./server-service";
import {gradePublication} from "./server-grader";
it("E upgrades C/D without changing Practice; isolates publications/identities, pins sessions and enforces one exposure and terminal grading",async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
 for(const f of readdirSync("supabase/migrations").filter(f=>f.endsWith(".sql")&&f<"20261020000900").sort())await db.exec(readFileSync(`supabase/migrations/${f}`,"utf8"));
 const publicState=async()=>(await db.query("select oid::regprocedure::text id,pg_get_functiondef(oid) def,proacl::text acl from pg_proc where pronamespace='public'::regnamespace order by 1")).rows;
 const before=await publicState();await db.exec(readFileSync("supabase/migrations/20261020000900_assess_practical_ui.sql","utf8"));expect(await publicState()).toEqual(before);
 for(let n=1;n<=5;n++)await db.query("insert into auth.users values($1,$2,now(),$3)",[id(n),`synthetic${n}@example.test`,JSON.stringify({display_name:"Synthetic"})]);
 await db.exec(`update profiles set status='approved';update profiles set role='owner' where user_id in ('${id(1)}','${id(2)}')`);
 async function as<T>(who:number|"worker"|null,fn:()=>Promise<T>){await db.exec(`set role ${who==="worker"?"assess_worker":who===null?"anon":"authenticated"}`);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[typeof who==="number"?id(who):""]);try{return await fn();}finally{await db.exec("reset role");}}
 async function rpc<T>(fn:string,args:unknown[]=[]){return (await db.query<{v:T}>(`select assess.${fn}(${args.map((_,i)=>`$${i+1}`).join(",")}) v`,args)).rows[0]!.v;}
 const worker:AssessRpc={call:<T>(fn:string,args:Record<string,unknown>)=>as("worker",()=>rpc<T>(fn,Object.values(args)))};
 const pub=practicalFixture();
 for(const who of [null,3,4])await expect(as(who,()=>rpc("content_submit_v1",[pub]))).rejects.toMatchObject({code:"42501"});
 const version=await as(1,()=>rpc<string>("content_submit_v1",[pub]));
 await expect(as(1,()=>rpc("content_submit_v1",[pub]))).rejects.toMatchObject({code:"23505"});
 await expect(as(2,()=>rpc("content_submit_v1",[practicalFixture("2")]))).rejects.toMatchObject({code:"42501"});
 await expect(installMixedContent(worker,version)).rejects.toThrow();
 for(const who of [1,2,3,4,null]){
  for(const table of ["practical_presentations","publications","session_details","results","receipts"])
   await expect(as(who,()=>db.query(`select * from assess.${table}`))).rejects.toMatchObject({code:"42501"});
  await expect(as(who,()=>rpc("content_install_practical_v1",[version,{},{}]))).rejects.toMatchObject({code:"42501"});
  await expect(as(who,()=>rpc("content_read_v1",[version]))).rejects.toMatchObject({code:"42501"});
 }
 await installPracticalContent(worker,version);await expect(installPracticalContent(worker,version)).rejects.toThrow();
 const mixedDoc=mixedFixture();mixedDoc.assessment.ref.id=id(11);const mixed=await as(1,()=>rpc<string>("content_submit_v1",[mixedDoc]));await installMixedContent(worker,mixed);
 const assignment=await as(1,()=>rpc<string>("assign_v1",[version,[id(3)],[]]));
 expect(await as(3,()=>rpc("assigned_page_v1",[null,20]))).toEqual({rows:[],next:null});
 expect(await as(4,()=>rpc("assigned_practical_page_v1",[null,20]))).toEqual({rows:[],next:null});
 expect(await as(3,()=>rpc("assigned_practical_page_v1",[null,1]))).toMatchObject({rows:[{id:assignment}],next:assignment});
 expect(await as(3,()=>rpc("assigned_practical_page_v1",[assignment,1]))).toEqual({rows:[],next:null});
 await expect(as(null,()=>rpc("assigned_practical_page_v1",[null,1]))).rejects.toMatchObject({code:"42501"});
 await expect(as(3,()=>rpc("start_v1",[assignment,id(100)]))).rejects.toMatchObject({code:"55000"});
 const catalogue=await db.exec(readFileSync("supabase/checks/assess-practical-ready.sql","utf8"));expect(catalogue[1]!.rows[0]).toEqual({read_only:true,presentation_rls:true,no_direct_grants:true,participant_read_grants:true,private_installer:true,launch_gate_closed:true,runtime_or_launch_verified:false});
 await db.exec("update assess.launch_gate set enabled=true"); // disposable synthetic DB only, never a provider
 const attempt=(await as(3,()=>rpc<{attemptId:string}>("start_v1",[assignment,id(100)]))).attemptId;
 const read=()=>as(3,async()=>parsePracticalSession(await rpc("read_practical_session_v1",[attempt])));
 let s=await read();expect(s.ack.lockedItemIds).toEqual([]);
 expect(JSON.stringify(s)).not.toMatch(/correctOption|privateItems|criteria|fixedSettings|evaluatorVersion|review|itemMarks|scoring|tolerance/);
 for(const who of [1,2,4,null])await expect(as(who,()=>rpc("read_practical_session_v1",[attempt]))).rejects.toMatchObject({code:"42501"});
 await expect(as(3,()=>rpc("read_mixed_session_v1",[attempt]))).rejects.toMatchObject({code:"55000"});
 const item=s.assessment!.items[0]!,values={...s.views![item.ref.id]!.initial,kvp:110},answer={type:"full-practical",values};
 const command=(op:number,rev:number,action:unknown)=>as(3,()=>rpc("command_v1",[attempt,id(op),rev,action]));
 await expect(command(101,0,{type:"save",item:item.ref,answer:{...answer,values:{...values,score:100}}})).rejects.toMatchObject({code:"22023"});
 const exposure={type:"expose",item:item.ref,answer};const ack=await command(102,0,exposure);
 expect(await command(102,0,exposure)).toEqual(ack);
 await expect(command(102,0,{...exposure,answer:{...answer,values:{...values,kvp:120}}})).rejects.toMatchObject({code:"22023"});
 await expect(command(103,0,exposure)).rejects.toMatchObject({code:"40001"});
 await expect(command(104,1,exposure)).rejects.toMatchObject({code:"55000"});
 await expect(command(105,1,{type:"save",item:item.ref,answer})).rejects.toMatchObject({code:"55000"});
 s=await read();expect(s.ack.lockedItemIds).toEqual([item.ref.id]);expect(s.answers![item.ref.id]).toEqual(answer);
 const next=await as(1,()=>rpc<string>("content_submit_v1",[practicalFixture("2")]));await installPracticalContent(worker,next);
 expect((await read()).assessment!.ref.version).toBe("1");
 await command(106,1,{type:"submit"});expect((await read()).assessment).toBeUndefined();
 await expect(command(107,2,exposure)).rejects.toMatchObject({code:"55000"});
 expect((await runAssessJobs(worker,10)).graded).toBe(1);
 const grade=gradePublication(pub,{[item.ref.id]:answer as never},[item.ref.id]);
 expect((await db.query("select earned_n::text n,earned_d::text d from assess.results where session_id=$1",[attempt])).rows[0]).toEqual({n:grade.numerator,d:grade.denominator});
 const result=await as(3,()=>rpc("result_v1",[attempt]));expect(JSON.stringify(result)).not.toMatch(/earned|maximum|full-0|values|checks/);
 expect((await db.query("select count(*)::int n from assess.session_details where session_id=$1",[attempt])).rows[0]).toEqual({n:0});
 expect((await db.query("select count(*)::int n from assess.receipts where session_id=$1",[attempt])).rows[0]).toEqual({n:0});
 // A second allowed attempt expires from server state alone; an unexposed saved item scores zero.
 const second=(await as(3,()=>rpc<{attemptId:string}>("start_v1",[assignment,id(108)]))).attemptId;
 await as(3,()=>rpc("command_v1",[second,id(109),0,{type:"save",item:item.ref,answer}]));
 await db.query("update assess.sessions set deadline=clock_timestamp()-interval '1 second' where id=$1",[second]);
 await runAssessJobs(worker,10);expect((await db.query("select earned_n::text n from assess.results where session_id=$1",[second])).rows[0]).toEqual({n:"0"});
 await expect(as(3,()=>rpc("start_v1",[assignment,id(110)]))).rejects.toMatchObject({code:"54000"});
 await db.query("update profiles set status='suspended' where user_id=$1",[id(3)]);await expect(read()).rejects.toMatchObject({code:"42501"});
 expect((await db.query("select count(*)::int n from public.attempts")).rows[0]).toEqual({n:0});
 }finally{await db.close();}
},40000);
