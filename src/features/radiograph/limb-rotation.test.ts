/**
 * Wrist rotation effect (S14.1c, rebuilt on the 2.5D wrist model in S-VIS-1b): the pure pieces — the plan input and the pixel step — on
 * synthetic stripes (no wrist data needed). Pins the SIGN (defined by the result image, never mirrored by RTL), that the displacement comes
 * from `features/wrist-model` (the same functions the scene draws), determinism, and that a mismatching asset is untouched.
 */
import { describe, expect, it } from "vitest";
import type { LimbRotationLandmarks } from "@/domain/radiograph";
import { PA_COLUMNS, WRIST_MODEL, wristLateralCopies, wristPaShifts } from "@/features/wrist-model/wrist-model";
import { limbRotationPlan } from "./limb-effects";
import { bandWeight, limbRotationValue } from "./pipeline";
import { TUNING } from "./tuning";

const PA: LimbRotationLandmarks = { kind: "wrist-pa", forearm: { v1: 0.52, v2: 1, splitU: 0.457 } };
const LAT: LimbRotationLandmarks = { kind: "wrist-lateral", bands: [{ v1: 0, v2: 0.19, u1: 0.2, u2: 1 }, { v1: 0.42, v2: 0.57, u1: 0.33, u2: 0.79 }] };
const W = WRIST_MODEL.pa.widthPx;

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
  it("PA: the plan carries the wrist model's anchors and layers; the sign carrier is odd, the clamp is the control range", () => {
    const a = limbRotationPlan(6, true, PA)!, b = limbRotationPlan(-6, true, PA)!;
    const m = wristPaShifts(6);
    expect(a.elbow?.anchors).toEqual(m.anchors);
    expect(a.elbow?.layers).toEqual({ ulna: m.ulnaAnchors, radius: m.radiusAnchors });
    expect(a.shiftU).toBeGreaterThan(0);
    expect(b.shiftU).toBeCloseTo(-a.shiftU);
    expect(limbRotationPlan(99, true, PA)!.degrees).toBe(TUNING.limbRotation.maxDeg);
    expect(limbRotationPlan(99, true, PA)!.elbow).toEqual(limbRotationPlan(15, true, PA)!.elbow);
  });
  it("lateral: the plan carries the model's copies, signed by the far-side copy", () => {
    const a = limbRotationPlan(6, true, LAT)!;
    const m = wristLateralCopies(6);
    expect(a.elbow?.copies).toEqual([m.metacarpals, m.head]);
    expect(a.shiftU).toBeGreaterThan(0);
    expect(limbRotationPlan(-6, true, LAT)!.shiftU).toBeCloseTo(-a.shiftU);
  });
});

describe("wrist model (pure)", () => {
  it("is the identity at the base pose", () => {
    const m = wristPaShifts(0);
    expect(m.anchors.every((x) => x.du === 0)).toBe(true);
    expect(m.ulna).toBeCloseTo(0, 12);
    expect(m.radius).toBeCloseTo(0, 12);
    expect(wristLateralCopies(0).metacarpals.every((c) => c.du === 0)).toBe(true);
  });
  it("PA sign: + opens the radioulnar space (ulna left, radius right), − closes it; the spacing of the metacarpals becomes unequal", () => {
    const p = wristPaShifts(8), n = wristPaShifts(-8);
    expect(p.radius - p.ulna).toBeGreaterThan(0);
    expect(n.radius - n.ulna).toBeLessThan(0);
    const gaps = (s: ReturnType<typeof wristPaShifts>) => s.anchors.slice(1).map((a, i) => a.u + a.du - (s.anchors[i]!.u + s.anchors[i]!.du));
    const base = gaps(wristPaShifts(0)), g = gaps(p);
    expect(g.some((x, i) => Math.abs(x - base[i]!) > 0.005)).toBe(true);
    // not equal changes in every gap: the spaces become unequal relative to each other
    const rel = g.map((x, i) => x / base[i]!);
    expect(Math.max(...rel) - Math.min(...rel)).toBeGreaterThan(0.05);
    expect(PA_COLUMNS.metacarpals.length).toBe(p.anchors.length);
  });
  it("PA: the anchors never fold (kept in order)", () => {
    for (const d of [-15, -8, 8, 15]) {
      const a = wristPaShifts(d).anchors;
      for (let k = 1; k < a.length; k++) expect(a[k]!.u + a[k]!.du).toBeGreaterThan(a[k - 1]!.u + a[k - 1]!.du);
    }
  });
});

describe("limbRotationValue (pixel step)", () => {
  const at = (rot: ReturnType<typeof limbRotationPlan>, lm: LimbRotationLandmarks, src: (u: number) => number, v: number, win?: (u: number) => boolean) =>
    argmaxU((u) => (win && !win(u) ? 0 : limbRotationValue(rot!, lm, (uu) => src(uu), u, v)));

  it("PA forearm rows: with +θ the ulna stripe moves LEFT and the radius stripe RIGHT; with −θ they move toward each other (sign pinned)", () => {
    const ulna = PA_COLUMNS.ulna.x / W, radius = PA_COLUMNS.radius.x / W;
    const plus = limbRotationPlan(8, true, PA), minus = limbRotationPlan(-8, true, PA);
    const left = (u: number) => u < 0.45, right = (u: number) => u > 0.46;
    expect(at(plus, PA, stripe(ulna), 0.8, left).u).toBeLessThan(ulna - 0.005);
    expect(at(plus, PA, stripe(radius), 0.8, right).u).toBeGreaterThan(radius + 0.005);
    expect(at(minus, PA, stripe(ulna), 0.8, left).u).toBeGreaterThan(ulna + 0.005);
    expect(at(minus, PA, stripe(radius), 0.8, right).u).toBeLessThan(radius - 0.005);
  });

  it("PA metacarpal rows: the middle metacarpals (dorsal) move RIGHT for +θ, the thumb-side one LEFT", () => {
    const mc3 = PA_COLUMNS.metacarpals[2]!.x / W, thumb = PA_COLUMNS.metacarpals[4]!.x / W;
    const plus = limbRotationPlan(8, true, PA);
    expect(at(plus, PA, stripe(mc3), 0.1).u).toBeGreaterThan(mc3 + 0.005);
    expect(at(plus, PA, stripe(thumb), 0.1).u).toBeLessThan(thumb - 0.005);
  });

  it("PA: at the base pose the image is unchanged (no plan) and the displacement is deterministic", () => {
    expect(limbRotationPlan(0, true, PA)).toBeNull();
    const rot = limbRotationPlan(8, true, PA)!;
    const a = limbRotationValue(rot, PA, stripe(0.3), 0.33, 0.1), b = limbRotationValue(rot, PA, stripe(0.3), 0.33, 0.1);
    expect(a).toBe(b);
  });

  it("lateral: the far-side copy of a band stripe is RIGHT of it for +θ and LEFT for −θ, the near-side copy on the other side (stronger)", () => {
    const base = 0.5;
    for (const [deg, sgn] of [[8, 1], [-8, -1]] as const) {
      const rot = limbRotationPlan(deg, true, LAT)!;
      const m = wristLateralCopies(deg).metacarpals;
      expect(Math.sign(m[0]!.du)).toBe(sgn);
      const far = argmaxU((u) => (sgn > 0 ? (u > base + 0.01 ? limbRotationValue(rot, LAT, stripe(base), u, 0.1) : 0) : u < base - 0.01 ? limbRotationValue(rot, LAT, stripe(base), u, 0.1) : 0));
      expect(far.u).toBeCloseTo(base + m[0]!.du, 2);
      const near = argmaxU((u) => (sgn > 0 ? (u < base - 0.01 ? limbRotationValue(rot, LAT, stripe(base), u, 0.1) : 0) : u > base + 0.01 ? limbRotationValue(rot, LAT, stripe(base), u, 0.1) : 0));
      expect(near.u).toBeCloseTo(base + m[1]!.du, 2);
      expect(near.value).toBeGreaterThan(far.value); // 60 % vs 40 %
    }
  });

  it("lateral: outside the bands the image is unchanged; a mismatching kind is a no-op", () => {
    const rot = limbRotationPlan(8, true, LAT)!;
    expect(limbRotationValue(rot, LAT, stripe(0.5), 0.5, 0.3)).toBe(200);
    expect(limbRotationValue(rot, PA, stripe(0.3), 0.3, 0.1)).toBe(200);
  });

  it("band weights are 0–1 with a soft edge", () => {
    expect(bandWeight({ v1: 0.2, v2: 0.4 }, 0.3)).toBe(1);
    expect(bandWeight({ v1: 0.2, v2: 0.4 }, 0.9)).toBe(0);
    const edge = bandWeight({ v1: 0.2, v2: 0.4 }, 0.2);
    expect(edge).toBeGreaterThan(0.4);
    expect(edge).toBeLessThan(0.6);
  });
});
