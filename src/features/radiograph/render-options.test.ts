/** Per-asset render options (S14.2b-FIX): the shared default is untouched; only an asset that asks gets a higher, capped resolution. */
import { describe, expect, it } from "vitest";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import { chestLateralErect } from "@/data/cases/chest-lateral-erect";
import { handLateral } from "@/data/cases/hand-lateral";
import { handPa } from "@/data/cases/hand-pa";
import { wristPa } from "@/data/cases/wrist-pa";
import { resultPxPerCm } from "./RadiographCanvas";

describe("result resolution", () => {
  it("chest and wrist keep the shared 24 px/cm", () => {
    for (const c of [chestPaErect, chestLateralErect, wristPa]) {
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
