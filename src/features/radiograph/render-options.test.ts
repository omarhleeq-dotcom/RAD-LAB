/** Per-asset render options (S14.2b-FIX): the shared default is untouched; only an asset that asks gets a higher, capped resolution. */
import { describe, expect, it } from "vitest";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import { chestLateralErect } from "@/data/cases/chest-lateral-erect";
import { handLateral } from "@/data/cases/hand-lateral";
import { handPa } from "@/data/cases/hand-pa";
import { wristPa } from "@/data/cases/wrist-pa";
import { resultPxPerCm } from "./RadiographCanvas";

describe("result resolution", () => {
  it("chest keeps the shared 24 px/cm", () => {
    for (const c of [chestPaErect, chestLateralErect]) {
      expect(c.radiograph.render).toBeUndefined();
      expect(resultPxPerCm(c.radiograph, c.detector.widthCm * c.detector.heightCm)).toBe(24);
    }
  });
  it("the hand exams ask for 48 px/cm and the canvas stays under its pixel budget", () => {
    for (const c of [handPa, handLateral]) {
      const area = c.detector.widthCm * c.detector.heightCm;
      const px = resultPxPerCm(c.radiograph, area);
      expect(px).toBeGreaterThan(24);
      expect(px * px * area).toBeLessThanOrEqual(1_800_000 + 1);
    }
  });
  it("a request is capped, never below the default", () => {
    const spec = { ...handPa.radiograph, render: { pxPerCm: 400 } };
    expect(resultPxPerCm(spec, 720)).toBeCloseTo(Math.sqrt(1_800_000 / 720));
    expect(resultPxPerCm({ ...spec, render: { pxPerCm: 10 } }, 720)).toBe(24);
  });
});

describe("result view (hand lateral)", () => {
  it("is absent for every other asset and for the hand PA", async () => {
    const { buildRenderPlan } = await import("./plan");
    const { evaluate } = await import("@/features/evaluation/engine");
    for (const c of [chestPaErect, wristPa, handPa]) expect(buildRenderPlan(evaluate(c, c.initialSettings).resultState, c).view).toBeUndefined();
  });
  it("the lateral view follows the required region and the marker, padded by the margin and clipped to the detector (field and scoring untouched)", async () => {
    const { buildRenderPlan } = await import("./plan");
    const { evaluate } = await import("@/features/evaluation/engine");
    const r = evaluate(handLateral, { ...handLateral.initialSettings, sideMarker: "L", markerPosition: { x: -0.55, y: 0 }, collimation: { width: 0.66, height: 1 } });
    const plan = buildRenderPlan(r.resultState, handLateral);
    const req = handLateral.requiredAnatomy;
    expect(plan.view).toBeDefined();
    const v = plan.view!;
    expect(v.x1).toBeLessThanOrEqual(req.xCm - 0.25 + 1e-6);
    expect(v.x2).toBeGreaterThanOrEqual(req.xCm + req.widthCm + 0.25 - 1e-6);
    expect(v.y1).toBeGreaterThanOrEqual(0);
    expect(v.y2).toBeLessThanOrEqual(handLateral.detector.heightCm);
    // narrower than the detector: aspect well above the 0.8 of the whole 24 × 30 cm
    expect((v.x2 - v.x1) / (v.y2 - v.y1)).toBeLessThan(0.5);
    expect(plan.detector).toEqual({ widthCm: 24, heightCm: 30 });
    // the view changes neither the score nor the findings: identical settings on the same case with and without the render options
    const bare = { ...handLateral, radiograph: { ...handLateral.radiograph, render: undefined } };
    const settings = { ...handLateral.initialSettings, sideMarker: "L" as const, markerPosition: { x: -0.55, y: 0 }, collimation: { width: 0.66, height: 1 }, centralRay: { x: 0, y: 0 }, sidCm: 105, kvp: 65, mas: 2.5, rotationDeg: 4, projection: "hand-lateral" };
    const a = evaluate(handLateral, settings), b = evaluate(bare, settings);
    expect(a.score).toEqual(b.score);
    expect(a.checks.map((c) => [c.ruleId, c.outcome])).toEqual(b.checks.map((c) => [c.ruleId, c.outcome]));
    expect(a.criticalFindings).toEqual(b.criticalFindings);
    expect(buildRenderPlan(b.resultState, bare).view).toBeUndefined();
    expect(buildRenderPlan(a.resultState, handLateral).fieldCm).toEqual(buildRenderPlan(b.resultState, bare).fieldCm);
  });
  it("a marker far outside the region widens the view so it is still drawn", async () => {
    const { buildRenderPlan } = await import("./plan");
    const { evaluate } = await import("@/features/evaluation/engine");
    const r = evaluate(handLateral, { ...handLateral.initialSettings, sideMarker: "L", markerPosition: { x: 0.9, y: 0 }, collimation: { width: 1, height: 1 } });
    expect(buildRenderPlan(r.resultState, handLateral).view!.x2).toBeGreaterThan(21);
  });
});
