import {cpSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {expect,it} from "vitest";
const root=process.cwd(),script=join(root,"scripts/pages/pilot-schema-gate.mjs");
it("E requires its reviewed SQL/catalogues, rejects a C/D-only attestation and preserves private-module isolation",()=>{
 const dir=mkdtempSync(join(tmpdir(),"radlab-e-gate-"));try{
  for(const p of ["src","supabase","scripts/pages"])cpSync(p,join(dir,p),{recursive:true});
  const path=join(dir,"scripts/pages/frontend-schema.json"),m=JSON.parse(readFileSync(path,"utf8"));
  // This retained fixture predates the owner dashboard SQL; preserve its exact assertions.
  rmSync(join(dir,"supabase/migrations/20261024000100_owner_dashboard.sql"),{force:true});
  rmSync(join(dir,"supabase/migrations/20261024000200_owner_deletion_surveys.sql"),{force:true});
  delete m.deferredMigrations["20261024000100_owner_dashboard.sql"];
  delete m.deferredMigrations["20261024000200_owner_deletion_surveys.sql"];
  writeFileSync(join(dir,"scripts/pages/frontend-schema.json"),JSON.stringify(m));
  expect(m.requiredMigrations).toContain("20261020000900_assess_practical_ui.sql");expect(m.checks).toContain("supabase/checks/assess-practical-ready.sql");expect(m.checks).toContain("supabase/checks/assess-staging-ready.sql");expect(m.deferredMigrations).toEqual({});
  // Compute the prior C/D marker from its actual historical files, independent of E source pins.
  const hash=createHash("sha256").update("https://vlacestfruxooznrcjqc.supabase.co\n");
  for(const f of m.requiredMigrations.filter((f:string)=>f<"20261020000900").sort())hash.update(`${f}\0`).update(readFileSync(join(dir,"supabase/migrations",f))).update("\0");
  for(const f of ["training-ready.sql","comparison-ready.sql","assess-mixed-ready.sql"])hash.update(readFileSync(join(dir,"supabase/checks",f)));
  const marker=`pilot-v1:${hash.digest("hex")}`;
  const run=(print=false)=>spawnSync(process.execPath,["--input-type=module","-e",`import {runSchemaGate} from ${JSON.stringify(script)};try{console.log(runSchemaGate({NEXT_PUBLIC_SUPABASE_URL:'https://vlacestfruxooznrcjqc.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic_local_test_123456',PILOT_SCHEMA_VERIFIED:${JSON.stringify(marker)}},${print},${JSON.stringify(dir)}));}catch(e){console.error(e.message);process.exitCode=1;}`],{encoding:"utf8",timeout:15000});
  const blocked=run();expect(blocked.status).toBe(1);expect(blocked.stderr).toContain("schema compatibility has not been attested");
  const file="src/features/assess/AssessPanel.tsx",edited=readFileSync(join(dir,file),"utf8")+'\nimport {installPracticalContent} from "./server-practical";void installPracticalContent;';writeFileSync(join(dir,file),edited);m.browserBoundaries[file]=createHash("sha256").update(edited).digest("hex");writeFileSync(path,JSON.stringify(m));
  const leaked=run(true);expect(leaked.status).toBe(1);expect(leaked.stderr).toContain("Server-only backend reached the frontend");
 }finally{rmSync(dir,{recursive:true,force:true});}
},20000);
