import { readdirSync,readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { expect,it } from "vitest";
import type { AssessmentPublication } from "./server-contracts";
import { ASSESS_EVALUATOR,caseVersion,validatePublication } from "./server-validation";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import { gradePublication } from "./server-grader";
import { runAssessJobs,type AssessRpc } from "./server-service";

const id=(n:number)=>`00000000-0000-0000-0000-${String(n).padStart(12,"0")}`;
const publication=(refId=id(10),visibility:"hidden"|"after-submission"="hidden"):AssessmentPublication=>({
  schemaVersion:1,assessment:{schemaVersion:1,ref:{id:refId,version:"v1"},name:"Synthetic non-clinical",track:"mixed",maximum:"10",policy:{durationSeconds:3600,maxAttempts:1,gradeVisibility:visibility},items:[
    {schemaVersion:1,ref:{id:"q",version:"1"},contentLanguage:"en",prompt:"Synthetic letter",type:"single-choice",options:[{id:"a",text:"A"},{id:"b",text:"B"}]},
    {schemaVersion:1,ref:{id:"sim",version:"1"},contentLanguage:"en",prompt:"Engineering fixture only",type:"simulator-part",presentation:{controls:["sidCm"],sceneElements:[]}},
  ]},itemMarks:[{item:{id:"q",version:"1"},maximum:"1"},{item:{id:"sim",version:"1"},maximum:"1"}],privateItems:[
    {schemaVersion:1,ref:{id:"q",version:"1"},type:"single-choice",correctOptionId:"a",review:{sources:[{reference:"Synthetic fixture",licenceEvidence:"Own test fixture"}],reviewedBy:"Test only",reviewedAt:"2026-10-19T00:00:00.000Z",scope:"Engineering; not clinical"}},
    {schemaVersion:1,ref:{id:"sim",version:"1"},type:"simulator-part",caseRef:{id:chestPaErect.id,version:caseVersion(chestPaErect)},evaluatorVersion:ASSESS_EVALUATOR,fixedSettings:structuredClone(chestPaErect.initialSettings),mutablePaths:["sidCm"],criteria:[{ruleId:chestPaErect.rules.find(r=>r.kind==="range"&&r.setting==="sidCm")!.id,part:"sidCm",maximum:"1"}],review:{sources:[{reference:"Existing case, engineering only",licenceEvidence:"No new content"}],reviewedBy:"Test only",reviewedAt:"2026-10-19T00:00:00.000Z",scope:"Engineering; not clinical"}},
  ]});

it("executes the full migration chain: authority, replay, expiry, grading leases, rollback and deletion",async()=>{
  const db=new PGlite();
  try {
    await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
    const files=readdirSync("supabase/migrations").filter(f=>f.endsWith(".sql")).sort();
    for(const f of files.filter(f=>f<"20261020000700"))await db.exec(readFileSync(`supabase/migrations/${f}`,"utf8"));
    const publicState=async()=>(await db.query("select oid::regprocedure::text id,pg_get_functiondef(oid) def,proacl::text acl from pg_proc where pronamespace='public'::regnamespace order by 1")).rows;
    const before=await publicState();
    await db.transaction(async tx=>{await tx.exec(readFileSync("supabase/migrations/20261020000700_assess_lifecycle.sql","utf8"));});
    expect(await publicState()).toEqual(before);
    for(let i=1;i<=5;i++)await db.query("insert into auth.users values($1,$2,now(),$3)",[id(i),`synthetic${i}@example.test`,JSON.stringify({display_name:"Fixture"})]);
    await db.exec(`update profiles set status='approved';update profiles set role='owner' where user_id in ('${id(1)}','${id(2)}');update profiles set status='suspended' where user_id='${id(5)}';`);
    const as=async<T,>(who:number|"worker"|null,fn:()=>Promise<T>)=>{
      await db.exec(`set role ${who==="worker"?"assess_worker":who===null?"anon":"authenticated"}`);
      await db.query("select set_config('request.jwt.claim.sub',$1,false)",[typeof who==="number"?id(who):""]);
      try{return await fn();}finally{await db.exec("reset role");}
    };
    const rpc=async<T,>(fn:string,args:unknown[]=[]) => (await db.query<{v:T}>(`select assess.${fn}(${args.map((_,i)=>`$${i+1}`).join(",")}) v`,args)).rows[0]!.v;
    const worker:AssessRpc={call:<T,>(fn:string,args:Record<string,unknown>)=>as("worker",()=>rpc<T>(fn,Object.values(args)))};
    async function install(n:number,visibility:"hidden"|"after-submission"="hidden",duration:number|null=3600){
      await db.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values($1,$2,$1,'v1','Synthetic non-clinical','mixed',true)",[id(n),id(1)]);
      const pub=publication(id(n),visibility);pub.assessment.policy.durationSeconds=duration;
      const {specs}=validatePublication(pub);
      await as("worker",()=>rpc("install_publication_v1",[id(n),pub,specs]));
      return as(1,()=>rpc<string>("assign_v1",[id(n),[id(3),id(4)],[]]));
    }
    const assignment=await install(10);
    await expect(as(3,()=>rpc("start_v1",[assignment,id(501)]))).rejects.toMatchObject({code:"55000"});
    await db.exec("update assess.launch_gate set enabled=true"); // disposable DB only; never a production setup instruction
    const start=()=>as(3,()=>rpc<{attemptId:string}>("start_v1",[assignment,id(501)]));
    const session=(await start()).attemptId;
    expect((await start()).attemptId).toBe(session);
    expect((await db.query<{used:number}>("select used from assess.reservations")).rows[0]!.used).toBe(1);
    const cmd=(op:number,rev:number,action:unknown)=>as(3,()=>rpc<Record<string,unknown>>("command_v1",[session,id(op),rev,action]));
    const save={type:"save",item:{id:"q",version:"1"},answer:{type:"single-choice",optionId:"a"}};
    const ack=await cmd(100,0,save);
    expect(await cmd(100,0,save)).toEqual(ack); // lost ack, exact retry
    await expect(cmd(100,0,{...save,answer:{type:"single-choice",optionId:"b"}})).rejects.toMatchObject({code:"22023"});
    await expect(cmd(101,0,save)).rejects.toMatchObject({code:"40001"});
    for(const who of [null,1,2,4,5] as const) {
      await expect(as(who,()=>rpc("read_session_v1",[session]))).rejects.toMatchObject({code:"42501"});
      await expect(as(who,()=>rpc("command_v1",[session,id(102),1,save]))).rejects.toMatchObject({code:"42501"});
    }
    await db.query("update profiles set status='suspended' where user_id=$1",[id(3)]);
    await expect(as(3,()=>rpc("read_session_v1",[session]))).rejects.toMatchObject({code:"42501"});
    await db.query("update profiles set status='approved' where user_id=$1",[id(3)]);
    await as(1,()=>rpc("targets_write_v1",[assignment,1,[id(3)],false]));
    await expect(cmd(102,1,save)).rejects.toMatchObject({code:"42501"});
    await as(1,()=>rpc("targets_write_v1",[assignment,2,[id(3)],true]));
    for(const invalid of [null,{}, {type:"save",item:{id:"q",version:"WRONG"},answer:save.answer},
      {...save,answer:{type:"single-choice",optionId:"evil"}}, {...save,answer:{type:"single-choice",optionId:"a",score:100}},
      {type:"save",item:{id:"sim",version:"1"},answer:{type:"simulator-part",values:{kvp:120}}},
      {type:"save",item:{id:"sim",version:"1"},answer:{type:"simulator-part",values:{sidCm:"180"}}},
      {type:"save",item:{id:"sim",version:"1"},answer:{type:"simulator-part",values:{sidCm:9999}}},
      {type:"submit",score:10}, {type:"expose",item:{id:"q",version:"1"},answer:save.answer}])
      await expect(cmd(102,1,invalid)).rejects.toBeDefined();
    const exposure={type:"expose",item:{id:"sim",version:"1"},answer:{type:"simulator-part",values:{sidCm:180}}};
    const exposureAck=await cmd(103,1,exposure);
    const read=await as(3,()=>rpc<Record<string,unknown>>("read_session_v1",[session]));
    expect(JSON.stringify(read)).not.toMatch(/correctOption|fixedSettings|criteria|evaluatorVersion|itemMarks|review/);
    expect(read).toMatchObject({ack:{lockedItemIds:["sim"],revision:2},answers:{sim:exposure.answer}});
    expect(await cmd(103,1,exposure)).toEqual(exposureAck);
    await expect(cmd(104,2,exposure)).rejects.toMatchObject({code:"55000"});
    await expect(cmd(105,2,{...exposure,type:"save"})).rejects.toMatchObject({code:"55000"});
    const submitAck=await cmd(106,2,{type:"submit"});
    expect(await cmd(106,2,{type:"submit"})).toEqual(submitAck);
    await expect(cmd(107,3,save)).rejects.toMatchObject({code:"55000"});
    const claim=await as("worker",()=>rpc<{attemptId:string;token:string}>("claim_v1"));
    expect(await as("worker",()=>rpc("claim_v1"))).toBeNull(); // no second worker owns this lease
    await expect(as("worker",()=>rpc("finish_v1",[session,id(999),"10","1"]))).rejects.toMatchObject({code:"40001"});
    // Failure during deletion rolls the inserted result back too.
    await db.exec("create function assess.inject_failure() returns trigger language plpgsql as $$begin raise exception 'synthetic';end$$;create trigger injected before delete on assess.session_details for each row execute function assess.inject_failure();");
    await expect(as("worker",()=>rpc("finish_v1",[session,claim.token,"10","1"]))).rejects.toBeDefined();
    expect((await db.query("select * from assess.results")).rows).toHaveLength(0);
    expect((await db.query("select * from assess.session_details")).rows).toHaveLength(1);
    await db.exec("drop trigger injected on assess.session_details;drop function assess.inject_failure();");
    await as("worker",()=>rpc("fail_v1",[session,claim.token]));
    expect(await as("worker",()=>rpc("claim_v1"))).toBeNull();
    await as("worker",()=>rpc("recover_v1",[session]));
    const snap=(await db.query<{publication:AssessmentPublication;answers:Parameters<typeof gradePublication>[1];locked:string[]}>("select publication,answers,locked from assess.session_details where session_id=$1",[session])).rows[0]!;
    gradePublication(snap.publication,snap.answers,snap.locked);
    expect(await runAssessJobs(worker,1)).toMatchObject({graded:1,failed:0});
    expect((await db.query("select * from assess.session_details")).rows).toEqual([]);
    expect((await db.query("select * from assess.receipts")).rows).toEqual([]);
    expect(await as(3,()=>rpc("result_v1",[session]))).toEqual({name:"Synthetic non-clinical",track:"mixed",submittedAt:expect.any(String),grade:{visibility:"hidden"}});
    await as(1,()=>rpc("targets_write_v1",[assignment,3,[id(3)],false]));
    await expect(as(3,()=>rpc("result_v1",[session]))).rejects.toMatchObject({code:"42501"});
    await as(1,()=>rpc("targets_write_v1",[assignment,4,[id(3)],true]));
    expect((await cmd(106,2,{type:"submit"})).state).toBe("graded");
    await expect(cmd(106,2,{type:"submit",score:100})).rejects.toMatchObject({code:"55000"});
    await expect(as(3,()=>rpc("start_v1",[assignment,id(599)]))).rejects.toMatchObject({code:"54000"});
    await expect(as(4,()=>rpc("result_v1",[session]))).rejects.toMatchObject({code:"42501"});
    // Expiry with browser closed uses saved MCQ, zero for missing simulator, and the deadline as submission time.
    const a2=await install(11,"after-submission");const s2=(await as(3,()=>rpc<{attemptId:string}>("start_v1",[a2,id(502)]))).attemptId;
    await as(3,()=>rpc("command_v1",[s2,id(201),0,save]));
    await db.query("update assess.sessions set deadline=clock_timestamp()-interval '1 second' where id=$1",[s2]);
    expect(await runAssessJobs(worker,1)).toMatchObject({maintenance:{expired:1},graded:1});
    expect(await as(3,()=>rpc("result_v1",[s2]))).toMatchObject({grade:{visibility:"shown",earned:"5.00",maximum:"10.00"}});
    const s3=(await as(4,()=>rpc<{attemptId:string}>("start_v1",[a2,id(502)]))).attemptId;
    await db.query("update assess.sessions set deadline=clock_timestamp()-interval '1 second' where id=$1",[s3]);
    expect(await as(4,()=>rpc("command_v1",[s3,id(202),0,save]))).toMatchObject({accepted:false,reason:"deadline",state:"grading"});
    expect((await db.query<{answers:unknown}>("select answers from assess.session_details where session_id=$1",[s3])).rows[0]!.answers).toEqual({});
    await runAssessJobs(worker,1);
    await db.query("update assess.sessions set expires_at=clock_timestamp() where id=$1",[session]);
    await expect(as(3,()=>rpc("result_v1",[session]))).rejects.toMatchObject({code:"42501"});
    await runAssessJobs(worker,1);
    expect((await db.query("select id from assess.sessions where id=$1",[session])).rows).toEqual([]);
    await expect(as(3,()=>rpc("start_v1",[assignment,id(599)]))).rejects.toMatchObject({code:"54000"}); // purge cannot restore the reserved attempt
    // Immutable content: a second installation cannot replace keys behind an existing version.
    const p=publication(id(11),"after-submission");
    await expect(as("worker",()=>rpc("install_publication_v1",[id(11),p,validatePublication(p).specs]))).rejects.toMatchObject({code:"23505"});
    // A crashed worker lease can be reclaimed; its stale token cannot finalise later.
    const a4=await install(13,"after-submission"),s4=(await as(3,()=>rpc<{attemptId:string}>("start_v1",[a4,id(504)]))).attemptId;
    await as(3,()=>rpc("command_v1",[s4,id(204),0,{type:"submit"}]));
    const oldClaim=await as("worker",()=>rpc<{token:string}>("claim_v1"));
    await db.query("update assess.sessions set lease_until=clock_timestamp()-interval '1 second' where id=$1",[s4]);
    const newClaim=await as("worker",()=>rpc<{token:string}>("claim_v1"));expect(newClaim.token).not.toBe(oldClaim.token);
    await expect(as("worker",()=>rpc("finish_v1",[s4,oldClaim.token,"0","1"]))).rejects.toMatchObject({code:"40001"});
    // Integer display rounding cannot round a fraction to a tie before two-decimal formatting.
    await db.exec("set timezone='Pacific/Auckland'");
    await db.query("update assess.sessions set submitted_at='2028-08-31 23:59:59+00' where id=$1",[s4]);
    await as("worker",()=>rpc("finish_v1",[s4,newClaim.token,"4999999999999999999","1000000000000000000000"]));
    expect(await as(3,()=>rpc("result_v1",[s4]))).toMatchObject({grade:{earned:"0.00"}});
    expect((await db.query<{expiry:string}>("select to_char(expires_at at time zone 'UTC','YYYY-MM-DD HH24:MI:SS') expiry from assess.sessions where id=$1",[s4])).rows[0]!.expiry).toBe("2029-02-28 23:59:59");
    await db.exec("set timezone='UTC'");
    // After 24h, failures/crashed leases require explicit recovery; at day seven all details are purged, no grade invented.
    const a5=await install(14),s5=(await as(3,()=>rpc<{attemptId:string}>("start_v1",[a5,id(505)]))).attemptId;
    await as(3,()=>rpc("command_v1",[s5,id(205),0,{type:"submit"}]));
    await db.query("update assess.sessions set submitted_at=clock_timestamp()-interval '25 hours' where id=$1",[s5]);
    await as("worker",()=>rpc("maintain_v1",[1]));
    expect(await as("worker",()=>rpc("claim_v1"))).toBeNull();
    expect(await as("worker",()=>rpc("health_v1"))).toMatchObject({alert:1});
    await as("worker",()=>rpc("recover_v1",[s5]));
    expect(await as("worker",()=>rpc("claim_v1"))).toMatchObject({attemptId:s5});
    await db.query("update assess.sessions set submitted_at=clock_timestamp()-interval '7 days' where id=$1",[s5]);
    await as("worker",()=>rpc("maintain_v1",[1]));
    expect((await db.query("select * from assess.session_details where session_id=$1",[s5])).rows).toEqual([]);
    expect((await db.query("select * from assess.results where session_id=$1",[s5])).rows).toEqual([]);
    expect((await db.query<{used:number}>("select used from assess.reservations where assignment_id=$1",[a5])).rows[0]!.used).toBe(1);
    const untimed=await install(12,"hidden",null);
    await expect(as(3,()=>rpc("start_v1",[untimed,id(503)]))).rejects.toMatchObject({code:"55000"});
    for(const role of [null,1,2,3,4,"worker"] as const) for(const table of ["launch_gate","publications","reservations","sessions","session_details","receipts","results"])
      await expect(as(role,()=>db.query(`select * from assess.${table}`))).rejects.toMatchObject({code:"42501"});
    for(const role of [null,1,3] as const) for(const [fn,args] of [["install_publication_v1",[id(99),{},{}]],["claim_v1",[]],["finish_v1",[id(99),id(99),"1","1"]],["maintain_v1",[1]],["session_ack_v1",[s2,id(99)]],["session_authorize_v1",[a2]],["health_v1",[]]] as const)
      await expect(as(role,()=>rpc(fn,[...args]))).rejects.toMatchObject({code:"42501"});
    expect(await publicState()).toEqual(before);
  }finally{await db.close();}
},60000);
