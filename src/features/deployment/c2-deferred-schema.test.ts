// RAD085-P1-B-20261028: current contract gains B SQL/readiness; historical hashes and privacy assertions unchanged.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";
import { C2_CHECK, C2_MIGRATION } from "../pilot/c2-contract";

it("requires unchanged reviewed C2 SQL/check with the DB-day attestation and reachable adapter", () => {
 const current = "pilot-v1:6d690343c1ce5e95221d9e67eda65b62dc552ac0e95e78cf41074bc069bfc1be";
 const m = JSON.parse(readFileSync("scripts/pages/frontend-schema.json", "utf8"));
 expect(m.requiredMigrations).toContain(C2_MIGRATION);
 expect(m.checks).toContain(C2_CHECK);
 expect(m.deferredMigrations[C2_MIGRATION]).toBeUndefined();
 expect(createHash("sha256").update(readFileSync(`supabase/migrations/${C2_MIGRATION}`)).digest("hex")).toBe("757ba38b0806221e8bbce71cc2f67740188ccdcaa46664bc070ce1d339c9d99a");
 expect(m.browserBoundaries["src/features/pilot/c2-contract.ts"]).toBe(createHash("sha256").update(readFileSync("src/features/pilot/c2-contract.ts")).digest("hex"));
 const env = {...process.env, NEXT_PUBLIC_SUPABASE_URL: "https://vlacestfruxooznrcjqc.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic_local_test_123456", PILOT_SCHEMA_VERIFIED: current};
 for (const args of [[], ["--print-marker"]]) {
  const r = spawnSync(process.execPath, ["scripts/pages/pilot-schema-gate.mjs", ...args], {env, encoding: "utf8"});
  expect(r.status, r.stderr).toBe(0);
  expect(r.stdout.trim()).toContain(args.length ? current : "Schema attestation matches");
 }
});
