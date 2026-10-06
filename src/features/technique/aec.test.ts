import { describe, expect, it } from "vitest";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import type { SimulationSettings } from "@/domain/simulation";
import { chamberFieldCoverage, evaluateAec, toggleChamber } from "./aec";
import { computeDetectorExposure } from "./model";
import { collimatedField } from "@/features/simulation/geometry";

const profile = chestPaErect.technique;
const detector = chestPaErect.detector;
const field = collimatedField({ centralRay: { x: 0, y: -0.07 }, collimation: { width: 0.94, height: 0.84 } }, detector);
const chamber = (id: string) => profile.aec.chambers.find((c) => c.id === id)!;

describe("AEC chamber selection", () => {
  it("toggles chambers in canonical order without duplicates", () => {
    expect(toggleChamber([], "right")).toEqual(["right"]);
    expect(toggleChamber(["right"], "left")).toEqual(["left", "right"]);
    expect(toggleChamber(["left", "right"], "left")).toEqual(["right"]);
    expect(toggleChamber(toggleChamber(["center"], "center"), "center")).toEqual(["center"]);
  });

  it("is order-independent: the same set always yields the same selection array", () => {
    expect(toggleChamber(toggleChamber([], "right"), "left")).toEqual(toggleChamber(toggleChamber([], "left"), "right"));
  });
});

describe("AEC chamber geometry vs the collimated field", () => {
  it("counts a chamber fully inside the field as 100 % covered", () => {
    expect(chamberFieldCoverage(chamber("left").region, field, detector)).toBeCloseTo(1, 10);
  });

  it("reduces coverage when the field closes over a chamber", () => {
    const narrow = collimatedField({ centralRay: { x: 0, y: -0.07 }, collimation: { width: 0.3, height: 0.84 } }, detector);
    expect(chamberFieldCoverage(chamber("left").region, narrow, detector)).toBeLessThan(0.5);
    expect(chamberFieldCoverage(chamber("center").region, narrow, detector)).toBeCloseTo(1, 5);
  });

  it("follows the central ray: shifting the field aside removes a chamber from it", () => {
    const shifted = collimatedField({ centralRay: { x: 0.9, y: -0.07 }, collimation: { width: 0.3, height: 0.84 } }, detector);
    expect(chamberFieldCoverage(chamber("left").region, shifted, detector)).toBe(0);
  });
});

describe("AEC termination (educational, vendor-neutral)", () => {
  it("lung-field chambers terminate on target", () => {
    const r = evaluateAec(profile, ["left", "right"], field, detector);
    expect(r.terminatedOnChambers).toBe(true);
    expect(r.chamberRelativeExposure).toBeCloseTo(1, 10);
  });

  it("a central (mediastinal) chamber alone over-exposes the lung fields", () => {
    expect(evaluateAec(profile, ["center"], field, detector).chamberRelativeExposure).toBeCloseTo(
      profile.aec.anatomyRelativeExposure.mediastinum,
      10,
    );
  });

  it("combines several chambers by their mean sensed signal (between the individual outcomes)", () => {
    const mixed = evaluateAec(profile, ["left", "center", "right"], field, detector).chamberRelativeExposure as number;
    expect(mixed).toBeGreaterThan(1);
    expect(mixed).toBeLessThan(profile.aec.anatomyRelativeExposure.mediastinum);
  });

  it("ignores selected chambers that are not irradiated, and runs to backup if none is", () => {
    const narrow = collimatedField({ centralRay: { x: 0, y: -0.07 }, collimation: { width: 0.3, height: 0.84 } }, detector);
    const some = evaluateAec(profile, ["left", "center"], narrow, detector);
    expect(some.chambers.find((c) => c.id === "left")?.active).toBe(false);
    expect(some.chambers.find((c) => c.id === "center")?.active).toBe(true);
    const none = evaluateAec(profile, ["left", "right"], narrow, detector);
    expect(none.terminatedOnChambers).toBe(false);
    expect(none.chamberRelativeExposure).toBeNull();
  });

  it("never treats an unselected chamber as active", () => {
    expect(evaluateAec(profile, [], field, detector).chambers.every((c) => !c.active)).toBe(true);
  });
});

describe("AEC in the exposure model", () => {
  const aec = (patch: Partial<SimulationSettings>) =>
    computeDetectorExposure(
      profile,
      { ...chestPaErect.initialSettings, centralRay: { x: 0, y: -0.07 }, collimation: { width: 0.94, height: 0.84 }, exposureMode: "aec", ...patch },
      detector,
    );

  it("gives consistent receptor exposure across tube potentials (its validated purpose)", () => {
    const ratios = [80, 100, 120, 140].map((kvp) => aec({ kvp, aecChambers: ["left", "right"] }).exposureRatio);
    for (const r of ratios) expect(r).toBeCloseTo(1, 10);
  });

  it("ignores the manual mAs entirely", () => {
    expect(aec({ mas: 0.5, aecChambers: ["left", "right"] })).toEqual(aec({ mas: 40, aecChambers: ["left", "right"] }));
  });

  it("delivers a larger mAs when it terminates late (mediastinal chamber) → positive DI", () => {
    const good = aec({ aecChambers: ["left", "right"] });
    const bad = aec({ aecChambers: ["center"] });
    expect(bad.deliveredMas).toBeGreaterThan(good.deliveredMas);
    expect(bad.deviationIndex).toBeGreaterThan(0);
    expect(bad.doseAwareness).not.toBe("optimized");
  });

  it("runs to the backup limit with no irradiated chamber → large excess", () => {
    const r = aec({ aecChambers: ["left"], collimation: { width: 0.3, height: 0.84 } });
    expect(r.aec?.terminatedOnChambers).toBe(false);
    expect(r.exposureRatio).toBe(profile.aec.backupRelativeExposure);
    expect(r.tendency).toBe("excessive");
  });
});
