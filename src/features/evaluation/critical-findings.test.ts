import { describe, expect, it } from "vitest";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import type { SimulationSettings } from "@/domain/simulation";
import { computeScore } from "@/features/scoring/score";
import { evaluate } from "./engine";

/** Fully correct attempt (score 100, no critical finding). Marker L on the viewer's right (PA display convention). */
const ok: SimulationSettings = {
  projection: "pa-erect",
  rotationDeg: 0,
  centralRay: { x: 0, y: -0.07 },
  collimation: { width: 0.94, height: 0.84 },
  chinPosition: "elevated",
  shoulderPosition: "rolled-forward",
  sideMarker: "L",
  markerPosition: { x: 0.84, y: -0.44 },
  sidCm: 180,
  kvp: 115,
  mas: 3,
  exposureMode: "manual",
  aecChambers: [],
  breathing: "deep-inspiration-hold",
  motionInstruction: "remain-still",
};
const run = (patch: Partial<SimulationSettings> = {}) => evaluate(chestPaErect, { ...ok, ...patch });
const ids = (r: ReturnType<typeof run>) => r.criticalFindings.map((f) => f.id);
const WEIGHTS = { positioning: 25, rotation: 20, centering: 15, exposure: 20, sid: 10, breathing: 10 };

describe("critical findings: baseline", () => {
  it("a fully correct attempt has none and meets the pass mark", () => {
    const r = run();
    expect(ids(r)).toEqual([]);
    expect(r.score.total).toBe(100);
    expect(r.score.passed).toBe(true);
  });

  it("the four critical findings are configured as case data, once each (S11b-1 added missing-marker)", () => {
    expect(chestPaErect.scoring.criticalFindings.map((f) => f.id).sort()).toEqual(["missing-marker", "patient-motion", "wrong-projection", "wrong-side-marker"]);
  });

  it("keeps the top-level weights 25/20/15/20/10/10", () => {
    expect(chestPaErect.scoring.categoryWeights).toEqual(WEIGHTS);
  });

  it("a low score without any critical finding still fails the threshold (the gate is additional, not a replacement)", () => {
    const r = run({ rotationDeg: 15, kvp: 60, sidCm: 100, centralRay: { x: 0.8, y: 0.5 }, breathing: "expiration-hold" });
    expect(r.criticalFindings).toEqual([]);
    expect(r.score.total).toBeLessThan(chestPaErect.scoring.passThreshold);
    expect(r.score.passed).toBe(false);
    expect(r.score.thresholdMet).toBe(false);
  });
});

describe("1 · a wrong projection must not pass", () => {
  it.each([["ap-erect"], ["lateral-left"]] as const)("%s for a requested PA exam is below the pass mark", (projection) => {
    const r = run({ projection });
    expect(ids(r)).toEqual(["wrong-projection"]);
    expect(r.score.passed).toBe(false);
  });

  it("…even though the numeric score stays high (the number is not changed, only the pass mark is gated)", () => {
    const r = run({ projection: "ap-erect" });
    expect(r.score.total).toBeGreaterThanOrEqual(chestPaErect.scoring.passThreshold);
    expect(r.score.thresholdMet).toBe(true);
    expect(r.score.passed).toBe(false);
  });

  it("the requested projection never triggers it", () => {
    expect(ids(run({ projection: chestPaErect.requiredProjection }))).toEqual([]);
  });
});

describe("2 · critical findings gate the pass mark without changing the numeric score or the weights", () => {
  const cases: [string, Partial<SimulationSettings>, string][] = [
    ["wrong projection", { projection: "ap-erect" }, "wrong-projection"],
    ["visible patient motion (relax and move)", { motionInstruction: "relax-and-move" }, "patient-motion"],
    ["wrong-side marker (L on the viewer's left)", { sideMarker: "L", markerPosition: { x: -0.84, y: -0.44 } }, "wrong-side-marker"],
    ["wrong-side marker (R on the viewer's right)", { sideMarker: "R", markerPosition: { x: 0.84, y: -0.44 } }, "wrong-side-marker"],
  ];

  it.each(cases)("%s forces “below the pass mark”", (_name, patch, id) => {
    const r = run(patch);
    expect(ids(r)).toContain(id);
    expect(r.score.passed).toBe(false);
  });

  it.each(cases)("%s leaves the numeric total and every category score exactly as the checks give them", (_name, patch) => {
    const r = run(patch);
    const ungated = computeScore(r.checks, chestPaErect.scoring);
    expect(r.score.total).toBe(ungated.total);
    expect(r.score.categories).toEqual(ungated.categories);
    expect(r.score.thresholdMet).toBe(ungated.thresholdMet);
    expect(r.score.categories.map((c) => [c.category, c.weight])).toEqual(Object.entries(WEIGHTS));
  });

  it("computeScore itself is unchanged: passed === thresholdMet before the gate", () => {
    const r = run();
    const raw = computeScore(r.checks, chestPaErect.scoring);
    expect(raw.passed).toBe(raw.thresholdMet);
  });

  it("several critical findings are all reported, in the case's order, and are deterministic", () => {
    const patch: Partial<SimulationSettings> = { projection: "lateral-left", motionInstruction: "relax-and-move", sideMarker: "R", markerPosition: { x: 0.84, y: -0.44 } };
    const r = run(patch);
    expect(ids(r)).toEqual(["wrong-projection", "patient-motion", "wrong-side-marker"]);
    expect(run(patch).criticalFindings).toEqual(r.criticalFindings);
    expect(r.score.passed).toBe(false);
  });

  it("gives the reason in English AND Arabic for every critical finding", () => {
    for (const f of chestPaErect.scoring.criticalFindings) {
      expect(f.reason.en).toMatch(/^Critical finding/);
      expect(f.reason.en).toMatch(/below the pass mark/);
      expect(f.reason.ar).toMatch(/[؀-ۿ]/);
      expect(f.reason.ar).toMatch(/دون درجة النجاح/);
      expect(f.label.en.length).toBeGreaterThan(0);
      expect(f.label.ar).toMatch(/[؀-ۿ]/);
    }
    const r = run({ projection: "ap-erect" });
    expect(r.criticalFindings[0]!.reason.en).toMatch(/wrong projection/);
  });

  it("classifies each: concept = common quality criterion (common-reference class), implementation = provisional / educational", () => {
    for (const f of chestPaErect.scoring.criticalFindings) {
      expect(f.concept.status, f.id).toBe("common-reference");
      expect(f.concept.note, f.id).toMatch(/COMMON QUALITY CRITERION/);
      expect(f.evidence.status, f.id).toBe("provisional");
      expect(f.evidence.note, f.id).toMatch(/PROVISIONAL \/ educational/);
      expect(f.concept.reference.length).toBeGreaterThan(0);
    }
  });

  it("is not presented as a real-world automatic reject decision", () => {
    for (const f of chestPaErect.scoring.criticalFindings) expect(f.evidence.reference).toMatch(/Image rejection|Side marker/);
    for (const f of chestPaErect.scoring.criticalFindings) expect(f.reason.en).toMatch(/educational result, not a clinical decision/);
  });
});

describe("wrong-side marker", () => {
  it("correct sides never trigger it (L viewer-right, R viewer-left)", () => {
    expect(ids(run({ sideMarker: "L", markerPosition: { x: 0.84, y: -0.44 } }))).toEqual([]);
    expect(ids(run({ sideMarker: "R", markerPosition: { x: -0.84, y: -0.44 } }))).toEqual([]);
  });

  it("no marker placed is a missing-marker critical finding (S11b-1), not a wrong side; same gate severity, score unchanged", () => {
    const r = run({ sideMarker: null });
    expect(ids(r)).toEqual(["missing-marker"]);
    expect(r.checks.find((c) => c.ruleId === "side-marker")?.outcome).toBe("fail");
    expect(r.score.total).toBe(100);
    expect(r.score.thresholdMet).toBe(true);
    expect(r.score.passed).toBe(false);
  });

  it("a wrong-side marker is still exactly one wrong-side-marker finding with the same gate result (unchanged)", () => {
    const r = run({ sideMarker: "L", markerPosition: { x: -0.84, y: -0.44 } });
    expect(ids(r)).toEqual(["wrong-side-marker"]);
    expect(r.score.total).toBe(100);
    expect(r.score.passed).toBe(false);
  });

  it("uses the same wrong-side flag as the marker check feedback, in every placement (score = feedback)", () => {
    for (const [side, x, field] of [
      ["L", -0.84, { width: 0.94, height: 0.84 }],
      ["R", 0.84, { width: 0.94, height: 0.84 }],
      ["L", -0.84, { width: 0.5, height: 0.84 }], // wrong side AND outside the field
      ["R", 0.4, { width: 0.94, height: 0.84 }],
    ] as const) {
      const r = run({ sideMarker: side, markerPosition: { x, y: -0.44 }, collimation: field });
      const feedback = r.checks.find((c) => c.ruleId === "side-marker")!.feedback.en;
      expect(/wrong side/.test(feedback), `${side}@${x}`).toBe(true);
      expect(ids(r), `${side}@${x}`).toEqual(["wrong-side-marker"]);
    }
  });

  it("the marker check itself stays unscored (weight 0): the numeric score does not depend on the marker", () => {
    const correct = run();
    const wrong = run({ sideMarker: "L", markerPosition: { x: -0.84, y: -0.44 } });
    expect(chestPaErect.rules.find((r) => r.id === "side-marker")?.weight).toBe(0);
    expect(wrong.score.total).toBe(correct.score.total);
    expect(wrong.score.passed).toBe(false);
  });

  it("is independent of the UI language: the convention is in case data, never mirrored by RTL", () => {
    expect(chestPaErect.positioning.markerSide).toEqual({ L: "viewer-right", R: "viewer-left" });
  });
});

describe("visible patient motion", () => {
  it("is triggered by simulated motion that follows an instruction to move, not by a missing instruction alone (S5)", () => {
    expect(ids(run({ motionInstruction: "remain-still" }))).toEqual([]);
    expect(ids(run({ motionInstruction: "none" }))).toEqual([]);
    expect(ids(run({ motionInstruction: "relax-and-move" }))).toEqual(["patient-motion"]);
  });

  it("a missing instruction is assessed as its own item and still shows the assumed motion, but does not gate the pass mark (S5)", () => {
    const r = run({ motionInstruction: "none" });
    expect(r.resultState.patientResponse.motion).toBe("motion");
    expect(r.variants).toContain("motion");
    const instruction = r.checks.find((c) => c.ruleId === "motion-instruction")!;
    // Owner follow-up (2026-10-22): the missing instruction leaves the engine's partial credit of its own category (breathing ratio 0.5), nothing else.
    expect([instruction.outcome, instruction.credit, instruction.scored]).toEqual(["partial", 0.5, true]);
    const still = run({ motionInstruction: "remain-still" });
    expect(r.score.passed).toBe(still.score.passed);
    expect(r.score.total).toBe(95);
    expect(r.score.categories.filter((c) => c.category !== "breathing")).toEqual(still.score.categories.filter((c) => c.category !== "breathing"));
  });

  it("agrees with the renderer-facing state when the learner instructs movement (the same response drives the image and the gate)", () => {
    const r = run({ motionInstruction: "relax-and-move" });
    expect(r.resultState.patientResponse.motion).toBe("motion");
    expect(r.variants).toContain("motion");
  });
});
