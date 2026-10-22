import { spawnSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import { trialFixture } from "../../../scripts/assess/trial-fixture";
import { validateMixedContent } from "./server-presentation";
import { gradePublication } from "./server-grader";

it("provides two temporary non-clinical versions with independently known five-of-ten grades",()=>{
 for(const label of ["visible","hidden"] as const){
  const fixture=trialFixture("00000000-0000-0000-0000-000000000010",label);
  validateMixedContent(fixture);
  expect(fixture.assessment.policy).toEqual({durationSeconds:label==="visible"?300:120,maxAttempts:1,gradeVisibility:label==="visible"?"after-submission":"hidden"});
  expect(gradePublication(fixture,{q1:{type:"single-choice",optionId:"a"},q2:{type:"single-choice",optionId:"a"}},[])).toEqual({numerator:"5",denominator:"1"});
  expect(gradePublication(fixture,{q1:{type:"single-choice",optionId:"a"}},[])).toEqual({numerator:"5",denominator:"1"});
 }
 expect(()=>trialFixture("bad","visible")).toThrow("invalid");
});
it("enforces the process guard, one tick, redaction, cancellation and transport drain",()=>{
 const source=`
 import assert from 'node:assert/strict';
 import {runTrialProcess} from './scripts/assess/trial-main.mjs';
 const config={host:'synthetic.invalid',port:5432,database:'postgres',user:'synthetic_job',password:'PRIVATE',ca:'-----BEGIN CERTIFICATE-----PRIVATE'};
 let reads=[],calls=[],closed=0,mode='complete';
 const read=async p=>{reads.push(p);return p.includes('/config/')?{contract:'assess-trial-scope/1',trial:'00000000-0000-0000-0000-000000000090'}:config};
 const make=()=>({async close(){closed++;if(mode==='cleanup')throw Error('PRIVATE')},async call(name,args){calls.push(name);assert.equal(args.p_trial,'00000000-0000-0000-0000-000000000090');
 if(name==='trial_maintain_v1'){assert.equal(args.p_limit,1);if(mode==='signal')process.emit('SIGTERM');if(mode==='missing')throw Error('PRIVATE');return {expired:0,purged:0};}
 if(name==='trial_claim_v1')return null;
 if(name==='trial_health_v1')return {failed:0,alert:0,overdue:0,purgeDue:0};throw Error('general RPC forbidden');}});
 const listeners=process.listenerCount('SIGTERM');
 for(const options of [{enabled:'0',args:[]},{enabled:'1',args:['--retry']}]){assert.equal((await runTrialProcess({...options,read,make})).report.code,'configuration');assert.equal(reads.length,0)}
 const run=()=>runTrialProcess({enabled:'1',args:[],read,make});
 assert.equal((await run()).report.outcome,'COMPLETE');assert.deepEqual(calls,['trial_maintain_v1','trial_claim_v1','trial_health_v1']);assert.equal(closed,1);
 for(const m of ['missing','signal','cleanup']){mode=m;calls=[];const result=await run();assert.equal(result.report.outcome,'STOP');assert(!JSON.stringify(result).includes('PRIVATE'));
 if(m==='missing'){assert.equal(result.report.counts,undefined);assert.deepEqual(calls,['trial_maintain_v1'])}
 if(m==='signal'){assert.equal(result.exitCode,130);assert.deepEqual(calls,['trial_maintain_v1','trial_health_v1'])}
 if(m==='cleanup')assert.equal(result.report.code,'cleanup_failed');}
 assert.equal(closed,4);assert.equal(process.listenerCount('SIGTERM'),listeners);
 reads=[];const bad=await runTrialProcess({enabled:'1',args:[],make,read:async p=>{reads.push(p);return {contract:'assess-trial-scope/1',trial:'bad'}}});assert.equal(bad.report.code,'configuration');assert.equal(reads.length,1);
 console.log(JSON.stringify({outcome:'PASS'}));`;
 const child=spawnSync(process.execPath,["--import","./scripts/assess/node-loader.mjs","--input-type=module","-e",source],{encoding:"utf8",timeout:15000,maxBuffer:100000});
 expect(child.status,child.stdout+child.stderr).toBe(0);expect(JSON.parse(child.stdout)).toEqual({outcome:"PASS"});
});
it("builds a separate hashed artifact whose real executable refuses execution by default",()=>{
 const build=spawnSync(process.execPath,["scripts/assess/build-trial.mjs"],{encoding:"utf8",timeout:20000,maxBuffer:100000});
 expect(build.status,build.stdout+build.stderr).toBe(0);const {output}=JSON.parse(build.stdout);
 try{
  const manifest=JSON.parse(readFileSync(join(output,"manifest.json"),"utf8"));
  expect(manifest.limit).toBe(1);expect(manifest.inputs.join(" ")).not.toMatch(/job-main|trial-tools|react-dom/);
  for(const name of ["trial.mjs","Dockerfile"])expect(createHash("sha256").update(readFileSync(join(output,name))).digest("hex")).toBe(manifest.hashes[name]);
  const child=spawnSync(process.execPath,[join(output,"trial.mjs")],{encoding:"utf8",timeout:10000,env:{...process.env,ASSESS_TRIAL_ENABLED:"0"}});
  expect(child.status).toBe(1);expect(JSON.parse(child.stdout)).toMatchObject({outcome:"STOP",code:"configuration",runtimeOrLaunchVerified:false});
 }finally{rmSync(output,{recursive:true,force:true});}
},25000);
it("binds a reviewed scope file into the curated image without another secret or environment fallback",()=>{
 const source=`
 import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {mkdtemp,writeFile,readFile,symlink,rm} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';import {createHash} from 'node:crypto';
 const dir=await mkdtemp(join(tmpdir(),'radlab-trial-bind-'));let output;
 try{
  const scope=join(dir,'scope.json'),link=join(dir,'link.json'),fixture={contract:'assess-trial-scope/1',trial:'00000000-0000-0000-0000-000000000090'};
  await writeFile(scope,JSON.stringify(fixture));await symlink(scope,link);
  for(const args of [['--scope-file',link],['--scope-file',scope,'--run'],['--trial',fixture.trial]]){
   const child=spawnSync(process.execPath,['scripts/assess/build-trial.mjs',...args],{encoding:'utf8',timeout:10000});
   assert.equal(child.status,1);assert.equal(JSON.parse(child.stdout).code,'configuration');assert(!child.stdout.includes(fixture.trial));
  }
  const child=spawnSync(process.execPath,['scripts/assess/build-trial.mjs','--scope-file',scope],{encoding:'utf8',timeout:20000});assert.equal(child.status,0);output=JSON.parse(child.stdout).output;
  assert(!child.stdout.includes(fixture.trial));
  const bytes=await readFile(join(output,'assess-trial.json'));assert.deepEqual(JSON.parse(bytes),fixture);
  const manifest=JSON.parse(await readFile(join(output,'manifest.json'),'utf8'));assert.equal(manifest.scopeBound,true);assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.hashes['assess-trial.json']);
  const dockerfile=await readFile(join(output,'Dockerfile'),'utf8');assert(dockerfile.includes('COPY --chown=node:node assess-trial.json /run/config/assess-trial.json'));assert(dockerfile.includes('ASSESS_TRIAL_ENABLED=0'));assert(!dockerfile.includes(fixture.trial));
  for(const invalid of [{...fixture,token:'PRIVATE'},{contract:fixture.contract,trial:'bad'},null]){await writeFile(scope,JSON.stringify(invalid));const r=spawnSync(process.execPath,['scripts/assess/build-trial.mjs','--scope-file',scope],{encoding:'utf8',timeout:10000});assert.equal(r.status,1);assert(!r.stdout.includes('PRIVATE'));}
 }finally{await rm(dir,{recursive:true,force:true});if(output)await rm(output,{recursive:true,force:true});}
 console.log(JSON.stringify({outcome:'PASS'}));`;
 const child=spawnSync(process.execPath,["--input-type=module","-e",source],{encoding:"utf8",timeout:40000,maxBuffer:100000});
 expect(child.status,child.stdout+child.stderr).toBe(0);expect(JSON.parse(child.stdout)).toEqual({outcome:"PASS"});
},45000);
