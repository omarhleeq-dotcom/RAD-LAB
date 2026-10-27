import { expect, it } from "vitest";
import { REST_BAND_DEG, SHOULDER_COLUMNS, shoulderAnchors, shoulderClosureU, shoulderShift, shoulderValue } from "./shoulder-model";
import { limbRotationPlan } from "@/features/radiograph/limb-effects";
import { limbRotationValue } from "@/features/radiograph/pipeline";
import { shoulderGrasheyRadiograph } from "@/data/cases/shoulder-grashey-radiograph";

import { SHOULDER_BAND_DEG } from "@/data/exams/xray/shoulder-geometry";

it("keeps the public rest interval equal to the reviewed shoulder band", () => {
  expect(REST_BAND_DEG).toEqual(SHOULDER_BAND_DEG);
});

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
it("is the same cue for a deviation on either side (magnitude only) and grows over the whole console range (cap lifted, 2c D2)", () => {
  expect(shoulderClosureU(-8)).toBe(shoulderClosureU(8));
  expect(shoulderClosureU(15)).toBeGreaterThan(shoulderClosureU(10));
  expect(shoulderClosureU(35)).toBeGreaterThan(shoulderClosureU(15));
  expect(shoulderClosureU(60)).toBe(shoulderClosureU(35)); // only beyond the console range (0°…60° is at most 35° from the band) does it stop
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

it("the result image keeps changing with the console angle: 0°, 15°, 20° and 30° differ, 35°–45° are the baseline, 60° differs from 50° (2c D2)", () => {
  const ramp = (u: number) => u * 255;
  const probe = [0.45, 0.55, 0.62, 0.68];
  const sig = (deg: number) => {
    const plan = limbRotationPlan(deg, true, lm);
    return probe.map((u) => (plan ? limbRotationValue(plan, lm, ramp, u, 0.3) : ramp(u)).toFixed(4)).join("|");
  };
  const baseline = probe.map((u) => ramp(u).toFixed(4)).join("|");
  for (const d of [35, 40, 45]) expect(sig(d)).toBe(baseline);
  const low = [0, 15, 20, 30].map(sig);
  expect(new Set(low).size).toBe(4);
  for (const s of low) expect(s).not.toBe(baseline);
  expect(sig(60)).not.toBe(sig(50));
  expect(sig(60)).not.toBe(baseline);
  // the head stays distinct at the maximum closure: no fold, the strip between the head anchor and the glenoid line keeps at least 20 % of its width
  const worst = shoulderAnchors(shoulderValue(0));
  expect(worst[4]!.u + worst[4]!.du - (worst[3]!.u + worst[3]!.du)).toBeGreaterThan(0.2 * (worst[4]!.u - worst[3]!.u));
});

it("the closure is a monotone saturating curve: strictly increasing from 35° down to 0° and from 45° up to 60°, steep at the band edge, never below the old capped value at 15° from the band, no fold at 0° (2c D2 refinement)", () => {
  const OLD_CAPPED = 0.0033 * 15; // the closure at 15° from the band under the earlier cap (59 px of 1193)
  const c = (deg: number) => shoulderClosureU(shoulderValue(deg));
  for (let d = 34; d >= 0; d--) expect(c(d), `${d}°`).toBeGreaterThan(c(d + 1));
  for (let d = 46; d <= 60; d++) expect(c(d), `${d}°`).toBeGreaterThan(c(d - 1));
  expect(c(35)).toBe(0);
  expect(c(45)).toBe(0);
  expect(c(20)).toBeGreaterThanOrEqual(OLD_CAPPED);
  expect(c(60)).toBeGreaterThanOrEqual(OLD_CAPPED);
  expect(c(20)).toBe(c(60)); // the same cue on both sides
  expect(c(0)).toBeGreaterThan(c(20));
  // flattening: the first 10° from the band edge close more than the next 10°, which close more than the last 15°
  expect(c(25) - c(35)).toBeGreaterThan(c(15) - c(25));
  expect(c(15) - c(25)).toBeGreaterThan((c(0) - c(15)) * (10 / 15));
  const a = shoulderAnchors(shoulderValue(0));
  expect(a[4]!.u + a[4]!.du - (a[3]!.u + a[3]!.du)).toBeGreaterThan(0.2 * (a[4]!.u - a[3]!.u));
  for (let i = 1; i < a.length; i++) expect(a[i]!.u + a[i]!.du - (a[i - 1]!.u + a[i - 1]!.du)).toBeGreaterThan(0.2 * (a[i]!.u - a[i - 1]!.u) - 1e-9);
});
