import { describe, expect, it } from "vitest";
import { chinOverlapsApices, planRotationDeg, rotationVisual, scapulaOffset } from "./visual-model";

describe("rotationVisual (educational drawing model)", () => {
  it("is symmetric and neutral at 0°", () => {
    const v = rotationVisual(0);
    expect(v.thoraxScale).toBe(1);
    expect(v.viewerLeftLungScale).toBe(1);
    expect(v.viewerRightLungScale).toBe(1);
    expect(v.spineShift).toBeCloseTo(0);
  });

  it("makes the lungs asymmetric and shifts the spine line in opposite directions for ±rotation", () => {
    const a = rotationVisual(10);
    const b = rotationVisual(-10);
    expect(a.viewerRightLungScale).toBeGreaterThan(a.viewerLeftLungScale);
    expect(b.viewerLeftLungScale).toBeGreaterThan(b.viewerRightLungScale);
    expect(a.spineShift).toBeCloseTo(-b.spineShift);
    expect(Math.abs(rotationVisual(15).spineShift)).toBeGreaterThan(Math.abs(a.spineShift));
  });

  it("never collapses the thorax", () => {
    expect(rotationVisual(80).thoraxScale).toBeGreaterThanOrEqual(0.55);
  });
});

describe("patient cue drawing helpers", () => {
  it("moves scapulae off the lung fields only when shoulders are rolled forward", () => {
    expect(scapulaOffset("relaxed")).toBe(0);
    expect(scapulaOffset("rolled-forward")).toBeGreaterThan(0);
  });

  it("shows the chin over the apices only when tucked", () => {
    expect(chinOverlapsApices("tucked")).toBe(true);
    expect(chinOverlapsApices("elevated")).toBe(false);
  });
});

describe("planRotationDeg (S11c-1: positive rotationDeg = patient LEFT side toward the receptor)", () => {
  // Plan view: +x toward the detector; in a PA the patient faces +x and the patient's left is +y (plan down).
  // SVG rotate(a) is clockwise: (x, y) -> (x cos a - y sin a, x sin a + y cos a).
  const leftSideTowardDetector = (deg: number) => {
    const a = (planRotationDeg("pa-erect", deg) * Math.PI) / 180;
    return -Math.sin(a); // x component of the rotated left-side vector (0, 1)
  };
  it("positive rotation swings the PA patient's left side toward the detector, negative the right side", () => {
    expect(leftSideTowardDetector(10)).toBeGreaterThan(0);
    expect(leftSideTowardDetector(-10)).toBeLessThan(0);
    expect(leftSideTowardDetector(0)).toBeCloseTo(0);
  });
  it("matches the result image: positive rotation moves the spine toward the viewer's right (patient's left)", () => {
    expect(rotationVisual(10).spineShift).toBeGreaterThan(0);
    expect(leftSideTowardDetector(10)).toBeGreaterThan(0);
  });
  it("leaves AP and lateral drawings unchanged", () => {
    expect(planRotationDeg("ap-erect", 7)).toBe(7);
    expect(planRotationDeg("lateral-left", 7)).toBe(7);
  });
});
