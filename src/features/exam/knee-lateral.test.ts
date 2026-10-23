import { describe, expect, it } from "vitest";
import { kneeLateral, kneeLateralAdultDemo } from "@/data/cases/knee-lateral";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import { kneeLateralExam } from "@/data/exams/xray/knee-lateral";
import type { SimulationSettings } from "@/domain/simulation";
import { evaluate } from "@/features/evaluation/engine";
import { checkIsDrawn, unregisteredVariants } from "@/features/radiograph/consistency";
import { renderRadiograph, type LumaImage } from "@/features/radiograph/pipeline";
import { buildRenderPlan } from "@/features/radiograph/plan";
import { wordingNsOf } from "@/features/radiograph/wording";
import { validateCase, validateExam } from "./validate";

/** A fully correct knee attempt (RIGHT knee): marker R inside the field on the lateral margin, CR at the knee joint, 6° cephalad (−6), SID ≥ 102 cm. */
const ok: SimulationSettings = {
  projection: "knee-lateral",
  rotationDeg: 0,
  centralRay: { x: 0, y: 0 },
  collimation: { width: 0.8, height: 0.52 },
  sideMarker: "R",
  markerPosition: { x: 0.7, y: 0 },
  sidCm: 105,
  kvp: 75,
  mas: 2.5,
  exposureMode: "manual",
  aecChambers: [],
  motionInstruction: "remain-still",
  tubeAngulationDeg: -6,
};
const run = (patch: Partial<SimulationSettings> = {}) => evaluate(kneeLateral, { ...ok, ...patch });
const check = (r: ReturnType<typeof run>, id: string) => r.checks.find((c) => c.ruleId === id)!;
const ids = (r: ReturnType<typeof run>) => r.criticalFindings.map((f) => f.id);

describe("Knee lateral exam data (S14.4)", () => {
  it("validates as an exam and a case, and names only registered variants", () => {
    expect(validateExam(kneeLateralExam)).toEqual([]);
    expect(validateCase(kneeLateralExam, kneeLateralAdultDemo)).toEqual([]);
    expect(unregisteredVariants(kneeLateralExam)).toEqual([]);
  });
  it("weights are 28 / 22 / 17 / 22 / 11 (S14.4-3) and sum to 100; no breathing category", () => {
    expect(kneeLateralExam.scoring.categoryWeights).toEqual({ positioning: 28, rotation: 22, centering: 17, exposure: 22, sid: 11 });
    expect(kneeLateralExam.availableBreathing).toBeUndefined();
  });
  it("uses only the generalised optional mechanisms: manual-only technique, fixed-side marker R (right side), tube angulation, no chin / shoulder / breathing", () => {
    expect(kneeLateralExam.technique.aec).toBeUndefined();
    expect(kneeLateralExam.positioning.markerRule).toEqual({ kind: "fixed-side", side: "R" });
    expect(kneeLateralExam.controls.tubeAngulationDeg).toBeDefined();
    expect(kneeLateralExam.choiceControls).toBeUndefined();
    expect(kneeLateralExam.bodyPart).toBe("knee");
    expect(kneeLateralExam.detector).toEqual({ widthCm: 24, heightCm: 30 });
    expect(kneeLateralAdultDemo.initialSettings.chinPosition).toBeUndefined();
    expect(kneeLateralAdultDemo.initialSettings.breathing).toBeUndefined();
  });
  it("critical findings are the S6 set: wrong projection and visible motion, then the two marker ones (owner 2026-10-22)", () => {
    expect(kneeLateralExam.scoring.criticalFindings.map((f) => f.id)).toEqual(["wrong-projection", "patient-motion", "wrong-side-marker", "missing-marker"]);
  });
  it("starts in a state that is not the answer", () => {
    const r = evaluate(kneeLateral, kneeLateral.initialSettings);
    expect(r.score.passed).toBe(false);
    expect(r.score.total).toBeLessThan(50);
  });
  it("the right knee and the registry agree (S14.4-2) and no chest-case wording or elbow wording leaks in", () => {
    const all = JSON.stringify([kneeLateralExam, kneeLateralAdultDemo]);
    expect(all).not.toMatch(/الكاسيت/);
    expect(all).not.toMatch(/\bleft knee\b|LEFT knee/i);
    expect(kneeLateralAdultDemo.radiograph.registryIds).toEqual(["A-024", "A-025"]);
    expect(wordingNsOf(kneeLateralAdultDemo.radiograph.projection)).toBe("knee-lateral");
  });
});

describe("a fully correct knee attempt", () => {
  it("scores 100 with no critical finding", () => {
    const r = run();
    expect(r.checks.filter((c) => c.scored && c.outcome !== "pass").map((c) => c.ruleId)).toEqual([]);
    expect(ids(r)).toEqual([]);
    expect(r.score.total).toBe(100);
    expect(r.score.passed).toBe(true);
  });
});

describe("marker (O21 option A, right side): the letter, presence and placement; no viewer-half check", () => {
  it("R passes on either half of the image", () => {
    const left = { markerPosition: { x: -0.7, y: 0 } };
    expect(check(run(left), "side-marker").outcome).toBe("pass");
    expect(ids(run(left))).toEqual([]);
  });
  it("L is the critical wrong-side marker; none is the critical missing marker", () => {
    expect(ids(run({ sideMarker: "L" }))).toEqual(["wrong-side-marker"]);
    const m = run({ sideMarker: null });
    expect(ids(m)).toEqual(["missing-marker"]);
    expect(m.score.passed).toBe(false);
  });
  it("a marker over the anatomy or outside the field is flagged", () => {
    expect(check(run({ markerPosition: { x: 0, y: 0 } }), "side-marker").outcome).toBe("partial");
    expect(check(run({ collimation: { width: 0.4, height: 0.52 } }), "side-marker").outcome).toBe("partial");
  });
});

describe("rotation: magnitude only; ±2° / ±5° are an engine teaching choice", () => {
  it.each([[0, "pass"], [2, "pass"], [-2, "pass"], [3, "partial"], [-5, "partial"], [6, "fail"], [-12, "fail"]] as const)("%d° → %s", (deg, outcome) => {
    expect(check(run({ rotationDeg: deg }), "rotation").outcome).toBe(outcome);
  });
  it("feedback and score are the same for both signs; the rule is labelled a teaching choice", () => {
    const a = run({ rotationDeg: 8 }), b = run({ rotationDeg: -8 });
    expect(check(a, "rotation").feedback.en).toBe(check(b, "rotation").feedback.en);
    expect(a.score.total).toBe(b.score.total);
    expect(check(a, "rotation").feedback.en).toMatch(/partial credit/i);
    expect(check(a, "rotation").feedback.en).not.toMatch(/clockwise|toward the left|toward the right/i);
  });
  it("the picture shows the rotation exactly when the check is not passed (consistency), with the knee wording", () => {
    const fail = run({ rotationDeg: 8 }), pass = run({ rotationDeg: 2 });
    const plan = buildRenderPlan(fail.resultState, kneeLateral);
    expect(plan.effects.map((e) => e.id)).toContain("rotation");
    expect(plan.anatomy.rotation).toBeNull(); // the chest rotation effect stays off
    expect(plan.limb?.rotation.kind).toBe("limb-copies");
    expect(checkIsDrawn("rotation", "fail", plan)).toBe(true);
    const planOk = buildRenderPlan(pass.resultState, kneeLateral);
    expect(planOk.effects.map((e) => e.id)).not.toContain("rotation");
    expect(planOk.limb).toBeUndefined();
  });
});

describe("tube angle: 5°–7° cephalad (Bontrager p.249, negative on the control); the 3°–10° partial band is a teaching choice", () => {
  it.each([[-6, "pass"], [-5, "pass"], [-7, "pass"], [-4, "partial"], [-9, "partial"], [0, "fail"], [-13, "fail"], [8, "fail"]] as const)("%d° → %s", (deg, outcome) => {
    expect(check(run({ tubeAngulationDeg: deg }), "angulation").outcome).toBe(outcome);
  });
  it("is feedback only (not drawn), says which way and names the partial band as a teaching choice", () => {
    expect(check(run({ tubeAngulationDeg: -9 }), "angulation").feedback.en).toMatch(/More cephalad than 5°–7°/);
    expect(check(run({ tubeAngulationDeg: -4 }), "angulation").feedback.en).toMatch(/Too little cephalad angle/);
    expect(check(run({ tubeAngulationDeg: -4 }), "angulation").feedback.en).toMatch(/partial credit/i);
    const plan = buildRenderPlan(run({ tubeAngulationDeg: 0 }).resultState, kneeLateral);
    expect(plan.effects.map((e) => e.id)).not.toContain("angulation");
  });
});

describe("technique: Bontrager p.249 kV band 70–80; the partial bands, SID band and reference point are teaching choices", () => {
  it.each([[75, "pass"], [70, "pass"], [80, "pass"], [67, "partial"], [83, "partial"], [55, "fail"], [95, "fail"]] as const)("%d kV → %s", (kvp, outcome) => {
    expect(check(run({ kvp }), "kvp").outcome).toBe(outcome);
  });
  it.each([[102, "pass"], [110, "pass"], [100, "partial"], [120, "partial"], [85, "fail"], [150, "fail"]] as const)("SID %d cm → %s", (sidCm, outcome) => {
    expect(check(run({ sidCm }), "sid").outcome).toBe(outcome);
  });
  it("no AEC: the technique has no aec section, the exposure model reads manual, low kV draws low penetration", () => {
    const r = run({ kvp: 45 });
    expect(r.resultState.technique.mode).toBe("manual");
    expect(buildRenderPlan(r.resultState, kneeLateral).effects.map((e) => e.id)).toContain("low-penetration");
  });
  it("every teaching-choice band is named as such in the learner-visible text", () => {
    expect(check(run({ kvp: 67 }), "kvp").feedback.en).toMatch(/partial credit/i);
    expect(check(run({ sidCm: 120 }), "sid").feedback.en).toMatch(/textbook gives only a minimum|minimum/);
    expect(check(run({ rotationDeg: 8 }), "rotation").feedback.en).toMatch(/partial credit/i);
  });
});

describe("centring and collimation", () => {
  it("the joint passes; a far-off ray fails", () => {
    expect(check(run(), "centering-vertical").outcome).toBe("pass");
    expect(check(run({ centralRay: { x: 0, y: 0.6 } }), "centering-vertical").outcome).toBe("fail");
    expect(check(run({ centralRay: { x: 0.8, y: 0 } }), "centering-lateral").outcome).toBe("fail");
  });
  it("a tight field clips the required anatomy and is drawn; a wide-open field is excess", () => {
    const tight = run({ collimation: { width: 0.3, height: 0.3 } });
    expect(check(tight, "collimation-clipping").outcome).toBe("fail");
    expect(buildRenderPlan(tight.resultState, kneeLateral).effects.map((e) => e.id)).toContain("collimation-clipping");
    expect(check(run({ collimation: { width: 1, height: 1 } }), "collimation-excess").outcome).not.toBe("pass");
  });
});

describe("result image", () => {
  it("is representative only for the lateral projection; the other selection is not simulated and is labelled", () => {
    expect(buildRenderPlan(run().resultState, kneeLateral).representative).toBe(true);
    const wrong = run({ projection: "knee-ap" });
    expect(buildRenderPlan(wrong.resultState, kneeLateral).representative).toBe(false);
    expect(check(wrong, "projection").outcome).toBe("fail");
    expect(ids(wrong)).toEqual(["wrong-projection"]); // S6: the engine labels the unsimulated projection and now gates on it
  });
  it("renders deterministically on a synthetic baseline and the rotation changes the pixels", () => {
    const spec = kneeLateral.radiograph;
    const src: LumaImage = { width: 113, height: 194, data: Float32Array.from({ length: 113 * 194 }, (_, i) => 40 + ((i * 7) % 120)) };
    const draw = (patch: Partial<SimulationSettings>) => renderRadiograph(buildRenderPlan(run(patch).resultState, kneeLateral), spec, src, 6).luma;
    const a = draw({ rotationDeg: 8 }), b = draw({ rotationDeg: 8 }), c = draw({ rotationDeg: 0 });
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
    expect(Buffer.from(a).equals(Buffer.from(c))).toBe(false);
  });
  it("the chest PA case is not touched by the knee effect", () => {
    expect(chestPaErect.radiograph.limbRotation).toBeUndefined();
  });
});
