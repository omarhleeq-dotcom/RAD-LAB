import { spawnSync } from "node:child_process";
import { beforeEach, expect, it, vi } from "vitest";
import type { AssessRpc } from "./server-service";

const pg = vi.hoisted(() => ({ query: vi.fn(), release: vi.fn(), connect: vi.fn(), end: vi.fn(), on: vi.fn() }));
vi.mock("pg", () => ({ Pool: class { connect = pg.connect; end = pg.end; on = pg.on; } }));
import { createWorkerBinding } from "./server-runtime";
import { executeTrialJob, scopedTrialWorker } from "../../../scripts/assess/trial-isolation";

const id="00000000-0000-0000-0000-000000000001";
const config={host:"synthetic.invalid",port:5432,database:"postgres",user:"synthetic_job",password:"PRIVATE",ca:"-----BEGIN CERTIFICATE-----SYNTHETIC"};
beforeEach(()=>{
 vi.resetAllMocks();
 pg.query.mockImplementation(async(sql:string)=>({rows:sql.includes("as allowed")?[{allowed:true}]:[{value:null}]}));
 pg.connect.mockResolvedValue({query:pg.query,release:pg.release});pg.end.mockResolvedValue(undefined);
});

it.each([
 ["maintain_v1",{p_limit:1},"trial_maintain_v1($1::uuid,$2::integer)",[id,1]],
 ["claim_v1",{},"trial_claim_v1($1::uuid)",[id]],
 ["health_v1",{},"trial_health_v1($1::uuid)",[id]],
 ["finish_v1",{p_session:id,p_token:id,p_n:"5",p_d:"1"},"trial_finish_v1($1::uuid,$2::uuid,$3::uuid,$4::text,$5::text)",[id,id,id,"5","1"]],
 ["fail_v1",{p_session:id,p_token:id},"trial_fail_v1($1::uuid,$2::uuid,$3::uuid)",[id,id,id]],
] as const)("routes %s only through the parameterized guarded SQL operation",async(name,args,sql,values)=>{
 const worker=scopedTrialWorker(id,createWorkerBinding(config));
 await worker.call(name,args);
 expect(pg.query).toHaveBeenCalledWith(`select assess.${sql} as value`,values);
 expect(pg.query.mock.calls.map(c=>c[0])).toEqual(["begin",expect.stringContaining("session_user = $1"),"set local role assess_worker","set local search_path = ''","set local statement_timeout = '60s'","set local lock_timeout = '5s'",`select assess.${sql} as value`,"commit"]);
 await worker.close();expect(pg.end).toHaveBeenCalledTimes(1);
});
it("rejects identity overrides and all unscoped/recovery/installation escape routes before connecting",()=>{
 const worker=scopedTrialWorker(id,createWorkerBinding(config));
 for(const name of ["recover_v1","content_read_v1","install_publication_v1","trial_claim_v1","claim_v1();select 1"])expect(()=>worker.call(name,{})).toThrow("invalid");
 expect(()=>worker.call("claim_v1",{p_trial:id})).toThrow("invalid");expect(pg.connect).not.toHaveBeenCalled();
});
it("refuses malformed scope or an already stopped job before loading any credential",async()=>{
 const load=vi.fn(),make=vi.fn();
 expect(await executeTrialJob("bad",load,new AbortController().signal,make)).toMatchObject({outcome:"STOP",code:"configuration"});
 const stop=new AbortController();stop.abort();expect(await executeTrialJob(id,load,stop.signal,make)).toMatchObject({outcome:"STOP",code:"stopped"});
 expect(load).not.toHaveBeenCalled();expect(make).not.toHaveBeenCalled();
});
it("never falls back to global RPCs or emits zero counts on missing SQL/scope",async()=>{
 pg.query.mockImplementation(async(sql:string)=>{
  if(sql.includes("as allowed"))return {rows:[{allowed:true}]};
  if(sql.includes("trial_maintain_v1"))throw {code:"42883",message:"PRIVATE"};return {rows:[{value:null}]};
 });
 const result=await executeTrialJob(id,async()=>config,new AbortController().signal);
 expect(result).toEqual({contract:"assess-job/1",outcome:"STOP",code:"unavailable",runtimeOrLaunchVerified:false});
 expect(pg.query.mock.calls.filter(c=>String(c[0]).startsWith("select assess."))).toHaveLength(1);
 expect(pg.end).toHaveBeenCalledTimes(1);expect(JSON.stringify(result)).not.toContain("PRIVATE");
});
it("stops after scoped maintenance acknowledgement and closes the transport",async()=>{
 const stop=new AbortController(),calls:string[]=[];let closed=false;
 const worker:AssessRpc & {close():Promise<void>}={async call<T>(name:string){calls.push(name);
  if(name==="trial_maintain_v1"){stop.abort();return {expired:0,purged:0} as T;}
  return {failed:0,alert:0,overdue:0,purgeDue:0} as T;
 },async close(){closed=true;}};
 const result=await executeTrialJob(id,async()=>config,stop.signal,()=>worker);
 expect(result).toMatchObject({outcome:"STOP",code:"stopped"});expect(calls).toEqual(["trial_maintain_v1","trial_health_v1"]);expect(closed).toBe(true);
});
it("runs the complete bounded SQL lifecycle on a disposable database, without private output",()=>{
 const child=spawnSync(process.execPath,["--import","./scripts/assess/node-loader.mjs","scripts/assess/trial-isolation-rehearsal.mjs","--synthetic-disposable","--backend=pglite"],{encoding:"utf8",timeout:40000,maxBuffer:100000});
 expect(child.status,child.stdout+child.stderr).toBe(0);
 const result=JSON.parse(child.stdout);
 expect(result).toMatchObject({contract:"assess-trial-isolation/1",backend:"pglite-serialized",outcome:"PASS",code:"complete",cleanup:true,runtimeOrLaunchVerified:false});
 expect(result.checks).toEqual(expect.arrayContaining(["worker-only-wrappers","baseline-consents-retained","sql-start-guard","scoped-known-grade","scoped-hidden-expiry","all-worker-phases-reject-foreign-data","foreign-session-not-mutated","void-failed-purge-and-reservations","original-functions-and-practice-unchanged"]));
 expect(child.stdout).not.toMatch(/PRIVATE|00000000-|@example|correctOptionId|optionId|earned_n|p_token/);
},45000);
it("rejects extra flags or provider selectors before synthetic setup",()=>{
 for(const args of [["--backend=pglite"],["--synthetic-disposable","--backend=https://private.invalid"],["--synthetic-disposable","--backend=pglite","--url=PRIVATE"]]){
  const child=spawnSync(process.execPath,["--import","./scripts/assess/node-loader.mjs","scripts/assess/trial-isolation-rehearsal.mjs",...args],{encoding:"utf8",timeout:10000});
  expect(child.status).toBe(1);expect(JSON.parse(child.stdout)).toMatchObject({outcome:"STOP",code:"configuration",checks:[],cleanup:true});expect(child.stdout).not.toMatch(/PRIVATE|private.invalid/);
 }
});
