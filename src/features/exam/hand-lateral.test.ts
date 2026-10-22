import { describe, expect, it } from "vitest";
import { handLateral, handLateralAdultDemo } from "@/data/cases/hand-lateral";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import { handLateralExam } from "@/data/exams/xray/hand-lateral";
import type { SimulationSettings } from "@/domain/simulation";
import { evaluate } from "@/features/evaluation/engine";
import { checkIsDrawn, unregisteredVariants } from "@/features/radiograph/consistency";
import { renderRadiograph, type LumaImage } from "@/features/radiograph/pipeline";
import { buildRenderPlan } from "@/features/radiograph/plan";
import { wordingNsOf } from "@/features/radiograph/wording";
import { validateCase, validateExam } from "./validate";

/** A fully correct hand lateral attempt (left hand): marker L inside the field, CR perpendicular at the third MCP joint, SID ≥ 102 cm. */
const ok: SimulationSettings = {
  projection: "hand-lateral",
  rotationDeg: 0,
  centralRay: { x: 0, y: 0 },
  collimation: { width: 0.66, height: 1 },
  sideMarker: "L",
  markerPosition: { x: -0.55, y: 0 },
  sidCm: 105,
  kvp: 65,
  mas: 2.5,
  exposureMode: "manual",
  aecChambers: [],
  motionInstruction: "remain-still",
};
const run = (patch: Partial<SimulationSettings> = {}) => evaluate(handLateral, { ...ok, ...patch });
const check = (r: ReturnType<typeof run>, id: string) => r.checks.find((c) => c.ruleId === id)!;
const ids = (r: ReturnType<typeof run>) => r.criticalFindings.map((f) => f.id);

describe("Hand lateral (extension) exam data (S14.2b, S14.2-6)", () => {
  it("validates as an exam and a case, and names only registered variants", () => {
    expect(validateExam(handLateralExam)).toEqual([]);
    expect(validateCase(handLateralExam, handLateralAdultDemo)).toEqual([]);
    expect(unregisteredVariants(handLateralExam)).toEqual([]);
  });
  it("weights are 28 / 22 / 17 / 22 / 11 (S14.2-5) and sum to 100; no breathing category", () => {
    expect(handLateralExam.scoring.categoryWeights).toEqual({ positioning: 28, rotation: 22, centering: 17, exposure: 22, sid: 11 });
    expect(handLateralExam.availableBreathing).toBeUndefined();
  });
  it("uses only the generalised optional mechanisms: manual-only technique, fixed-side marker, no chin / shoulder / breathing / tube angle", () => {
    expect(handLateralExam.technique.aec).toBeUndefined();
    expect(handLateralExam.positioning.markerRule).toEqual({ kind: "fixed-side", side: "L" });
    expect(handLateralExam.controls.tubeAngulationDeg).toBeUndefined();
    expect(handLateralExam.choiceControls).toBeUndefined();
    expect(handLateralExam.bodyPart).toBe("hand");
    expect(handLateralExam.detector).toEqual({ widthCm: 24, heightCm: 30 });
    expect(handLateralAdultDemo.initialSettings.chinPosition).toBeUndefined();
    expect(handLateralAdultDemo.initialSettings.breathing).toBeUndefined();
  });
  it("critical findings are the S6 set: wrong projection and visible motion, then the two marker ones (owner 2026-10-22)", () => {
    expect(handLateralExam.scoring.criticalFindings.map((f) => f.id)).toEqual(["wrong-projection", "patient-motion", "wrong-side-marker", "missing-marker"]);
  });
  it("starts in a state that is not the answer", () => {
    const r = evaluate(handLateral, handLateral.initialSettings);
    expect(r.score.passed).toBe(false);
    expect(r.score.total).toBeLessThan(50);
  });
  it("the left hand and the image description agree (S14.2-8) and no chest-case wording leaks in", () => {
    expect(handLateralAdultDemo.patient).toMatchObject({ age: 31, sex: "male" });
    const all = JSON.stringify([handLateralExam, handLateralAdultDemo]);
    expect(all).not.toMatch(/الكاسيت/);
    expect(handLateralAdultDemo.radiograph.registryIds).toEqual(["A-016", "A-017"]);
    expect(wordingNsOf(handLateralAdultDemo.radiograph.projection)).toBe("hand-lateral");
  });
});

describe("a fully correct hand lateral attempt", () => {
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
    // right half: the thumb side has no room inside the tight field, so the field is opened to the detector edge and the marker sits clear of the region
    const right = { markerPosition: { x: 0.55, y: 0 } };
    expect(check(run(right), "side-marker").outcome).toBe("pass");
    expect(ids(run(right))).toEqual([]);
  });
  it("R is the critical wrong-side marker; none is the critical missing marker", () => {
    expect(ids(run({ sideMarker: "R", markerPosition: { x: -0.55, y: 0 } }))).toEqual(["wrong-side-marker"]);
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
    expect(check(a, "rotation").feedback.en).toMatch(/engine teaching choice/);
    expect(check(a, "rotation").feedback.en).not.toMatch(/clockwise|toward the left|toward the right/i);
  });
  it("the picture shows the rotation exactly when the check is not passed (consistency), with the hand wording", () => {
    const fail = run({ rotationDeg: 8 }), pass = run({ rotationDeg: 2 });
    const plan = buildRenderPlan(fail.resultState, handLateral);
    expect(plan.effects.map((e) => e.id)).toContain("rotation");
    expect(plan.anatomy.rotation).toBeNull(); // the chest rotation effect stays off
    expect(plan.limb?.rotation.kind).toBe("hand-lateral");
    expect(checkIsDrawn("rotation", "fail", plan)).toBe(true);
    const planOk = buildRenderPlan(pass.resultState, handLateral);
    expect(planOk.effects.map((e) => e.id)).not.toContain("rotation");
    expect(planOk.limb).toBeUndefined();
  });
});

describe("technique: Bontrager p.153 kV band 60–70; the partial bands, SID band and reference point are teaching choices", () => {
  it.each([[65, "pass"], [60, "pass"], [70, "pass"], [57, "partial"], [73, "partial"], [50, "fail"], [90, "fail"]] as const)("%d kV → %s", (kvp, outcome) => {
    expect(check(run({ kvp }), "kvp").outcome).toBe(outcome);
  });
  it.each([[102, "pass"], [110, "pass"], [100, "partial"], [120, "partial"], [85, "fail"], [150, "fail"]] as const)("SID %d cm → %s", (sidCm, outcome) => {
    expect(check(run({ sidCm }), "sid").outcome).toBe(outcome);
  });
  it("no AEC: the technique has no aec section, the exposure model reads manual, low kV draws low penetration", () => {
    const r = run({ kvp: 45 });
    expect(r.resultState.technique.mode).toBe("manual");
    expect(buildRenderPlan(r.resultState, handLateral).effects.map((e) => e.id)).toContain("low-penetration");
  });
  it("every teaching-choice band is named as such in the learner-visible text", () => {
    expect(check(run({ kvp: 57 }), "kvp").feedback.en).toMatch(/engine teaching choice/);
    expect(check(run({ sidCm: 120 }), "sid").feedback.en).toMatch(/engine teaching choice/);
    expect(check(run({ rotationDeg: 8 }), "rotation").feedback.en).toMatch(/engine teaching choice/);
  });
});

describe("centring and collimation", () => {
  it("the MCP 2–5 target passes; a far-off ray fails", () => {
    expect(check(run(), "centering-vertical").outcome).toBe("pass");
    expect(check(run({ centralRay: { x: 0, y: 0.7 } }), "centering-vertical").outcome).toBe("fail");
    expect(check(run({ centralRay: { x: 0.8, y: 0 } }), "centering-lateral").outcome).toBe("fail");
  });
  it("a tight field clips the required anatomy and is drawn; a wide-open field is no longer excess when only forced / marker-needed opening remains (S2)", () => {
    const tight = run({ collimation: { width: 0.4, height: 0.3 } });
    expect(check(tight, "collimation-clipping").outcome).toBe("fail");
    expect(buildRenderPlan(tight.resultState, handLateral).effects.map((e) => e.id)).toContain("collimation-clipping");
    // S2: the opening of a full-open field beyond what the ray position and the marker force is within this exam's margin, so it no
    // longer scores as excess (the margin value is an owner decision; see the RAD-068 part 3 report).
    expect(check(run({ collimation: { width: 1, height: 1 } }), "collimation-excess").outcome).toBe("pass");
  });
});

describe("result image", () => {
  it("is representative only for the lateral projection; the PA selection is not simulated and is labelled", () => {
    expect(buildRenderPlan(run().resultState, handLateral).representative).toBe(true);
    const wrong = run({ projection: "hand-pa" });
    expect(buildRenderPlan(wrong.resultState, handLateral).representative).toBe(false);
    expect(check(wrong, "projection").outcome).toBe("fail");
    expect(ids(wrong)).toEqual(["wrong-projection"]); // S6: the engine labels the unsimulated projection and now gates on it
  });
  it("renders deterministically on a synthetic baseline and the rotation changes the pixels", () => {
    const spec = handLateral.radiograph;
    const src: LumaImage = { width: 73, height: 104, data: Float32Array.from({ length: 73 * 104 }, (_, i) => 40 + ((i * 7) % 120)) };
    const draw = (patch: Partial<SimulationSettings>) => renderRadiograph(buildRenderPlan(run(patch).resultState, handLateral), spec, src, 6).luma;
    const a = draw({ rotationDeg: 8 }), b = draw({ rotationDeg: 8 }), c = draw({ rotationDeg: 0 });
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
    expect(Buffer.from(a).equals(Buffer.from(c))).toBe(false);
  });
  it("the chest PA case is not touched by the hand effect", () => {
    expect(chestPaErect.radiograph.limbRotation).toBeUndefined();
  });
});
