import { describe, expect, it } from "vitest";
import { elbowAp, elbowApAdultDemo } from "@/data/cases/elbow-ap";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import { elbowApExam } from "@/data/exams/xray/elbow-ap";
import type { SimulationSettings } from "@/domain/simulation";
import { evaluate } from "@/features/evaluation/engine";
import { checkIsDrawn, unregisteredVariants } from "@/features/radiograph/consistency";
import { renderRadiograph, type LumaImage } from "@/features/radiograph/pipeline";
import { buildRenderPlan } from "@/features/radiograph/plan";
import { wordingNsOf } from "@/features/radiograph/wording";
import { validateCase, validateExam } from "./validate";

/** A fully correct elbow AP attempt (left elbow): marker L inside the field, CR perpendicular at the mid-elbow joint, SID in the 100–110 cm ideal band (RAD-081). */
const ok: SimulationSettings = {
  projection: "elbow-ap",
  rotationDeg: 0,
  centralRay: { x: 0, y: 0 },
  collimation: { width: 0.56, height: 0.52 },
  sideMarker: "L",
  markerPosition: { x: -0.46, y: 0 },
  sidCm: 105,
  kvp: 70,
  mas: 2.5,
  exposureMode: "manual",
  aecChambers: [],
  motionInstruction: "remain-still",
};
const run = (patch: Partial<SimulationSettings> = {}) => evaluate(elbowAp, { ...ok, ...patch });
const check = (r: ReturnType<typeof run>, id: string) => r.checks.find((c) => c.ruleId === id)!;
const ids = (r: ReturnType<typeof run>) => r.criticalFindings.map((f) => f.id);

describe("Elbow AP exam data (S14.3)", () => {
  it("validates as an exam and a case, and names only registered variants", () => {
    expect(validateExam(elbowApExam)).toEqual([]);
    expect(validateCase(elbowApExam, elbowApAdultDemo)).toEqual([]);
    expect(unregisteredVariants(elbowApExam)).toEqual([]);
  });
  it("weights are 28 / 22 / 17 / 22 / 11 (S14.3-5) and sum to 100; no breathing category", () => {
    expect(elbowApExam.scoring.categoryWeights).toEqual({ positioning: 28, rotation: 22, centering: 17, exposure: 22, sid: 11 });
    expect(elbowApExam.availableBreathing).toBeUndefined();
  });
  it("uses only the generalised optional mechanisms: manual-only technique, fixed-side marker, no chin / shoulder / breathing / tube angle", () => {
    expect(elbowApExam.technique.aec).toBeUndefined();
    expect(elbowApExam.positioning.markerRule).toEqual({ kind: "fixed-side", side: "L" });
    expect(elbowApExam.controls.tubeAngulationDeg).toBeUndefined();
    expect(elbowApExam.choiceControls).toBeUndefined();
    expect(elbowApExam.bodyPart).toBe("elbow");
    expect(elbowApExam.detector).toEqual({ widthCm: 24, heightCm: 30 });
    expect(elbowApAdultDemo.initialSettings.chinPosition).toBeUndefined();
    expect(elbowApAdultDemo.initialSettings.breathing).toBeUndefined();
  });
  it("critical findings are the S6 set: wrong projection and visible motion, then the two marker ones (owner 2026-10-22)", () => {
    expect(elbowApExam.scoring.criticalFindings.map((f) => f.id)).toEqual(["wrong-projection", "patient-motion", "wrong-side-marker", "missing-marker"]);
  });
  it("starts in a state that is not the answer", () => {
    const r = evaluate(elbowAp, elbowAp.initialSettings);
    expect(r.score.passed).toBe(false);
    expect(r.score.total).toBeLessThan(50);
  });
  it("the left elbow and the image description agree (S14.3-5) and no chest-case wording leaks in", () => {
    expect(elbowApAdultDemo.patient).toMatchObject({ age: 31, sex: "male" });
    const all = JSON.stringify([elbowApExam, elbowApAdultDemo]);
    expect(all).not.toMatch(/الكاسيت/);
    expect(elbowApAdultDemo.radiograph.registryIds).toEqual(["A-018", "A-019"]);
    expect(wordingNsOf(elbowApAdultDemo.radiograph.projection)).toBe("elbow-ap");
  });
});

describe("a fully correct elbow AP attempt", () => {
  it("scores 100 with no critical finding", () => {
    const r = run();
    expect(r.checks.filter((c) => c.scored && c.outcome !== "pass").map((c) => c.ruleId)).toEqual([]);
    expect(ids(r)).toEqual([]);
    expect(r.score.total).toBe(100);
    expect(r.score.passed).toBe(true);
  });
});

describe("marker (O21 option A): the letter, presence and placement; no viewer-half check", () => {
  it("L passes on either half of the image", () => {
    const right = { markerPosition: { x: 0.46, y: 0 } };
    expect(check(run(right), "side-marker").outcome).toBe("pass");
    expect(ids(run(right))).toEqual([]);
  });
  it("R is the critical wrong-side marker; none is the critical missing marker", () => {
    expect(ids(run({ sideMarker: "R", markerPosition: { x: -0.46, y: 0 } }))).toEqual(["wrong-side-marker"]);
    const m = run({ sideMarker: null });
    expect(ids(m)).toEqual(["missing-marker"]);
    expect(m.score.passed).toBe(false);
  });
  it("a marker over the anatomy or outside the field is flagged", () => {
    expect(check(run({ markerPosition: { x: 0, y: 0 } }), "side-marker").outcome).toBe("partial");
    expect(check(run({ collimation: { width: 0.3, height: 0.62 } }), "side-marker").outcome).toBe("partial");
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
  it("the picture shows the rotation exactly when the check is not passed (consistency), with the elbow wording", () => {
    const fail = run({ rotationDeg: 8 }), pass = run({ rotationDeg: 2 });
    const plan = buildRenderPlan(fail.resultState, elbowAp);
    expect(plan.effects.map((e) => e.id)).toContain("rotation");
    expect(plan.anatomy.rotation).toBeNull(); // the chest rotation effect stays off
    expect(plan.limb?.rotation.kind).toBe("elbow-ap");
    expect(checkIsDrawn("rotation", "fail", plan)).toBe(true);
    const planOk = buildRenderPlan(pass.resultState, elbowAp);
    expect(planOk.effects.map((e) => e.id)).not.toContain("rotation");
    expect(planOk.limb).toBeUndefined();
  });
});

describe("technique: Bontrager p.166 kV band 65–75; the partial bands, SID band and reference point are teaching choices", () => {
  it.each([[70, "pass"], [65, "pass"], [75, "pass"], [62, "partial"], [78, "partial"], [50, "fail"], [95, "fail"]] as const)("%d kV → %s", (kvp, outcome) => {
    expect(check(run({ kvp }), "kvp").outcome).toBe(outcome);
  });
  it.each([[102, "pass"], [100, "pass"], [101, "pass"], [99, "partial"], [110, "pass"], [111, "partial"], [120, "partial"], [85, "fail"], [150, "fail"]] as const)("SID %d cm → %s", (sidCm, outcome) => {
    expect(check(run({ sidCm }), "sid").outcome).toBe(outcome);
  });
  it("no AEC: the technique has no aec section, the exposure model reads manual, low kV draws low penetration", () => {
    const r = run({ kvp: 50 });
    expect(r.resultState.technique.mode).toBe("manual");
    expect(buildRenderPlan(r.resultState, elbowAp).effects.map((e) => e.id)).toContain("low-penetration");
  });
  it("every teaching-choice band is named as such in the learner-visible text", () => {
    expect(check(run({ kvp: 62 }), "kvp").feedback.en).toMatch(/partial credit/i);
    expect(check(run({ sidCm: 120 }), "sid").feedback.en).toMatch(/textbook gives only a minimum|minimum/);
    expect(check(run({ rotationDeg: 8 }), "rotation").feedback.en).toMatch(/partial credit/i);
  });
});

describe("centring and collimation", () => {
  it("the mid-elbow target passes; a far-off ray fails", () => {
    expect(check(run(), "centering-vertical").outcome).toBe("pass");
    expect(check(run({ centralRay: { x: 0, y: 0.6 } }), "centering-vertical").outcome).toBe("fail");
    expect(check(run({ centralRay: { x: 0.8, y: 0 } }), "centering-lateral").outcome).toBe("fail");
  });
  it("a tight field clips the required anatomy and is drawn; a wide-open field is excess", () => {
    const tight = run({ collimation: { width: 0.3, height: 0.3 } });
    expect(check(tight, "collimation-clipping").outcome).toBe("fail");
    expect(buildRenderPlan(tight.resultState, elbowAp).effects.map((e) => e.id)).toContain("collimation-clipping");
    expect(check(run({ collimation: { width: 1, height: 1 } }), "collimation-excess").outcome).not.toBe("pass");
  });
});

describe("result image", () => {
  it("is representative only for the AP projection; the lateral selection is not simulated and is labelled", () => {
    expect(buildRenderPlan(run().resultState, elbowAp).representative).toBe(true);
    const wrong = run({ projection: "elbow-lateral" });
    expect(buildRenderPlan(wrong.resultState, elbowAp).representative).toBe(false);
    expect(check(wrong, "projection").outcome).toBe("fail");
    expect(ids(wrong)).toEqual(["wrong-projection"]); // S6: the engine labels the unsimulated projection and now gates on it
  });
  it("renders deterministically on a synthetic baseline and the rotation changes the pixels", () => {
    const spec = elbowAp.radiograph;
    const src: LumaImage = { width: 85, height: 110, data: Float32Array.from({ length: 85 * 110 }, (_, i) => 40 + ((i * 7) % 120)) };
    const draw = (patch: Partial<SimulationSettings>) => renderRadiograph(buildRenderPlan(run(patch).resultState, elbowAp), spec, src, 6).luma;
    const a = draw({ rotationDeg: 8 }), b = draw({ rotationDeg: 8 }), c = draw({ rotationDeg: 0 });
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
    expect(Buffer.from(a).equals(Buffer.from(c))).toBe(false);
  });
  it("the chest PA case is not touched by the elbow effect", () => {
    expect(chestPaErect.radiograph.limbRotation).toBeUndefined();
  });
});
