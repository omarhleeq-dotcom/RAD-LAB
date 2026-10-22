/**
 * S2 (owner 2026-10-22, RAD-068 part 3 batch 4): coverage and margins. Opt-in per exam through two optional rule fields:
 *  - clipping `landmarkBoxOnly`: a cut that takes only the anatomy-free strip beside the required region passes;
 *  - excess `beyondNeeded`: only the opening beyond the smallest field centred on the ray that covers the anatomy and the
 *    placed marker counts, so an opening forced by the ray position or needed for the marker is not excess.
 * Enabled for Chest PA first; the other chest exams still reuse the old behaviour until the owner enables them.
 */
import { describe, expect, it } from "vitest";
import { chestApSupine } from "@/data/cases/chest-ap-supine";
import { chestLateralErect } from "@/data/cases/chest-lateral-erect";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { fitAnatomyBox, minimalFieldAround } from "@/features/simulation/geometry";
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

describe("S2 excess: only the avoidable opening counts (Chest PA)", () => {
  const open = { collimation: { width: 1, height: 1 } };
  it("a full-open field with the ray on the region and nothing forcing it is still excess", () => {
    expect(check(run(chestPaErect, { ...open, sideMarker: null }), "collimation-excess").outcome).toBe("partial");
    expect(check(run(chestPaErect, open), "collimation-excess").outcome).toBe("partial");
  });
  it("the opening a marker placed low needs is not excess", () => {
    expect(check(run(chestPaErect, { ...open, markerPosition: { x: 0.84, y: 0.8 } }), "collimation-excess").outcome).toBe("pass");
  });
  it("the opening forced by an off-centre ray is not excess (centering is judged on its own)", () => {
    const r = run(chestPaErect, { ...open, centralRay: { x: 0, y: 0.02 }, sideMarker: null }); // ≈ 3.4 cm below the target level
    expect(check(r, "collimation-excess").outcome).toBe("pass");
    expect(check(r, "centering-vertical").outcome).not.toBe("pass");
  });
  it("a field opened clearly beyond what is needed is still partial, whatever the ray", () => {
    expect(check(run(chestPaErect, { centralRay: { x: 0, y: -0.14 }, collimation: { width: 1, height: 1 }, sideMarker: null }), "collimation-excess").outcome).toBe("partial");
  });
  it("is opt-in: Chest Lateral and AP keep measuring the margin beyond the required region", () => {
    const lat = { ...chestLateralErect.initialSettings, centralRay: { x: 0, y: -0.07 }, ...open, sideMarker: null };
    expect(check(evaluate(chestLateralErect, lat as SimulationSettings), "collimation-excess").outcome).toBe("partial");
    const ap = { ...chestApSupine.initialSettings, centralRay: { x: 0, y: -0.07 }, ...open, sideMarker: null };
    expect(check(evaluate(chestApSupine, ap as SimulationSettings), "collimation-excess").outcome).toBe("partial");
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
