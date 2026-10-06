import { describe, expect, it } from "vitest";
import { chinOverlapsApices, rotationVisual, scapulaOffset } from "./visual-model";

describe("rotationVisual (educational drawing model)", () => {
  it("is symmetric and neutral at 0°", () => {
    const v = rotationVisual(0);
    expect(v.thoraxScale).toBe(1);
    expect(v.leftLungScale).toBe(1);
    expect(v.rightLungScale).toBe(1);
    expect(v.spineShift).toBeCloseTo(0);
  });

  it("makes the lungs asymmetric and shifts the spine line in opposite directions for ±rotation", () => {
    const a = rotationVisual(10);
    const b = rotationVisual(-10);
    expect(a.rightLungScale).toBeGreaterThan(a.leftLungScale);
    expect(b.leftLungScale).toBeGreaterThan(b.rightLungScale);
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
