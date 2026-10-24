import {cpSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {expect,it} from "vitest";
import {spawnSync} from "node:child_process";
it("Current retention frontend retains F, requires v2 SQL, rejects the actual E/F markers and unreviewed history boundaries",()=>{
 const dir=mkdtempSync(join(tmpdir(),"radlab-f-gate-"));try{
  for(const p of ["src","supabase","scripts/pages"])cpSync(p,join(dir,p),{recursive:true});
  const path=join(dir,"scripts/pages/frontend-schema.json"),m=JSON.parse(readFileSync(path,"utf8"));
  // This retained fixture predates the owner dashboard SQL; preserve its exact assertions.
  rmSync(join(dir,"supabase/migrations/20261024000100_owner_dashboard.sql"),{force:true});
  delete m.deferredMigrations["20261024000100_owner_dashboard.sql"];
  writeFileSync(join(dir,"scripts/pages/frontend-schema.json"),JSON.stringify(m));
  expect(m.contract).toBe("pilot-through-assess-retention/1");expect(m.requiredMigrations).toContain("20261020001100_assess_retention.sql");expect(m.checks).toContain("supabase/checks/assess-retention-ready.sql");expect(m.requiredMigrations).toContain("20261020001000_assess_history_consent.sql");expect(m.checks).toContain("supabase/checks/assess-history-ready.sql");expect(m.deferredMigrations).toEqual({});
  const env={NEXT_PUBLIC_SUPABASE_URL:"https://vlacestfruxooznrcjqc.supabase.co",NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"sb_publishable_synthetic_local_test_123456",PILOT_SCHEMA_VERIFIED:"pilot-v1:0820cbdf2120261dba63397c4e2139e6f710ae6d77bbeaf49fefcb12480a9c8f"};
  const gate=(print=false)=>spawnSync(process.execPath,["--input-type=module","-e",`import {runSchemaGate} from ${JSON.stringify(join(process.cwd(),"scripts/pages/pilot-schema-gate.mjs"))};try{console.log(runSchemaGate(${JSON.stringify(env)},${print},${JSON.stringify(dir)}));}catch(e){console.error(e.message);process.exitCode=1;}`],{encoding:"utf8",timeout:15000});
  expect(gate().stderr).toContain("schema compatibility has not been attested");
  // F was attested before this policy migration; it cannot authorize v2 UI.
  env.PILOT_SCHEMA_VERIFIED="pilot-v1:79416f28ed75826571ed08c6bc9732e5278280ffa0a48437830c2b0d685a054d";
  expect(gate().stderr).toContain("schema compatibility has not been attested");
  const print=gate(true);expect(print.status).toBe(0);expect(print.stdout.trim()).not.toBe(env.PILOT_SCHEMA_VERIFIED);
  const adapter=join(dir,"src/features/assess/history-data.ts");writeFileSync(adapter,readFileSync(adapter,"utf8")+'\n// unreviewed edit\n');expect(gate(true).stderr).toContain("database boundary changed");
 }finally{rmSync(dir,{recursive:true,force:true});}
},20000);
