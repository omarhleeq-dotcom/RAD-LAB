import { expect, it } from "vitest";
import { getCase } from "@/data/cases";
import { definitionVersion, compactResult } from "@/features/pilot/attempt-record";
import { evaluate } from "./engine";
import { PRACTICE_EVALUATION_VERSION } from "./version";
import { comparisonVersion } from "./comparison-version";
import { evaluationComparison, readyEvaluationComparison } from "./version";

const fixture = () => structuredClone(getCase("chest-pa-erect")!);
const identity = (c: ReturnType<typeof fixture>) => comparisonVersion(c, PRACTICE_EVALUATION_VERSION);
function translate(value: unknown) {
  if (!value || typeof value !== "object") return;
  const object = value as Record<string, unknown>;
  if (typeof object.en === "string" && typeof object.ar === "string") {
    object.en = "Synthetic display copy"; object.ar = "نص اصطناعي للعرض";
  } else Object.values(object).forEach(translate);
}

it("keeps text/display-only synthetic variants together while retaining distinct original fingerprints and exact saved scores", async () => {
  const original = fixture(), copy = structuredClone(original);
  translate(copy);
  copy.radiograph = { ...copy.radiograph, id: "synthetic-display" } as typeof copy.radiograph;
  copy.availableProjections.reverse();
  copy.controls.kvp.step += 1;
  const before = JSON.stringify(original);
  expect(await definitionVersion(copy)).not.toBe(await definitionVersion(original));
  expect(await identity(copy)).toBe(await identity(original));
  expect(compactResult(evaluate(copy, copy.initialSettings))).toEqual(compactResult(evaluate(original, original.initialSettings)));
  expect(JSON.stringify(original)).toBe(before);
});

it("separates rule/weight/gate/geometry/model changes and evaluator semantics without modifying real definitions", async () => {
  const original = fixture(), base = await identity(original);
  const edits: ((c: typeof original) => void)[] = [
    (c) => { c.rules[0]!.weight = 7; },
    (c) => { c.scoring.passThreshold += 1; },
    (c) => { c.scoring.criticalFindings = []; },
    (c) => { c.positioning.centering.idealTolerance.x += 0.01; },
    (c) => { c.requiredAnatomy.widthCm += 1; },
    (c) => { c.technique.patient.attenuation += 0.1; },
    (c) => { c.patientCooperation.motionResponse["remain-still"] = "motion"; },
    (c) => { c.requiredProjection = "AP"; },
  ];
  for (const edit of edits) { const c = fixture(); edit(c); expect(await identity(c)).not.toBe(base); }
  expect(await comparisonVersion(original, "radlab-practice-evaluation/2")).not.toBe(base);
  expect(await comparisonVersion(original, "unknown")).toBeNull();
  // New fields are conservative until classified; no generic label/text stripping.
  const future = { ...original, futureRule: { label: "semantic-id", threshold: 1 } };
  expect(await identity(future)).not.toBe(base);
  const changedFuture = { ...future, futureRule: { ...future.futureRule, label: "other" } };
  expect(await identity(changedFuture)).not.toBe(await identity(future));
});

it("captures evaluated rules before later mutation and refuses cloned result provenance", async () => {
  const c = fixture(), expected = await identity(c);
  const result = evaluate(c, c.initialSettings);
  c.scoring.passThreshold += 1;
  expect(await evaluationComparison(result)).toBe(expected);
  expect(readyEvaluationComparison(result)).toBe(expected);
  expect(await identity(c)).not.toBe(expected);
  expect(await evaluationComparison(structuredClone(result))).toBeNull();
});
