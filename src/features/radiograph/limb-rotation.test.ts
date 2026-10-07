/**
 * Wrist rotation effect (S14.1c): the pure pieces — the plan input and the pixel step — on synthetic stripes (no wrist data
 * needed). Pins the SIGN (S14.1c-2: defined by the result image; positive = toward the viewer's right), the magnitude-only
 * radioulnar overlap, determinism, and that an asset without `limbRotation` is untouched.
 */
import { describe, expect, it } from "vitest";
import type { LimbRotationLandmarks } from "@/domain/radiograph";
import { limbRotationPlan } from "./limb-effects";
import { bandWeight, limbRotationValue } from "./pipeline";
import { TUNING } from "./tuning";

const PA: LimbRotationLandmarks = {
  kind: "wrist-pa",
  spacing: { v1: 0, v2: 0.2, u1: 0.1, u2: 0.9 },
  radioulnar: { v1: 0.5, v2: 0.95, ulnaU1: 0.2, ulnaU2: 0.4 },
};
const LAT: LimbRotationLandmarks = { kind: "wrist-lateral", bands: [{ v1: 0, v2: 0.2 }, { v1: 0.45, v2: 0.6 }] };

/** A bright vertical stripe at u0 (width 0.01) on a dark image, for every v. */
const stripe = (u0: number) => (u: number) => (Math.abs(u - u0) < 0.006 ? 200 : 0);
/** Centre of the brightest plateau of f over u in [0, 1]. */
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

describe("limbRotationPlan (pure)", () => {
  it("is null without landmarks, without a failed rotation check, or at 0°", () => {
    expect(limbRotationPlan(6, true, undefined)).toBeNull();
    expect(limbRotationPlan(6, false, PA)).toBeNull();
    expect(limbRotationPlan(0, true, PA)).toBeNull();
  });
  it("PA: signed spacing shift and a magnitude-only overlap, clamped to the control range", () => {
    const a = limbRotationPlan(6, true, PA)!, b = limbRotationPlan(-6, true, PA)!;
    expect(a.shiftU).toBeCloseTo(6 * TUNING.limbRotation.paSpacingShiftPerDeg);
    expect(b.shiftU).toBeCloseTo(-a.shiftU);
    expect(a.overlapShiftU).toBeCloseTo(b.overlapShiftU);
    expect(a.overlapShiftU).toBeGreaterThan(0);
    expect(limbRotationPlan(99, true, PA)!.degrees).toBe(TUNING.limbRotation.maxDeg);
  });
  it("lateral: signed offset, no overlap term", () => {
    const a = limbRotationPlan(6, true, LAT)!;
    expect(a.shiftU).toBeCloseTo(6 * TUNING.limbRotation.lateralShiftPerDeg);
    expect(a.overlapShiftU).toBe(0);
    expect(limbRotationPlan(-6, true, LAT)!.shiftU).toBeCloseTo(-a.shiftU);
  });
});

describe("limbRotationValue (pixel step)", () => {
  const at = (rot: ReturnType<typeof limbRotationPlan>, lm: LimbRotationLandmarks, src: (u: number) => number, v: number) =>
    argmaxU((u) => limbRotationValue(rot!, lm, (uu) => src(uu), u, v));

  it("PA: a metacarpal-band stripe moves RIGHT for +θ and LEFT for −θ (sign pinned: the result image defines it)", () => {
    const base = 0.3;
    const plus = at(limbRotationPlan(8, true, PA), PA, stripe(base), 0.1);
    const minus = at(limbRotationPlan(-8, true, PA), PA, stripe(base), 0.1);
    expect(plus.u).toBeGreaterThan(base + 0.005);
    expect(minus.u).toBeLessThan(base - 0.005);
    // outside the band nothing moves
    expect(at(limbRotationPlan(8, true, PA), PA, stripe(base), 0.35).u).toBeCloseTo(base, 2);
  });

  it("PA: the spacing bump squeezes one side and widens the other (the spaces become unequal)", () => {
    const rot = limbRotationPlan(8, true, PA)!;
    const pos = (u0: number) => at(rot, PA, stripe(u0), 0.1).u;
    const gapLeft = pos(0.4) - pos(0.2), gapRight = pos(0.8) - pos(0.6);
    expect(Math.abs(gapLeft - gapRight)).toBeGreaterThan(0.01);
  });

  it("PA: the ulna copy lands on the radius side by the overlap amount for either sign (magnitude only)", () => {
    const ulna = 0.3;
    for (const deg of [8, -8]) {
      const rot = limbRotationPlan(deg, true, PA)!;
      // look only to the right of the original ulna, where the copy is the only bright pixel
      const copy = argmaxU((u) => (u > ulna + 0.03 ? limbRotationValue(rot, PA, stripe(ulna), u, 0.7) : 0));
      expect(copy.u).toBeCloseTo(ulna + rot.overlapShiftU, 2);
      expect(copy.value).toBeCloseTo(200 * TUNING.limbRotation.blend, 0);
    }
  });

  it("lateral: the second copy of a band stripe is RIGHT of it for +θ and LEFT for −θ; the first copy stays", () => {
    const base = 0.5;
    for (const [deg, sgn] of [[8, 1], [-8, -1]] as const) {
      const rot = limbRotationPlan(deg, true, LAT)!;
      const away = (u: number) => (sgn > 0 ? u > base + 0.02 : u < base - 0.02);
      const second = argmaxU((u) => (away(u) ? limbRotationValue(rot, LAT, stripe(base), u, 0.1) : 0));
      expect(Math.sign(second.u - base)).toBe(sgn);
      expect(Math.abs(second.u - base)).toBeCloseTo(Math.abs(rot.shiftU), 2);
      expect(limbRotationValue(rot, LAT, stripe(base), base, 0.1)).toBeCloseTo(200 * (1 - TUNING.limbRotation.blend), 0);
    }
  });

  it("lateral: outside the bands the image is unchanged", () => {
    const rot = limbRotationPlan(8, true, LAT)!;
    expect(limbRotationValue(rot, LAT, stripe(0.5), 0.5, 0.3)).toBe(200);
  });

  it("is deterministic and a no-op for a mismatching kind", () => {
    const rot = limbRotationPlan(8, true, PA)!;
    const a = limbRotationValue(rot, PA, stripe(0.3), 0.33, 0.1), b = limbRotationValue(rot, PA, stripe(0.3), 0.33, 0.1);
    expect(a).toBe(b);
    expect(limbRotationValue(rot, LAT, stripe(0.3), 0.3, 0.1)).toBe(200);
  });

  it("band weights are 0–1 with a soft edge", () => {
    expect(bandWeight({ v1: 0.2, v2: 0.4 }, 0.3)).toBe(1);
    expect(bandWeight({ v1: 0.2, v2: 0.4 }, 0.9)).toBe(0);
    const edge = bandWeight({ v1: 0.2, v2: 0.4 }, 0.2);
    expect(edge).toBeGreaterThan(0.4);
    expect(edge).toBeLessThan(0.6);
  });
});
