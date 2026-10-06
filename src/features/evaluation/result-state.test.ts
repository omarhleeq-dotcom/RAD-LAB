import { describe, expect, it } from "vitest";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import type { SimulationSettings } from "@/domain/simulation";
import { evaluate } from "./engine";

const s: SimulationSettings = {
  ...chestPaErect.initialSettings,
  projection: "pa-erect",
  rotationDeg: 6,
  centralRay: { x: 0.05, y: -0.05 },
  collimation: { width: 0.9, height: 0.8 },
  chinPosition: "elevated",
  shoulderPosition: "rolled-forward",
  sideMarker: "R",
  markerPosition: { x: 0.8, y: 0.7 },
  sidCm: 160,
  kvp: 105,
  mas: 4,
  exposureMode: "manual",
  breathing: "deep-inspiration-hold",
};

describe("renderer-facing result state", () => {
  const r = evaluate(chestPaErect, s);
  const st = r.resultState;

  it("contains every input the Session 4 renderer needs", () => {
    expect(st.schemaVersion).toBe(1);
    expect(st.caseId).toBe("chest-pa-erect");
    expect(st.geometry).toMatchObject({ projection: "pa-erect", rotationDeg: 6, sidCm: 160, centralRay: { x: 0.05, y: -0.05 } });
    expect(st.geometry.fieldCm.x2).toBeGreaterThan(st.geometry.fieldCm.x1);
    expect(st.patient).toMatchObject({ chin: "elevated", shoulders: "rolled-forward", breathing: "deep-inspiration-hold" });
    expect(st.patient.marker).toEqual({ side: "R", position: { x: 0.8, y: 0.7 } });
    expect(st.technique).toEqual({ mode: "manual", kvp: 105, manualMas: 4, aecChambers: [] });
    expect(st.exposure).toBe(r.exposure);
    for (const k of ["exposureRatio", "deviationIndex", "tendency", "quantumNoise", "penetration", "doseAwareness", "deliveredMas", "sid", "aec"]) {
      expect(st.exposure).toHaveProperty(k);
    }
  });

  it("has no displayed-brightness field: brightness is a renderer / display-processing concern", () => {
    expect(JSON.stringify(st)).not.toMatch(/bright|darkness|density/i);
  });

  it("is plain serialisable data (no functions, no React)", () => {
    expect(JSON.parse(JSON.stringify(st))).toEqual(st);
  });

  it("is deterministic and mirrors the evaluation's variants and failing checks", () => {
    expect(evaluate(chestPaErect, s).resultState).toEqual(st);
    expect(st.variants).toEqual(r.variants);
    const nonPass = r.checks.filter((c) => c.outcome !== "pass").map((c) => c.ruleId);
    expect(st.findings.map((f) => f.ruleId)).toEqual(nonPass);
  });

  it("reports anatomy clipping from the geometry", () => {
    const clipped = evaluate(chestPaErect, { ...s, collimation: { width: 0.9, height: 0.5 } }).resultState;
    expect(clipped.geometry.anatomyFullyIncluded).toBe(false);
    expect(clipped.geometry.clippedSides.length).toBeGreaterThan(0);
  });

  it("carries AEC state and chamber outcomes in AEC mode", () => {
    const a = evaluate(chestPaErect, { ...s, exposureMode: "aec", aecChambers: ["left", "right"] }).resultState;
    expect(a.technique).toMatchObject({ mode: "aec", aecChambers: ["left", "right"] });
    expect(a.exposure.aec?.chambers.filter((c) => c.active).map((c) => c.id)).toEqual(["left", "right"]);
    expect(a.exposure.sid.compensatedByAec).toBe(true);
  });

  it("is produced by pure logic: the score never depends on anything but settings", () => {
    expect(evaluate(chestPaErect, s).score).toEqual(evaluate(chestPaErect, { ...s }).score);
  });
});
