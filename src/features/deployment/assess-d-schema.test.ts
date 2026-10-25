import {cpSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {expect,it} from "vitest";
const root=process.cwd(),script=join(root,"scripts/pages/pilot-schema-gate.mjs");
it("D requires both lifecycle and UI migrations, rejects the old B attestation and never reaches private Node modules",()=>{
 const dir=mkdtempSync(join(tmpdir(),"radlab-d-gate-"));
 try {
  for(const part of ["src","supabase","scripts/pages"])cpSync(part,join(dir,part),{recursive:true});
  const manifestPath=join(dir,"scripts/pages/frontend-schema.json"),m=JSON.parse(readFileSync(manifestPath,"utf8"));
  writeFileSync(join(dir,"scripts/pages/frontend-schema.json"),JSON.stringify(m));
  expect(m.requiredMigrations).toContain("20261020000700_assess_lifecycle.sql");expect(m.requiredMigrations).toContain("20261020000800_assess_mixed_ui.sql");expect(m.deferredMigrations).toEqual({});
  const run=(print=false)=>spawnSync(process.execPath,["--input-type=module","-e",`import {runSchemaGate} from ${JSON.stringify(script)};try{console.log(runSchemaGate({NEXT_PUBLIC_SUPABASE_URL:'https://vlacestfruxooznrcjqc.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic_local_test_123456',PILOT_SCHEMA_VERIFIED:'pilot-v1:26b88b9dd0b1aa96e0b25ea9bb16c358c5710fb2c89a773e4a55c995720b4df5'},${print},${JSON.stringify(dir)}));}catch(e){console.error(e.message);process.exitCode=1;}`],{encoding:"utf8",timeout:15000});
  const blocked=run();expect(blocked.status).toBe(1);expect(blocked.stderr).toContain("schema compatibility has not been attested");
  const print=run(true);expect(print.status).toBe(0);expect(print.stdout.trim()).not.toBe("pilot-v1:26b88b9dd0b1aa96e0b25ea9bb16c358c5710fb2c89a773e4a55c995720b4df5");
  const file="src/features/assess/OwnerAssessPanel.tsx",original=readFileSync(join(dir,file),"utf8"),edited=original+'\nimport {installMixedContent} from "./server-presentation";void installMixedContent;';writeFileSync(join(dir,file),edited);
  m.browserBoundaries[file]=createHash("sha256").update(edited).digest("hex");writeFileSync(manifestPath,JSON.stringify(m));
  const leaked=run(true);expect(leaked.status).toBe(1);expect(leaked.stderr).toContain("Server-only backend reached the frontend");
 } finally {rmSync(dir,{recursive:true,force:true});}
},20000);
