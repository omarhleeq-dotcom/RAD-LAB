/**
 * Knee / foot rotation (S14.4): the lower-limb model (`features/lower-limb-model`), the plan input and the pixel steps on synthetic stripes.
 * Pins: the base pose is the baseline, continuity, ONE sign for the scene and the result image per model (written down in the model's header and in
 * DECISIONS S14.4), the warps never fold, the oblique's value is the deviation from 40°, the three generic kinds reuse the hand / elbow pixel
 * steps (stripes move as the model says), determinism.
 */
import { describe, expect, it } from "vitest";
import type { LimbRotationLandmarks } from "@/domain/radiograph";
import {
  FOOT_MODEL, FOOT_OBLIQUE_REFERENCE_DEG, KNEE_AP_MODEL, footAnchors, footValue, interpolateAnchors, kneeApShifts, kneeLateralCopies, lowerLimbDrawnRad,
} from "@/features/lower-limb-model/lower-limb-model";
import { LOWER_LIMB_RADIOGRAPHS } from "@/data/cases/lower-limb-radiographs";
import { deriveFootRays, footRayAnchors, limbRotationPlan } from "./limb-effects";
import footOutlines from "@/features/positioning/foot-outlines.json";
import { TUNING } from "./tuning";
import { CASES } from "@/data/cases";
import { limbRotationValue } from "./pipeline";

const lm = (k: keyof typeof LOWER_LIMB_RADIOGRAPHS): LimbRotationLandmarks => LOWER_LIMB_RADIOGRAPHS[k].limbRotation!;
const stripe = (u0: number) => (u: number) => (Math.abs(u - u0) < 0.006 ? 200 : 0);
const peak = (f: (u: number) => number) => {
  let best = 0, bu = 0;
  for (let i = 0; i <= 4000; i++) {
    const v = f(i / 4000);
    if (v > best) { best = v; bu = i / 4000; }
  }
  return bu;
};

describe("foot model (AP and medial oblique)", () => {
  it.each(["ap", "oblique"] as const)("%s: at value 0 nothing is displaced", (kind) => {
    const a = footAnchors(kind, kind === "oblique" ? footValue("oblique", FOOT_OBLIQUE_REFERENCE_DEG) : 0);
    for (const l of [a.toes, a.metatarsal]) for (const x of l) expect(x.du).toBeCloseTo(0, 12);
  });
  it("the oblique value is the deviation from 40° (the console value is the absolute angle)", () => {
    expect(footValue("oblique", 40)).toBe(0);
    expect(footValue("oblique", 25)).toBe(-15);
    expect(footValue("ap", 7)).toBe(7);
  });
  it.each(["ap", "oblique"] as const)("%s: the columns are authored in order and inside the image", (kind) => {
    const m = FOOT_MODEL[kind];
    for (const cols of [m.metatarsal, m.toes]) {
      const xs = cols.map((c) => c.x);
      expect(xs).toEqual([...xs].sort((a, b) => a - b));
      expect(xs[0]).toBeGreaterThan(0);
      expect(xs[xs.length - 1]!).toBeLessThan(m.widthPx);
    }
  });
  it.each(["ap", "oblique"] as const)("%s: continuity (a 0.25° step moves an anchor by less than 4 px) and no folding", (kind) => {
    const W = FOOT_MODEL[kind].widthPx;
    let prev = footAnchors(kind, -15);
    for (let r = -14.75; r <= 15.0001; r += 0.25) {
      const cur = footAnchors(kind, r);
      cur.metatarsal.forEach((a, i) => expect(Math.abs((a.du - prev.metatarsal[i]!.du) * W)).toBeLessThan(4));
      for (let i = 1; i < cur.metatarsal.length; i++) expect(cur.metatarsal[i]!.u + cur.metatarsal[i]!.du).toBeGreaterThan(cur.metatarsal[i - 1]!.u + cur.metatarsal[i - 1]!.du);
      prev = cur;
    }
  });
  it("AP: rotating makes the spacing of metatarsals 2–5 unequal for either sign (the cue Bontrager names)", () => {
    const gaps = (r: number) => {
      const a = footAnchors("ap", r).metatarsal.map((x) => x.u + x.du);
      return [a[2]! - a[1]!, a[3]! - a[2]!, a[4]! - a[3]!];
    };
    const spread = (g: number[]) => Math.max(...g) - Math.min(...g);
    expect(spread(gaps(0))).toBeLessThan(spread(gaps(12)));
    expect(spread(gaps(0))).toBeLessThan(spread(gaps(-12)));
  });
  it("oblique: below 40° metatarsals 3–5 come closer together, above they spread (the cue the exam text names)", () => {
    const span = (r: number) => {
      const a = footAnchors("oblique", r).metatarsal.map((x) => x.u + x.du);
      return a[4]! - a[2]!;
    };
    expect(span(-12)).toBeLessThan(span(0));
    expect(span(12)).toBeGreaterThan(span(0));
  });
  it("sign: positive value moves a high-depth column toward the viewer's right relative to a low-depth one (the model's odd part)", () => {
    const p = limbRotationPlan(10, true, lm("foot-ap"))!;
    const n = limbRotationPlan(-10, true, lm("foot-ap"))!;
    expect(Math.sign(p.shiftU)).toBe(-Math.sign(n.shiftU));
    expect(p.shiftU).not.toBe(0);
  });
  it("the pixel step moves a metatarsal-band stripe by the interpolated anchor shift (limb-warp reuses the hand band warp)", () => {
    const L = lm("foot-ap");
    const plan = limbRotationPlan(12, true, L)!;
    const v = 0.4; // inside the metatarsal band
    const u0 = 596 / FOOT_MODEL.ap.widthPx;
    const out = peak((u) => limbRotationValue(plan, L, stripe(u0), u, v));
    const expected = u0 + interpolateAnchors(plan.hand!.anchors![1]!, u0);
    expect(Math.abs(out - expected)).toBeLessThan(0.01);
    expect(Math.abs(out - u0)).toBeGreaterThan(0.005);
  });
  it("the model is deterministic", () => {
    expect(JSON.stringify(footAnchors("ap", 7.3))).toBe(JSON.stringify(footAnchors("ap", 7.3)));
  });
});

describe("foot rays in the result image (owner decision 2026-11-04: rigid rays, static tarsals)", () => {
  const views = { "foot-ap": footOutlines.views.ap, "foot-oblique": footOutlines.views.oblique } as const;
  const models = ["foot-ap", "foot-oblique"] as const;
  it.each(models)("%s: every ray is derived from the outlines; its base edge is the metatarsal's most proximal vertex", (model) => {
    const view = views[model];
    const rays = deriveFootRays(view);
    expect(rays).toHaveLength(5);
    rays.forEach((r, i) => {
      const mt = view.structures.find((s) => s.id === `mt${i + 1}`)!;
      expect(r.baseY).toBe(Math.max(...mt.points.map((p) => p[1]!)));
      // the line passes through the metatarsal: its column at the bone's mid row lies inside the bone's horizontal extent
      const ys = mt.points.map((p) => p[1]!), xs = mt.points.map((p) => p[0]!);
      const x = r.a + r.b * (Math.min(...ys) + Math.max(...ys)) / 2;
      expect(x).toBeGreaterThan(Math.min(...xs));
      expect(x).toBeLessThan(Math.max(...xs));
    });
    // deterministic, no stored numbers: a second derivation is identical
    expect(JSON.stringify(deriveFootRays(view))).toBe(JSON.stringify(rays));
  });
  it("STOP condition: a ray without a metatarsal or phalanx outline cannot be derived", () => {
    const view = footOutlines.views.ap;
    expect(() => deriveFootRays({ ...view, structures: view.structures.filter((s) => s.id !== "mt3") })).toThrow("foot ray 3");
    expect(() => deriveFootRays({ ...view, structures: view.structures.filter((s) => !s.id.startsWith("t5-")) })).toThrow("foot ray 5");
  });
  it.each(models)("%s: at every console station each ray is rigid down to its base edge and the rows past base + soft edge are still; the fold guard alone may hold back the 5th ray's base", (model) => {
    const view = views[model], rays = deriveFootRays(view), soft = TUNING.limbRotation.bandSoft;
    const c = CASES.find((x) => x.id === model)!, ctl = c.controls.rotationDeg;
    const held: string[] = [];
    for (let value = ctl.min; value <= ctl.max; value += ctl.step) {
      const plan = limbRotationPlan(value, true, lm(model));
      if (!plan) continue;
      const shifts = plan.hand!.anchors![1]!.map((a) => a.du);
      let worst = 0;
      for (let y = 0; y < view.heightPx; y += 2) {
        const a = footRayAnchors(model, shifts, y / view.heightPx);
        a.forEach((x, i) => {
          const r = rays[i]!;
          expect(x.u).toBeCloseTo((r.a + r.b * y) / view.widthPx, 12); // the ray lines
          if (y >= r.baseY + soft * view.heightPx) expect(Math.abs(x.du)).toBe(0); // the tarsal rows of that ray do not move
          if (y <= r.baseY && x.du !== shifts[i]) {
            // ONE shift for the whole ray (toes, metatarsal) unless the fold guard engages: only ray 5, only in its last 180 rows
            expect(i).toBe(4);
            expect(r.baseY - y).toBeLessThan(180);
            worst = Math.max(worst, Math.abs(x.du - shifts[i]!) * view.widthPx);
          }
        });
        for (let i = 1; i < a.length; i++) expect(a[i]!.u + a[i]!.du).toBeGreaterThan(a[i - 1]!.u + a[i - 1]!.du);
      }
      if (worst > 0) held.push(`${value}:${Math.ceil(worst)}`);
    }
    // Declared limit (report §5): where the 5th metatarsal's base would pass over the static 4th ray line, a single-valued warp cannot
    // draw the superimposition; the guard holds it back (before: 149 px of shear at the oblique's 25°).
    expect(held.join(" ")).toBe(model === "foot-ap" ? "15:5" : Array.from({ length: 26 }, (_, v) => `${v}:30`).join(" ") + " 26:18 27:6");
  }, 30_000);
  it.each(models)("%s: the pixel step moves a stripe on a ray's line by that ray's shift at its head and at its base", (model) => {
    const view = views[model], rays = deriveFootRays(view), L = lm(model);
    const plan = limbRotationPlan(model === "foot-oblique" ? 30 : -15, true, L)!; // stations where the fold guard does not engage
    const shifts = plan.hand!.anchors![1]!;
    const r = rays[4]!, mt = view.structures.find((s) => s.id === "mt5")!;
    for (const y of [Math.min(...mt.points.map((p) => p[1]!)), r.baseY]) {
      const v = y / view.heightPx, u0 = (r.a + r.b * y) / view.widthPx;
      // the centre of the drawn stripe (the stripe is narrow, so its centre is the image of u0 even where the warp stretches)
      const lit = Array.from({ length: 8001 }, (_, i) => i / 8000).filter((u) => limbRotationValue(plan, L, (x) => (Math.abs(x - u0) < 0.002 ? 200 : 0), u, v) > 0);
      const out = (lit[0]! + lit.at(-1)!) / 2;
      expect(Math.abs(out - (u0 + shifts[4]!.du))).toBeLessThan(0.001);
    }
  });
});

describe("knee AP model", () => {
  const W = KNEE_AP_MODEL.widthPx;
  it("at 0° nothing is displaced (the base pose is the baseline)", () => {
    const s = kneeApShifts(0);
    expect(s.fibula).toBeCloseTo(0, 12);
    expect(s.tibia).toBeCloseTo(0, 12);
    for (const a of s.anchors) expect(a.du).toBeCloseTo(0, 12);
  });
  it("the four columns are authored in order and inside the image", () => {
    const xs = KNEE_AP_MODEL.columns.map((c) => c.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(xs[0]).toBeGreaterThan(0);
    expect(xs[xs.length - 1]!).toBeLessThan(W);
  });
  it("continuity and no folding over the whole range", () => {
    let prev = kneeApShifts(-15);
    for (let r = -14.75; r <= 15.0001; r += 0.25) {
      const cur = kneeApShifts(r);
      cur.anchors.forEach((a, i) => expect(Math.abs((a.du - prev.anchors[i]!.du) * W)).toBeLessThan(4));
      for (let i = 1; i < cur.anchors.length; i++) expect(cur.anchors[i]!.u + cur.anchors[i]!.du).toBeGreaterThan(cur.anchors[i - 1]!.u + cur.anchors[i - 1]!.du);
      prev = cur;
    }
  });
  it("the fibular head moves relative to the tibia (more or less covered) for either sign, and ONE sign for scene and picture (the odd part of tibia − fibula)", () => {
    const rel = (r: number) => kneeApShifts(r).tibia - kneeApShifts(r).fibula;
    expect(rel(0)).toBeCloseTo(0, 12);
    expect(Math.abs(rel(10))).toBeGreaterThan(0);
    expect(Math.abs(rel(-10))).toBeGreaterThan(0);
    const p = limbRotationPlan(10, true, lm("knee-ap"))!;
    const n = limbRotationPlan(-10, true, lm("knee-ap"))!;
    expect(Math.sign(p.shiftU)).toBe(-Math.sign(n.shiftU));
  });
  it("the pixel step moves a tibia-layer stripe (below the joint) by the tibia layer's shift", () => {
    const L = lm("knee-ap");
    const plan = limbRotationPlan(12, true, L)!;
    const u0 = 600 / W; // the tibia layer (right of the contact line), below the joint
    const out = peak((u) => limbRotationValue(plan, L, stripe(u0), u, 0.85));
    expect(Math.abs(out - (u0 + interpolateAnchors(plan.elbow!.layers!.radius, u0)))).toBeLessThan(0.012);
  });
});

describe("knee lateral model", () => {
  it("at 0° both copies coincide (one outline) and the weights are 40 % / 60 %", () => {
    const c = kneeLateralCopies(0);
    for (const x of [...c.condyles, ...c.head]) expect(x.du).toBeCloseTo(0, 12);
    expect(c.condyles.map((x) => x.w)).toEqual([0.4, 0.6]);
  });
  it("the two copies move apart symmetrically; the far-side copy moves to the viewer's right for a positive value (sign pinned)", () => {
    const c = kneeLateralCopies(10);
    expect(c.condyles[0]!.du).toBeGreaterThan(0);
    expect(c.condyles[1]!.du).toBeCloseTo(-c.condyles[0]!.du, 12);
    expect(kneeLateralCopies(-10).condyles[0]!.du).toBeLessThan(0);
    expect(limbRotationPlan(10, true, lm("knee-lateral"))!.shiftU).toBeGreaterThan(0);
    expect(limbRotationPlan(-10, true, lm("knee-lateral"))!.shiftU).toBeLessThan(0);
  });
  it("the drawn angle is the value times the gain, clamped to ±15", () => {
    expect(lowerLimbDrawnRad(40)).toBeCloseTo(lowerLimbDrawnRad(15), 12);
    expect(lowerLimbDrawnRad(0)).toBe(0);
  });
  it("the pixel step doubles a condyle-band stripe into two copies at ± the model shift", () => {
    const L = lm("knee-lateral");
    const plan = limbRotationPlan(12, true, L)!;
    const u0 = 560 / 1133;
    const f = (u: number) => limbRotationValue(plan, L, stripe(u0), u, 0.36);
    const c = kneeLateralCopies(12).condyles;
    const samples = [u0 + c[0]!.du, u0 + c[1]!.du].map((u) => f(u));
    for (const s of samples) expect(s).toBeGreaterThan(20);
    expect(f(u0)).toBeLessThan(Math.min(...samples));
  });
});
