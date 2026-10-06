import { describe, expect, it } from "vitest";
import { CASE_DEFINITIONS, CASES, getCase } from "@/data/cases";
import { chestPaAdultDemo, chestPaErect } from "@/data/cases/chest-pa-erect";
import { EXAMS, getExam } from "@/data/exams";
import { chestPaErectExam } from "@/data/exams/xray/chest-pa-erect";
import type { CaseDefinition, ExamDefinition } from "@/domain/exam";
import { composeCase, publicCaseId } from "./compose";
import { validateCase, validateExam } from "./validate";

describe("exam / case registry", () => {
  it("every exam and every case passes structural validation", () => {
    for (const exam of EXAMS) expect(validateExam(exam), `exam ${exam.id}`).toEqual([]);
    for (const def of CASE_DEFINITIONS) {
      const exam = getExam(def.examId);
      expect(exam, `exam of case ${def.id}`).toBeDefined();
      expect(validateCase(exam!, def), `case ${def.examId}/${def.id}`).toEqual([]);
    }
  });

  it("ids are unique and every exam has its default case", () => {
    expect(new Set(EXAMS.map((e) => e.id)).size).toBe(EXAMS.length);
    expect(new Set(CASES.map((c) => c.id)).size).toBe(CASES.length);
    for (const exam of EXAMS) {
      expect(CASE_DEFINITIONS.some((d) => d.examId === exam.id && d.id === exam.defaultCaseId), exam.id).toBe(true);
    }
  });

  it("the composed view is memoised: one instance per case (registry, export and store agree)", () => {
    expect(CASES[0]).toBe(chestPaErect);
    expect(getCase("chest-pa-erect")).toBe(chestPaErect);
  });
});

describe("composeCase", () => {
  it("keeps the public id, modality and body part of the former single object", () => {
    expect(chestPaErect.id).toBe("chest-pa-erect");
    expect(chestPaErect.modality).toBe("general-radiography");
    expect(chestPaErect.bodyPart).toBe("chest");
    expect(chestPaErect.provisional).toBe(true);
  });

  it("takes exam concerns from the exam and the patient scenario from the case (same references, no copying)", () => {
    for (const k of ["rules", "scoring", "controls", "positioning", "requiredAnatomy", "detector", "possibleErrors", "imageCriteria"] as const) {
      expect(chestPaErect[k], k).toBe(chestPaErectExam[k]);
    }
    for (const k of ["patient", "clinicalScenario", "requestedExamination", "patientCondition", "radiograph", "patientCooperation", "initialSettings"] as const) {
      expect(chestPaErect[k], k).toBe(chestPaAdultDemo[k]);
    }
  });

  it("the technique model gets the exam's protocol and the case's patient attenuation", () => {
    expect(chestPaErect.technique.patient).toBe(chestPaAdultDemo.patientTechnique);
    expect(chestPaErect.technique.manual).toBe(chestPaErectExam.technique.manual);
    expect(chestPaErect.technique.system).toBe(chestPaErectExam.technique.system);
    expect(chestPaErectExam.technique).not.toHaveProperty("patient");
  });

  it("a second case of the same exam is a case, not an exam: same rules and weights, own patient, own id", () => {
    const heavier: CaseDefinition = {
      ...chestPaAdultDemo,
      id: "heavier-adult-fixture",
      patientTechnique: { ...chestPaAdultDemo.patientTechnique, attenuation: 1.5 },
    };
    const c = composeCase(chestPaErectExam, heavier);
    expect(c.id).toBe("chest-pa-erect/heavier-adult-fixture");
    expect(c.rules).toBe(chestPaErect.rules);
    expect(c.scoring).toBe(chestPaErect.scoring);
    expect(c.technique.patient.attenuation).toBe(1.5);
    expect(chestPaErect.technique.patient.attenuation).toBe(1);
    expect(publicCaseId(chestPaErectExam, heavier)).toBe(c.id);
  });

  it("refuses a case that belongs to another exam", () => {
    expect(() => composeCase({ ...chestPaErectExam, id: "other-exam" }, chestPaAdultDemo)).toThrow(/belongs to exam/);
  });
});

describe("validators catch data mistakes (so a new exam written as data is checked before it reaches a learner)", () => {
  const exam = chestPaErectExam;
  const mutate = (patch: Partial<ExamDefinition>): ExamDefinition => ({ ...exam, ...patch });

  it("weights that do not sum to 100", () => {
    const bad = mutate({ scoring: { ...exam.scoring, categoryWeights: { ...exam.scoring.categoryWeights, sid: 11 } } });
    expect(validateExam(bad).join("\n")).toMatch(/sum to 101/);
  });

  it("a rule in a category with no weight, and duplicate rule ids", () => {
    const bad = mutate({ rules: [...exam.rules, { ...exam.rules[0]! }], scoring: { ...exam.scoring, categoryWeights: { ...exam.scoring.categoryWeights, rotation: 0 } } });
    const problems = validateExam(bad).join("\n");
    expect(problems).toMatch(/rule ids must be unique/);
    expect(problems).toMatch(/category "rotation" has no positive weight/);
  });

  it("an equals rule expecting an option the exam does not offer", () => {
    const rules = exam.rules.map((r) => (r.kind === "equals" && r.setting === "projection" ? { ...r, expected: "lateral-right" } : r));
    expect(validateExam(mutate({ rules: rules as ExamDefinition["rules"] })).join("\n")).toMatch(/not an available projection/);
  });

  it("missing Arabic text and an unknown scene", () => {
    const bad = mutate({ title: { en: "x", ar: "" }, scene: { id: "nope" as never } });
    const problems = validateExam(bad).join("\n");
    expect(problems).toMatch(/title needs EN and AR/);
    expect(problems).toMatch(/unknown scene/);
  });

  it("a case whose initial state is outside the console range or unanswered by the cooperation profile", () => {
    const bad: CaseDefinition = {
      ...chestPaAdultDemo,
      initialSettings: { ...chestPaAdultDemo.initialSettings, kvp: 500 },
      patientCooperation: { ...chestPaAdultDemo.patientCooperation, motionResponse: { "remain-still": "none" } as never },
    };
    const problems = validateCase(exam, bad).join("\n");
    expect(problems).toMatch(/initial kvp \(500\)/);
    expect(problems).toMatch(/no response to motion instruction/);
  });
});
