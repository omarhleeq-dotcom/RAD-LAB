// Offline deployment gate: an owner attests compatibility after the documented read-only SQL + signed-in checks.
// No database connection, credentials or account data. The attestation binds to this project and SQL contents.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertPublishableKey, supabaseOrigin } from "./headers.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
function requiredMarker(origin) {
  const hash = createHash("sha256").update(`${origin}\n`);
  const files = readdirSync(resolve(root, "supabase/migrations")).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) hash.update(`${file}\0`).update(readFileSync(resolve(root, "supabase/migrations", file))).update("\0");
  hash.update(readFileSync(resolve(root, "supabase/checks/training-ready.sql")));
  hash.update(readFileSync(resolve(root, "supabase/checks/comparison-ready.sql")));
  return `pilot-v1:${hash.digest("hex")}`;
}
export function runSchemaGate(env, printMarker = false) {
  const origin = supabaseOrigin(env.NEXT_PUBLIC_SUPABASE_URL);
  if (printMarker) {
    if (!origin) throw new Error("Set the public NEXT_PUBLIC_SUPABASE_URL for the project being verified.");
    return requiredMarker(origin);
  }
  const key = assertPublishableKey(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  if (!origin && !key) return "Pilot disabled: schema attestation is not needed.";
  if (!origin || !key) throw new Error("Incomplete pilot configuration: both public project URL and publishable key are required.");
  if ((env.PILOT_SCHEMA_VERIFIED ?? "").trim() !== requiredMarker(origin)) {
    throw new Error("Pilot deployment blocked: schema compatibility has not been attested for this project and migration contents. Follow docs/PILOT_SUPABASE_SETUP.md; run the read-only SQL and signed-in checks before setting PILOT_SCHEMA_VERIFIED. No preview link should be published.");
  }
  return "Schema attestation matches this project and migration contents. This offline gate does not query the live database.";
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { console.log(runSchemaGate(process.env, process.argv.includes("--print-marker"))); }
  catch (error) { console.error(error instanceof Error ? error.message : "Pilot schema gate failed."); process.exitCode = 1; }
}
