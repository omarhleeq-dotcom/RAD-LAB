// RAD085-DEFERRED-SCHEMA-TESTS-20261027: only deferred RAD-085 expectations / historical input isolation.
import {RAD085_MIGRATIONS} from "../assess/server-rad085-contracts";
import { cpSync,mkdirSync,existsSync,mkdtempSync,readFileSync,rmSync,writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join,resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { afterAll,beforeAll,expect,it } from "vitest";

// Separate tests: existing schema-gate expectations remain unchanged.
const origin="https://vlacestfruxooznrcjqc.supabase.co";
const key="sb_publishable_synthetic_local_test_123456";
const verifiedB="pilot-v1:26b88b9dd0b1aa96e0b25ea9bb16c358c5710fb2c89a773e4a55c995720b4df5";
const migration="20261020000700_assess_lifecycle.sql";
let root:string;
beforeAll(()=>{
  root=mkdtempSync(join(tmpdir(),"radlab-frontend-schema-"));
  // Retained B fixture: these tests continue to prove the original B attestation and deferred-C contract.
  // D's active contract is tested separately; none of these historical expectations change.
  for(const dir of ["supabase","scripts/pages"])cpSync(dir,join(root,dir),{recursive:true});
  rmSync(join(root,"supabase/migrations/20261020000800_assess_mixed_ui.sql"),{force:true});
  // E must not change the retained historical B fixture or any of its expectations.
  rmSync(join(root,"supabase/migrations/20261020000900_assess_practical_ui.sql"),{force:true});
  // Keep the B fixture bounded to its historical migrations; its expectations and hashes remain unchanged.
  rmSync(join(root,"supabase/migrations/20261020001000_assess_history_consent.sql"),{force:true});
  // Retain historical B input; the new policy migration is exercised by the current gate test.
  rmSync(join(root,"supabase/migrations/20261020001100_assess_retention.sql"),{force:true});
  // Keep the historical B fixture isolated from the additive owner dashboard.
  rmSync(join(root,"supabase/migrations/20261024000100_owner_dashboard.sql"),{force:true});
  rmSync(join(root,"supabase/migrations/20261024000200_owner_deletion_surveys.sql"),{force:true});
  for(const file of RAD085_MIGRATIONS) rmSync(join(root,"supabase/migrations",file),{force:true});
  mkdirSync(join(root,"src/features/assess"),{recursive:true});
  mkdirSync(join(root,"src/features/positioning"),{recursive:true});
  cpSync("src/features/assess/admin-data.ts",join(root,"src/features/assess/admin-data.ts"));
  for(const file of ["server-service","server-contracts","server-validation","server-grader"])
    writeFileSync(join(root,`src/features/assess/${file}.ts`),file==="server-service"?"export const attemptService=()=>{};":"export {};");
  writeFileSync(join(root,"src/features/assess/OwnerAssessPanel.tsx"),`"use client";import type {SupabaseClient} from "@supabase/supabase-js";import {readAssessAdmin} from "./admin-data";export const Panel=readAssessAdmin;`);
  writeFileSync(join(root,"src/features/positioning/ShoulderFigure.tsx"),`export const figure=1;`);
  const retained=JSON.parse(readFileSync("src/features/deployment/fixtures/frontend-through-b.json","utf8"));
  retained.browserBoundaries=Object.fromEntries(["src/features/assess/OwnerAssessPanel.tsx","src/features/assess/admin-data.ts"].map(f=>[f,createHash("sha256").update(readFileSync(join(root,f))).digest("hex")]));
  writeFileSync(join(root,"scripts/pages/frontend-schema.json"),JSON.stringify(retained));
},30000);
afterAll(()=>rmSync(root,{recursive:true,force:true}));
function gate(marker=verifiedB,print=false){
  const script=`import {runSchemaGate} from ${JSON.stringify(new URL("../../../scripts/pages/pilot-schema-gate.mjs",import.meta.url).href)};try{console.log(runSchemaGate({NEXT_PUBLIC_SUPABASE_URL:${JSON.stringify(origin)},NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:${JSON.stringify(key)},PILOT_SCHEMA_VERIFIED:${JSON.stringify(marker)}},${print},${JSON.stringify(root)}));}catch(e){console.error(e.message);process.exitCode=1;}`;
  return spawnSync(process.execPath,["--input-type=module","-e",script],{encoding:"utf8",timeout:15000});
}
function edit(path:string,change:(original:string)=>string,work:()=>void){
  const file=join(root,path),original=existsSync(file)?readFileSync(file,"utf8"):null;
  writeFileSync(file,change(original??""));
  try{work();}finally{if(original===null)rmSync(file);else writeFileSync(file,original);}
}
function manifest(change:(m:Record<string,unknown>)=>void,work:()=>void){
  edit("scripts/pages/frontend-schema.json",s=>{const m=JSON.parse(s);change(m);return JSON.stringify(m);},work);
}
it("preserves the exact B attestation for the retained B fixture without installing C",()=>{
  expect(gate().status).toBe(0);expect(gate("",true).stdout.trim()).toBe(verifiedB);
});
it("rejects changed required SQL or readiness checks against the existing attestation",()=>{
  for(const file of ["supabase/migrations/20261020000600_assess_assignments.sql","supabase/checks/training-ready.sql","supabase/checks/comparison-ready.sql"])
    edit(file,s=>s+"\n-- synthetic edit\n",()=>expect(gate().status).toBe(1));
});
it("rejects unclassified SQL and edits to a deferred migration instead of ignoring future SQL",()=>{
  edit("supabase/migrations/20261020000800_unknown.sql",()=>"select 1;",()=>expect(gate().stderr).toContain("Unreviewed deferred migration"));
  edit(`supabase/migrations/${migration}`,s=>s+"\n-- synthetic backend edit",()=>expect(gate().status).toBe(1));
});
it("permits another explicitly reviewed dormant backend without changing the frontend marker",()=>{
  const future="20261020000800_future_private.sql";
  edit(`supabase/migrations/${future}`,()=>"create table assess.future_private(id uuid);",()=>{
    manifest(m=>{(m.deferredMigrations as Record<string,unknown>)[future]={sha256:createHash("sha256").update(readFileSync(join(root,"supabase/migrations",future))).digest("hex"),reason:"Synthetic dormant backend, never applied",serverModules:["src/features/assess/server-service.ts"]};},()=>expect(gate().status).toBe(0));
  });
});
it("keeps unrelated presentation edits independent from the database attestation",()=>{
  edit("src/features/positioning/ShoulderFigure.tsx",s=>s+"\n// synthetic presentation-only edit\n",()=>expect(gate().status).toBe(0));
});
it("rejects a modified DB boundary and detects a new direct RPC client",()=>{
  edit("src/features/assess/admin-data.ts",s=>s+"\n// changed adapter requires review\n",()=>expect(gate().stderr).toContain("database boundary changed"));
  edit("src/features/assess/NewClient.tsx",()=>`"use client";export function NewClient(c: {rpc:Function}){return c.rpc("start_v1");}`,()=>expect(gate().status).toBe(1));
});
it.each(["import","reexport","dynamic"])("rejects a runtime %s of deferred C even after pinning the UI boundary",kind=>{
  const target=kind==="reexport"?'export {attemptService} from "./server-service";':kind==="dynamic"?'void import("./server-service");':'import {attemptService} from "./server-service";void attemptService;';
  edit("src/features/assess/OwnerAssessPanel.tsx",s=>s+"\n"+target,()=>{
    // Re-pinning a changed UI adapter must not silently enable server-only C.
    manifest(m=>{
      const pins=m.browserBoundaries as Record<string,string>;
      pins["src/features/assess/OwnerAssessPanel.tsx"]=createHash("sha256").update(readFileSync(join(root,"src/features/assess/OwnerAssessPanel.tsx"))).digest("hex");
    },()=>expect(gate().stderr).toContain("Deferred backend reached the frontend"));
  });
});
it("rejects a literal C RPC even when the adapter source pin is updated",()=>{
  edit("src/features/assess/admin-data.ts",s=>s.replace('name="group_write_v1"','name="start_v1"'),()=>{
    manifest(m=>{(m.browserBoundaries as Record<string,string>)["src/features/assess/admin-data.ts"]=createHash("sha256").update(readFileSync(join(root,"src/features/assess/admin-data.ts"))).digest("hex");},()=>expect(gate().stderr).toContain("Deferred RPC used by frontend"));
  });
});
it.each(['c.rpc("start_v1")','c.from("session_details")','c.rpc("unknown_rpc")','c.schema("assess").rpc("training_page_v1_with_comparison")','c.schema("assess").from("profiles")'])("rejects an API outside required SQL even after pinning: %s",call=>{
    edit("src/features/assess/ExtraClient.tsx",()=>`"use client";export function ExtraClient(c: any){return ${call};}`,()=>{
      manifest(m=>{(m.browserBoundaries as Record<string,string>)["src/features/assess/ExtraClient.tsx"]=createHash("sha256").update(readFileSync(join(root,"src/features/assess/ExtraClient.tsx"))).digest("hex");},()=>expect(gate().stderr).toContain("Frontend API missing from required SQL"));
    });
});
it("requires a new attestation when a reviewed backend migration is promoted to frontend requirements",()=>{
  manifest(m=>{(m.requiredMigrations as string[]).push(migration);delete(m.deferredMigrations as Record<string,unknown>)[migration];},()=>{
    expect(gate().status).toBe(1);
    const printed=gate("",true);expect(printed.status).toBe(0);
    const next=printed.stdout.trim();expect(next).not.toBe(verifiedB);
    expect(gate(next).status).toBe(0);
  });
  // Three isolated CLI processes parse the real browser graph; allow runner startup/CPU variance.
  // The assertions, per-process timeout and production gate remain strict and unchanged.
},20000);
it("fails closed on malformed or stale contract entries",()=>{
  manifest(m=>{m.version=2;},()=>expect(gate().status).toBe(1));
  manifest(m=>{(m.requiredMigrations as string[]).push("../../untrusted.sql");},()=>expect(gate().status).toBe(1));
  manifest(m=>{(m.checks as string[]).push("../../untrusted.sql");},()=>expect(gate().status).toBe(1));
  manifest(m=>{m.browserBoundaries={};},()=>expect(gate().status).toBe(1));
});
it("keeps the deployment gate ahead of upload with no bypass or SQL execution",()=>{
  const workflow=readFileSync(resolve(".github/workflows/deploy-pages.yml"),"utf8");
  expect(workflow.indexOf("run: node scripts/pages/pilot-schema-gate.mjs")).toBeLessThan(workflow.indexOf("name: Build static export"));
  expect(workflow).not.toMatch(/continue-on-error|supabase db push|psql|--skip-schema/);
});
it("does not treat typed-array .from as a database boundary",()=>{
  edit("src/features/assess/TypedArrays.tsx",()=>`"use client";export const typed=()=>[Float32Array.from([1]),Float64Array.from([1]),Int8Array.from([1]),Int16Array.from([1]),Int32Array.from([1]),Uint8Array.from([1]),Uint16Array.from([1]),Uint32Array.from([1]),Uint8ClampedArray.from([1]),BigInt64Array.from([1n]),BigUint64Array.from([1n])];`,()=>expect(gate().status).toBe(0));
});
it("keeps an explicitly included adapter pinned without boundary calls",()=>{
  const adapter="src/features/pilot/owner-data.ts";
  mkdirSync(join(root,"src/features/pilot"),{recursive:true});
  edit(adapter,()=>"export const ownerFilters=(range: {start: string})=>range.start;",()=>{
    edit("src/features/pilot/OwnerRoot.tsx",()=>`"use client";import {ownerFilters} from "./owner-data";export const Root=ownerFilters;`,()=>{
      expect(gate().status).toBe(0);
      manifest(m=>{m.explicitBoundaries=[adapter];},()=>expect(gate().stderr).toContain("database boundary changed"));
      manifest(m=>{m.explicitBoundaries=[adapter];(m.browserBoundaries as Record<string,string>)[adapter]=createHash("sha256").update(readFileSync(join(root,adapter))).digest("hex");},()=>{
        expect(gate().status).toBe(0);
        edit(adapter,s=>s+"\n// changed adapter requires review\n",()=>expect(gate().stderr).toContain("database boundary changed"));
      });
    });
    manifest(m=>{m.explicitBoundaries=[adapter];},()=>expect(gate().stderr).toContain("Explicit boundary is not reachable"));
  });
},20000);
