import { it, expect } from "vitest";
import { CASES } from "@/data/cases";
import { evaluate } from "./engine";
import { comparisonVersion } from "./comparison-version";
import { PRACTICE_EVALUATION_VERSION } from "./version";
it.each(CASES)("$id keeps mixed-axis clipping and excess independent and names edges", async c => {
  let mixed: ReturnType<typeof evaluate> | undefined;
  for (const width of [.3, .5, .75, 1]) for (const height of [.3, .5, .75, 1]) {
    const r = evaluate(c, { ...c.initialSettings, projection: c.requiredProjection, centralRay: c.positioning.centering.target, collimation: { width, height }, sideMarker: null });
    if (r.checks.some(k => k.ruleId === "collimation-clipping" && k.outcome === "fail") && r.checks.some(k => k.ruleId === "collimation-excess" && k.outcome === "partial")) mixed = r;
  }
  expect(mixed, c.id).toBeDefined();
  const feedback = mixed!.checks.find(k => k.ruleId === "collimation-excess")!.feedback;
  expect(feedback.en).toMatch(/(?:left|right|top|bottom) edge/);
  expect(feedback.ar).toMatch(/الحافة (?:اليسرى|اليمنى|العلوية|السفلية)/);
  expect(mixed!.checks.find(k => k.ruleId === "collimation-clipping")!.feedback.en).toContain("named clipped edges");
  const plain = { ...c, rules: c.rules.map(r => r.kind === "coverage" ? { ...r, excessSides: undefined } : r) };
  expect(await comparisonVersion(c, PRACTICE_EVALUATION_VERSION)).toBe(await comparisonVersion(plain, PRACTICE_EVALUATION_VERSION));
});
