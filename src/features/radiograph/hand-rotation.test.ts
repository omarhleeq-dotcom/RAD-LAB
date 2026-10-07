/**
 * Hand rotation (S14.2b-FIX): the 2.5D hand model (`features/hand-model`), the plan input and the pixel step on synthetic stripes.
 * Pins: continuity (small step → small change, no jumps), the base-pose silhouettes, ONE sign for the scene and the result image
 * (positive = the ulnar-side structures toward the viewer's right), determinism, and that the wrist kinds are untouched.
 */
import { describe, expect, it } from "vitest";
import type { LimbRotationLandmarks } from "@/domain/radiograph";
import { HAND_MODEL, handLateralShifts, handPaAnchors, handTubes, oddPart, projectHand } from "@/features/hand-model/hand-model";
import { limbRotationConcept, limbRotationPlan } from "./limb-effects";
import { limbRotationValue } from "./pipeline";

const PA: LimbRotationLandmarks = {
  kind: "hand-pa",
  bands: [{ v1: 0.01, v2: 0.42 }, { v1: 0.44, v2: 0.71, u1: -0.1, u2: 0.58 }, { v1: 0.43, v2: 0.78, u1: 0.5, u2: 1.1 }],
};
const LAT: LimbRotationLandmarks = { kind: "hand-lateral", bands: [{ v1: 0, v2: 0.7, u1: 0.42, u2: 0.88 }, { v1: 0.86, v2: 1 }] };

const stripe = (u0: number) => (u: number) => (Math.abs(u - u0) < 0.006 ? 200 : 0);
const argmaxU = (f: (u: number) => number) => {
  let best = 0;
  const us: number[] = [];
  for (let i = 0; i <= 1500; i++) {
    const u = i / 1500;
    const v = f(u);
    if (v > best + 1e-9) { best = v; us.length = 0; }
    if (Math.abs(v - best) <= 1e-9) us.push(u);
  }
  return { u: (us[0]! + us[us.length - 1]!) / 2, value: best };
};
const byId = (kind: "pa" | "lateral", r: number) => new Map(projectHand(kind, r).map((p) => [p.tube.id, p]));

describe("hand model: base-pose silhouettes", () => {
  it("PA at 0°: the projection is the authored PA coordinates (axis + X)", () => {
    for (const t of handTubes("pa")) {
      const p = byId("pa", 0).get(t.id)!;
      expect(p.x1).toBeCloseTo(HAND_MODEL.axis.pa + t.a.X, 6);
      expect(p.w1).toBeCloseTo(t.wa[0], 6);
    }
  });
  it("lateral at 0°: the projection is the authored lateral coordinates (axis + Z), the digits are superimposed and the thumb is separated", () => {
    for (const t of handTubes("lateral")) expect(byId("lateral", 0).get(t.id)!.x1).toBeCloseTo(HAND_MODEL.axis.lateral + t.a.Z, 6);
    const m = byId("lateral", 0);
    const xs = [5, 4, 3, 2].map((n) => m.get(`m${n}`)!.x2);
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(80); // one column
    expect(m.get("m3")!.x2 - m.get("t-mc")!.x2).toBeGreaterThan(200); // the thumb stands apart (on the viewer's left)
  });
  it("PA: five digits slightly spread, thumb on the viewer's right", () => {
    const m = byId("pa", 0);
    const mcp = [5, 4, 3, 2].map((n) => m.get(`p${n}-0`)!.x1);
    expect(mcp).toEqual([...mcp].sort((a, b) => a - b));
    expect(m.get("t-dp")!.x2).toBeGreaterThan(m.get("p2-0")!.x1);
  });
});

describe("hand model: continuity (no jumps)", () => {
  for (const kind of ["pa", "lateral"] as const) {
    it(`${kind}: a 0.25° step moves every part by less than 12 px (0.14 cm) and changes no width by more than that, over the whole range`, () => {
      let prev = byId(kind, -15);
      for (let r = -14.75; r <= 15.0001; r += 0.25) {
        const cur = byId(kind, r);
        cur.forEach((c, id) => {
          const p = prev.get(id)!;
          for (const [a, b] of [[c.x1, p.x1], [c.x2, p.x2], [c.w1, p.w1], [c.w2, p.w2]] as const) expect(Math.abs(a - b)).toBeLessThan(12);
        });
        prev = cur;
      }
    });
    it(`${kind}: the drawing at ±15° differs clearly from 0° (it reads as a turn, not a near-static drawing)`, () => {
      const base = byId(kind, 0), plus = byId(kind, 15), minus = byId(kind, -15);
      const spread = (m: Map<string, ReturnType<typeof projectHand>[number]>) => Math.max(...[...m.values()].map((p) => Math.abs(p.x1 - base.get(p.tube.id)!.x1)));
      expect(spread(plus)).toBeGreaterThan(60);
      expect(spread(minus)).toBeGreaterThan(60);
    });
  }
  it("lateral: the digits are one column at 0° and fan out continuously (spread grows with |value|)", () => {
    let last = -1;
    for (const r of [0, 3, 6, 9, 12, 15]) {
      const m = byId("lateral", r);
      const xs = [5, 4, 3, 2].map((n) => m.get(`p${n}-0`)!.x1);
      const spread = Math.max(...xs) - Math.min(...xs);
      expect(spread).toBeGreaterThan(last);
      last = spread;
    }
  });
});

describe("one sign for the scene and the result image", () => {
  it("PA: positive value moves the THUMB toward the viewer's LEFT, in the drawing AND in the result-image anchors; negative: right", () => {
    // rotating narrows the hand for either sign (the even part); the SIGN is the odd part, the depth term Z·sinθ (the thumb is palmar, Z < 0)
    const x = (r: number) => byId("pa", r).get("t-mc")!.x1;
    expect(oddPart(x, 8)).toBeLessThan(0);
    expect(x(8)).toBeLessThan(x(-8));
    const thumb = (r: number) => handPaAnchors(r).thumb[0]!.du;
    expect(oddPart(thumb, 8)).toBeLessThan(0);
    expect(thumb(8)).toBeLessThan(thumb(-8));
  });
  it("lateral: positive value moves the ulnar-side digit (5) toward the viewer's RIGHT and the radial side (digit 2) LEFT, in the drawing AND in the anchors; negative: the mirror", () => {
    const d5 = (r: number) => byId("lateral", r).get("p5-1")!.x1, d2 = (r: number) => byId("lateral", r).get("p2-1")!.x1;
    expect(d5(8)).toBeGreaterThan(d5(0));
    expect(d5(-8)).toBeLessThan(d5(0));
    expect(d2(8)).toBeLessThan(d2(0));
    expect(d2(-8)).toBeGreaterThan(d2(0));
    expect(handLateralShifts(8).column[0]).toBeGreaterThan(0); // digit 5
    expect(handLateralShifts(-8).column[0]).toBeLessThan(0);
    expect(handLateralShifts(8).column[3]).toBeLessThan(0); // digit 2 (radial side) goes the other way: the fan
  });
  it("the plan's sign carrier agrees: PA = minus the thumb's shift, lateral = digit 5's shift", () => {
    expect(limbRotationPlan(8, true, PA)!.shiftU).toBeGreaterThan(0);
    expect(limbRotationPlan(-8, true, PA)!.shiftU).toBeLessThan(0);
    expect(limbRotationPlan(8, true, LAT)!.shiftU).toBeGreaterThan(0);
    expect(limbRotationPlan(-8, true, LAT)!.shiftU).toBeLessThan(0);
  });
  it("the plan's anchors equal the drawn displacement of the same parts (same module)", () => {
    const r = 9;
    const plan = limbRotationPlan(r, true, PA)!;
    const drawn = byId("pa", r), base = byId("pa", 0);
    const du = (drawn.get("p5-1")!.x1 + drawn.get("p5-1")!.x2 - base.get("p5-1")!.x1 - base.get("p5-1")!.x2) / 2 / HAND_MODEL.imageWidthPx.pa;
    expect(plan.hand!.anchors![0]!.some((a) => Math.abs(a.du - du) < 1e-9)).toBe(true);
  });
});

describe("PA warp never folds the image", () => {
  it("the displaced anchors stay in order for every value of the range (both bands)", () => {
    for (let r = -15; r <= 15; r += 0.5) {
      const a = handPaAnchors(r);
      for (const band of [a.phalanx, a.metacarpal, a.thumb]) for (let k = 1; k < band.length; k++) expect(band[k]!.u + band[k]!.du).toBeGreaterThan(band[k - 1]!.u + band[k - 1]!.du);
    }
  });
});

describe("hand limbRotationPlan (pure)", () => {
  it("is null without landmarks, without a failed rotation check, or at 0°; clamped to the control range", () => {
    expect(limbRotationPlan(6, true, undefined)).toBeNull();
    expect(limbRotationPlan(6, false, PA)).toBeNull();
    expect(limbRotationPlan(0, true, LAT)).toBeNull();
    expect(limbRotationPlan(99, true, PA)!.degrees).toBe(15);
  });
  it("PA: anchors for the three bands; lateral: shifts for the two bands; no overlap term", () => {
    const a = limbRotationPlan(6, true, PA)!, b = limbRotationPlan(6, true, LAT)!;
    expect(a.hand!.anchors).toHaveLength(3);
    expect(b.hand!.shifts).toHaveLength(2);
    expect(a.overlapShiftU).toBe(0);
    expect(b.hand!.shifts![0]).toHaveLength(4);
  });
  it("the concept record cites the hand pages", () => {
    expect(limbRotationConcept("hand-pa").reference).toMatch(/p\.150/);
    expect(limbRotationConcept("hand-lateral").reference).toMatch(/p\.153/);
  });
});

describe("hand limbRotationValue (pixel step)", () => {
  const at = (r: number, lm: LimbRotationLandmarks, src: (u: number) => number, v: number) =>
    argmaxU((u) => limbRotationValue(limbRotationPlan(r, true, lm)!, lm, (uu) => src(uu), u, v));

  it("PA: a stripe at the thumb metacarpal is further LEFT for +θ than for −θ, continuously; the carpals do not move", () => {
    const u0 = 930 / HAND_MODEL.imageWidthPx.pa;
    expect(at(8, PA, stripe(u0), 0.62).u).toBeLessThan(at(-8, PA, stripe(u0), 0.62).u); // + is to the left of −
    expect(at(8, PA, stripe(u0), 0.62).u).toBeLessThan(u0 - 0.002);
    for (const [v, c] of [[0.2, 0.3], [0.55, 0.25], [0.62, u0]] as const) {
      let prev = at(1, PA, stripe(c), v).u; // (stripe width 0.012 ≈ 9 argmax steps: resolution 0.0007)
      for (let r = 2; r <= 15; r += 1) {
        const cur = at(r, PA, stripe(c), v).u;
        expect(Math.abs(cur - prev)).toBeLessThan(0.03); // no jump per 1° step
        prev = cur;
      }
    }
    expect(at(8, PA, stripe(u0), 0.9).u).toBeCloseTo(u0, 2);
  });
  it("PA: the displacement is not a rigid shift (spaces between the digits change)", () => {
    const pos = (u0: number) => at(10, PA, stripe(u0), 0.55).u;
    const a = pos(0.2) - pos(0.1), b = pos(0.55) - pos(0.45);
    expect(Math.abs(a - b)).toBeGreaterThan(0.003);
  });
  it("lateral: at a tiny value the picture is almost the baseline (one copy); copies separate gradually; both signs fan the same way (mirror), no side-to-side jump", () => {
    const col = (HAND_MODEL.axis.lateral - 5) / HAND_MODEL.imageWidthPx.lateral;
    const src = stripe(col);
    const diff = (r: number) => { let s = 0; for (let i = 0; i <= 700; i++) { const u = i / 700; s += Math.abs(limbRotationValue(limbRotationPlan(r, true, LAT)!, LAT, src, u, 0.3) - src(u)); } return s; };
    expect(diff(0.25)).toBeLessThan(diff(3));
    expect(diff(3)).toBeLessThan(diff(9));
    let prev = diff(0.25);
    for (let r = 0.75; r <= 15; r += 0.5) { const cur = diff(r); expect(Math.abs(cur - prev)).toBeLessThan(900); prev = cur; }
    // +θ and −θ draw the SAME kind of change (the fan), not a one-sided copy that jumps across
    expect(Math.abs(diff(8) - diff(-8)) / diff(8)).toBeLessThan(0.35);
  });
  it("lateral: outside the bands (the carpals) nothing changes; is deterministic; no-op for a mismatching kind", () => {
    const rot = limbRotationPlan(9, true, LAT)!;
    expect(limbRotationValue(rot, LAT, stripe(0.5), 0.5, 0.78)).toBe(200);
    expect(limbRotationValue(rot, LAT, stripe(0.5), 0.45, 0.3)).toBe(limbRotationValue(rot, LAT, stripe(0.5), 0.45, 0.3));
    expect(limbRotationValue(limbRotationPlan(9, true, PA)!, LAT, stripe(0.3), 0.3, 0.2)).toBe(200);
  });
});
