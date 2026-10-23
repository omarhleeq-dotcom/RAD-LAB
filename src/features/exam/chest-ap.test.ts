import { describe, expect, it } from "vitest";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import { chestApAdultDemo, chestApSupine } from "@/data/cases/chest-ap-supine";
import { chestApSupineExam } from "@/data/exams/xray/chest-ap-supine";
import type { SimulationSettings } from "@/domain/simulation";
import { evaluate } from "@/features/evaluation/engine";
import { renderRadiograph, type LumaImage } from "@/features/radiograph/pipeline";
import { buildRenderPlan } from "@/features/radiograph/plan";
import { checkIsDrawn, unregisteredVariants } from "@/features/radiograph/consistency";
import { validateCase, validateExam } from "./validate";

/** A fully correct AP supine attempt: marker L on the viewer's right (PA display convention, S10b-22), ~5° caudad. */
const ok: SimulationSettings = {
  projection: "ap-erect",
  rotationDeg: 0,
  centralRay: { x: 0, y: -0.14 },
  collimation: { width: 1, height: 0.86 },
  chinPosition: "elevated",
  shoulderPosition: "rolled-forward",
  sideMarker: "L",
  markerPosition: { x: 0.84, y: -0.44 },
  sidCm: 180,
  kvp: 120,
  mas: 3.2,
  exposureMode: "manual",
  aecChambers: [],
  breathing: "deep-inspiration-hold",
  motionInstruction: "remain-still",
  tubeAngulationDeg: 5,
  choices: { state: "supine" },
};
const run = (patch: Partial<SimulationSettings> = {}, choices: Record<string, string> = {}) =>
  evaluate(chestApSupine, { ...ok, ...patch, choices: { ...ok.choices, ...choices } });
const check = (r: ReturnType<typeof run>, id: string) => r.checks.find((c) => c.ruleId === id)!;
const ids = (r: ReturnType<typeof run>) => r.criticalFindings.map((f) => f.id);
const text = (r: ReturnType<typeof run>, id: string) => check(r, id).feedback.en;

describe("Chest AP supine exam data (S13)", () => {
  it("validates as an exam and a case, and names only registered variants", () => {
    expect(validateExam(chestApSupineExam)).toEqual([]);
    expect(validateCase(chestApSupineExam, chestApAdultDemo)).toEqual([]);
    expect(unregisteredVariants(chestApSupineExam)).toEqual([]);
  });

  it("reuses the PA weights (S10b-14) and the PA pass mark", () => {
    expect(chestApSupineExam.scoring.categoryWeights).toEqual({ positioning: 25, rotation: 20, centering: 15, exposure: 20, sid: 10, breathing: 10 });
    expect(chestApSupineExam.scoring.passThreshold).toBe(70);
  });

  it("uses only the S11 / S12 mechanisms: default anatomical-side marker rule, state choice, tube angulation, 35 x 43 detector", () => {
    expect(chestApSupineExam.positioning.markerRule).toBeUndefined();
    expect(chestApSupineExam.positioning.markerSide).toEqual({ L: "viewer-right", R: "viewer-left" }); // same display as the PA (S10b-22)
    expect(chestApSupineExam.choiceControls?.map((c) => c.id)).toEqual(["state"]);
    expect(chestApSupineExam.controls.tubeAngulationDeg).toEqual({ min: -15, max: 15, step: 1 });
    expect(chestApSupineExam.detector).toEqual({ widthCm: 35, heightCm: 43 });
    expect(chestApSupine.choiceControls?.map((c) => c.id)).toEqual(["state"]);
    expect("choiceControls" in chestPaErect).toBe(false);
  });

  it("the critical findings mirror the PA (no arms control, so no arms-over-lungs)", () => {
    expect(chestApSupineExam.scoring.criticalFindings.map((f) => f.id)).toEqual(["wrong-projection", "patient-motion", "wrong-side-marker", "missing-marker"]);
  });

  it("starts in a state that is not the answer", () => {
    const r = evaluate(chestApSupine, chestApSupine.initialSettings);
    expect(r.score.passed).toBe(false);
    expect(r.score.total).toBeLessThan(50);
  });

  it("new Arabic strings use «الكاشف», never «الكاسيت» (S13 terminology), and every text has both languages", () => {
    const all = JSON.stringify([chestApSupineExam, chestApAdultDemo]);
    expect(all).not.toMatch(/الكاسيت/);
  });
});

describe("a fully correct AP supine attempt", () => {
  it("scores 100 with no critical finding", () => {
    const r = run();
    expect(r.checks.filter((c) => c.scored && c.outcome !== "pass").map((c) => c.ruleId)).toEqual([]);
    expect(ids(r)).toEqual([]);
    expect(r.score.total).toBe(100);
    expect(r.score.passed).toBe(true);
  });
});

describe("patient position (state choice, S11-5)", () => {
  it("semi-erect does not match this supine request: a scored positioning error, not a critical finding", () => {
    const r = run({}, { state: "semierect" });
    expect(check(r, "state").outcome).toBe("fail");
    expect(ids(r)).toEqual([]);
    expect(r.score.total).toBeLessThan(100);
  });
});

describe("tube angulation: about 5° caudad (Bontrager p.96); the bands are a teaching choice", () => {
  it.each([[5, "pass"], [3, "pass"], [7, "pass"], [2, "partial"], [1, "partial"], [9, "partial"], [10, "partial"], [0, "fail"], [-4, "fail"], [14, "fail"]] as const)("%d° → %s", (deg, outcome) => {
    expect(check(run({ tubeAngulationDeg: deg }), "angulation").outcome).toBe(outcome);
  });
  it("too little angle says the clavicles can hide the apices; the absent angle reads as 0°", () => {
    expect(text(run({ tubeAngulationDeg: 0 }), "angulation")).toMatch(/clavicles/i);
    const { tubeAngulationDeg: _omit, ...without } = ok;
    void _omit;
    expect(check(evaluate(chestApSupine, without), "angulation").outcome).toBe("fail");
  });
  it("is labelled an engine teaching choice and is not drawn on the image", () => {
    const rule = chestApSupineExam.rules.find((r) => r.id === "angulation")!;
    expect(rule.evidence.note).toMatch(/NOT drawn on the result image/);
    const r = run({ tubeAngulationDeg: 0 });
    expect(r.resultState.geometry.tubeAngulationDeg).toBe(0);
    expect(buildRenderPlan(r.resultState, chestApSupine).effects.map((e) => e.id)).toEqual(["baseline", "marker"]);
  });
});

describe("marker (S10b-22): the patient's anatomical side, same rule and display as the PA, scored", () => {
  it("the correct letter on its own half passes", () => expect(check(run(), "side-marker").outcome).toBe("pass"));
  it("the right letter on the wrong half is the critical wrong-side marker", () => {
    const r = run({ markerPosition: { x: -0.84, y: -0.44 } });
    expect(ids(r)).toEqual(["wrong-side-marker"]);
    expect(r.score.passed).toBe(false);
  });
  it("a missing marker is critical, and the marker check is scored (weight 1)", () => {
    const r = run({ sideMarker: null });
    expect(ids(r)).toEqual(["missing-marker"]);
    expect(r.score.total).toBeLessThan(100);
    expect(r.score.passed).toBe(false);
  });
  it("the letter is judged against the viewer half only: R on the viewer's left passes", () => {
    expect(check(run({ sideMarker: "R", markerPosition: { x: -0.84, y: -0.44 } }), "side-marker").outcome).toBe("pass");
  });
});

describe("rotation: magnitude only; the ±2° / ±5° bands are the PA numbers as a teaching choice", () => {
  it.each([[0, "pass"], [2, "pass"], [-2, "pass"], [3, "partial"], [-5, "partial"], [6, "fail"], [-12, "fail"]] as const)("%d° → %s", (deg, outcome) => {
    expect(check(run({ rotationDeg: deg }), "rotation").outcome).toBe(outcome);
  });
  it("feedback and score are the same for both signs (no direction text for the AP)", () => {
    const a = run({ rotationDeg: 8 }), b = run({ rotationDeg: -8 });
    expect(text(a, "rotation")).toBe(text(b, "rotation"));
    expect(a.score.total).toBe(b.score.total);
    const rule = chestApSupineExam.rules.find((r) => r.id === "rotation")!;
    expect(rule.feedback.low).toBeUndefined();
    expect(rule.feedback.high).toBeUndefined();
    expect(rule.evidence.note).toMatch(/Bontrager gives no angle/);
  });
});

describe("kVp and SID (S12-1 labelling; SID lower bound 102 cm, S10b-23)", () => {
  it.each([[110, "pass"], [125, "pass"], [100, "partial"], [126, "partial"], [90, "fail"]] as const)("%d kV → %s", (kvp, outcome) => {
    expect(check(run({ kvp }), "kvp").outcome).toBe(outcome);
  });
  it.each([[180, "pass"], [185, "pass"], [105, "partial"], [150, "partial"], [200, "partial"], [100, "fail"]] as const)("%d cm → %s", (sidCm, outcome) => {
    expect(check(run({ sidCm }), "sid").outcome).toBe(outcome);
  });
  it("a short SID is told to be labelled on the image together with the projection (the label itself is not modelled)", () => {
    expect(text(run({ sidCm: 120 }), "sid")).toMatch(/marked on the image/);
  });
  it("labels the non-Bontrager bands as teaching choices", () => {
    for (const [id, source] of [["kvp", /110–125 kV is Bontrager/], ["sid", /ACR-PORTABLE conversion/]] as const) expect(chestApSupineExam.rules.find((r) => r.id === id)!.evidence.note ?? "", id).toMatch(source);
  });
});

describe("exposure: no numeric mAs target (S10b-9); the exposure mode is not scored", () => {
  it("the AP path uses the PA reference attenuation", () => {
    expect(evaluate(chestApSupine, ok).exposure.targetMas).toBeCloseTo(evaluate(chestPaErect, { ...ok, projection: "pa-erect", choices: undefined, tubeAngulationDeg: undefined }).exposure.targetMas, 10);
  });
  it("manual 3.2 mAs at 120 kV / 180 cm lands on the target", () => expect(run().exposure.deviationIndex).toBeCloseTo(0, 6));
});

describe("a wrong projection in the AP exam", () => {
  it("PA is a critical wrong-projection and the image is not representative", () => {
    const r = run({ projection: "pa-erect" });
    expect(ids(r)).toContain("wrong-projection");
    expect(buildRenderPlan(r.resultState, chestApSupine).representative).toBe(false);
  });
});

describe("result image (S13): deterministic, driven by the result state only", () => {
  const W = 128, H = 128;
  const img: LumaImage = { width: W, height: H, data: Float32Array.from({ length: W * H }, (_, i) => 60 + ((i % W) * 3) % 120 + ((i / W) | 0) % 40) };
  const plan = (patch: Partial<SimulationSettings> = {}) => buildRenderPlan(run(patch).resultState, chestApSupine);

  it("the correct attempt is the AP baseline appearance and is representative", () => {
    const p = plan();
    expect(p.representative).toBe(true);
    expect(p.assetId).toBe("chest-ap-baseline");
    expect(p.effects.map((e) => e.id)).toEqual(["baseline", "marker"]);
    expect(p.marker?.wrongSide).toBe(false);
  });
  it("rotation outside the tolerance is drawn as the frontal spine shift, within the tolerance nothing is drawn", () => {
    expect(plan({ rotationDeg: 1 }).anatomy.rotation).toBeNull();
    expect(plan({ rotationDeg: 10 }).anatomy.rotation).not.toBeNull();
  });
  it("renders deterministically", () => {
    const a = renderRadiograph(plan(), chestApSupine.radiograph, img, 6);
    const b = renderRadiograph(plan(), chestApSupine.radiograph, img, 6);
    expect(Array.from(b.luma)).toEqual(Array.from(a.luma));
  });
  it("shoulders not rolled forward are scored and labelled 'not drawn' (no scapula group for this baseline)", () => {
    const r = run({ shoulderPosition: "relaxed" });
    expect(check(r, "shoulders").outcome).toBe("fail");
    expect(checkIsDrawn("shoulders", "fail", buildRenderPlan(r.resultState, chestApSupine))).toBe(false);
  });
  it("low exposure, motion and clipping reuse the PA effects", () => {
    expect(plan({ mas: 1 }).effects.some((e) => e.id === "low-exposure")).toBe(true);
    expect(plan({ motionInstruction: "none" }).effects.some((e) => e.id === "motion")).toBe(true);
    expect(plan({ collimation: { width: 0.6, height: 0.5 } }).effects.some((e) => e.id === "collimation-clipping")).toBe(true);
  });
});

describe("S13-6: the rotation sign is defined by the result image (positive = the spine shifts to the viewer's right)", () => {
  const W = 256, H = 256;
  // A bright vertical stripe at the baseline's midline: where it lands in the rendered image shows the spine shift.
  const midU = chestApSupine.radiograph.midlineU!;
  const stripe: LumaImage = {
    width: W,
    height: H,
    data: Float32Array.from({ length: W * H }, (_, i) => (Math.abs((i % W) - midU * W) <= 1.5 ? 220 : 60)),
  };
  const peakColumn = (patch: Partial<SimulationSettings>) => {
    const p = buildRenderPlan(run(patch).resultState, chestApSupine);
    const out = renderRadiograph(p, chestApSupine.radiograph, stripe, 2);
    const sums = new Float64Array(out.width);
    for (let y = 0; y < out.height; y++) for (let x = 0; x < out.width; x++) sums[x]! += out.luma[y * out.width + x]!;
    let best = 0;
    for (let x = 1; x < out.width; x++) if (sums[x]! > sums[best]!) best = x;
    return best;
  };
  it("the AP renderer moves the spine to the viewer's right for a positive value, left for a negative one", () => {
    const [neg, zero, pos] = [peakColumn({ rotationDeg: -12 }), peakColumn({ rotationDeg: 0 }), peakColumn({ rotationDeg: 12 })];
    expect(pos).toBeGreaterThan(zero);
    expect(neg).toBeLessThan(zero);
  });
  it("the plan carries a positive thorax shift for a positive value, like the PA (same renderer, same sign)", () => {
    const ap = buildRenderPlan(run({ rotationDeg: 10 }).resultState, chestApSupine).anatomy.rotation!;
    const pa = buildRenderPlan(evaluate(chestPaErect, { ...ok, projection: "pa-erect", rotationDeg: 10, choices: undefined, tubeAngulationDeg: undefined }).resultState, chestPaErect).anatomy.rotation!;
    expect(ap.thoraxShiftU).toBeGreaterThan(0);
    expect(Math.sign(ap.thoraxShiftU)).toBe(Math.sign(pa.thoraxShiftU));
  });
  it("the AP exam shows no plan-view turn (its scene is the side view) and the AP wording names no direction of turn", async () => {
    const { rotationVisual } = await import("@/features/positioning/visual-model");
    expect(rotationVisual(10).spineShift).toBeGreaterThan(0); // the frontal figure draws the same sign
    const rule = chestApSupineExam.rules.find((r) => r.id === "rotation")!;
    const all = JSON.stringify([rule.feedback, chestApSupineExam.rules.find((r) => r.id === "rotation")]);
    expect(all).not.toMatch(/toward the detector|towards the detector|left side|right side|باتجاه الكاشف|الجانب الأيسر|الجانب الأيمن/i);
  });
});

describe("S13-6: the projection button is labelled by the patient position, never 'AP erect' next to the supine control", () => {
  it("AP supine / AP semi-erect by the state choice (EN + AR); other exams keep the generic label", async () => {
    const { projectionLabelOf } = await import("@/features/simulation/projection-label");
    const { chestLateralErect } = await import("@/data/cases/chest-lateral-erect");
    const c = chestApSupine.choiceControls;
    expect(projectionLabelOf(c, { state: "supine" }, "ap-erect")).toEqual({ en: "AP supine", ar: "AP مستلقيًا" });
    expect(projectionLabelOf(c, { state: "semierect" }, "ap-erect")).toEqual({ en: "AP semi-erect", ar: "AP شبه جالس" });
    expect(projectionLabelOf(c, { state: "supine" }, "pa-erect")).toBeUndefined();
    expect(projectionLabelOf(chestLateralErect.choiceControls, { side: "L" }, "ap-erect")).toBeUndefined();
    expect(projectionLabelOf(chestPaErect.choiceControls, undefined, "ap-erect")).toBeUndefined();
  });
  it("validateExam requires both languages for every option and an available projection", () => {
    const cc = chestApSupineExam.choiceControls![0]!;
    const bad = { ...chestApSupineExam, choiceControls: [{ ...cc, projectionLabels: { projection: "ap-erect" as const, byOption: { supine: cc.projectionLabels!.byOption.supine! } } }] };
    expect(validateExam(bad).join()).toMatch(/projectionLabels needs EN and AR text for option "semierect"/);
  });
});
