import { describe, expect, it } from "vitest";
import { deviationIndex, deviationIndexFromRatio, exposureRatioFromDI, formatDI } from "./di";

describe("Deviation Index  DI = 10·log10(EI/EIT)", () => {
  it("is 0 when EI equals the target EIT, whatever the numeric scale", () => {
    expect(deviationIndex(350, 350)).toBe(0);
    expect(deviationIndex(1, 1)).toBe(0);
    expect(deviationIndexFromRatio(1)).toBe(0);
  });

  it("is ≈ +3 for twice the target and ≈ −3 for half the target", () => {
    expect(deviationIndex(200, 100)).toBeCloseTo(3.01, 2);
    expect(deviationIndex(50, 100)).toBeCloseTo(-3.01, 2);
  });

  it("is positive above target and negative below it", () => {
    expect(deviationIndexFromRatio(1.5)).toBeGreaterThan(0);
    expect(deviationIndexFromRatio(0.6)).toBeLessThan(0);
  });

  it("is invariant to the EI/EIT unit (only the ratio matters)", () => {
    expect(deviationIndex(2, 1)).toBeCloseTo(deviationIndex(2000, 1000), 12);
  });

  it("round-trips with the inverse relation", () => {
    for (const di of [-6, -3, -1, 0, 1, 3, 6]) expect(deviationIndexFromRatio(exposureRatioFromDI(di))).toBeCloseTo(di, 10);
    expect(exposureRatioFromDI(3)).toBeCloseTo(2, 1);
    expect(exposureRatioFromDI(-3)).toBeCloseTo(0.5, 1);
  });

  it("rejects non-positive input instead of returning NaN", () => {
    expect(() => deviationIndex(0, 1)).toThrow(RangeError);
    expect(() => deviationIndex(1, 0)).toThrow(RangeError);
    expect(() => deviationIndexFromRatio(-1)).toThrow(RangeError);
  });

  it("formats with a sign and never shows −0.0", () => {
    expect(formatDI(0)).toBe("0.0");
    expect(formatDI(-0.04)).toBe("0.0");
    expect(formatDI(2.55)).toBe("+2.6");
    expect(formatDI(-3.01)).toBe("-3.0");
  });
});
