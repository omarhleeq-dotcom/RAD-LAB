/**
 * Session 8 (decision D7), Phase B proof: scoring, technique, critical findings, result state and the render plan
 * do not read the patient's age, sex, name or description. The same case is analysed twice — as the aligned adult
 * female (21) and as the former adult male (45, masculine Arabic) — over all 53 QA scenarios; everything except the
 * demographic fields must be identical.
 */
import { describe, expect, it } from "vitest";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import type { RadCase } from "@/domain/case";
import { analyse, SCENARIOS } from "./scenario-matrix";

const former: RadCase = {
  ...chestPaErect,
  patient: {
    age: 45,
    sex: "male",
    description: {
      en: "45-year-old male, ambulant, able to stand and follow breathing instructions.",
      ar: "ذكر عمره ٤٥ عامًا، قادر على المشي والوقوف واتباع تعليمات التنفس.",
    },
  },
  patientCondition: {
    en: chestPaErect.patientCondition.en,
    ar: "حالته مستقرة ولا توجد قيود على الحركة. وصل المريض وهو مائل قليلًا إلى أحد الجانبين.",
  },
};

describe("scoring/technique/render do not depend on patient demographics", () => {
  it("the two variants really differ in demographics", () => {
    expect(chestPaErect.patient.sex).toBe("female");
    expect(chestPaErect.patient.age).toBe(21);
    expect(former.patient.sex).toBe("male");
  });

  it("technique profile and scoring configuration are identical", () => {
    expect(JSON.stringify(former.technique)).toBe(JSON.stringify(chestPaErect.technique));
    expect(JSON.stringify(former.scoring)).toBe(JSON.stringify(chestPaErect.scoring));
  });

  it.each(SCENARIOS.map((s) => [s.id, s] as const))("scenario %s: result and render plan are identical (female vs male)", (_id, sc) => {
    const a = analyse(sc, chestPaErect);
    const b = analyse(sc, former);
    expect(JSON.stringify(a.result)).toBe(JSON.stringify(b.result));
    expect(JSON.stringify(a.plan)).toBe(JSON.stringify(b.plan));
  });
});
