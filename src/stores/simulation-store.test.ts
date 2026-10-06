import { beforeEach, describe, expect, it } from "vitest";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import { toggleChamber } from "@/features/technique/aec";
import { useSimulationStore } from "./simulation-store";

const st = () => useSimulationStore.getState();
const set = <K extends Parameters<ReturnType<typeof st>["setSetting"]>[0]>(k: K, v: Parameters<ReturnType<typeof st>["setSetting"]>[1]) =>
  st().setSetting(k, v as never);

beforeEach(() => st().loadCase("chest-pa-erect"));

describe("technique state", () => {
  it("starts in manual mode with no AEC chamber selected (the case's defined starting state)", () => {
    expect(st().settings?.exposureMode).toBe("manual");
    expect(st().settings?.aecChambers).toEqual([]);
    expect(st().settings).toEqual(chestPaErect.initialSettings);
  });

  it("stores kVp and mAs and snaps them to what the console can select", () => {
    set("kvp", 118);
    set("mas", 3.3);
    expect(st().settings?.kvp).toBe(118);
    expect(st().settings?.mas).toBe(3.2);
    set("kvp", 9999);
    expect(st().settings?.kvp).toBe(chestPaErect.controls.kvp.max);
    set("mas", Number.NaN);
    expect(st().settings?.mas).toBe(chestPaErect.controls.mas.min);
  });

  it("keeps ONE SID state: the SID the console sets is the SID the exposure uses", () => {
    set("sidCm", 150);
    expect(st().settings?.sidCm).toBe(150);
    st().expose();
    expect(st().result?.exposure.sid.sidCm).toBe(150);
    expect(st().result?.resultState.geometry.sidCm).toBe(150);
  });

  it("switches between Manual and AEC and keeps the manual mAs while in AEC", () => {
    set("mas", 5);
    set("exposureMode", "aec");
    expect(st().settings?.exposureMode).toBe("aec");
    expect(st().settings?.mas).toBe(5);
    set("exposureMode", "manual");
    expect(st().settings?.mas).toBe(5);
  });

  it("selects and deselects AEC chambers", () => {
    set("exposureMode", "aec");
    set("aecChambers", toggleChamber(st().settings!.aecChambers, "right"));
    set("aecChambers", toggleChamber(st().settings!.aecChambers, "left"));
    expect(st().settings?.aecChambers).toEqual(["left", "right"]);
    set("aecChambers", toggleChamber(st().settings!.aecChambers, "left"));
    expect(st().settings?.aecChambers).toEqual(["right"]);
  });
});

describe("expose, lock, retry, restart", () => {
  it("refuses to expose in AEC with no chamber (readiness block), then exposes once one is selected", () => {
    set("exposureMode", "aec");
    st().expose();
    expect(st().phase).toBe("setup");
    expect(st().result).toBeNull();
    set("aecChambers", ["left", "right"]);
    st().expose();
    expect(st().phase).toBe("result");
    expect(st().result?.exposure.mode).toBe("aec");
  });

  it("locks every control after exposure until Retry / Restart", () => {
    st().expose();
    const before = st().settings;
    set("kvp", 100);
    set("mas", 10);
    set("exposureMode", "aec");
    set("aecChambers", ["center"]);
    set("sidCm", 200);
    expect(st().settings).toEqual(before);
    st().expose(); // a second exposure cannot overwrite the first
    expect(st().attempt).toBe(1);
  });

  it("Retry keeps the learner's technique and AEC choices and unlocks the controls", () => {
    set("exposureMode", "aec");
    set("aecChambers", ["left", "right"]);
    set("kvp", 118);
    set("mas", 6.3);
    set("sidCm", 170);
    st().expose();
    st().retry();
    expect(st().phase).toBe("setup");
    expect(st().result).toBeNull();
    expect(st().attempt).toBe(2);
    expect(st().settings).toMatchObject({ exposureMode: "aec", aecChambers: ["left", "right"], kvp: 118, mas: 6.3, sidCm: 170 });
    set("kvp", 120);
    expect(st().settings?.kvp).toBe(120);
  });

  it("Restart returns kVp, mAs, SID, mode and AEC chambers to the case's starting state", () => {
    set("exposureMode", "aec");
    set("aecChambers", ["center"]);
    set("kvp", 118);
    set("mas", 6.3);
    set("sidCm", 170);
    set("rotationDeg", 0);
    st().expose();
    st().reset();
    expect(st().phase).toBe("setup");
    expect(st().result).toBeNull();
    expect(st().attempt).toBe(1);
    expect(st().settings).toEqual(chestPaErect.initialSettings);
    expect(st().settings?.aecChambers).toEqual([]);
  });

  it("Restart does not alias the case's initial settings (mutating state cannot corrupt the case)", () => {
    set("aecChambers", ["left"]);
    st().reset();
    set("aecChambers", ["right"]);
    expect(chestPaErect.initialSettings.aecChambers).toEqual([]);
  });

  it("produces the same result for the same settings (deterministic exposure)", () => {
    set("kvp", 112);
    st().expose();
    const first = st().result;
    st().retry();
    st().expose();
    expect(st().result).toEqual(first);
  });
});
