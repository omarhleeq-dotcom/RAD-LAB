/**
 * RAD-068 part 1 (Part B): the side marker on the result image lies where the learner placed it in the scene's detector view,
 * in the same orientation, for every exam. The scene stores a detector-normalised position (`normToView` draws it); the result
 * draws the letter at `markerCanvasPoint(plan.marker.centerCm, out)` on a canvas whose origin and scale come from the renderer.
 * Checked here end to end on the pure chain: settings → evaluate → plan → renderRadiograph (output geometry) → canvas point,
 * for L and R in the four detector quadrants. Display only: nothing here is scored.
 */
import { describe, expect, it } from "vitest";
import { CASES } from "@/data/cases";
import type { SideMarkerId } from "@/domain/simulation";
import { evaluate } from "@/features/evaluation/engine";
import { normToCm } from "@/features/simulation/coords";
import { buildRenderPlan } from "./plan";
import { renderRadiograph, type LumaImage } from "./pipeline";
import { markerCanvasPoint } from "./RadiographCanvas";

const SRC: LumaImage = { width: 4, height: 4, data: new Float32Array(16).fill(100) };
const PX_PER_CM = 4;
const PLACES: { side: SideMarkerId; x: number; y: number }[] = [
  { side: "L", x: -0.55, y: -0.5 },
  { side: "L", x: 0.55, y: 0.5 },
  { side: "R", x: 0.55, y: -0.5 },
  { side: "R", x: -0.55, y: 0.5 },
];

describe("result-image side marker matches its place in the scene (every exam)", () => {
  for (const c of CASES) {
    for (const p of PLACES) {
      it(`${c.id}: ${p.side} at (${p.x}, ${p.y})`, () => {
        // The whole detector exposed with the central ray centred, so the marker is recorded wherever it is placed.
        const settings = { ...c.initialSettings, centralRay: { x: 0, y: 0 }, collimation: { width: 1, height: 1 }, sideMarker: p.side, markerPosition: { x: p.x, y: p.y } };
        const result = evaluate(c, settings);
        const plan = buildRenderPlan(result.resultState, c);
        const m = plan.marker!;
        expect(m.side).toBe(p.side);
        expect(m.visibleFraction).toBe(1);
        // Same detector point as the scene's drawing of the stored position.
        const placed = normToCm({ x: p.x, y: p.y }, c.detector);
        expect(m.centerCm.x).toBeCloseTo(placed.x, 9);
        expect(m.centerCm.y).toBeCloseTo(placed.y, 9);
        // On the canvas: back to detector cm through the canvas origin and scale, and the same half of the detector.
        const out = renderRadiograph(plan, c.radiograph, SRC, PX_PER_CM);
        const px = markerCanvasPoint(m.centerCm, out);
        expect(px.x).toBeGreaterThan(0);
        expect(px.y).toBeGreaterThan(0);
        expect(px.x).toBeLessThan(out.width);
        expect(px.y).toBeLessThan(out.height);
        expect(out.originCm.x + px.x / out.pxPerCm).toBeCloseTo(placed.x, 9);
        expect(out.originCm.y + px.y / out.pxPerCm).toBeCloseTo(placed.y, 9);
        expect(m.viewerSide).toBe(p.x < 0 ? "viewer-left" : "viewer-right");
      });
    }
  }
});
