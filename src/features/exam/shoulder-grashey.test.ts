import { describe, expect, it } from "vitest";
import { shoulderGrasheyErect, shoulderGrasheyAdultDemo } from "@/data/cases/shoulder-grashey-erect";
import { shoulderGrasheyErectExam } from "@/data/exams/xray/shoulder-grashey-erect";
import type { SimulationSettings } from "@/domain/simulation";
import { evaluate } from "@/features/evaluation/engine";
import { buildRenderPlan } from "@/features/radiograph/plan";
import { renderRadiograph } from "@/features/radiograph/pipeline";
import { needsNotDrawnLabel, unregisteredVariants } from "@/features/radiograph/consistency";
import { validateExam, validateCase } from "./validate";
import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";

export const SHOULDER_OK: SimulationSettings = {
  projection: "shoulder-grashey", rotationDeg: 40, centralRay: { x: 0, y: 0 }, collimation: { width: 0.53, height: 0.8 },
  sideMarker: "R", markerPosition: { x: 0.37, y: -0.38 }, sidCm: 102, kvp: 80, mas: 2,
  exposureMode: "manual", aecChambers: [], motionInstruction: "remain-still", tubeAngulationDeg: 0,
  choices: { armPosition: "neutral", respiration: "suspend" },
};
const run = (patch: Partial<SimulationSettings> = {}) => evaluate(shoulderGrasheyErect, { ...SHOULDER_OK, ...patch });
const check = (p: Partial<SimulationSettings>, id: string) => run(p).checks.find((c) => c.ruleId === id)!;
const plan = (p: Partial<SimulationSettings> = {}) => buildRenderPlan(run(p).resultState, shoulderGrasheyErect);

describe("Shoulder Grashey exam (erect) built from existing optional mechanisms", () => {
  it("validates, has a 100-point correct attempt and an intentionally incorrect initial state", () => {
    expect(validateExam(shoulderGrasheyErectExam)).toEqual([]);
    expect(validateCase(shoulderGrasheyErectExam, shoulderGrasheyAdultDemo)).toEqual([]);
    expect(unregisteredVariants(shoulderGrasheyErectExam)).toEqual([]);
    expect(run().score.total).toBe(100);
    expect(run().score.passed).toBe(true);
    expect(run().criticalFindings).toEqual([]);
    expect(evaluate(shoulderGrasheyErect, shoulderGrasheyErect.initialSettings).score.passed).toBe(false);
    expect(Object.values(shoulderGrasheyErectExam.scoring.categoryWeights).reduce((a, b) => a + b, 0)).toBe(100);
  });
  it("is erect-only and manual: one projection, no posture control, grid context, no chest landmarks", () => {
    expect(shoulderGrasheyErectExam.availableProjections).toEqual(["shoulder-grashey"]);
    expect(shoulderGrasheyErectExam.choiceControls?.map((c) => c.id)).toEqual(["armPosition", "respiration"]);
    expect(shoulderGrasheyErectExam.technique.system.grid).not.toBe("none");
    expect(shoulderGrasheyErectExam.technique.aec).toBeUndefined();
    expect(shoulderGrasheyErectExam.availableBreathing).toBeUndefined();
    for (const key of ["lungApexV", "diaphragmDomeV", "midlineU", "scapulae", "jaw"]) expect(shoulderGrasheyErect.radiograph[key as keyof typeof shoulderGrasheyErect.radiograph]).toBeUndefined();
    expect(plan().anatomy.inspiration).toBeNull();
    expect(shoulderGrasheyErectExam.detector).toEqual({ widthCm: 30, heightCm: 24 }); // 24 × 30 cm landscape (S-SHOULDER-3-1)
  });
  it("uses the source band 35°–45° as an equal-credit plateau; the 30°–50° partial band is a labelled teaching choice", () => {
    for (const r of [35, 36, 40, 44, 45]) expect(check({ rotationDeg: r }, "rotation").outcome).toBe("pass");
    for (const r of [30, 34, 46, 50]) expect(check({ rotationDeg: r }, "rotation").outcome).toBe("partial");
    for (const r of [0, 15, 29, 51, 60]) expect(check({ rotationDeg: r }, "rotation").outcome).toBe("fail");
    expect(check({ rotationDeg: 33 }, "rotation").feedback.en).toMatch(/teaching choice/);
    expect(check({ rotationDeg: 20 }, "rotation").feedback.en).toMatch(/less than 35°/);
    expect(check({ rotationDeg: 58 }, "rotation").feedback.en).toMatch(/more than 45°/);
  });
  it("scores body turn, arm position and respiration independently", () => {
    const arm = { choices: { armPosition: "internal", respiration: "suspend" } };
    expect(check(arm, "shoulder-arm").outcome).toBe("fail");
    expect(check(arm, "rotation").outcome).toBe("pass");
    expect(check(arm, "shoulder-respiration").outcome).toBe("pass");
    const breathing = { choices: { armPosition: "neutral", respiration: "normal" } };
    expect(check(breathing, "shoulder-arm").outcome).toBe("pass");
    expect(check(breathing, "shoulder-respiration").outcome).toBe("fail");
    expect(plan(breathing).anatomy.inspiration).toBeNull();
    expect(needsNotDrawnLabel("shoulder-respiration", "fail", plan(breathing))).toBe(true);
  });
  it("judges only the marker letter (fixed side R), gating missing / wrong letters, and flags overlap / outside", () => {
    expect(run({ sideMarker: "R", markerPosition: { x: 0.37, y: 0.5 } }).criticalFindings).toEqual([]);
    expect(run({ sideMarker: null }).criticalFindings.map((f) => f.id)).toContain("missing-marker");
    expect(run({ sideMarker: "L" }).criticalFindings.map((f) => f.id)).toContain("wrong-side-marker");
    expect(run({ sideMarker: "L" }).score.passed).toBe(false);
    expect(check({ markerPosition: { x: -0.2, y: 0 } }, "side-marker").outcome).toBe("partial"); // on the shoulder
    expect(check({ markerPosition: { x: 1, y: 1 } }, "side-marker").outcome).toBe("partial"); // outside the field
  });
  it("clips anatomy visibly, labels every teaching choice and keeps the source-backed values", () => {
    expect(check({ collimation: { width: 0.3, height: 0.5 } }, "collimation-clipping").outcome).toBe("fail");
    expect(plan({ collimation: { width: 0.3, height: 0.5 } }).effects.map((e) => e.id)).toContain("collimation-clipping");
    expect(check({ collimation: { width: 0.95, height: 0.95 } }, "collimation-excess").outcome).not.toBe("pass");
    for (const [kv, outcome] of [[80, "pass"], [75, "pass"], [85, "pass"], [72, "partial"], [60, "fail"]] as const) expect(check({ kvp: kv }, "kvp").outcome).toBe(outcome);
    expect(check({ kvp: 72 }, "kvp").feedback.en).toMatch(/teaching choice/);
    expect(check({ sidCm: 120 }, "sid").feedback.en).toMatch(/teaching choice/);
    expect(check({ sidCm: 102 }, "sid").outcome).toBe("pass");
    expect(check({ sidCm: 95 }, "sid").outcome).toBe("partial");
  });
  it("closes the joint space only outside the band, the same for both sides, and never draws the arm", () => {
    const src = { width: 134, height: 202, data: Float32Array.from({ length: 134 * 202 }, (_, i) => 35 + (i * 7) % 160) };
    const draw = (p: Partial<SimulationSettings>) => Buffer.from(renderRadiograph(plan(p), shoulderGrasheyErect.radiograph, src, 6).luma);
    expect(plan({ rotationDeg: 40 }).limb).toBeUndefined();
    expect(plan({ rotationDeg: 35 }).limb).toBeUndefined();
    expect(plan({ rotationDeg: 45 }).limb).toBeUndefined();
    expect(plan({ rotationDeg: 20 }).limb).toBeDefined();
    expect(draw({ rotationDeg: 20 }).equals(draw({ rotationDeg: 20 }))).toBe(true); // deterministic
    expect(draw({ rotationDeg: 20 }).equals(draw({ rotationDeg: 40 }))).toBe(false);
    expect(draw({ rotationDeg: 25 }).equals(draw({ rotationDeg: 55 }))).toBe(true); // distance -10 / +10 from the band: identical cue
    expect(draw({ choices: { armPosition: "external", respiration: "suspend" } }).equals(draw({}))).toBe(true);
  });
  it("has complete EN and AR text", () => {
    const rx = (o: unknown): string[] => (typeof o === "string" ? [o] : o && typeof o === "object" ? Object.values(o).flatMap(rx) : []);
    const text = rx(shoulderGrasheyErectExam.rules.map((r) => r.feedback)).concat(rx(shoulderGrasheyErectExam.title));
    expect(text.length).toBeGreaterThan(20);
    const enKeys = Object.keys(en.positioningShoulder).sort(), arKeys = Object.keys(ar.positioningShoulder).sort();
    expect(arKeys).toEqual(enKeys);
    expect(Object.keys(ar.sceneShoulder).sort()).toEqual(Object.keys(en.sceneShoulder).sort());
    expect(Object.keys(ar.radiograph["shoulder-grashey"].effects).sort()).toEqual(Object.keys(en.radiograph["shoulder-grashey"].effects).sort());
    expect(JSON.stringify([ar.positioningShoulder, ar.sceneShoulder, ar.radiograph["shoulder-grashey"], shoulderGrasheyErectExam.rules])).not.toMatch(/الكاسيت/);
  });
});
