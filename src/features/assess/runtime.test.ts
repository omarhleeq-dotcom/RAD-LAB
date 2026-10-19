import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CASES } from "@/data/cases";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import { evaluate } from "@/features/evaluation/engine";
import { SCENARIOS, scenarioSettings } from "@/features/qa/scenario-matrix";

describe("Assess local server-runtime compatibility spike", () => {
  it("runs the unchanged engine in standalone Node with byte-identical outputs, including existing characterisation", () => {
    const samples = [
      ...CASES.flatMap((c) => [
        { caseId: c.id, settings: structuredClone(c.initialSettings) },
        { caseId: c.id, settings: { ...structuredClone(c.initialSettings), sideMarker: null, kvp: c.controls.kvp.min, sidCm: c.controls.sidCm.min } },
      ]),
      ...SCENARIOS.map((s) => ({ caseId: chestPaErect.id, settings: scenarioSettings(s, chestPaErect) })),
    ];
    const expected = samples.map((sample) => evaluate(CASES.find((c) => c.id === sample.caseId)!, sample.settings));
    const root = fileURLToPath(new URL("../../../", import.meta.url));
    const child = spawnSync(process.execPath, ["--import", "./scripts/assess/node-loader.mjs", "scripts/assess/evaluate.mjs"], {
      cwd: root, input: JSON.stringify(samples), encoding: "utf8", maxBuffer: 16 * 1024 * 1024, timeout: 30_000,
    });
    expect(child.error).toBeUndefined();
    expect(child.status, child.stderr).toBe(0);
    expect(child.stdout).toBe(JSON.stringify(expected));
    const frozen = JSON.parse(readFileSync(new URL("../../../scripts/qa/characterisation/chest-pa-scenarios.json", import.meta.url), "utf8"));
    const actual = JSON.parse(child.stdout).slice(CASES.length * 2);
    for (const [i, scenario] of SCENARIOS.entries()) expect(actual[i], scenario.id).toEqual(frozen[scenario.id].result);
  });
});
