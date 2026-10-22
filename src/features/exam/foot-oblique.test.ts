import { describe, expect, it } from "vitest";
import { footOblique, footObliqueAdultDemo } from "@/data/cases/foot-oblique";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import { footObliqueExam } from "@/data/exams/xray/foot-oblique";
import type { SimulationSettings } from "@/domain/simulation";
import { evaluate } from "@/features/evaluation/engine";
import { checkIsDrawn, unregisteredVariants } from "@/features/radiograph/consistency";
import { renderRadiograph, type LumaImage } from "@/features/radiograph/pipeline";
import { buildRenderPlan } from "@/features/radiograph/plan";
import { wordingNsOf } from "@/features/radiograph/wording";
import { validateCase, validateExam } from "./validate";

/** A fully correct foot AP medial oblique attempt (RIGHT foot): marker R inside the field on the lateral margin, CR 10° toward the heel (cephalad = −10) at the base of the 3rd metatarsal, SID ≥ 102 cm. */
const ok: SimulationSettings = {
  projection: "foot-oblique",
  rotationDeg: 40,
  centralRay: { x: 0, y: 0 },
  collimation: { width: 0.62, height: 0.8 },
  sideMarker: "R",
  markerPosition: { x: 0.5, y: 0 },
  sidCm: 105,
  kvp: 65,
  mas: 2.5,
  exposureMode: "manual",
  aecChambers: [],
  motionInstruction: "remain-still",
  tubeAngulationDeg: 0,
};
const run = (patch: Partial<SimulationSettings> = {}) => evaluate(footOblique, { ...ok, ...patch });
const check = (r: ReturnType<typeof run>, id: string) => r.checks.find((c) => c.ruleId === id)!;
const ids = (r: ReturnType<typeof run>) => r.criticalFindings.map((f) => f.id);

describe("Foot AP medial oblique exam data (S14.4)", () => {
  it("validates as an exam and a case, and names only registered variants", () => {
    expect(validateExam(footObliqueExam)).toEqual([]);
    expect(validateCase(footObliqueExam, footObliqueAdultDemo)).toEqual([]);
    expect(unregisteredVariants(footObliqueExam)).toEqual([]);
  });
  it("weights are 28 / 22 / 17 / 22 / 11 (S14.4-3) and sum to 100; no breathing category", () => {
    expect(footObliqueExam.scoring.categoryWeights).toEqual({ positioning: 28, rotation: 22, centering: 17, exposure: 22, sid: 11 });
    expect(footObliqueExam.availableBreathing).toBeUndefined();
  });
  it("uses only the generalised optional mechanisms: manual-only technique, fixed-side marker R (right side), tube angulation, no chin / shoulder / breathing", () => {
    expect(footObliqueExam.technique.aec).toBeUndefined();
    expect(footObliqueExam.positioning.markerRule).toEqual({ kind: "fixed-side", side: "R" });
    expect(footObliqueExam.controls.tubeAngulationDeg).toBeDefined();
    expect(footObliqueExam.choiceControls).toBeUndefined();
    expect(footObliqueExam.bodyPart).toBe("foot");
    expect(footObliqueExam.detector).toEqual({ widthCm: 24, heightCm: 30 });
    expect(footObliqueAdultDemo.initialSettings.chinPosition).toBeUndefined();
    expect(footObliqueAdultDemo.initialSettings.breathing).toBeUndefined();
  });
  it("critical findings are exactly the two marker ones (educator decision, provisional)", () => {
    expect(footObliqueExam.scoring.criticalFindings.map((f) => f.id)).toEqual(["wrong-side-marker", "missing-marker"]);
  });
  it("starts in a state that is not the answer", () => {
    const r = evaluate(footOblique, footOblique.initialSettings);
    expect(r.score.passed).toBe(false);
    expect(r.score.total).toBeLessThan(50);
  });
  it("the right foot and the registry agree (S14.4-2) and no chest-case wording or elbow wording leaks in", () => {
    const all = JSON.stringify([footObliqueExam, footObliqueAdultDemo]);
    expect(all).not.toMatch(/الكاسيت/);
    expect(all).not.toMatch(/\bleft foot\b|LEFT foot/i);
    expect(footObliqueAdultDemo.radiograph.registryIds).toEqual(["A-028", "A-029"]);
    expect(wordingNsOf(footObliqueAdultDemo.radiograph.projection)).toBe("foot-oblique");
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
    const left = { markerPosition: { x: -0.5, y: 0 } };
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
    expect(check(run({ collimation: { width: 0.4, height: 0.8 } }), "side-marker").outcome).toBe("partial");
  });
});

describe("obliquity: the console value is the absolute plantar angle; 30°–40° is Bontrager, the 25°–45° band a teaching choice", () => {
  it.each([[40, "pass"], [30, "pass"], [35, "pass"], [27, "partial"], [44, "partial"], [20, "fail"], [55, "fail"], [0, "fail"]] as const)("%d° → %s", (deg, outcome) => {
    expect(check(run({ rotationDeg: deg }), "rotation").outcome).toBe(outcome);
  });
  it("says which way (the value is a real angle) and names the partial band as a teaching choice", () => {
    expect(check(run({ rotationDeg: 20 }), "rotation").feedback.en).toMatch(/less than the 30°–40°/);
    expect(check(run({ rotationDeg: 55 }), "rotation").feedback.en).toMatch(/more than the 30°–40°/);
    expect(check(run({ rotationDeg: 27 }), "rotation").feedback.en).toMatch(/engine teaching choice/);
  });
  it("the picture shows the effect exactly when the check is not passed (consistency), with the foot wording; 40° is the baseline", () => {
    const fail = run({ rotationDeg: 20 }), pass = run({ rotationDeg: 40 });
    const plan = buildRenderPlan(fail.resultState, footOblique);
    expect(plan.effects.map((e) => e.id)).toContain("rotation");
    expect(plan.anatomy.rotation).toBeNull(); // the chest rotation effect stays off
    expect(plan.limb?.rotation.kind).toBe("limb-warp");
    expect(checkIsDrawn("rotation", "fail", plan)).toBe(true);
    const planOk = buildRenderPlan(pass.resultState, footOblique);
    expect(planOk.effects.map((e) => e.id)).not.toContain("rotation");
    expect(planOk.limb).toBeUndefined();
  });
  it("the displacement grows with the distance from 40° and its sign follows the sign of the deviation (pinned by the model)", () => {
    const p = (d: number) => buildRenderPlan(run({ rotationDeg: d }).resultState, footOblique).limb!.rotation;
    expect(Math.sign(p(20).shiftU)).toBe(-Math.sign(p(60).shiftU));
    expect(Math.abs(p(26).shiftU)).toBeGreaterThan(Math.abs(p(27).shiftU));
    expect(Math.abs(p(44).shiftU)).toBeGreaterThan(Math.abs(p(42).shiftU));
  });
});

describe("tube angle: perpendicular for the medial oblique (Bontrager p.233); the ±2° / ±5° bands are a teaching choice", () => {
  it.each([[0, "pass"], [2, "pass"], [-2, "pass"], [4, "partial"], [-5, "partial"], [10, "fail"], [-12, "fail"]] as const)("%d° → %s", (deg, outcome) => {
    expect(check(run({ tubeAngulationDeg: deg }), "angulation").outcome).toBe(outcome);
  });
  it("is feedback only (not drawn) and says which way", () => {
    expect(check(run({ tubeAngulationDeg: -10 }), "angulation").feedback.en).toMatch(/cephalad \(toward the heel\)/);
    expect(check(run({ tubeAngulationDeg: 10 }), "angulation").feedback.en).toMatch(/caudad \(toward the toes\)/);
    const plan = buildRenderPlan(run({ tubeAngulationDeg: 10 }).resultState, footOblique);
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
    expect(buildRenderPlan(r.resultState, footOblique).effects.map((e) => e.id)).toContain("low-penetration");
  });
  it("every teaching-choice band is named as such in the learner-visible text", () => {
    expect(check(run({ kvp: 57 }), "kvp").feedback.en).toMatch(/engine teaching choice/);
    expect(check(run({ sidCm: 120 }), "sid").feedback.en).toMatch(/engine teaching choice/);
    expect(check(run({ rotationDeg: 27 }), "rotation").feedback.en).toMatch(/engine teaching choice/);
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
    expect(buildRenderPlan(tight.resultState, footOblique).effects.map((e) => e.id)).toContain("collimation-clipping");
    // S2: the opening of a full-open field beyond what the ray position and the marker force is within this exam's margin, so it no
    // longer scores as excess (the margin value is an owner decision; see the RAD-068 part 3 report).
    expect(check(run({ collimation: { width: 1, height: 1 } }), "collimation-excess").outcome).toBe("pass");
  });
});

describe("result image", () => {
  it("is representative only for the medial oblique projection; the AP selection is not simulated and is labelled", () => {
    expect(buildRenderPlan(run().resultState, footOblique).representative).toBe(true);
    const wrong = run({ projection: "foot-ap" });
    expect(buildRenderPlan(wrong.resultState, footOblique).representative).toBe(false);
    expect(check(wrong, "projection").outcome).toBe("fail");
    expect(ids(wrong)).toEqual([]); // no wrong-projection critical finding in v1 (O24)
  });
  it("renders deterministically on a synthetic baseline and the rotation changes the pixels", () => {
    const spec = footOblique.radiograph;
    const src: LumaImage = { width: 108, height: 196, data: Float32Array.from({ length: 108 * 196 }, (_, i) => 40 + ((i * 7) % 120)) };
    const draw = (patch: Partial<SimulationSettings>) => renderRadiograph(buildRenderPlan(run(patch).resultState, footOblique), spec, src, 6).luma;
    const a = draw({ rotationDeg: 20 }), b = draw({ rotationDeg: 20 }), c = draw({ rotationDeg: 40 });
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
    expect(Buffer.from(a).equals(Buffer.from(c))).toBe(false);
  });
  it("the chest PA case is not touched by the foot effect", () => {
    expect(chestPaErect.radiograph.limbRotation).toBeUndefined();
  });
});
