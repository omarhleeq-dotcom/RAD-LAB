import { cpSync,mkdtempSync,readFileSync,rmSync,writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { expect,it } from "vitest";
const migration="20261024000100_owner_dashboard.sql",check="supabase/checks/owner-dashboard-ready.sql";
const marker="pilot-v1:0bc3743c707cff0fcef456d00096f6e186b759390708d2d963a6eabea55e5d52";
it("retains the current documented attestation while classifying unchanged owner SQL as deferred",()=>{
 const m=JSON.parse(readFileSync("scripts/pages/frontend-schema.json","utf8"));
 expect(m.requiredMigrations).not.toContain(migration);expect(m.checks).not.toContain(check);
 expect(Object.keys(m.deferredMigrations)).toEqual([migration,"20261024000200_owner_deletion_surveys.sql"]);
 expect(m.deferredMigrations[migration].sha256).toBe(createHash("sha256").update(readFileSync(`supabase/migrations/${migration}`)).digest("hex"));
 const env={...process.env,NEXT_PUBLIC_SUPABASE_URL:"https://vlacestfruxooznrcjqc.supabase.co",NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"sb_publishable_synthetic_local_test_123456",PILOT_SCHEMA_VERIFIED:marker};
 const r=spawnSync(process.execPath,["scripts/pages/pilot-schema-gate.mjs"],{env,encoding:"utf8"});
 expect(r.status,r.stderr).toBe(0);expect(r.stdout).toContain("Schema attestation matches");
 const print=spawnSync(process.execPath,["scripts/pages/pilot-schema-gate.mjs","--print-marker"],{env,encoding:"utf8"});
 expect(print.status,print.stderr).toBe(0);expect(print.stdout.trim()).toBe(marker);
});
it("still blocks deferred imports, direct future RPCs, SQL drift and a mismatched attestation",()=>{
 const dir=mkdtempSync(join(tmpdir(),"radlab-owner-deferred-"));
 try{
  for(const p of ["src","supabase","scripts/pages"])cpSync(p,join(dir,p),{recursive:true});
  const env={NEXT_PUBLIC_SUPABASE_URL:"https://vlacestfruxooznrcjqc.supabase.co",NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"sb_publishable_synthetic_local_test_123456",PILOT_SCHEMA_VERIFIED:marker};
  const run=()=>spawnSync(process.execPath,["--input-type=module","-e",`import {runSchemaGate} from ${JSON.stringify(join(process.cwd(),"scripts/pages/pilot-schema-gate.mjs"))};try{console.log(runSchemaGate(${JSON.stringify(env)},false,${JSON.stringify(dir)}))}catch(e){console.error(e.message);process.exitCode=1}`],{encoding:"utf8"});
  const adapter=join(dir,"src/features/pilot/owner-dashboard-data.ts"),original=readFileSync(adapter,"utf8");
  writeFileSync(adapter,original+'\nexport {directoryPage as future} from "./owner-dashboard-deferred";');
  expect(run().stderr).toContain("Deferred backend reached the frontend");
  writeFileSync(adapter,original+'\nexport const future=(c: {rpc:Function})=>c.rpc("owner_dashboard_v1");');
  expect(run().stderr).toContain("Frontend API missing from required SQL");
  writeFileSync(adapter,original);
  const sql=join(dir,"supabase/migrations",migration),originalSql=readFileSync(sql,"utf8");writeFileSync(sql,originalSql+"\n-- unreviewed edit\n");
  expect(run().stderr).toContain("Unreviewed deferred migration");
  writeFileSync(sql,originalSql);
  env.PILOT_SCHEMA_VERIFIED="pilot-v1:"+"0".repeat(64);expect(run().stderr).toContain("schema compatibility has not been attested");
 }finally{rmSync(dir,{recursive:true,force:true});}
},20000);
