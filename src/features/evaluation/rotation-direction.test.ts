import { describe, expect, it } from "vitest";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import type { SimulationSettings } from "@/domain/simulation";
import { evaluate } from "./engine";

/** S11c-1 / S11c-2: direction feedback from BONTRAGER-9 p.83 through "positive rotationDeg = patient LEFT side toward the receptor". */
const ok: SimulationSettings = {
  projection: "pa-erect",
  rotationDeg: 0,
  centralRay: { x: 0, y: -0.07 },
  collimation: { width: 0.94, height: 0.84 },
  chinPosition: "elevated",
  shoulderPosition: "rolled-forward",
  sideMarker: "L",
  markerPosition: { x: 0.84, y: -0.44 },
  sidCm: 180,
  kvp: 115,
  mas: 3,
  exposureMode: "manual",
  aecChambers: [],
  breathing: "deep-inspiration-hold",
  motionInstruction: "remain-still",
};
const run = (rotationDeg: number) => evaluate(chestPaErect, { ...ok, rotationDeg });
const rot = (r: ReturnType<typeof run>) => r.checks.find((c) => c.ruleId === "rotation")!;

describe("rotation direction feedback", () => {
  it.each([8, 4])("positive %i°: LEFT side toward the detector (EN + AR)", (deg) => {
    const f = rot(run(deg)).feedback;
    expect(f.en).toContain("LEFT side toward the detector");
    expect(f.en).toContain("left clavicle");
    expect(f.ar).toContain("الجانب الأيسر");
    expect(f.ar).toContain("ترقوة اليسرى");
  });
  it.each([-8, -4])("negative %i°: RIGHT side toward the detector (EN + AR)", (deg) => {
    const f = rot(run(deg)).feedback;
    expect(f.en).toContain("RIGHT side toward the detector");
    expect(f.en).toContain("right clavicle");
    expect(f.ar).toContain("الجانب الأيمن");
    expect(f.ar).toContain("ترقوة اليمنى");
  });
  it("zero / in-tolerance rotation gives no direction text", () => {
    for (const deg of [0, 1, -2, 2]) {
      const c = rot(run(deg));
      expect(c.outcome).toBe("pass");
      expect(c.feedback.en).not.toMatch(/LEFT|RIGHT/);
      expect(c.feedback.ar).not.toMatch(/الأيسر|الأيمن/);
    }
  });
  it("feedback only: outcome, score and critical findings equal for ±N", () => {
    for (const deg of [4, 8, 15]) {
      const a = run(deg), b = run(-deg);
      expect(rot(a).outcome).toBe(rot(b).outcome);
      expect(a.score).toEqual(b.score);
      expect(a.criticalFindings).toEqual(b.criticalFindings);
    }
  });
});
