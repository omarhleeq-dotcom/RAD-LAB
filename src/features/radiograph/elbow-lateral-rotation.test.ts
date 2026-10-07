/**
 * Elbow lateral rotation (S14.3): the elbow model's copies, the plan input and the pixel step on synthetic stripes.
 * Pins: at the base pose there is one outline (copies coincide), continuity, ONE sign for the scene and the result image (positive = the
 * lateral-side copy toward the viewer's right, the medial-side copy toward the left; the medial copy is the stronger), both signs show the
 * same kind of change, determinism.
 */
import { describe, expect, it } from "vitest";
import type { LimbRotationLandmarks } from "@/domain/radiograph";
import { ELBOW_MODEL, LATERAL_COPY_WEIGHTS, elbowLateralCopies } from "@/features/elbow-model/elbow-model";
import { limbRotationConcept, limbRotationPlan } from "./limb-effects";
import { limbRotationValue } from "./pipeline";

const LAT: LimbRotationLandmarks = {
  kind: "elbow-lateral",
  bands: [{ v1: 0.64, v2: 0.82, u1: 0.635, u2: 0.843 }, { v1: 0.66, v2: 0.8, u1: 0.502, u2: 0.635 }],
};
const W = ELBOW_MODEL.lateral.widthPx;
const stripe = (u0: number) => (u: number) => (Math.abs(u - u0) < 0.006 ? 200 : 0);
const col = 0.72; // inside band 0's window
const at = (r: number, src: (u: number) => number, v: number) => {
  const plan = limbRotationPlan(r, true, LAT)!;
  return (u: number) => limbRotationValue(plan, LAT, src, u, v);
};

describe("elbow lateral model", () => {
  it("at 0° the copies coincide (one outline) and their weights are 40 % lateral / 60 % medial", () => {
    const c = elbowLateralCopies(0);
    for (const x of [...c.condyles, ...c.head]) expect(x.du).toBeCloseTo(0, 12);
    expect(c.condyles[0]!.w).toBe(LATERAL_COPY_WEIGHTS.lateral);
    expect(c.condyles[1]!.w).toBe(LATERAL_COPY_WEIGHTS.medial);
    expect(LATERAL_COPY_WEIGHTS.lateral + LATERAL_COPY_WEIGHTS.medial).toBeCloseTo(1, 12);
  });
  it("continuity: a 0.25° step moves every copy by less than 2 px over the whole range, and the separation grows with |value|", () => {
    let prev = elbowLateralCopies(-15);
    for (let r = -14.75; r <= 15.0001; r += 0.25) {
      const cur = elbowLateralCopies(r);
      cur.condyles.forEach((x, i) => expect(Math.abs((x.du - prev.condyles[i]!.du) * W)).toBeLessThan(2));
      prev = cur;
    }
    const sep = (r: number) => { const c = elbowLateralCopies(r).condyles; return Math.abs(c[0]!.du - c[1]!.du); };
    expect(sep(3)).toBeLessThan(sep(8));
    expect(sep(8)).toBeLessThan(sep(15));
    expect(sep(5)).toBeCloseTo(sep(-5), 12);
  });
});

describe("one sign for the scene and the result image", () => {
  it("positive value: the lateral-side copy moves RIGHT and the medial-side copy LEFT; negative: the mirror", () => {
    const p = elbowLateralCopies(8).condyles, m = elbowLateralCopies(-8).condyles;
    expect(p[0]!.du).toBeGreaterThan(0);
    expect(p[1]!.du).toBeLessThan(0);
    expect(m[0]!.du).toBeLessThan(0);
    expect(m[1]!.du).toBeGreaterThan(0);
  });
  it("the plan's sign carrier is the lateral-side copy's shift, and carries the same copies the scene draws", () => {
    expect(limbRotationPlan(8, true, LAT)!.shiftU).toBeGreaterThan(0);
    expect(limbRotationPlan(-8, true, LAT)!.shiftU).toBeLessThan(0);
    const c = elbowLateralCopies(9);
    expect(limbRotationPlan(9, true, LAT)!.elbow!.copies).toEqual([c.condyles, c.head]);
  });
});

describe("elbow lateral pixel step", () => {
  it("a stripe inside the condyle band is drawn twice, apart: the medial copy (60 %) to the left and the lateral copy (40 %) to the right for +θ; mirrored for −θ", () => {
    for (const r of [12, -12]) {
      const c = elbowLateralCopies(r).condyles;
      const f = at(r, stripe(col), 0.73);
      const lat = f(col + c[0]!.du), med = f(col + c[1]!.du);
      expect(med).toBeGreaterThan(lat);
      expect(lat).toBeGreaterThan(40);
      expect(Math.abs(c[0]!.du - c[1]!.du)).toBeGreaterThan(0.02);
      expect(f(col)).toBeLessThan(10); // the base position is empty: no third copy
    }
    const p = elbowLateralCopies(12).condyles;
    expect(col + p[1]!.du).toBeLessThan(col + p[0]!.du); // +θ: medial copy on the left
  });
  it("at a tiny value the picture is almost the baseline; copies separate gradually (no jump)", () => {
    const src = stripe(col);
    const diff = (r: number) => { let s = 0; for (let i = 0; i <= 700; i++) { const u = i / 700; s += Math.abs(at(r, src, 0.73)(u) - src(u)); } return s; };
    expect(diff(0.25)).toBeLessThan(diff(3));
    expect(diff(3)).toBeLessThan(diff(9));
    let prev = diff(0.25);
    for (let r = 0.75; r <= 15; r += 0.5) { const cur = diff(r); expect(Math.abs(cur - prev)).toBeLessThan(900); prev = cur; }
  });
  it("outside the bands nothing changes; the band window limits the copies; deterministic; mismatching kind is a no-op", () => {
    const rot = limbRotationPlan(9, true, LAT)!;
    expect(limbRotationValue(rot, LAT, stripe(col), col, 0.3)).toBe(200); // above the bands
    expect(limbRotationValue(rot, LAT, stripe(0.2), 0.2, 0.73)).toBe(200); // left of both windows: the baseline pixel
    expect(at(7, stripe(col), 0.73)(0.7)).toBe(at(7, stripe(col), 0.73)(0.7));
    const wrist: LimbRotationLandmarks = { kind: "wrist-lateral", bands: [{ v1: 0, v2: 1 }] };
    expect(limbRotationValue(rot, wrist, stripe(0.3), 0.3, 0.2)).toBe(200);
  });
  it("the plan is null without a failed rotation check or at 0°, clamped to the control range; the concept cites p.172", () => {
    expect(limbRotationPlan(6, false, LAT)).toBeNull();
    expect(limbRotationPlan(0, true, LAT)).toBeNull();
    expect(limbRotationPlan(99, true, LAT)!.degrees).toBe(15);
    expect(limbRotationConcept("elbow-lateral").reference).toMatch(/p\.172/);
  });
});
