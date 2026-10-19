import { spawnSync } from "node:child_process";
import { readFileSync,readdirSync } from "node:fs";
import { describe,expect,it,vi } from "vitest";
import { attemptService,runAssessJobs,type AssessRpc } from "./server-service";
const id="00000000-0000-0000-0000-000000000001";
describe("C service boundaries",()=>{
  it("passes JWT-bound calls to SQL without accepting a caller-supplied user or mark",async()=>{
    const call=vi.fn().mockResolvedValue({});const service=attemptService({call});
    await service.start(id,id);expect(call).toHaveBeenLastCalledWith("start_v1",{p_assignment:id,p_operation:id});
    await service.read(id);expect(call).toHaveBeenLastCalledWith("read_session_v1",{p_session:id});
    await service.result(id);expect(call).toHaveBeenLastCalledWith("result_v1",{p_session:id});
    const c={schemaVersion:1,attemptId:id,operationId:id,expectedRevision:0,action:{type:"submit"}};
    await service.command(JSON.stringify(c));expect(call).toHaveBeenLastCalledWith("command_v1",{p_session:id,p_operation:id,p_revision:0,p_action:{type:"submit"}});
    expect(()=>service.command(JSON.stringify({...c,userId:id}))).toThrow("invalid");
    expect(()=>service.command("x".repeat(65537))).toThrow("invalid");
    expect(()=>service.command(JSON.stringify({...c,expectedRevision:-1}))).toThrow("invalid");
    expect(()=>service.start("invalid",id)).toThrow("invalid");
  });
  it.each([["42501","denied"],["40001","conflict"],["22023","invalid"],["54000","limit"],["55000","unavailable"],["XX000","unavailable"]])("sanitizes %s",async(code,expected)=>{
    const service=attemptService({call:vi.fn().mockRejectedValue({code,message:"SECRET body",details:{correctOptionId:"private"}})});
    await expect(service.read(id)).rejects.toMatchObject({code:expected,message:expected});
  });
  it("keeps failed grading frozen; no synthetic grade is committed",async()=>{
    const calls:string[]=[];const worker:AssessRpc={async call<T>(name:string){calls.push(name);return ({maintain_v1:{expired:0,purged:0},claim_v1:{attemptId:id,token:id,publication:{bad:"fixture"},answers:{},locked:[]},fail_v1:null,health_v1:{failed:1,alert:0,overdue:0,purgeDue:0}} as Record<string,unknown>)[name] as T;}};
    expect(await runAssessJobs(worker,1)).toMatchObject({graded:0,failed:1,health:{failed:1}});
    expect(calls).toEqual(["maintain_v1","claim_v1","fail_v1","health_v1"]);
    await expect(runAssessJobs(worker,101)).rejects.toThrow("invalid");
  });
  it("runs C in a standalone Node process with serialized SQL and private result erasure",()=>{
    const child=spawnSync(process.execPath,["--import","./scripts/assess/node-loader.mjs","scripts/assess/rehearse-c.mjs"],{encoding:"utf8",timeout:30000,maxBuffer:2_000_000});
    expect(child.status,child.stderr).toBe(0);expect(JSON.parse(child.stdout)).toMatchObject({contract:"assess-c-rehearsal/1",outcome:"PASS",backend:"pglite-serialized"});
  },40000);
  it("has no production consumer in the existing UI dependency tree",()=>{
    // An architectural guard at the browser entry boundary, not proof of a deployed bundle.
    const walk=(path:string):string[]=>readdirSync(path,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${path}/${e.name}`):/\.(tsx?|mjs)$/.test(e.name)?[`${path}/${e.name}`]:[]);
    for(const file of [...walk("src/app"),...walk("src/components"),...walk("src/stores"),...walk("src/features/pilot")])expect(readFileSync(file,"utf8"),file).not.toMatch(/assess\/server-(validation|service|grader|contracts)/);
  });
});
