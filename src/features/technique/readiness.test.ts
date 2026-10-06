import { describe, expect, it } from "vitest";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import type { SimulationSettings } from "@/domain/simulation";
import { assessReadiness } from "./readiness";

const ready: SimulationSettings = {
  ...chestPaErect.initialSettings,
  sideMarker: "L",
  breathing: "deep-inspiration-hold",
  centralRay: { x: 0, y: -0.07 },
  collimation: { width: 0.94, height: 0.84 },
};
const assess = (patch: Partial<SimulationSettings> = {}, phase: "setup" | "result" = "setup") =>
  assessReadiness(chestPaErect, { ...ready, ...patch }, phase);
const ids = (r: ReturnType<typeof assess>) => r.items.map((i) => i.id);

describe("exposure readiness (workflow, not correctness)", () => {
  it("is ready when the workflow is complete", () => {
    const r = assess();
    expect(r.level).toBe("ready");
    expect(r.canExpose).toBe(true);
    expect(r.items).toEqual([]);
  });

  it("flags advisories without blocking: missing breathing instruction and side marker", () => {
    const r = assess({ breathing: "no-instruction", sideMarker: null });
    expect(r.level).toBe("caution");
    expect(r.canExpose).toBe(true);
    expect(ids(r)).toEqual(expect.arrayContaining(["breathing-not-instructed", "marker-missing"]));
  });

  it("blocks AEC with no chamber selected", () => {
    const r = assess({ exposureMode: "aec", aecChambers: [] });
    expect(r.level).toBe("blocked");
    expect(r.canExpose).toBe(false);
    expect(ids(r)).toContain("aec-no-chamber");
  });

  it("does not require a chamber in manual mode", () => {
    expect(ids(assess({ exposureMode: "manual", aecChambers: [] }))).not.toContain("aec-no-chamber");
  });

  it("warns (does not block) when every selected chamber is outside the light field", () => {
    const r = assess({ exposureMode: "aec", aecChambers: ["left", "right"], collimation: { width: 0.3, height: 0.84 } });
    expect(ids(r)).toContain("aec-chambers-outside-field");
    expect(r.canExpose).toBe(true);
    expect(r.level).toBe("caution");
  });

  it("blocks after the exposure until Retry / Restart", () => {
    const r = assess({}, "result");
    expect(r.canExpose).toBe(false);
    expect(ids(r)).toContain("exposure-done");
  });

  it("blocks a technique outside the console's selectable range", () => {
    expect(assess({ kvp: 400 }).canExpose).toBe(false);
    expect(assess({ kvp: Number.NaN }).canExpose).toBe(false);
    // In AEC mode the manual mAs is unused, so it cannot block the exposure.
    expect(assess({ exposureMode: "aec", aecChambers: ["left"], mas: 9999 }).canExpose).toBe(true);
    expect(assess({ mas: 9999 }).canExpose).toBe(false);
  });

  it("never reveals correctness: wrong-but-complete setups are just as ready as correct ones", () => {
    const wrong = assess({ projection: "lateral-left", rotationDeg: 15, kvp: 60, mas: 40, sidCm: 100 });
    expect(wrong.level).toBe("ready");
    expect(wrong.canExpose).toBe(true);
  });
});
