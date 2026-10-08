/**
 * Ankle rotation (S14.5): the ankle models of `features/lower-limb-model`, the plan input and the pixel steps on synthetic stripes. Pins: the base pose is the
 * baseline, continuity and no folding, ONE sign for the scene and the result image per model (written down in the model's header and in DECISIONS S14.5),
 * the generic kinds reuse the hand / elbow pixel steps, the knee / foot plans are not affected, determinism.
 */
import { describe, expect, it } from "vitest";
import type { LimbRotationLandmarks } from "@/domain/radiograph";
import {
  ANKLE_AP_MODEL, ANKLE_LATERAL_HALF_PX, ANKLE_LATERAL_WIDTH_PX, ankleApAnchors, ankleLateralCopies, interpolateAnchors, kneeLateralCopies,
} from "@/features/lower-limb-model/lower-limb-model";
import { LOWER_LIMB_RADIOGRAPHS } from "@/data/cases/lower-limb-radiographs";
import { limbRotationConcept, limbRotationPlan } from "./limb-effects";
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

describe("ankle AP model (limb-warp, one band)", () => {
  const W = ANKLE_AP_MODEL.widthPx;
  it("at 0° nothing is displaced (the base pose is the baseline)", () => {
    for (const a of ankleApAnchors(0)) expect(a.du).toBeCloseTo(0, 12);
    expect(limbRotationPlan(0, true, lm("ankle-ap"))).toBeNull();
  });
  it("the four columns are authored in order and inside the image", () => {
    const xs = ANKLE_AP_MODEL.columns.map((c) => c.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(xs[0]).toBeGreaterThan(0);
    expect(xs[xs.length - 1]!).toBeLessThan(W);
  });
  it("continuity and no folding over the whole range", () => {
    let prev = ankleApAnchors(-15);
    for (let r = -14.75; r <= 15.0001; r += 0.25) {
      const cur = ankleApAnchors(r);
      cur.forEach((a, i) => expect(Math.abs((a.du - prev[i]!.du) * W)).toBeLessThan(4));
      for (let i = 1; i < cur.length; i++) expect(cur[i]!.u + cur[i]!.du).toBeGreaterThan(cur[i - 1]!.u + cur[i - 1]!.du);
      prev = cur;
    }
  });
  it("sign (pinned): a positive value moves the medial malleolus column to the viewer's right and the lateral one to the left; the plan's sign flips with the value", () => {
    const a = ankleApAnchors(10);
    expect(a[0]!.du).toBeGreaterThan(0);
    expect(a[a.length - 1]!.du).toBeLessThan(0);
    const p = limbRotationPlan(10, true, lm("ankle-ap"))!;
    const n = limbRotationPlan(-10, true, lm("ankle-ap"))!;
    expect(p.kind).toBe("limb-warp");
    expect(Math.sign(p.shiftU)).toBe(-Math.sign(n.shiftU));
    expect(p.shiftU).not.toBe(0);
  });
  it("the pixel step moves a stripe on the lateral malleolus by the interpolated anchor shift (limb-warp reuses the hand band warp)", () => {
    const L = lm("ankle-ap");
    const plan = limbRotationPlan(12, true, L)!;
    const u0 = 640 / W;
    const out = peak((u) => limbRotationValue(plan, L, stripe(u0), u, 0.7));
    const expected = u0 + interpolateAnchors(plan.hand!.anchors![0]!, u0);
    expect(Math.abs(out - expected)).toBeLessThan(0.012);
    expect(Math.abs(out - u0)).toBeGreaterThan(0.005);
  });
  it("the knee and foot AP plans are unchanged by the ankle branch", () => {
    expect(limbRotationPlan(10, true, lm("foot-ap"))!.hand!.anchors).toHaveLength(2);
    expect(limbRotationPlan(10, true, lm("knee-ap"))!.kind).toBe("limb-layers");
  });
  it("the model is deterministic", () => {
    expect(JSON.stringify(ankleApAnchors(7.3))).toBe(JSON.stringify(ankleApAnchors(7.3)));
  });
});

describe("ankle lateral model (limb-copies, two bands)", () => {
  it("at 0° both copies coincide (one outline) and the weights are 40 % / 60 %", () => {
    const c = ankleLateralCopies(0);
    for (const x of [...c.malleolus, ...c.joint]) expect(x.du).toBeCloseTo(0, 12);
    expect(c.malleolus.map((x) => x.w)).toEqual([0.4, 0.6]);
  });
  it("the two copies move apart symmetrically; the far-side copy moves to the viewer's right for a positive value (sign pinned)", () => {
    const c = ankleLateralCopies(10);
    expect(c.malleolus[0]!.du).toBeGreaterThan(0);
    expect(c.malleolus[1]!.du).toBeCloseTo(-c.malleolus[0]!.du, 12);
    expect(c.malleolus[0]!.du).toBeGreaterThan(c.joint[0]!.du); // the fibula window moves further than the joint window
    expect(ankleLateralCopies(-10).malleolus[0]!.du).toBeLessThan(0);
    expect(limbRotationPlan(10, true, lm("ankle-lateral"))!.shiftU).toBeGreaterThan(0);
    expect(limbRotationPlan(-10, true, lm("ankle-lateral"))!.shiftU).toBeLessThan(0);
  });
  it("the half-distances give the shift in image px: half · sin(drawn angle) / width", () => {
    const th = (10 * 2.3 * Math.PI) / 180;
    expect(ankleLateralCopies(10).malleolus[0]!.du).toBeCloseTo((ANKLE_LATERAL_HALF_PX.malleolus * Math.sin(th)) / ANKLE_LATERAL_WIDTH_PX, 12);
  });
  it("the pixel step doubles a fibula-window stripe into two copies at ± the model shift", () => {
    const L = lm("ankle-lateral");
    const plan = limbRotationPlan(12, true, L)!;
    const u0 = 470 / 932;
    const f = (u: number) => limbRotationValue(plan, L, stripe(u0), u, 0.46);
    const c = ankleLateralCopies(12).malleolus;
    const samples = [u0 + c[0]!.du, u0 + c[1]!.du].map((u) => f(u));
    for (const s of samples) expect(s).toBeGreaterThan(20);
    expect(f(u0)).toBeLessThan(Math.min(...samples));
  });
  it("the knee lateral plan is unchanged by the ankle branch", () => {
    expect(limbRotationPlan(10, true, lm("knee-lateral"))!.elbow!.copies![0]).toEqual(kneeLateralCopies(10).condyles);
  });
});

describe("effect cards cite the ankle pages", () => {
  it("each concept record names its Bontrager page and is provisional wording", () => {
    expect(limbRotationConcept("limb-warp", "ankle-ap").reference).toMatch(/p\.239/);
    expect(limbRotationConcept("limb-copies", "ankle-lateral").reference).toMatch(/p\.242/);
    expect(limbRotationConcept("limb-warp", "foot-ap").reference).toMatch(/p\.232/);
  });
});
