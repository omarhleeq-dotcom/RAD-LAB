import { describe, expect, it } from "vitest";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import { chestLateralAdultDemo, chestLateralErect } from "@/data/cases/chest-lateral-erect";
import { chestLateralErectExam } from "@/data/exams/xray/chest-lateral-erect";
import type { SimulationSettings } from "@/domain/simulation";
import { evaluate } from "@/features/evaluation/engine";
import { renderRadiograph, lateralSeparation, type LumaImage } from "@/features/radiograph/pipeline";
import { buildRenderPlan } from "@/features/radiograph/plan";
import { unregisteredVariants, checkIsDrawn } from "@/features/radiograph/consistency";
import { validateCase, validateExam } from "./validate";

/** A fully correct lateral attempt (everything chosen appropriately): marker L in the viewer's-left margin. */
const ok: SimulationSettings = {
  projection: "lateral-left",
  rotationDeg: 0,
  centralRay: { x: 0, y: -0.14 },
  collimation: { width: 1, height: 0.86 },
  chinPosition: "elevated",
  shoulderPosition: "relaxed",
  sideMarker: "L",
  markerPosition: { x: -0.84, y: -0.44 },
  sidCm: 180,
  kvp: 120,
  mas: 6.3,
  exposureMode: "manual",
  aecChambers: [],
  breathing: "deep-inspiration-hold",
  motionInstruction: "remain-still",
  choices: { side: "L", arms: "raised" },
};
const run = (patch: Partial<SimulationSettings> = {}, choices: Record<string, string> = {}) =>
  evaluate(chestLateralErect, { ...ok, ...patch, choices: { ...ok.choices, ...choices } });
const check = (r: ReturnType<typeof run>, id: string) => r.checks.find((c) => c.ruleId === id)!;
const ids = (r: ReturnType<typeof run>) => r.criticalFindings.map((f) => f.id);
const text = (r: ReturnType<typeof run>, id: string) => check(r, id).feedback.en;

describe("Chest Lateral exam data (S12)", () => {
  it("validates as an exam and a case, and names only registered variants", () => {
    expect(validateExam(chestLateralErectExam)).toEqual([]);
    expect(validateCase(chestLateralErectExam, chestLateralAdultDemo)).toEqual([]);
    expect(unregisteredVariants(chestLateralErectExam)).toEqual([]);
  });

  it("reuses the PA weights (S10b-14) and the PA pass mark", () => {
    expect(chestLateralErectExam.scoring.categoryWeights).toEqual({ positioning: 25, rotation: 20, centering: 15, exposure: 20, sid: 10, breathing: 10 });
    expect(chestLateralErectExam.scoring.passThreshold).toBe(70);
  });

  it("uses the S11 mechanisms: detector-side marker rule, side + arms choice controls, 35 x 43 cm portrait detector", () => {
    expect(chestLateralErectExam.positioning.markerRule).toEqual({ kind: "detector-side", choiceId: "side" });
    expect(chestLateralErectExam.choiceControls?.map((c) => c.id)).toEqual(["side", "arms"]);
    expect(chestLateralErectExam.detector).toEqual({ widthCm: 35, heightCm: 43 });
    expect(chestLateralErectExam.controls.tubeAngulationDeg).toBeUndefined();
  });

  it("the composed case carries the exam's choice controls (the console renders them); Chest PA's has none", () => {
    expect(chestLateralErect.choiceControls?.map((c) => c.id)).toEqual(["side", "arms"]);
    expect("choiceControls" in chestPaErect).toBe(false);
  });

  it("starts in a state that is not the answer", () => {
    const r = evaluate(chestLateralErect, chestLateralErect.initialSettings);
    expect(r.score.passed).toBe(false);
    expect(r.score.total).toBeLessThan(50);
  });
});

describe("a fully correct lateral attempt", () => {
  it("scores 100 with no critical finding", () => {
    const r = run();
    expect(r.checks.filter((c) => c.scored && c.outcome !== "pass").map((c) => c.ruleId)).toEqual([]);
    expect(ids(r)).toEqual([]);
    expect(r.score.total).toBe(100);
    expect(r.score.passed).toBe(true);
  });
});

describe("side against the detector (S10b-4)", () => {
  it("the right side is wrong for this case; the marker letter is judged against the chosen side, not against the case", () => {
    const r = run({ sideMarker: "R", markerPosition: { x: 0.84, y: -0.44 } }, { side: "R" });
    expect(check(r, "side").outcome).toBe("fail");
    expect(check(r, "side-marker").outcome).toBe("pass"); // consistent with the chosen side
    expect(ids(r)).toEqual([]); // the wrong side is a scored positioning error, not a critical finding
  });
  it("a marker letter that differs from the side against the detector is the critical wrong-marker finding", () => {
    const r = run({ sideMarker: "R", markerPosition: { x: 0.84, y: -0.44 } });
    expect(ids(r)).toEqual(["wrong-side-marker"]);
    expect(check(r, "side-marker").outcome).toBe("partial");
    expect(r.score.passed).toBe(false);
  });
  it("the right letter on the other display half is only a non-critical display note: no fail, no deduction (S3 option D)", () => {
    const r = run({ markerPosition: { x: 0.84, y: -0.44 } });
    expect(ids(r)).toEqual([]);
    expect(check(r, "side-marker").outcome).toBe("pass");
    expect(check(r, "side-marker").credit).toBe(1);
    expect(text(r, "side-marker")).toMatch(/Note, not scored/);
    expect(r.score).toEqual(run().score);
    expect(r.score.passed).toBe(true);
  });
  it("the display-half note comes with another marker issue instead of hiding it, and a wrong letter stays critical in either half", () => {
    const outside = run({ markerPosition: { x: 0.84, y: -0.44 }, collimation: { width: 0.5, height: 0.86 } });
    expect(check(outside, "side-marker").outcome).toBe("partial");
    expect(text(outside, "side-marker")).toMatch(/outside the collimated field/);
    expect(text(outside, "side-marker")).toMatch(/Note, not scored/);
    for (const x of [-0.84, 0.84]) {
      const r = run({ sideMarker: "R", markerPosition: { x, y: -0.44 } }, { side: "L" });
      expect(ids(r), `R@${x}`).toEqual(["wrong-side-marker"]);
      expect(check(r, "side-marker").outcome, `R@${x}`).toBe("partial");
      expect(text(r, "side-marker"), `R@${x}`).toMatch(/marker letter is wrong/);
    }
  });
  it("a missing marker is a critical finding of its own (S11b mechanism), the numeric score is unchanged by the gate", () => {
    const r = run({ sideMarker: null });
    expect(ids(r)).toEqual(["missing-marker"]);
    expect(r.score.passed).toBe(false);
    expect(r.score.total).toBeLessThan(100); // the marker check is scored (weight 1) and now fails
  });
});

describe("arms and chin (Bontrager p.84-85, 94)", () => {
  it("arms not raised: scored fail and the critical finding arms-over-lungs", () => {
    const r = run({}, { arms: "lowered" });
    expect(check(r, "arms").outcome).toBe("fail");
    expect(ids(r)).toEqual(["arms-over-lungs"]);
    expect(r.score.passed).toBe(false);
  });
  it("arms raised never raises the finding", () => expect(ids(run())).toEqual([]));
  it("chin down is scored (and labelled 'not drawn' because the lateral baseline has no jaw overlay)", () => {
    const r = run({ chinPosition: "tucked" });
    expect(check(r, "chin").outcome).toBe("fail");
    const p = buildRenderPlan(r.resultState, chestLateralErect);
    expect(checkIsDrawn("chin", "fail", p)).toBe(false);
  });
});

describe("rotation: magnitude only (S12-3) and the ±2° / ±5° teaching bands", () => {
  it.each([[0, "pass"], [2, "pass"], [-2, "pass"], [3, "partial"], [-5, "partial"], [6, "fail"], [-12, "fail"]] as const)("%d° → %s", (deg, outcome) => {
    expect(check(run({ rotationDeg: deg }), "rotation").outcome).toBe(outcome);
  });
  it("the feedback and the score do not depend on the sign (no direction text)", () => {
    const a = run({ rotationDeg: 8 }), b = run({ rotationDeg: -8 });
    expect(text(a, "rotation")).toBe(text(b, "rotation"));
    expect(a.score.total).toBe(b.score.total);
    expect(check(a, "rotation").credit).toBe(check(b, "rotation").credit);
    expect(text(a, "rotation")).not.toMatch(/toward the detector|towards the detector|left side|right side/i);
  });
  it("the rule has no low / high direction texts at all", () => {
    const rule = chestLateralErectExam.rules.find((r) => r.id === "rotation")!;
    expect(rule.feedback.low).toBeUndefined();
    expect(rule.feedback.high).toBeUndefined();
  });
  it("documents the teaching-choice derivation (1 cm ≈ 2·a·sin θ with an assumed half-width)", () => {
    const rule = chestLateralErectExam.rules.find((r) => r.id === "rotation")!;
    expect(rule.evidence.note).toMatch(/ENGINE TEACHING CHOICE/);
    expect(rule.evidence.note).toMatch(/NOT|Neither|not a Bontrager value/i);
    // the derivation is consistent: 2 * 14 cm * sin(2°) ≈ 1 cm
    expect(2 * 14 * Math.sin((2 * Math.PI) / 180)).toBeCloseTo(1, 1);
  });
});

describe("kVp and SID wording is scored as the owner decided (S12-1: bands other than 110–125 and the 183 minimum are teaching choices)", () => {
  it.each([[110, "pass"], [125, "pass"], [100, "partial"], [109, "partial"], [126, "partial"], [150, "partial"], [90, "fail"]] as const)("%d kV → %s", (kvp, outcome) => {
    expect(check(run({ kvp }), "kvp").outcome).toBe(outcome);
  });
  it.each([[180, "pass"], [183, "pass"], [185, "pass"], [150, "partial"], [179, "partial"], [190, "partial"], [200, "partial"], [145, "fail"]] as const)("%d cm → %s", (sidCm, outcome) => {
    expect(check(run({ sidCm }), "sid").outcome).toBe(outcome);
  });
  it("labels the teaching choices as such, never as Bontrager, in the rule evidence", () => {
    for (const id of ["kvp", "sid"]) {
      const note = chestLateralErectExam.rules.find((r) => r.id === id)!.evidence.note ?? "";
      expect(note, id).toMatch(/TEACHING CHOICE/);
    }
  });
});

describe("exposure: no numeric mAs target, AEC = central chamber (S10b-2, S10b-9)", () => {
  it("the lateral path needs more exposure than the PA (provisional per-projection attenuation, direction only)", () => {
    const lat = evaluate(chestLateralErect, ok).exposure.targetMas;
    const pa = evaluate(chestLateralErect, { ...ok, projection: "pa-erect" }).exposure.targetMas;
    expect(lat / pa).toBeCloseTo(2, 10);
  });
  it("AEC on the central chamber alone terminates at the target; an outer chamber runs long", () => {
    const centre = run({ exposureMode: "aec", aecChambers: ["center"] });
    expect(check(centre, "aec-chambers").outcome).toBe("pass");
    expect(centre.exposure.deviationIndex).toBeCloseTo(0, 6);
    const anterior = run({ exposureMode: "aec", aecChambers: ["left"] });
    expect(check(anterior, "aec-chambers").outcome).not.toBe("pass");
    expect(anterior.exposure.deviationIndex).toBeGreaterThan(0);
  });
});

describe("a wrong projection in the lateral exam", () => {
  it("PA is a critical wrong-projection and the image is not representative", () => {
    const r = run({ projection: "pa-erect" });
    expect(ids(r)).toContain("wrong-projection");
    expect(buildRenderPlan(r.resultState, chestLateralErect).representative).toBe(false);
  });
});

describe("result image (S12): deterministic, driven by the result state only", () => {
  const W = 120, H = 166;
  const img: LumaImage = { width: W, height: H, data: Float32Array.from({ length: W * H }, (_, i) => 60 + ((i % W) * 3) % 120 + ((i / W) | 0) % 40) };
  const plan = (patch: Partial<SimulationSettings> = {}) => buildRenderPlan(run(patch).resultState, chestLateralErect);
  const draw = (patch: Partial<SimulationSettings> = {}) => renderRadiograph(plan(patch), chestLateralErect.radiograph, img, 6);

  it("the correct attempt is the baseline appearance of the lateral asset and is representative", () => {
    const p = plan();
    expect(p.representative).toBe(true);
    expect(p.assetId).toBe("chest-lateral-baseline");
    expect(p.effects.map((e) => e.id)).toEqual(["baseline", "marker"]);
    expect(p.marker?.wrongSide).toBe(false);
  });
  it("rotation outside the tolerance is drawn as a separation; within the tolerance nothing is drawn", () => {
    expect(plan({ rotationDeg: 1 }).anatomy.rotation).toBeNull();
    const p = plan({ rotationDeg: 10 });
    expect(p.anatomy.rotation).not.toBeNull();
    expect(p.effects.some((e) => e.id === "rotation")).toBe(true);
  });
  it("the separation is a posterior-rib doubling that grows with the value, and is the same mechanism for both signs", () => {
    const spec = chestLateralErect.radiograph;
    expect(spec.midlineU).toBeUndefined();
    const pos = plan({ rotationDeg: 10 }).anatomy.rotation!, neg = plan({ rotationDeg: -10 }).anatomy.rotation!;
    expect(pos.thoraxShiftU).toBeGreaterThan(0); // S12-2: positive = the second posterior copy moves toward the viewer's right (posterior)
    expect(neg.thoraxShiftU).toBeCloseTo(-pos.thoraxShiftU, 12);
    const late = lateralSeparation(0.8, pos, spec), early = lateralSeparation(0.12, pos, spec);
    expect(late.weight).toBeGreaterThan(early.weight);
    expect(early.weight).toBeCloseTo(0, 5); // nothing on the sternum side
    expect(Math.abs(plan({ rotationDeg: 15 }).anatomy.rotation!.thoraxShiftU)).toBeGreaterThan(Math.abs(pos.thoraxShiftU));
  });
  it("renders deterministically, rotation changes pixels only in the posterior half", () => {
    const a = draw(), b = draw(), r = draw({ rotationDeg: 10 });
    expect(Array.from(b.luma)).toEqual(Array.from(a.luma));
    const spec = chestLateralErect.radiograph;
    let diffAnterior = 0, diffPosterior = 0;
    const p = plan({ rotationDeg: 10 });
    const midX = (p.image.x1 + (spec.anatomyBox.u1 + 0.3 * (spec.anatomyBox.u2 - spec.anatomyBox.u1)) * p.image.widthCm) * 6;
    for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
      const d = Math.abs(r.luma[y * a.width + x]! - a.luma[y * a.width + x]!);
      if (d > 0) { if (x < midX) diffAnterior += d; else diffPosterior += d; }
    }
    expect(diffPosterior).toBeGreaterThan(0);
    expect(diffAnterior).toBe(0);
  });
  it("low exposure and motion reuse the PA effects", () => {
    expect(plan({ mas: 1 }).effects.some((e) => e.id === "low-exposure")).toBe(true);
    expect(plan({ motionInstruction: "none" }).effects.some((e) => e.id === "motion")).toBe(true);
  });
});
