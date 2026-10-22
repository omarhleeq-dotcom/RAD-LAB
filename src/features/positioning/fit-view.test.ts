import { describe, expect, it } from "vitest";
import { CASES } from "@/data/cases";
import type { SimulationSettings } from "@/domain/simulation";
import { clientToNorm, normToView, type Box } from "@/features/simulation/coords";
import { collimatedField } from "@/features/simulation/geometry";
import { U } from "./detector-figures";
import { detectorViewBox, phoneFit } from "./fit-view";

const LIMBS = ["wrist", "hand", "elbow", "knee", "ankle", "foot", "shoulder"];

describe("phone fit view (owner phone check 3)", () => {
  const cases = CASES.filter((c) => LIMBS.some((b) => c.bodyPart === b));

  it("covers the field, the crosshair and the marker, stays inside the detector and is tighter than the whole view", () => {
    expect(cases.length).toBeGreaterThan(0);
    for (const c of cases) {
      const settings = { ...c.initialSettings, sideMarker: "L", markerPosition: { x: -0.5, y: 0 } } as SimulationSettings;
      const { box } = phoneFit(c, settings, false);
      const W = c.detector.widthCm * U, H = c.detector.heightCm * U;
      const f = collimatedField(settings, c.detector);
      expect(box.x).toBeLessThanOrEqual(f.x1 * U);
      expect(box.x + box.width).toBeGreaterThanOrEqual(f.x2 * U);
      expect(box.y).toBeLessThanOrEqual(f.y1 * U);
      expect(box.y + box.height).toBeGreaterThanOrEqual(f.y2 * U);
      for (const p of [settings.centralRay, settings.markerPosition]) {
        const v = normToView(p, { x: 0, y: 0, width: W, height: H });
        expect(v.x).toBeGreaterThanOrEqual(box.x);
        expect(v.x).toBeLessThanOrEqual(box.x + box.width);
        expect(v.y).toBeGreaterThanOrEqual(box.y);
        expect(v.y).toBeLessThanOrEqual(box.y + box.height);
      }
      expect(box.x).toBeGreaterThanOrEqual(-6);
      expect(box.x + box.width).toBeLessThanOrEqual(W + 6);
      expect(box.y).toBeGreaterThanOrEqual(-6);
      expect(box.y + box.height).toBeLessThanOrEqual(H + 6);
    }
  });

  it("zooms in for at least one limb exam whose field is smaller than the detector, and never below 40% of it", () => {
    const zoomed = cases.filter((c) => phoneFit(c, c.initialSettings as SimulationSettings, false).meaningful);
    expect(zoomed.length).toBeGreaterThan(0);
    for (const c of cases) {
      const { box } = phoneFit(c, { ...(c.initialSettings as SimulationSettings), collimation: { width: 0.05, height: 0.05 } }, false);
      expect(box.width).toBeGreaterThanOrEqual(0.4 * c.detector.widthCm * U - 1e-9);
    }
  });

  it("a pointer position gives the same stored (normalised) value in the fitted view and in the whole view", () => {
    // Same detector point → client px under each viewBox (letterboxed 'meet' SVG) → clientToNorm must return the same value.
    const project = (p: { x: number; y: number }, vb: Box, screen: { left: number; top: number; width: number; height: number }) => {
      const scale = Math.min(screen.width / vb.width, screen.height / vb.height);
      return { x: screen.left + (screen.width - vb.width * scale) / 2 + (p.x - vb.x) * scale, y: screen.top + (screen.height - vb.height * scale) / 2 + (p.y - vb.y) * scale };
    };
    for (const c of cases) {
      const W = c.detector.widthCm * U, H = c.detector.heightCm * U;
      const frame = { x: 0, y: 0, width: W, height: H };
      const fit = phoneFit(c, c.initialSettings as SimulationSettings, false).box;
      const whole = detectorViewBox(W, H, false);
      const screen = { left: 8, top: 120, width: 372, height: 240 };
      for (const norm of [{ x: 0, y: 0 }, { x: -0.31, y: 0.4 }, { x: 0.2, y: -0.15 }]) {
        const view = normToView(norm, frame);
        const a = clientToNorm(project(view, fit, screen), screen, fit, frame);
        const b = clientToNorm(project(view, whole, screen), screen, whole, frame);
        expect(a.x).toBeCloseTo(norm.x, 9);
        expect(a.y).toBeCloseTo(norm.y, 9);
        expect(b.x).toBeCloseTo(a.x, 9);
        expect(b.y).toBeCloseTo(a.y, 9);
      }
    }
  });
});
