import { describe, expect, it } from "vitest";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import { fromSliderPosition, snapToControl, stepControl, toSliderPosition } from "./stations";

const { kvp, mas, sidCm } = chestPaErect.controls;

describe("console stepping", () => {
  it("steps kVp and SID by their configured step and clamps at the range ends", () => {
    expect(stepControl(kvp, 120, 1)).toBe(121);
    expect(stepControl(kvp, 120, -10)).toBe(110);
    expect(stepControl(kvp, kvp.max, 1)).toBe(kvp.max);
    expect(stepControl(kvp, kvp.min, -1)).toBe(kvp.min);
    expect(stepControl(sidCm, 180, 1)).toBe(185);
  });

  it("steps mAs through the preferred-number stations, not by a fixed increment", () => {
    expect(stepControl(mas, 3.2, 1)).toBe(4);
    expect(stepControl(mas, 3.2, -1)).toBe(2.5);
    expect(stepControl(mas, 40, 1)).toBe(40);
    expect(stepControl(mas, 0.5, -1)).toBe(0.5);
  });

  it("lands on the adjacent station when starting between stations (no skipping)", () => {
    // The case starts at 12 mAs, which lies between the 10 and 12.5 stations.
    expect(stepControl(mas, 12, 1)).toBe(12.5);
    expect(stepControl(mas, 12, -1)).toBe(10);
    expect(stepControl(mas, 12, 3)).toBe(20);
    expect(stepControl(mas, 12, -3)).toBe(6.3);
    expect(stepControl(mas, 0.51, -1)).toBe(0.5);
    expect(stepControl(mas, 39, 1)).toBe(40);
  });

  it("snaps arbitrary input to what the console can select", () => {
    expect(snapToControl(mas, 3.3)).toBe(3.2);
    expect(snapToControl(mas, 1000)).toBe(40);
    expect(snapToControl(kvp, 120.4)).toBe(120);
    expect(snapToControl(kvp, 5)).toBe(kvp.min);
    expect(snapToControl(kvp, Number.NaN)).toBe(kvp.min);
  });

  it("maps slider positions to values for station controls and plain values otherwise", () => {
    for (const s of mas.stations!) expect(fromSliderPosition(mas, toSliderPosition(mas, s))).toBe(s);
    expect(toSliderPosition(kvp, 117)).toBe(117);
  });

  it("has ascending stations inside the selectable range", () => {
    const st = mas.stations!;
    expect([...st].sort((a, b) => a - b)).toEqual(st);
    expect(st[0]).toBeGreaterThanOrEqual(mas.min);
    expect(st[st.length - 1]).toBeLessThanOrEqual(mas.max);
  });
});
