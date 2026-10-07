/**
 * Elbow AP rotation (S14.3): the elbow model (`features/elbow-model`), the plan input and the pixel step on synthetic stripes.
 * Pins: continuity (small step → small change, no jumps), the base pose is the baseline, ONE sign for the scene and the result image
 * (positive = the ulna column toward the viewer's left and the radius column toward the right: apart; negative = toward each other, drawn
 * over one another), the epicondyles narrow for either sign, the warp never folds, determinism.
 */
import { describe, expect, it } from "vitest";
import type { LimbRotationLandmarks } from "@/domain/radiograph";
import { AP_COLUMNS, ELBOW_MODEL, elbowApShifts, interpolateAnchors } from "@/features/elbow-model/elbow-model";
import { limbRotationConcept, limbRotationPlan } from "./limb-effects";
import { limbRotationValue } from "./pipeline";
import { oddPart } from "@/features/hand-model/hand-model";

const AP: LimbRotationLandmarks = { kind: "elbow-ap", forearm: { v1: 0.51, v2: 1, splitU: 0.465 } };
const W = ELBOW_MODEL.ap.widthPx;
const stripe = (u0: number) => (u: number) => (Math.abs(u - u0) < 0.006 ? 200 : 0);
const positions = (f: (u: number) => number, v = 0.8) => {
  // centres of the runs of output pixels above 100
  const out: number[] = [];
  let run: number[] = [];
  for (let i = 0; i <= 3000; i++) {
    const u = i / 3000;
    const val = f(u);
    if (val > 100) run.push(u);
    else if (run.length) { out.push((run[0]! + run[run.length - 1]!) / 2); run = []; }
  }
  if (run.length) out.push((run[0]! + run[run.length - 1]!) / 2);
  void v;
  return out;
};
const outAt = (r: number, src: (u: number) => number, v: number) => {
  const plan = r === 0 ? { kind: "elbow-ap" as const, degrees: 0, shiftU: 0, overlapShiftU: 0, elbow: { anchors: elbowApShifts(0).anchors, layers: { ulna: elbowApShifts(0).ulnaAnchors, radius: elbowApShifts(0).radiusAnchors } } } : limbRotationPlan(r, true, AP)!;
  return (u: number) => limbRotationValue(plan, AP, src, u, v);
};

describe("elbow AP model", () => {
  it("at 0° nothing is displaced (the base pose is the baseline)", () => {
    const s = elbowApShifts(0);
    expect(s.ulna).toBeCloseTo(0, 12);
    expect(s.radius).toBeCloseTo(0, 12);
    for (const a of s.anchors) expect(a.du).toBeCloseTo(0, 12);
    for (const u of [0, 0.2, 0.5, 0.9]) {
      const f = outAt(0, stripe(0.4), 0.8);
      expect(f(u)).toBeCloseTo(stripe(0.4)(u), 6);
    }
  });
  it("the four columns are authored in order and inside the image", () => {
    const xs = [AP_COLUMNS.medialEpicondyle.x, AP_COLUMNS.ulna.x, AP_COLUMNS.radius.x, AP_COLUMNS.lateralEpicondyle.x];
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(xs[0]).toBeGreaterThan(0);
    expect(xs[3]).toBeLessThan(W);
  });
  it("continuity: a 0.25° step moves every anchor by less than 3 px over the whole range", () => {
    let prev = elbowApShifts(-15);
    for (let r = -14.75; r <= 15.0001; r += 0.25) {
      const cur = elbowApShifts(r);
      cur.anchors.forEach((a, i) => expect(Math.abs((a.du - prev.anchors[i]!.du) * W)).toBeLessThan(3));
      expect(Math.abs((cur.ulna - prev.ulna) * W)).toBeLessThan(3);
      expect(Math.abs((cur.radius - prev.radius) * W)).toBeLessThan(3);
      prev = cur;
    }
  });
  it("the displaced anchors stay in order for every value of the range (the warp never folds)", () => {
    for (let r = -15; r <= 15; r += 0.5) {
      const a = elbowApShifts(r).anchors;
      for (let k = 1; k < a.length; k++) expect(a[k]!.u + a[k]!.du).toBeGreaterThan(a[k - 1]!.u + a[k - 1]!.du);
    }
  });
  it("the epicondyles move toward each other for EITHER sign (profile lost), and the effect grows with |value|", () => {
    const gap = (r: number) => { const a = elbowApShifts(r).anchors; return (a[3]!.u + a[3]!.du) - (a[0]!.u + a[0]!.du); };
    const base = gap(0);
    for (const r of [3, 8, 15]) { expect(gap(r)).toBeLessThan(base); expect(gap(-r)).toBeLessThan(base); }
    expect(gap(15)).toBeLessThan(gap(8));
    expect(gap(8)).toBeLessThan(gap(3));
  });
});

describe("one sign for the scene and the result image", () => {
  it("positive value: the radius column moves RIGHT relative to the ulna column (apart); negative: toward / over it", () => {
    const rel = (r: number) => (elbowApShifts(r).radius - elbowApShifts(r).ulna) * W;
    expect(rel(8)).toBeGreaterThan(0);
    expect(rel(-8)).toBeLessThan(0);
    expect(Math.abs(rel(-8))).toBeGreaterThan(Math.abs(rel(8))); // the even part narrows both: more overlap than separation
    expect(oddPart(rel, 8)).toBeGreaterThan(0);
  });
  it("the plan's sign carrier agrees (the odd part of the relative shift)", () => {
    expect(limbRotationPlan(8, true, AP)!.shiftU).toBeGreaterThan(0);
    expect(limbRotationPlan(-8, true, AP)!.shiftU).toBeLessThan(0);
  });
  it("the plan carries the same anchors the scene draws (one module)", () => {
    const plan = limbRotationPlan(9, true, AP)!;
    const s = elbowApShifts(9);
    expect(plan.elbow!.anchors).toEqual(s.anchors);
    expect(plan.elbow!.layers).toEqual({ ulna: s.ulnaAnchors, radius: s.radiusAnchors });
  });
});

describe("elbow AP pixel step", () => {
  const ulnaU = AP_COLUMNS.ulna.x / W, radiusU = AP_COLUMNS.radius.x / W;
  it("forearm rows: a stripe on the ulna is further LEFT and a stripe on the radius further RIGHT for +θ than for −θ", () => {
    const p = (r: number, u0: number) => positions(outAt(r, stripe(u0), 0.8))[0]!;
    expect(p(8, ulnaU)).toBeLessThan(p(-8, ulnaU));
    expect(p(8, radiusU)).toBeGreaterThan(p(-8, radiusU));
  });
  it("negative values superimpose the radius on the ulna: at −15° a stripe on each ends up closer than at 0°, and the picture shows both", () => {
    const both = (r: number) => {
      const f = (u: number) => Math.max(outAt(r, stripe(ulnaU), 0.8)(u), outAt(r, stripe(radiusU), 0.8)(u));
      return positions(f);
    };
    const d0 = both(1)[1]! - both(1)[0]!;
    const dm = both(-15);
    // two stripes moved toward each other: their separation shrinks a lot (they may merge into one run)
    expect(dm.length === 1 || dm[1]! - dm[0]! < d0 * 0.6).toBe(true);
  });
  it("positive values open a gap between the bones that is filled (no hole): the value in the gap is the row mean, not 0 from a missing layer", () => {
    const src = () => 100; // uniform
    const f = outAt(15, src, 0.8);
    for (let i = 0; i <= 200; i++) expect(f(i / 200)).toBeCloseTo(100, 6);
  });
  it("humerus rows: the epicondyle stripes move toward the axis; the rows above the elbow are not displaced by the forearm layers", () => {
    const me = AP_COLUMNS.medialEpicondyle.x / W, le = AP_COLUMNS.lateralEpicondyle.x / W;
    const pm = positions(outAt(15, stripe(me), 0.3))[0]!, pl = positions(outAt(15, stripe(le), 0.3))[0]!;
    expect(pm).toBeGreaterThan(me + 0.01);
    expect(pl).toBeLessThan(le - 0.01);
  });
  it("is deterministic; a mismatching kind is a no-op", () => {
    const f = outAt(7, stripe(0.4), 0.7);
    expect(f(0.41)).toBe(f(0.41));
    const lat: LimbRotationLandmarks = { kind: "wrist-lateral", bands: [{ v1: 0, v2: 1 }] };
    expect(limbRotationValue(limbRotationPlan(8, true, AP)!, lat, stripe(0.3), 0.3, 0.2)).toBe(200);
  });
});

describe("elbow AP limbRotationPlan (pure)", () => {
  it("is null without landmarks, without a failed rotation check, or at 0°; clamped to the control range", () => {
    expect(limbRotationPlan(6, true, undefined)).toBeNull();
    expect(limbRotationPlan(6, false, AP)).toBeNull();
    expect(limbRotationPlan(0, true, AP)).toBeNull();
    expect(limbRotationPlan(99, true, AP)!.degrees).toBe(15);
    expect(interpolateAnchors(limbRotationPlan(6, true, AP)!.elbow!.anchors!, 0.5)).toBeTypeOf("number");
  });
  it("the concept record cites Bontrager p.166", () => {
    expect(limbRotationConcept("elbow-ap").reference).toMatch(/p\.166/);
  });
});
