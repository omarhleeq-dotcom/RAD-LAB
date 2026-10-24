import { describe, expect, it } from "vitest";
import { CASES } from "@/data/cases";
import { fitAnatomyBox } from "@/features/simulation/geometry";
import { detectorCoverage } from "./coverage";

const get = (id: string) => CASES.find((c) => c.id === id)!;

describe("detectorCoverage (RAD-072 part 3b): computed from the fit, never hard-coded", () => {
  it("is the clipped image rectangle over the detector area, for every case", () => {
    for (const c of CASES) {
      const cov = detectorCoverage(c.radiograph, c.requiredAnatomy, c.detector);
      const { image } = fitAnatomyBox(c.radiograph, c.requiredAnatomy);
      const w = Math.min(image.x1 + image.widthCm, c.detector.widthCm) - Math.max(image.x1, 0);
      const h = Math.min(image.y1 + image.heightCm, c.detector.heightCm) - Math.max(image.y1, 0);
      expect(cov).toBeGreaterThan(0);
      expect(cov).toBeLessThanOrEqual(1);
      expect(cov).toBeCloseTo((Math.max(0, w) * Math.max(0, h)) / (c.detector.widthCm * c.detector.heightCm), 12);
    }
  });
  it("ankle AP and shoulder (the two exams that opt in) cover well under half the detector; the field is hatched elsewhere", () => {
    for (const id of ["ankle-ap", "shoulder-grashey-erect"]) {
      const c = get(id);
      expect(c.radiograph.partialCoverageKey).toBe(true);
      expect(detectorCoverage(c.radiograph, c.requiredAnatomy, c.detector)).toBeLessThan(0.5);
    }
  });
  it("only the ankle AP and the shoulder declare the key; every other exam omits the field (no new element)", () => {
    expect(CASES.filter((c) => c.radiograph.partialCoverageKey).map((c) => c.id).sort()).toEqual(["ankle-ap", "shoulder-grashey-erect"]);
  });
});
