import { describe, expect, it } from "vitest";
import {
  clamp,
  clampPoint,
  clientToNorm,
  clientToView,
  cmToNorm,
  collimationFromEdgeDrag,
  normToCm,
  normToView,
  nudge,
  viewToNorm,
  type Box,
  type DetectorFrame,
} from "./coords";
import { collimatedField } from "./geometry";

const detector = { widthCm: 35, heightCm: 43 };
const frame: DetectorFrame = { x: 0, y: 0, width: 350, height: 430 };
const viewBox: Box = { x: -30, y: -90, width: 410, height: 550 };

describe("normalization", () => {
  it("maps detector corners and centre to ±1 / 0", () => {
    expect(viewToNorm({ x: 0, y: 0 }, frame)).toEqual({ x: -1, y: -1 });
    expect(viewToNorm({ x: 350, y: 430 }, frame)).toEqual({ x: 1, y: 1 });
    expect(viewToNorm({ x: 175, y: 215 }, frame)).toEqual({ x: 0, y: 0 });
  });

  it("round-trips norm ↔ view ↔ cm", () => {
    const n = { x: -0.37, y: 0.62 };
    const back = viewToNorm(normToView(n, frame), frame);
    expect(back.x).toBeCloseTo(n.x);
    expect(back.y).toBeCloseTo(n.y);
    const cm = normToCm(n, detector);
    const again = cmToNorm(cm, detector);
    expect(again.x).toBeCloseTo(n.x);
    expect(again.y).toBeCloseTo(n.y);
    expect(normToCm({ x: 0, y: -1 }, detector)).toEqual({ x: 17.5, y: 0 });
  });

  it("is independent of drawing scale", () => {
    const small: DetectorFrame = { x: 10, y: 20, width: 70, height: 86 };
    expect(viewToNorm({ x: 45, y: 63 }, small)).toEqual({ x: 0, y: 0 });
  });
});

describe("pointer → view mapping", () => {
  it("handles a screen box that matches the viewBox aspect at any size", () => {
    for (const k of [0.5, 1, 2.3]) {
      const screen = { left: 100, top: 50, width: viewBox.width * k, height: viewBox.height * k };
      const p = clientToView({ x: 100 + (0 - viewBox.x) * k, y: 50 + (0 - viewBox.y) * k }, screen, viewBox);
      expect(p.x).toBeCloseTo(0);
      expect(p.y).toBeCloseTo(0);
    }
  });

  it("accounts for letterboxing (meet) when the screen is wider than the viewBox", () => {
    const screen = { left: 0, top: 0, width: 1000, height: 550 }; // scale 1, 295px side bars
    const p = clientToView({ x: 295 + (0 - viewBox.x), y: 0 - viewBox.y }, screen, viewBox);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
  });

  it("does not depend on text direction: a pointer on the screen's left maps to normalized -x", () => {
    const screen = { left: 0, top: 0, width: viewBox.width, height: viewBox.height };
    const n = clientToNorm({ x: 40, y: 300 }, screen, viewBox, frame);
    expect(n.x).toBeLessThan(0);
  });

  it("survives a zero-size element", () => {
    expect(clientToView({ x: 5, y: 5 }, { left: 0, top: 0, width: 0, height: 0 }, viewBox)).toEqual({ x: -30, y: -90 });
  });
});

describe("clamping", () => {
  it("keeps pointer positions outside the detector inside ±1", () => {
    const screen = { left: 0, top: 0, width: viewBox.width, height: viewBox.height };
    expect(clientToNorm({ x: -500, y: 5000 }, screen, viewBox, frame)).toEqual({ x: -1, y: 1 });
    expect(clampPoint({ x: 3, y: -2 })).toEqual({ x: 1, y: -1 });
    expect(clamp(5, 0, 1)).toBe(1);
  });

  it("clamps keyboard nudges to the detector", () => {
    expect(nudge({ x: 0.99, y: -0.99 }, 0.05, -0.05)).toEqual({ x: 1, y: -1 });
  });
});

describe("collimation edge drag", () => {
  const ray = { x: 0.2, y: 0 };
  const cur = { width: 0.5, height: 0.5 };

  it("sets half-extent from the pointer distance to the central ray (symmetric field)", () => {
    expect(collimationFromEdgeDrag({ x: 0.7, y: 0.3 }, ray, "right", cur, 0.3).width).toBeCloseTo(0.5);
    expect(collimationFromEdgeDrag({ x: 0.8, y: 0.3 }, ray, "left", cur, 0.3).width).toBeCloseTo(0.6);
    expect(collimationFromEdgeDrag({ x: 0, y: -0.9 }, ray, "top", cur, 0.3)).toEqual({ width: 0.5, height: 0.9 });
  });

  it("corners change both axes and respect min/max", () => {
    const r = collimationFromEdgeDrag({ x: 0.21, y: 5 }, ray, "bottom-right", cur, 0.3);
    expect(r).toEqual({ width: 0.3, height: 1 });
  });
});

describe("collimated field (cm)", () => {
  it("is centred on the central ray and clamped to the detector", () => {
    const f = collimatedField({ centralRay: { x: 0, y: 0 }, collimation: { width: 0.5, height: 0.5 } }, detector);
    expect(f).toEqual({ x1: 8.75, x2: 26.25, y1: 10.75, y2: 32.25 });
    const edge = collimatedField({ centralRay: { x: 1, y: -1 }, collimation: { width: 1, height: 1 } }, detector);
    expect(edge).toEqual({ x1: 17.5, x2: 35, y1: 0, y2: 21.5 });
  });

  it("full-size field on a centred ray covers the whole detector", () => {
    const f = collimatedField({ centralRay: { x: 0, y: 0 }, collimation: { width: 1, height: 1 } }, detector);
    expect(f).toEqual({ x1: 0, x2: 35, y1: 0, y2: 43 });
  });
});
