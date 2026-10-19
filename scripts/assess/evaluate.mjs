// Local stdin/stdout harness. No HTTP listener, credentials, writes, deployment or client-supplied score.
// node --import ./scripts/assess/node-loader.mjs scripts/assess/evaluate.mjs < synthetic-samples.json
import { readFileSync } from "node:fs";
import { CASES } from "../../src/data/cases/index.ts";
import { evaluate } from "../../src/features/evaluation/engine.ts";

const raw = readFileSync(0, "utf8");
if (Buffer.byteLength(raw) > 2_000_000) throw new Error("Spike input too large");
const samples = JSON.parse(raw);
if (!Array.isArray(samples) || samples.length > 250) throw new Error("Invalid spike samples");
const results = samples.map(({ caseId, settings }) => {
  const c = CASES.find((entry) => entry.id === caseId);
  if (!c) throw new Error("Unknown server case");
  return evaluate(c, settings);
});
process.stdout.write(JSON.stringify(results));
