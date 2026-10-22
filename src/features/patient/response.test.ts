import { describe, expect, it } from "vitest";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import type { PatientCooperationProfile } from "@/domain/patient";
import type { BreathingId, MotionInstructionId, SimulationSettings } from "@/domain/simulation";
import { evaluate } from "@/features/evaluation/engine";
import { assessReadiness } from "@/features/technique/readiness";
import { derivePatientResponse } from "./response";

const profile = chestPaErect.patientCooperation;
const BREATHING: BreathingId[] = ["deep-inspiration-hold", "expiration-hold", "normal-breathing", "no-instruction"];
const MOTION: MotionInstructionId[] = ["none", "remain-still", "relax-and-move"];

const ideal: SimulationSettings = {
  ...chestPaErect.initialSettings,
  projection: "pa-erect",
  rotationDeg: 0,
  centralRay: { x: 0, y: -0.07 },
  collimation: { width: 0.94, height: 0.84 },
  chinPosition: "elevated",
  shoulderPosition: "rolled-forward",
  sideMarker: "L",
  sidCm: 180,
  kvp: 115,
  mas: 3.2,
  breathing: "deep-inspiration-hold",
  motionInstruction: "remain-still",
};

describe("patient response: learner instruction → assumed patient response → simulated outcome", () => {
  it("the appropriate breathing instruction gives adequate simulated inspiration", () => {
    expect(derivePatientResponse(profile, { breathing: "deep-inspiration-hold", motionInstruction: "remain-still" }).inspiration).toBe("adequate");
  });

  it.each(BREATHING.filter((b) => b !== "deep-inspiration-hold"))("an incorrect / incomplete breathing instruction (%s) gives reduced inspiration", (b) => {
    expect(derivePatientResponse(profile, { breathing: b, motionInstruction: "remain-still" }).inspiration).toBe("reduced");
  });

  it("the remain-still instruction gives no simulated motion", () => {
    expect(derivePatientResponse(profile, { breathing: "deep-inspiration-hold", motionInstruction: "remain-still" }).motion).toBe("none");
  });

  it.each(["none", "relax-and-move"] as const)("an omitted / incorrect remain-still instruction (%s) gives simulated motion", (m) => {
    expect(derivePatientResponse(profile, { breathing: "deep-inspiration-hold", motionInstruction: m }).motion).toBe("motion");
  });

  it("inspiration and motion are independent: each depends only on its own instruction", () => {
    for (const b of BREATHING) {
      const outcomes = new Set(MOTION.map((m) => derivePatientResponse(profile, { breathing: b, motionInstruction: m }).inspiration));
      expect(outcomes.size, `inspiration must not depend on the motion instruction (${b})`).toBe(1);
    }
    for (const m of MOTION) {
      const outcomes = new Set(BREATHING.map((b) => derivePatientResponse(profile, { breathing: b, motionInstruction: m }).motion));
      expect(outcomes.size, `motion must not depend on the breathing instruction (${m})`).toBe(1);
    }
  });

  it("is deterministic: the same actions always give the same response (no randomness)", () => {
    for (const b of BREATHING) for (const m of MOTION) {
      const s = { breathing: b, motionInstruction: m };
      expect(derivePatientResponse(profile, s)).toEqual(derivePatientResponse(profile, s));
    }
    // Repeated through the whole evaluation as well.
    const runs = Array.from({ length: 5 }, () => evaluate(chestPaErect, { ...ideal, motionInstruction: "none" }).resultState.patientResponse);
    expect(new Set(runs.map((r) => JSON.stringify(r))).size).toBe(1);
  });

  it("echoes the learner's instructions and the profile id for traceability", () => {
    expect(derivePatientResponse(profile, { breathing: "normal-breathing", motionInstruction: "none" })).toEqual({
      profileId: "cooperative-adult",
      instructions: { breathing: "normal-breathing", motion: "none" },
      inspiration: "reduced",
      motion: "motion",
    });
  });

  it("motion is NOT inferred from technique, geometry or exposure controls", () => {
    const grid: Partial<SimulationSettings>[] = [
      { kvp: 50 }, { kvp: 150 }, { mas: 0.5 }, { mas: 40 }, { sidCm: 100 }, { sidCm: 200 }, { rotationDeg: 20 }, { rotationDeg: -20 },
      { exposureMode: "aec", aecChambers: ["center"] }, { exposureMode: "aec", aecChambers: [] }, { collimation: { width: 0.3, height: 0.3 } },
      { centralRay: { x: 0.9, y: 0.9 } }, { chinPosition: "tucked" }, { shoulderPosition: "relaxed" }, { projection: "ap-erect" },
    ];
    for (const patch of grid) {
      expect(evaluate(chestPaErect, { ...ideal, ...patch, motionInstruction: "remain-still" }).resultState.patientResponse.motion, JSON.stringify(patch)).toBe("none");
      expect(evaluate(chestPaErect, { ...ideal, ...patch, motionInstruction: "none" }).resultState.patientResponse.motion, JSON.stringify(patch)).toBe("motion");
    }
  });

  it("inspiration is NOT inferred from technique, geometry or motion controls", () => {
    for (const patch of [{ kvp: 50 }, { mas: 40 }, { sidCm: 100 }, { rotationDeg: 15 }, { motionInstruction: "none" as const }]) {
      expect(evaluate(chestPaErect, { ...ideal, ...patch }).resultState.patientResponse.inspiration).toBe("adequate");
    }
  });

  it("a different patient is just different data (future patient profiles need no engine change)", () => {
    const hard: PatientCooperationProfile = {
      ...profile,
      id: "difficulty-following-breathing",
      inspirationResponse: { ...profile.inspirationResponse!, "deep-inspiration-hold": "reduced" },
    };
    expect(derivePatientResponse(hard, { breathing: "deep-inspiration-hold", motionInstruction: "remain-still" })).toMatchObject({ inspiration: "reduced", motion: "none", profileId: hard.id });
    const c = { ...chestPaErect, patientCooperation: hard };
    expect(evaluate(c, ideal).resultState.patientResponse.inspiration).toBe("reduced");
  });

  it("every instruction offered by the case is covered by the profile", () => {
    for (const b of chestPaErect.availableBreathing!) expect(profile.inspirationResponse![b]).toBeDefined();
    for (const m of chestPaErect.availableMotionInstructions) expect(profile.motionResponse[m]).toBeDefined();
  });
});

describe("scoring integration is conservative", () => {
  it("does not change the established category weights", () => {
    expect(chestPaErect.scoring.categoryWeights).toEqual({ positioning: 25, rotation: 20, centering: 15, exposure: 20, sid: 10, breathing: 10 });
  });

  it("the remain-still instruction never changes the NUMERIC score (an instruction to move can trigger the critical-finding gate; a missing one cannot, S5)", () => {
    const base = evaluate(chestPaErect, ideal);
    expect(base.score.total).toBe(100);
    expect(base.score.passed).toBe(true);
    for (const m of ["none", "relax-and-move"] as const) {
      const r = evaluate(chestPaErect, { ...ideal, motionInstruction: m });
      expect(r.score.total).toBe(base.score.total);
      expect(r.score.categories).toEqual(base.score.categories);
      expect(r.score.thresholdMet).toBe(true);
      // Motion after an instruction to move is a critical finding: below the pass mark despite the unchanged 100.
      // A missing instruction (S5) leaves the attempt passing: the assumed motion is drawn, not gated.
      expect(r.score.passed).toBe(m === "none");
      expect(r.criticalFindings.map((f) => f.id)).toEqual(m === "none" ? [] : ["patient-motion"]);
      const check = r.checks.find((c) => c.ruleId === "motion-instruction")!;
      expect(check.outcome).toBe("fail");
      expect(check.scored).toBe(false);
      expect(check.weight).toBe(0);
      expect(r.variants).toContain("motion");
    }
    expect(base.checks.find((c) => c.ruleId === "motion-instruction")?.outcome).toBe("pass");
  });

  it("the breathing instruction is still scored exactly as before and gives the reduced-inspiration variant", () => {
    const r = evaluate(chestPaErect, { ...ideal, breathing: "expiration-hold" });
    expect(r.score.categories.find((c) => c.category === "breathing")?.ratio).toBe(0);
    expect(r.variants).toContain("poor-inspiration");
    expect(r.resultState.patientResponse.inspiration).toBe("reduced");
  });

  it("variant list and simulated response never disagree about inspiration or motion", () => {
    for (const b of chestPaErect.availableBreathing!) for (const m of chestPaErect.availableMotionInstructions) {
      const r = evaluate(chestPaErect, { ...ideal, breathing: b, motionInstruction: m });
      expect(r.variants.includes("poor-inspiration"), `${b}`).toBe(r.resultState.patientResponse.inspiration === "reduced");
      expect(r.variants.includes("motion"), `${m}`).toBe(r.resultState.patientResponse.motion === "motion");
    }
  });
});

describe("Practice Mode does not leak the answer before exposure", () => {
  it("readiness only reports a missing instruction, never which instruction is right", () => {
    const base = assessReadiness(chestPaErect, ideal);
    expect(base.items.map((i) => i.id)).not.toContain("motion-not-instructed");
    expect(assessReadiness(chestPaErect, { ...ideal, motionInstruction: "relax-and-move" }).items).toEqual(base.items);
    expect(assessReadiness(chestPaErect, { ...ideal, motionInstruction: "none" }).items.map((i) => i.id)).toContain("motion-not-instructed");
    expect(assessReadiness(chestPaErect, { ...ideal, motionInstruction: "none" }).canExpose).toBe(true);
  });
});
