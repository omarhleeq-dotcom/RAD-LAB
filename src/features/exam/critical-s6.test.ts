/**
 * S6 (owner 2026-10-22, RAD-068 part 3 batch 5): the critical lists of the limb, pelvis and shoulder exams gain only what the engine
 * already represents faithfully, with the registered detectors (no new mechanism):
 *  - wrong projection: the 12 limb exams (they offer a second projection; the result image labels the unsimulated one);
 *  - visible motion: the 12 limb exams + pelvis + shoulder (the blur is drawn from the same patient response; S5: only an instruction to move gates).
 * Lost required anatomy does NOT qualify (no calibrated tolerance at an uncalibrated by-eye region edge) and is pinned absent here.
 */
import { describe, expect, it } from "vitest";
import { CASES } from "@/data/cases";
import type { ExamDefinition } from "@/domain/exam";
import type { SimulationSettings } from "@/domain/simulation";
import { evaluate } from "@/features/evaluation/engine";
import { validateExam } from "./validate";
import { getExam } from "@/data/exams";

const LIMB_IDS = ["wrist-pa", "wrist-lateral", "hand-pa", "hand-lateral", "elbow-ap", "elbow-lateral", "foot-ap", "foot-oblique", "knee-ap", "knee-lateral", "ankle-ap", "ankle-lateral"];
const ids = (c: (typeof CASES)[number], patch: Partial<SimulationSettings>) =>
  evaluate(c, { ...c.initialSettings, projection: c.requiredProjection, motionInstruction: "remain-still", ...patch } as SimulationSettings).criticalFindings.map((f) => f.id);

describe("S6 critical lists", () => {
  it.each(LIMB_IDS)("%s: the list is wrong projection, visible motion, wrong-side marker, missing marker (validated, bilingual)", (id) => {
    const c = CASES.find((x) => x.id === id)!;
    expect(c.scoring.criticalFindings.map((f) => f.id)).toEqual(["wrong-projection", "patient-motion", "wrong-side-marker", "missing-marker"]);
    expect(validateExam(getExam(c.id) as ExamDefinition)).toEqual([]);
    for (const f of c.scoring.criticalFindings.slice(0, 2)) {
      expect(f.reason.en).toMatch(/educational result, not a clinical decision/);
      expect(`${f.reason.en} ${f.reason.ar} ${f.concept.note ?? ""} ${f.evidence.note ?? ""}`).not.toMatch(/validated|repeat|repeated|إعادة|provisional|pending educator/i);
    }
  });

  it.each(LIMB_IDS)("%s: a wrong projection gates; the requested one does not", (id) => {
    const c = CASES.find((x) => x.id === id)!;
    const other = c.availableProjections.find((p) => p !== c.requiredProjection)!;
    expect(ids(c, {})).not.toContain("wrong-projection");
    expect(ids(c, { projection: other })).toContain("wrong-projection");
    expect(evaluate(c, { ...c.initialSettings, projection: other } as SimulationSettings).score.passed).toBe(false);
  });

  it.each([...LIMB_IDS, "pelvis-ap-supine", "shoulder-grashey-erect"])("%s: only an instruction to move gates (a missing 'stay still' alone does not, S5)", (id) => {
    const c = CASES.find((x) => x.id === id)!;
    expect(ids(c, { motionInstruction: "remain-still" })).not.toContain("patient-motion");
    expect(ids(c, { motionInstruction: "none" })).not.toContain("patient-motion");
    expect(ids(c, { motionInstruction: "relax-and-move" })).toContain("patient-motion");
  });

  it("pelvis and shoulder gain visible motion only: they offer one projection, so a wrong projection cannot be chosen", () => {
    for (const id of ["pelvis-ap-supine", "shoulder-grashey-erect"]) {
      const c = CASES.find((x) => x.id === id)!;
      expect(c.availableProjections).toHaveLength(1);
      expect(c.scoring.criticalFindings.map((f) => f.id)).toEqual(["patient-motion", "missing-marker", "wrong-side-marker"]);
    }
  });

  it("lost required anatomy is not a critical finding anywhere: a clipped field lowers the score only", () => {
    for (const c of CASES) expect(c.scoring.criticalFindings.map((f) => f.id), c.id).not.toContain("anatomy-lost");
    const wrist = CASES.find((x) => x.id === "wrist-pa")!;
    const tight = evaluate(wrist, { ...wrist.initialSettings, projection: "wrist-pa", motionInstruction: "remain-still", collimation: { width: 0.2, height: 0.2 } } as SimulationSettings);
    expect(tight.checks.find((k) => k.ruleId === "collimation-clipping")!.outcome).toBe("fail");
    expect(tight.criticalFindings.map((f) => f.id)).not.toContain("anatomy-lost");
  });
});
