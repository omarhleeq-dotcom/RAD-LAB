/**
 * Hand rotation effects (S14.2b): the pure pieces — the plan input and the pixel step — on synthetic stripes (no hand data needed).
 * Pins the SIGN (S14.2-11: defined by the result image; positive = toward the viewer's right), the magnitude-only plan, determinism,
 * and that the wrist kinds are untouched. Same pattern as `limb-rotation.test.ts`.
 */
import { describe, expect, it } from "vitest";
import type { LimbRotationLandmarks } from "@/domain/radiograph";
import { limbRotationConcept, limbRotationPlan } from "./limb-effects";
import { limbRotationValue } from "./pipeline";
import { TUNING } from "./tuning";

const PA: LimbRotationLandmarks = {
  kind: "hand-pa",
  bands: [{ v1: 0.01, v2: 0.42, u1: 0.03, u2: 0.75 }, { v1: 0.44, v2: 0.71, u1: 0.08, u2: 0.72 }],
};
const LAT: LimbRotationLandmarks = { kind: "hand-lateral", bands: [{ v1: 0, v2: 0.63 }, { v1: 0.86, v2: 1 }] };

const stripe = (u0: number) => (u: number) => (Math.abs(u - u0) < 0.006 ? 200 : 0);
const argmaxU = (f: (u: number) => number) => {
  let best = 0;
  const us: number[] = [];
  for (let i = 0; i <= 4000; i++) {
    const u = i / 4000;
    const v = f(u);
    if (v > best + 1e-9) { best = v; us.length = 0; }
    if (Math.abs(v - best) <= 1e-9) us.push(u);
  }
  return { u: (us[0]! + us[us.length - 1]!) / 2, value: best };
};

describe("hand limbRotationPlan (pure)", () => {
  it("is null without landmarks, without a failed rotation check, or at 0°", () => {
    expect(limbRotationPlan(6, true, undefined)).toBeNull();
    expect(limbRotationPlan(6, false, PA)).toBeNull();
    expect(limbRotationPlan(0, true, LAT)).toBeNull();
  });
  it("PA: signed bump, no overlap term, clamped to the control range", () => {
    const a = limbRotationPlan(6, true, PA)!, b = limbRotationPlan(-6, true, PA)!;
    expect(a.kind).toBe("hand-pa");
    expect(a.shiftU).toBeCloseTo(6 * TUNING.limbRotation.handPaSpacingShiftPerDeg);
    expect(b.shiftU).toBeCloseTo(-a.shiftU);
    expect(a.overlapShiftU).toBe(0);
    expect(limbRotationPlan(99, true, PA)!.degrees).toBe(TUNING.limbRotation.maxDeg);
  });
  it("lateral: signed offset, no overlap term", () => {
    const a = limbRotationPlan(6, true, LAT)!;
    expect(a.kind).toBe("hand-lateral");
    expect(a.shiftU).toBeCloseTo(6 * TUNING.limbRotation.handLateralShiftPerDeg);
    expect(limbRotationPlan(-6, true, LAT)!.shiftU).toBeCloseTo(-a.shiftU);
  });
  it("the concept record cites the hand pages", () => {
    expect(limbRotationConcept("hand-pa").reference).toMatch(/p\.150/);
    expect(limbRotationConcept("hand-lateral").reference).toMatch(/p\.153/);
  });
});

describe("hand limbRotationValue (pixel step)", () => {
  const at = (rot: ReturnType<typeof limbRotationPlan>, lm: LimbRotationLandmarks, src: (u: number) => number, v: number) =>
    argmaxU((u) => limbRotationValue(rot!, lm, (uu) => src(uu), u, v));

  it("PA: a stripe in the metacarpal and in the phalangeal band moves RIGHT for +θ and LEFT for −θ", () => {
    for (const v of [0.2, 0.55]) {
      const plus = at(limbRotationPlan(8, true, PA), PA, stripe(0.4), v);
      const minus = at(limbRotationPlan(-8, true, PA), PA, stripe(0.4), v);
      expect(plus.u).toBeGreaterThan(0.4 + 0.005);
      expect(minus.u).toBeLessThan(0.4 - 0.005);
    }
    // outside the bands (the carpals) nothing moves
    expect(at(limbRotationPlan(8, true, PA), PA, stripe(0.4), 0.85).u).toBeCloseTo(0.4, 2);
  });
  it("PA: the bump makes the spaces unequal (widens one side, squeezes the other)", () => {
    const rot = limbRotationPlan(8, true, PA)!;
    const pos = (u0: number) => at(rot, PA, stripe(u0), 0.55).u;
    expect(Math.abs((pos(0.35) - pos(0.15)) - (pos(0.65) - pos(0.45)))).toBeGreaterThan(0.005);
  });
  it("lateral: the second copy of a band stripe is RIGHT of it for +θ and LEFT for −θ; the first copy stays; outside the bands nothing", () => {
    const base = 0.5;
    for (const [deg, sgn] of [[8, 1], [-8, -1]] as const) {
      const rot = limbRotationPlan(deg, true, LAT)!;
      const away = (u: number) => (sgn > 0 ? u > base + 0.02 : u < base - 0.02);
      for (const v of [0.3, 0.95]) {
        const second = argmaxU((u) => (away(u) ? limbRotationValue(rot, LAT, stripe(base), u, v) : 0));
        expect(Math.sign(second.u - base)).toBe(sgn);
        expect(Math.abs(second.u - base)).toBeCloseTo(Math.abs(rot.shiftU), 2);
        expect(limbRotationValue(rot, LAT, stripe(base), base, v)).toBeCloseTo(200 * (1 - TUNING.limbRotation.blend), 0);
      }
    }
    expect(limbRotationValue(limbRotationPlan(8, true, LAT)!, LAT, stripe(0.5), 0.5, 0.75)).toBe(200);
  });
  it("is deterministic and a no-op for a mismatching kind", () => {
    const rot = limbRotationPlan(8, true, PA)!;
    expect(limbRotationValue(rot, PA, stripe(0.3), 0.33, 0.2)).toBe(limbRotationValue(rot, PA, stripe(0.3), 0.33, 0.2));
    expect(limbRotationValue(rot, LAT, stripe(0.3), 0.3, 0.2)).toBe(200);
  });
});
