import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";
import { C2_CHECK, C2_MIGRATION } from "../pilot/c2-contract";

it("defers the exact C2 SQL/check without changing the project attestation or reaching the frontend", () => {
 const current = "pilot-v1:0bc3743c707cff0fcef456d00096f6e186b759390708d2d963a6eabea55e5d52";
 const m = JSON.parse(readFileSync("scripts/pages/frontend-schema.json", "utf8"));
 expect(m.requiredMigrations).not.toContain(C2_MIGRATION);
 expect(m.checks).not.toContain(C2_CHECK);
 expect(m.deferredMigrations[C2_MIGRATION]).toMatchObject({sha256: createHash("sha256").update(readFileSync(`supabase/migrations/${C2_MIGRATION}`)).digest("hex"), serverModules: ["src/features/pilot/c2-contract.ts"]});
 const env = {...process.env, NEXT_PUBLIC_SUPABASE_URL: "https://vlacestfruxooznrcjqc.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic_local_test_123456", PILOT_SCHEMA_VERIFIED: current};
 for (const args of [[], ["--print-marker"]]) {
  const r = spawnSync(process.execPath, ["scripts/pages/pilot-schema-gate.mjs", ...args], {env, encoding: "utf8"});
  expect(r.status, r.stderr).toBe(0);
  expect(r.stdout.trim()).toContain(args.length ? current : "Schema attestation matches");
 }
});
