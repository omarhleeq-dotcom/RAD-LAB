import { describe, expect, it } from "vitest";
import { pelvisApSupine, pelvisApAdultDemo } from "@/data/cases/pelvis-ap-supine";
import { pelvisApSupineExam } from "@/data/exams/xray/pelvis-ap-supine";
import type { SimulationSettings } from "@/domain/simulation";
import { evaluate } from "@/features/evaluation/engine";
import { buildRenderPlan } from "@/features/radiograph/plan";
import { renderRadiograph } from "@/features/radiograph/pipeline";
import { needsNotDrawnLabel, unregisteredVariants } from "@/features/radiograph/consistency";
import { validateExam, validateCase } from "./validate";

export const PELVIS_OK: SimulationSettings = {
  projection: "pelvis-ap", rotationDeg: 0, centralRay: { x: 0, y: 0 }, collimation: { width: 0.98, height: 0.95 },
  sideMarker: "R", markerPosition: { x: -0.93, y: -0.6 }, sidCm: 102, kvp: 85, mas: 2.5,
  exposureMode: "manual", aecChambers: [], motionInstruction: "remain-still", tubeAngulationDeg: 0,
  choices: { legPosition: "internal", respiration: "suspend" },
};
const run = (patch: Partial<SimulationSettings> = {}) => evaluate(pelvisApSupine, { ...PELVIS_OK, ...patch });
const check = (p: Partial<SimulationSettings>, id: string) => run(p).checks.find(c => c.ruleId === id)!;
const plan = (p: Partial<SimulationSettings> = {}) => buildRenderPlan(run(p).resultState, pelvisApSupine);

describe("Pelvis AP reference and existing optional mechanisms", () => {
  it("validates, has a 100-point correct attempt and an intentionally incorrect initial state", () => {
    expect(validateExam(pelvisApSupineExam)).toEqual([]);
    expect(validateCase(pelvisApSupineExam, pelvisApAdultDemo)).toEqual([]);
    expect(unregisteredVariants(pelvisApSupineExam)).toEqual([]);
    expect(run().score.total).toBe(100);
    expect(run().score.passed).toBe(true);
    expect(evaluate(pelvisApSupine, pelvisApSupine.initialSettings).score.passed).toBe(false);
  });
  it("uses grid context, manual technique, phase-neutral respiration and no chest landmarks", () => {
    expect(pelvisApSupineExam.technique.system.grid).not.toBe("none");
    expect(pelvisApSupineExam.technique.aec).toBeUndefined();
    expect(pelvisApSupineExam.availableBreathing).toBeUndefined();
    for (const key of ["lungApexV", "diaphragmDomeV", "midlineU", "scapulae", "jaw"]) expect(pelvisApSupine.radiograph[key as keyof typeof pelvisApSupine.radiograph]).toBeUndefined();
    expect(plan().anatomy.inspiration).toBeNull();
  });
  it("scores leg stance, pelvic rotation and respiration independently", () => {
    const neutral = { choices: { legPosition: "neutral", respiration: "suspend" } };
    expect(check(neutral, "pelvis-legs").outcome).toBe("fail");
    expect(check(neutral, "rotation").outcome).toBe("pass");
    expect(check(neutral, "pelvis-respiration").outcome).toBe("pass");
    const breathing = { choices: { legPosition: "internal", respiration: "normal" } };
    expect(check(breathing, "pelvis-legs").outcome).toBe("pass");
    expect(check(breathing, "pelvis-respiration").outcome).toBe("fail");
    expect(plan(breathing).anatomy.inspiration).toBeNull();
    expect(needsNotDrawnLabel("pelvis-respiration", "fail", plan(breathing))).toBe(true);
  });
  it.each([[0,"pass"],[2,"pass"],[-2,"pass"],[3,"partial"],[-5,"partial"],[6,"fail"],[-15,"fail"]] as const)("pelvis rotation %d → %s", (r,outcome) => {
    expect(check({rotationDeg:r},"rotation").outcome).toBe(outcome);
    expect(plan({rotationDeg:r}).anatomy.rotation).toBeNull();
    expect(plan({rotationDeg:r}).limb !== undefined).toBe(Math.abs(r)>2);
  });
  it("uses the fixed R marker (letter only), gates missing/wrong letter, and flags overlap/outside", () => {
    expect(pelvisApSupineExam.positioning.markerRule).toEqual({ kind: "fixed-side", side: "R" });
    expect(run().criticalFindings).toEqual([]);
    // Only the letter is judged: R is accepted on either viewer half, L is wrong wherever it is placed.
    expect(run({sideMarker:"R",markerPosition:{x:0.93,y:-0.6}}).criticalFindings).toEqual([]);
    expect(run({sideMarker:null}).criticalFindings.map(f=>f.id)).toContain("missing-marker");
    expect(run({sideMarker:"L"}).criticalFindings.map(f=>f.id)).toContain("wrong-side-marker");
    expect(run({sideMarker:"L",markerPosition:{x:0.93,y:-0.6}}).criticalFindings.map(f=>f.id)).toContain("wrong-side-marker");
    expect(run({sideMarker:"L"}).score.passed).toBe(false);
    expect(check({markerPosition:{x:0.5,y:0}},"side-marker").outcome).toBe("partial");
    expect(check({markerPosition:{x:-1,y:-1}},"side-marker").outcome).toBe("partial");
  });
  it("clips anatomy visibly, records explicit educational bands, and keeps source-based kV", () => {
    expect(check({collimation:{width:0.5,height:0.5}},"collimation-clipping").outcome).toBe("fail");
    expect(plan({collimation:{width:0.5,height:0.5}}).effects.map(e=>e.id)).toContain("collimation-clipping");
    expect(check({kvp:80},"kvp").outcome).toBe("pass");
    expect(check({kvp:78},"kvp").outcome).toBe("partial");
    expect(check({kvp:70},"kvp").outcome).toBe("fail");
    expect(check({sidCm:120},"sid").feedback.en).toMatch(/teaching choice/);
    expect(check({rotationDeg:8},"rotation").feedback.en).toMatch(/teaching choice/);
  });
  it("changes pixels deterministically for rotation without synthesizing leg-angle anatomy", () => {
    const src={width:134,height:104,data:Float32Array.from({length:134*104},(_,i)=>35+(i*7)%160)};
    const draw=(p:Partial<SimulationSettings>)=>Buffer.from(renderRadiograph(plan(p),pelvisApSupine.radiograph,src,6).luma);
    expect(draw({rotationDeg:10}).equals(draw({rotationDeg:10}))).toBe(true);
    expect(draw({rotationDeg:10}).equals(draw({rotationDeg:0}))).toBe(false);
    expect(draw({choices:{legPosition:"external",respiration:"suspend"}}).equals(draw({}))).toBe(true);
  });
});
