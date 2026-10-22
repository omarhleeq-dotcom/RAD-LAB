import { describe, expect, it } from "vitest";
import { footAp, footApAdultDemo } from "@/data/cases/foot-ap";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import { footApExam } from "@/data/exams/xray/foot-ap";
import type { SimulationSettings } from "@/domain/simulation";
import { evaluate } from "@/features/evaluation/engine";
import { checkIsDrawn, unregisteredVariants } from "@/features/radiograph/consistency";
import { renderRadiograph, type LumaImage } from "@/features/radiograph/pipeline";
import { buildRenderPlan } from "@/features/radiograph/plan";
import { wordingNsOf } from "@/features/radiograph/wording";
import { validateCase, validateExam } from "./validate";

/** A fully correct foot AP (DP) attempt (RIGHT foot): marker R inside the field on the lateral margin, CR 10° toward the heel (cephalad = −10) at the base of the 3rd metatarsal, SID ≥ 102 cm. */
const ok: SimulationSettings = {
  projection: "foot-ap",
  rotationDeg: 0,
  centralRay: { x: 0, y: 0 },
  collimation: { width: 0.64, height: 0.84 },
  sideMarker: "R",
  markerPosition: { x: 0.54, y: 0 },
  sidCm: 105,
  kvp: 65,
  mas: 2.5,
  exposureMode: "manual",
  aecChambers: [],
  motionInstruction: "remain-still",
  tubeAngulationDeg: -10,
};
const run = (patch: Partial<SimulationSettings> = {}) => evaluate(footAp, { ...ok, ...patch });
const check = (r: ReturnType<typeof run>, id: string) => r.checks.find((c) => c.ruleId === id)!;
const ids = (r: ReturnType<typeof run>) => r.criticalFindings.map((f) => f.id);

describe("Foot AP (DP) exam data (S14.4)", () => {
  it("validates as an exam and a case, and names only registered variants", () => {
    expect(validateExam(footApExam)).toEqual([]);
    expect(validateCase(footApExam, footApAdultDemo)).toEqual([]);
    expect(unregisteredVariants(footApExam)).toEqual([]);
  });
  it("weights are 28 / 22 / 17 / 22 / 11 (S14.4-3) and sum to 100; no breathing category", () => {
    expect(footApExam.scoring.categoryWeights).toEqual({ positioning: 28, rotation: 22, centering: 17, exposure: 22, sid: 11 });
    expect(footApExam.availableBreathing).toBeUndefined();
  });
  it("uses only the generalised optional mechanisms: manual-only technique, fixed-side marker R (right side), tube angulation, no chin / shoulder / breathing", () => {
    expect(footApExam.technique.aec).toBeUndefined();
    expect(footApExam.positioning.markerRule).toEqual({ kind: "fixed-side", side: "R" });
    expect(footApExam.controls.tubeAngulationDeg).toBeDefined();
    expect(footApExam.choiceControls).toBeUndefined();
    expect(footApExam.bodyPart).toBe("foot");
    expect(footApExam.detector).toEqual({ widthCm: 24, heightCm: 30 });
    expect(footApAdultDemo.initialSettings.chinPosition).toBeUndefined();
    expect(footApAdultDemo.initialSettings.breathing).toBeUndefined();
  });
  it("critical findings are exactly the two marker ones (educator decision, provisional)", () => {
    expect(footApExam.scoring.criticalFindings.map((f) => f.id)).toEqual(["wrong-side-marker", "missing-marker"]);
  });
  it("starts in a state that is not the answer", () => {
    const r = evaluate(footAp, footAp.initialSettings);
    expect(r.score.passed).toBe(false);
    expect(r.score.total).toBeLessThan(50);
  });
  it("the right foot and the registry agree (S14.4-2) and no chest-case wording or elbow wording leaks in", () => {
    const all = JSON.stringify([footApExam, footApAdultDemo]);
    expect(all).not.toMatch(/الكاسيت/);
    expect(all).not.toMatch(/\bleft foot\b|LEFT foot/i);
    expect(footApAdultDemo.radiograph.registryIds).toEqual(["A-026", "A-027"]);
    expect(wordingNsOf(footApAdultDemo.radiograph.projection)).toBe("foot-ap");
  });
});

describe("a fully correct foot AP attempt", () => {
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
    const left = { markerPosition: { x: -0.55, y: 0 } };
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
    expect(check(run({ collimation: { width: 0.4, height: 0.84 } }), "side-marker").outcome).toBe("partial");
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
  it("the picture shows the rotation exactly when the check is not passed (consistency), with the foot wording", () => {
    const fail = run({ rotationDeg: 8 }), pass = run({ rotationDeg: 2 });
    const plan = buildRenderPlan(fail.resultState, footAp);
    expect(plan.effects.map((e) => e.id)).toContain("rotation");
    expect(plan.anatomy.rotation).toBeNull(); // the chest rotation effect stays off
    expect(plan.limb?.rotation.kind).toBe("limb-warp");
    expect(checkIsDrawn("rotation", "fail", plan)).toBe(true);
    const planOk = buildRenderPlan(pass.resultState, footAp);
    expect(planOk.effects.map((e) => e.id)).not.toContain("rotation");
    expect(planOk.limb).toBeUndefined();
  });
});

describe("tube angle: 10° toward the heel (cephalad, negative); the bands are a teaching choice", () => {
  it.each([[-10, "pass"], [-8, "pass"], [-12, "pass"], [-6, "partial"], [-14, "partial"], [0, "fail"], [10, "fail"]] as const)("%d° → %s", (deg, outcome) => {
    expect(check(run({ tubeAngulationDeg: deg }), "angulation").outcome).toBe(outcome);
  });
  it("is feedback only (not drawn) and says which way and for which arch", () => {
    expect(check(run({ tubeAngulationDeg: 0 }), "angulation").feedback.en).toMatch(/toward the heel/);
    expect(check(run({ tubeAngulationDeg: -14 }), "angulation").feedback.en).toMatch(/engine teaching choice/);
    const plan = buildRenderPlan(run({ tubeAngulationDeg: 0 }).resultState, footAp);
    expect(plan.effects.map((e) => e.id)).not.toContain("angulation");
  });
});

describe("technique: Bontrager p.232 kV band 60–70; the partial bands, SID band and reference point are teaching choices", () => {
  it.each([[65, "pass"], [60, "pass"], [70, "pass"], [57, "partial"], [73, "partial"], [45, "fail"], [90, "fail"]] as const)("%d kV → %s", (kvp, outcome) => {
    expect(check(run({ kvp }), "kvp").outcome).toBe(outcome);
  });
  it.each([[102, "pass"], [110, "pass"], [100, "partial"], [120, "partial"], [85, "fail"], [150, "fail"]] as const)("SID %d cm → %s", (sidCm, outcome) => {
    expect(check(run({ sidCm }), "sid").outcome).toBe(outcome);
  });
  it("no AEC: the technique has no aec section, the exposure model reads manual, low kV draws low penetration", () => {
    const r = run({ kvp: 45 });
    expect(r.resultState.technique.mode).toBe("manual");
    expect(buildRenderPlan(r.resultState, footAp).effects.map((e) => e.id)).toContain("low-penetration");
  });
  it("every teaching-choice band is named as such in the learner-visible text", () => {
    expect(check(run({ kvp: 57 }), "kvp").feedback.en).toMatch(/engine teaching choice/);
    expect(check(run({ sidCm: 120 }), "sid").feedback.en).toMatch(/engine teaching choice/);
    expect(check(run({ rotationDeg: 8 }), "rotation").feedback.en).toMatch(/engine teaching choice/);
  });
});

describe("centring and collimation", () => {
  it("the base of the 3rd metatarsal passes; a far-off ray fails", () => {
    expect(check(run(), "centering-vertical").outcome).toBe("pass");
    expect(check(run({ centralRay: { x: 0, y: 0.6 } }), "centering-vertical").outcome).toBe("fail");
    expect(check(run({ centralRay: { x: 0.8, y: 0 } }), "centering-lateral").outcome).toBe("fail");
  });
  it("a tight field clips the required anatomy and is drawn; a wide-open field is no longer excess when only forced / marker-needed opening remains (S2)", () => {
    const tight = run({ collimation: { width: 0.3, height: 0.3 } });
    expect(check(tight, "collimation-clipping").outcome).toBe("fail");
    expect(buildRenderPlan(tight.resultState, footAp).effects.map((e) => e.id)).toContain("collimation-clipping");
    // S2: the opening of a full-open field beyond what the ray position and the marker force is within this exam's margin, so it no
    // longer scores as excess (the margin value is an owner decision; see the RAD-068 part 3 report).
    expect(check(run({ collimation: { width: 1, height: 1 } }), "collimation-excess").outcome).toBe("pass");
  });
});

describe("result image", () => {
  it("is representative only for the AP projection; the oblique selection is not simulated and is labelled", () => {
    expect(buildRenderPlan(run().resultState, footAp).representative).toBe(true);
    const wrong = run({ projection: "foot-oblique" });
    expect(buildRenderPlan(wrong.resultState, footAp).representative).toBe(false);
    expect(check(wrong, "projection").outcome).toBe("fail");
    expect(ids(wrong)).toEqual([]); // no wrong-projection critical finding in v1 (O24)
  });
  it("renders deterministically on a synthetic baseline and the rotation changes the pixels", () => {
    const spec = footAp.radiograph;
    const src: LumaImage = { width: 106, height: 240, data: Float32Array.from({ length: 106 * 240 }, (_, i) => 40 + ((i * 7) % 120)) };
    const draw = (patch: Partial<SimulationSettings>) => renderRadiograph(buildRenderPlan(run(patch).resultState, footAp), spec, src, 6).luma;
    const a = draw({ rotationDeg: 8 }), b = draw({ rotationDeg: 8 }), c = draw({ rotationDeg: 0 });
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
    expect(Buffer.from(a).equals(Buffer.from(c))).toBe(false);
  });
  it("the chest PA case is not touched by the foot effect", () => {
    expect(chestPaErect.radiograph.limbRotation).toBeUndefined();
  });
});
