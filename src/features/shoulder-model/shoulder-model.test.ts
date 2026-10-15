import { expect, it } from "vitest";
import { SHOULDER_COLUMNS, shoulderAnchors, shoulderClosureU, shoulderShift, shoulderValue } from "./shoulder-model";
import { limbRotationPlan } from "@/features/radiograph/limb-effects";
import { limbRotationValue } from "@/features/radiograph/pipeline";
import { shoulderGrasheyRadiograph } from "@/data/cases/shoulder-grashey-radiograph";

const lm = shoulderGrasheyRadiograph.limbRotation!;
it("has a dead band over the whole source range 35°–45° and grows only outside it (no 40° optimum)", () => {
  for (let d = 35; d <= 45; d += 0.5) expect(shoulderValue(d)).toBe(0);
  expect(shoulderValue(34)).toBe(-1);
  expect(shoulderValue(46)).toBe(1);
  expect(shoulderValue(0)).toBe(-35);
  for (const d of [35, 40, 45]) expect(limbRotationPlan(d, true, lm)).toBeNull();
  expect(limbRotationPlan(30, true, lm)).not.toBeNull();
  expect(limbRotationPlan(50, true, lm)).not.toBeNull();
});
it("preserves the baseline at zero and never folds over the supported range", () => {
  expect(shoulderAnchors(0).every((a) => a.du === 0)).toBe(true);
  for (let v = -35; v <= 25; v += 0.5) {
    const a = shoulderAnchors(v);
    for (let i = 1; i < a.length; i++) expect(a[i]!.u + a[i]!.du - (a[i - 1]!.u + a[i - 1]!.du)).toBeGreaterThan(0.2 * (a[i]!.u - a[i - 1]!.u) - 1e-9);
  }
});
it("is the same cue for a deviation on either side (magnitude only) and is capped", () => {
  expect(shoulderClosureU(-8)).toBe(shoulderClosureU(8));
  expect(shoulderClosureU(35)).toBe(shoulderClosureU(15));
  expect(shoulderShift(0.6, -8)).toBeCloseTo(shoulderShift(0.6, 8));
  expect(shoulderShift(0.641, 8)).toBeGreaterThan(0);
  expect(shoulderShift(0.9, 8)).toBe(0); // everything medial of the glenoid line stays put
  expect(SHOULDER_COLUMNS[3]!.k).toBe(1);
});
it("drives the drawing and the pixel sampling from the same displacement", () => {
  const p = limbRotationPlan(25, true, lm)!;
  expect(p.hand!.anchors![0]).toEqual(shoulderAnchors(shoulderValue(25)));
  expect(limbRotationPlan(25, false, lm)).toBeNull();
  const ramp = (u: number) => u * 255;
  expect(limbRotationValue(p, lm, ramp, 0.5, 0.3)).not.toBeCloseTo(ramp(0.5), 4);
  expect(limbRotationValue(p, lm, ramp, 0.5, 0.95)).toBeCloseTo(ramp(0.5), 4); // outside the band of rows
});
