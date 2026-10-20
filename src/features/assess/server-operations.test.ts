import { spawnSync } from "node:child_process";
import { expect,it,vi } from "vitest";
import { runAssessJobs,type AssessRpc } from "./server-service";
import type { AssessmentPublication } from "./server-contracts";

const publication:AssessmentPublication={schemaVersion:1,
  assessment:{schemaVersion:1,ref:{id:"fixture",version:"1"},name:"Synthetic",track:"mixed",maximum:"10",policy:{durationSeconds:60,maxAttempts:1,gradeVisibility:"hidden"},items:[{schemaVersion:1,ref:{id:"q",version:"1"},type:"single-choice",contentLanguage:"en",prompt:"Synthetic",options:[{id:"a",text:"A"},{id:"b",text:"B"}]}]},
  itemMarks:[{item:{id:"q",version:"1"},maximum:"10"}],privateItems:[{schemaVersion:1,ref:{id:"q",version:"1"},type:"single-choice",correctOptionId:"a",review:{sources:[{reference:"Synthetic",licenceEvidence:"Own fixture"}],reviewedBy:"Engineering",reviewedAt:"2026-10-20T00:00:00.000Z",scope:"Non-clinical"}}]};
const health={failed:0,alert:0,overdue:0,purgeDue:0};
const claim={attemptId:"private-attempt",token:"private-token",publication,answers:{q:{type:"single-choice",optionId:"a"}},locked:[]};

it("stops before any RPC when already cancelled",async()=>{
  const stop=new AbortController();stop.abort();const call=vi.fn();
  await expect(runAssessJobs({call},1,stop.signal)).rejects.toMatchObject({code:"stopped",message:"stopped"});
  expect(call).not.toHaveBeenCalled();
});

it("waits for maintenance acknowledgement, then skips claims on stop",async()=>{
  const stop=new AbortController(),calls:string[]=[];
  const worker:AssessRpc={async call<T>(name:string){calls.push(name);if(name==="maintain_v1"){stop.abort();return {expired:1,purged:2} as T;}return health as T;}};
  expect(await runAssessJobs(worker,2,stop.signal)).toEqual({maintenance:{expired:1,purged:2},graded:0,failed:0,health});
  expect(calls).toEqual(["maintain_v1","health_v1"]);
});

it.each(["claim_v1","finish_v1"])("finishes an acknowledged claim when stop arrives during %s",async stage=>{
  const stop=new AbortController(),calls:string[]=[];
  const call=vi.fn(async(name:string)=>{
    calls.push(name);if(name===stage)stop.abort();
    return ({maintain_v1:{expired:0,purged:0},claim_v1:claim,finish_v1:null,health_v1:health} as Record<string,unknown>)[name];
  });
  const worker:AssessRpc={call:call as AssessRpc["call"]};
  expect(await runAssessJobs(worker,2,stop.signal)).toMatchObject({graded:1,failed:0});
  expect(calls).toEqual(["maintain_v1","claim_v1","finish_v1","health_v1"]);
  expect(call).toHaveBeenCalledWith("finish_v1",{p_session:claim.attemptId,p_token:claim.token,p_n:"10",p_d:"1"});
});

it("records failure of an in-flight grade before stopping; never substitutes zero",async()=>{
  const stop=new AbortController(),calls:string[]=[];
  const worker:AssessRpc={async call<T>(name:string){calls.push(name);
    if(name==="claim_v1"){stop.abort();return {...claim,publication:{invalid:true}} as T;}
    return ({maintain_v1:{expired:0,purged:0},fail_v1:null,health_v1:{...health,failed:1}} as Record<string,unknown>)[name] as T;
  }};
  expect(await runAssessJobs(worker,2,stop.signal)).toMatchObject({graded:0,failed:1,health:{failed:1}});
  expect(calls).toEqual(["maintain_v1","claim_v1","fail_v1","health_v1"]);
});

it.each(["maintain_v1","claim_v1","health_v1"])("fails closed and sanitizes infrastructure failure in %s",async stage=>{
  const calls:string[]=[];
  const worker:AssessRpc={async call<T>(name:string){calls.push(name);if(name===stage)throw {code:"XX000",message:"PRIVATE identity answer key"};return (name==="maintain_v1"?{expired:0,purged:0}:null) as T;}};
  await expect(runAssessJobs(worker,2)).rejects.toMatchObject({code:"unavailable",message:"unavailable"});
  expect(calls.at(-1)).toBe(stage);
});

it("runs the bounded disposable operations exercise and emits only its whitelist",()=>{
  const child=spawnSync(process.execPath,["--import","./scripts/assess/node-loader.mjs","scripts/assess/local-operations.mjs","--synthetic-disposable","--backend=pglite"],{encoding:"utf8",timeout:30000,maxBuffer:100000});
  expect(child.status,child.stderr).toBe(0);
  const result=JSON.parse(child.stdout);
  expect(Object.keys(result).sort()).toEqual(["contract","runId","backend","outcome","code","ticks","checks","cleanup","runtimeOrLaunchVerified"].sort());
  expect(result).toMatchObject({contract:"assess-local-operations/1",backend:"pglite-serialized",outcome:"PASS",code:"complete",cleanup:true,runtimeOrLaunchVerified:false});
  expect(result.ticks).toBeLessThanOrEqual(24);
  expect(result.checks).toEqual(expect.arrayContaining(["two-workers-one-result","stale-token-rejected","grading-failure-preserves-snapshot","explicit-recovery","lost-finish-ack-no-second-result","delete-failure-rolls-back-result","two-purgers-idempotent","no-practice-or-events"]));
  expect(child.stdout).not.toMatch(/correctOptionId|optionId|PRIVATE|@example|00000000-|submitted_at|p_token/);
},40000);

it("rejects remote targets, unknown flags and missing disposable acknowledgement before setup",()=>{
  for(const args of [["--backend=pglite"],["--synthetic-disposable","--backend=https://invalid.example"],["--synthetic-disposable","--backend=pglite","--url=PRIVATE"]]) {
    const child=spawnSync(process.execPath,["--import","./scripts/assess/node-loader.mjs","scripts/assess/local-operations.mjs",...args],{encoding:"utf8",timeout:10000,maxBuffer:100000});
    expect(child.status).toBe(1);
    expect(JSON.parse(child.stdout)).toMatchObject({outcome:"STOP",code:"configuration",ticks:0,checks:[],cleanup:true,runtimeOrLaunchVerified:false});
    expect(child.stdout).not.toMatch(/PRIVATE|invalid.example/);
  }
});
