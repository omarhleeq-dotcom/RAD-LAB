/**
 * S2 (owner 2026-10-22, RAD-068 part 3 batch 4): coverage and margins. Opt-in per exam through two optional rule fields:
 *  - clipping `landmarkBoxOnly`: a cut that takes only the anatomy-free strip beside the required region passes;
 *  - excess `beyondNeeded`: only the opening beyond the smallest field centred on the ray that covers the anatomy and the
 *    placed marker counts, so an opening forced by the ray position or needed for the marker is not excess.
 * Enabled for Chest PA first; the other chest exams still reuse the old behaviour until the owner enables them.
 */
import { describe, expect, it } from "vitest";
import { CASES } from "@/data/cases";
import { chestApSupine } from "@/data/cases/chest-ap-supine";
import { chestLateralErect } from "@/data/cases/chest-lateral-erect";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { fitAnatomyBox, markerRect, minimalFieldAround, regionToRect, unionRect } from "@/features/simulation/geometry";
import { evaluate } from "./engine";

const D = chestPaErect.detector;
const ok: SimulationSettings = { ...chestPaErect.initialSettings, projection: "pa-erect", rotationDeg: 0, centralRay: { x: 0, y: -0.14 }, collimation: { width: 0.94, height: 0.84 }, chinPosition: "elevated", shoulderPosition: "rolled-forward", sideMarker: "L", markerPosition: { x: 0.84, y: -0.44 }, sidCm: 180, kvp: 120, mas: 3.2, exposureMode: "manual", aecChambers: [], breathing: "deep-inspiration-hold", motionInstruction: "remain-still" };
const field = (y1: number, y2: number) => ({ centralRay: { x: 0, y: ((y1 + y2) / 2 / D.heightCm) * 2 - 1 }, collimation: { width: 0.94, height: (y2 - y1) / D.heightCm } });
const run = (c: RadCase, patch: Partial<SimulationSettings> = {}, base: SimulationSettings = ok) => evaluate(c, { ...base, ...patch });
const check = (r: ReturnType<typeof run>, id: string) => r.checks.find((k) => k.ruleId === id)!;
const { landmarkCm } = fitAnatomyBox(chestPaErect.radiograph, chestPaErect.requiredAnatomy);
const region = chestPaErect.requiredAnatomy;

describe("S2 clipping: an anatomy-free strip is not lost anatomy (Chest PA)", () => {
  it("the strips beside the landmark box exist and are the same 27 × 31 region as before", () => {
    expect(region).toMatchObject({ widthCm: 27, heightCm: 31 });
    expect(landmarkCm.y1 - region.yCm).toBeGreaterThan(1.2);
  });
  it("cutting only the top or bottom strip passes with the margin remark and the full score", () => {
    for (const patch of [field(region.yCm + 0.6, 35), field(2, region.yCm + region.heightCm - 0.6)]) {
      const r = run(chestPaErect, patch);
      const c = check(r, "collimation-clipping");
      expect([c.outcome, c.credit]).toEqual(["pass", 1]);
      expect(c.feedback.en).toMatch(/only the spare margin/);
      expect(r.variants).toEqual(["correct"]);
      expect(r.score.total).toBe(100);
    }
  });
  it("reaching the drawn lungs still fails, and the text names only the sides that cut anatomy", () => {
    const r = run(chestPaErect, { centralRay: { x: 0, y: -0.14 }, collimation: { width: 0.94, height: (landmarkCm.y2 - landmarkCm.y1 - 2) / D.heightCm } });
    const c = check(r, "collimation-clipping");
    expect(c.outcome).toBe("fail");
    expect(r.variants).toContain("clipped");
    const mixed = run(chestPaErect, { ...field(region.yCm + 0.6, 30), });
    expect(check(mixed, "collimation-clipping").feedback.en).toMatch(/costophrenic/);
    expect(check(mixed, "collimation-clipping").feedback.en).not.toMatch(/apices/);
  });
  it("is opt-in: Chest Lateral and AP keep failing any cut into their required region", () => {
    const lat: SimulationSettings = { ...chestLateralErect.initialSettings, ...field(region.yCm + 0.6, 40) };
    expect(check(evaluate(chestLateralErect, lat), "collimation-clipping").outcome).toBe("fail");
    const ap: SimulationSettings = { ...chestApSupine.initialSettings, ...field(region.yCm + 0.6, 40) };
    expect(check(evaluate(chestApSupine, ap), "collimation-clipping").outcome).toBe("fail");
  });
});

describe("S2 excess: the allowance for what the marker or the ray forces is the extra actually required, not added to the maximum (Chest PA)", () => {
  const open = { collimation: { width: 1, height: 1 } };
  it("a full-open field is still excess, with or without a marker, ray centred on the region", () => {
    expect(check(run(chestPaErect, { ...open, sideMarker: null }), "collimation-excess").outcome).toBe("partial");
    expect(check(run(chestPaErect, open), "collimation-excess").outcome).toBe("partial");
  });
  it("a field opened exactly as far as a marker placed low needs is not excess", () => {
    const marker = { x: 0.84, y: 0.8 };
    const needed = neededField(chestPaErect, { ...ok, markerPosition: marker });
    expect(check(run(chestPaErect, { markerPosition: marker, ...needed }), "collimation-excess").outcome).toBe("pass");
  });
  it("a field opened exactly as far as an off-centre ray forces is not excess (centering is judged on its own)", () => {
    const ray = { x: 0, y: 0.02 }; // ≈ 3.4 cm below the target level
    const needed = neededField(chestPaErect, { ...ok, centralRay: ray, sideMarker: null });
    const r = run(chestPaErect, { centralRay: ray, sideMarker: null, ...needed });
    expect(check(r, "collimation-excess").outcome).toBe("pass");
    expect(check(r, "centering-vertical").outcome).not.toBe("pass");
  });
});

describe("S2 geometry helpers", () => {
  it("minimalFieldAround is symmetric about the ray, covers the target, and is clamped to the detector", () => {
    const target = { x1: 4, y1: 3, x2: 31, y2: 34 };
    const m = minimalFieldAround({ centralRay: { x: 0, y: -0.07 } }, target, D);
    expect([m.x1, m.x2, m.y1]).toEqual([4, 31, 3]);
    expect(m.y2).toBeCloseTo(36.99, 2);
    const edge = minimalFieldAround({ centralRay: { x: 0, y: 0.9 } }, target, D);
    expect(edge.y2).toBe(D.heightCm);
  });
});

/** Settings that open the field exactly as far as the required anatomy and the placed marker need around the given ray (the smallest allowed). */
function neededField(c: RadCase, base: SimulationSettings): Pick<SimulationSettings, "centralRay" | "collimation"> {
  const marker = markerRect(base.markerPosition, c.positioning.markerSizeCm, c.detector);
  const target = base.sideMarker ? unionRect(regionToRect(c.requiredAnatomy), marker) : regionToRect(c.requiredAnatomy);
  const min = minimalFieldAround(base, target, c.detector);
  const cx = ((base.centralRay.x + 1) / 2) * c.detector.widthCm, cy = ((base.centralRay.y + 1) / 2) * c.detector.heightCm;
  return {
    centralRay: base.centralRay,
    collimation: { width: (2 * Math.max(cx - min.x1, min.x2 - cx)) / c.detector.widthCm, height: (2 * Math.max(cy - min.y1, min.y2 - cy)) / c.detector.heightCm },
  };
}

describe("S2 per exam: a fully open field is still excess; a field opened only as needed is not", () => {
  const excessRule = (c: RadCase) => c.rules.find((r) => r.kind === "coverage" && r.check === "excess") as { beyondNeeded?: boolean } | undefined;
  it.each(CASES.map((c) => [c.id, c] as const))("%s", (_id, c) => {
    if (excessRule(c)?.beyondNeeded !== true) return; // not yet opted in
    const marker = c.positioning.markerRule?.kind === "fixed-side" ? c.positioning.markerRule.side : "L";
    const base = { ...c.initialSettings, sideMarker: marker, markerPosition: c.positioning.defaultMarkerPosition[marker], motionInstruction: "remain-still" } as SimulationSettings;
    const target = c.positioning.centering.target;
    const excess = (s: SimulationSettings) => check(evaluate(c, s), "collimation-excess").outcome;
    // The ray where the exam wants it, and a ray moved off it (the geometry then forces more opening on one side).
    for (const ray of [target, { x: Math.max(-1, Math.min(1, target.x + 0.12)), y: Math.max(-1, Math.min(1, target.y + 0.12)) }]) {
      const at = { ...base, centralRay: ray };
      expect(excess({ ...at, ...neededField(c, at) }), `needed only, ray ${JSON.stringify(ray)}`).toBe("pass");
      expect(excess({ ...at, collimation: { width: 1, height: 1 } }), `fully open, ray ${JSON.stringify(ray)}`).toBe("partial");
      expect(excess({ ...at, sideMarker: null, collimation: { width: 1, height: 1 } }), `fully open, no marker, ray ${JSON.stringify(ray)}`).toBe("partial");
    }
  });
  it("the strip rule is opted in for Chest PA (limb baselines are fitted flush, < 0.01 cm)", () => {
    const clipRule = (c: RadCase) => c.rules.find((r) => r.kind === "coverage" && r.check === "clipping") as { landmarkBoxOnly?: boolean } | undefined;
    expect(CASES.filter((c) => clipRule(c)?.landmarkBoxOnly === true).map((c) => c.id)).toEqual(["chest-pa-erect"]);
    for (const c of CASES.filter((x) => !x.id.startsWith("chest"))) {
      const { landmarkCm } = fitAnatomyBox(c.radiograph, c.requiredAnatomy);
      const r = c.requiredAnatomy;
      for (const strip of [landmarkCm.x1 - r.xCm, r.xCm + r.widthCm - landmarkCm.x2, landmarkCm.y1 - r.yCm, r.yCm + r.heightCm - landmarkCm.y2]) {
        expect(Math.abs(strip), c.id).toBeLessThan(0.01);
      }
    }
  });
});
