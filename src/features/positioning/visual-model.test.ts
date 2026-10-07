import { describe, expect, it } from "vitest";
import { AP_SIDE, apSideLayout, chinOverlapsApices, planRotationDeg, rotationVisual, scapulaOffset } from "./visual-model";

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
  it("leaves the AP drawing unchanged (it already turns the left side toward the receptor)", () => {
    expect(planRotationDeg("ap-erect", 7)).toBe(7);
  });
});

describe("S12-2: the lateral turn is the same physical turn as the PA's (positive = left-side turn)", () => {
  // PlanView draws a left lateral with the figure rotated by the base angle −90° from the PA drawing, then by planRotationDeg.
  const BASE_LATERAL = -90;
  const vec = (angleDeg: number, [x, y]: [number, number]): [number, number] => {
    const a = (angleDeg * Math.PI) / 180;
    return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  };
  const lateralAngle = (deg: number) => BASE_LATERAL + planRotationDeg("lateral-left", deg);
  it("a straight left lateral has the left side against the detector (+x) and the nose at −y", () => {
    const left = vec(lateralAngle(0), [0, 1]);
    const nose = vec(lateralAngle(0), [1, 0]);
    expect(left[0]).toBeCloseTo(1);
    expect(nose[1]).toBeCloseTo(-1);
  });
  it("positive rotation turns the front away from the detector, negative toward it (same turn sense as the PA)", () => {
    expect(vec(lateralAngle(10), [1, 0])[0]).toBeLessThan(0);
    expect(vec(lateralAngle(-10), [1, 0])[0]).toBeGreaterThan(0);
  });
  it("uses the same sign flip as the PA, so one positive value is one physical turn in both projections", () => {
    expect(planRotationDeg("lateral-left", 7)).toBe(planRotationDeg("pa-erect", 7));
    expect(planRotationDeg("lateral-left", 7)).toBe(-7);
  });
});

describe("apSideLayout (AP side-view drawing model, S13b)", () => {
  const base = { tubeAngleDeg: 0, sidCm: 120, semiErect: false, detectorHeightCm: 43, rayCm: 20, fieldFromCm: 4, fieldToCm: 35 };
  it("draws a caudad tube toward the head end of the central ray, with its housing turned to lie along the beam", () => {
    const l = apSideLayout({ ...base, tubeAngleDeg: 10 });
    expect(l.tube.x).toBeLessThan(l.target.x); // head end is the viewer's left
    expect(l.tubeRotDeg).toBe(-10);
    // the beam direction (tube -> target) equals the housing axis rotated by tubeRotDeg from straight down
    const ang = (Math.atan2(l.target.x - l.tube.x, l.target.y - l.tube.y) * 180) / Math.PI;
    expect(ang).toBeCloseTo(10);
    expect(Math.hypot(l.target.x - l.tube.x, l.target.y - l.tube.y)).toBeCloseTo(120 * AP_SIDE.sidPxPerCm);
  });
  it("is symmetric for a cephalad angle and vertical at 0°", () => {
    expect(apSideLayout(base).tube.x).toBeCloseTo(apSideLayout(base).target.x);
    expect(apSideLayout({ ...base, tubeAngleDeg: -10 }).tube.x).toBeGreaterThan(apSideLayout({ ...base, tubeAngleDeg: -10 }).target.x);
  });
  it("raises the head end (the viewer's left) when semi-erect, and leaves the supine layout flat", () => {
    const flat = apSideLayout(base);
    const semi = apSideLayout({ ...base, semiErect: true });
    expect(flat.raiseDeg).toBe(0);
    expect(flat.fieldA.y).toBe(AP_SIDE.surfaceY);
    expect(semi.fieldA.y).toBeLessThan(AP_SIDE.surfaceY); // field start (head end side) lifted
    expect(semi.fieldA.y).toBeLessThan(semi.fieldB.y);
  });
});
