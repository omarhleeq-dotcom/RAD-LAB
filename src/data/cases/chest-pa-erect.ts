import type { CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";
import { chestPaErectExam } from "../exams/xray/chest-pa-erect";
import { chestPaCooperativeAdult } from "./chest-pa-patient";
import { chestPaRadiograph } from "./chest-pa-radiograph";

/**
 * Case: "adult-demo" — the demo adult patient of the Chest PA erect exam.
 *
 * Session 7: this is the CASE half of the former single `RadCase` object (patient, order text, condition, baseline
 * radiograph asset, patient-cooperation profile, patient attenuation, initial state); the exam half lives in
 * `src/data/exams/xray/chest-pa-erect.ts`. Values and wording are unchanged by the split.
 *
 * PROVISIONAL / DEMO DATA, see the exam definition. The baseline radiograph shows a different patient (a young adult
 * woman, A-001); since Session 8 (decision D7) the case patient is aligned to it: adult female, 21 (docs/session-7-demographics-impact.md).
 */
export const chestPaAdultDemo: CaseDefinition = {
  schemaVersion: 1,
  id: "adult-demo",
  examId: "chest-pa-erect",
  provisional: true,
  patient: {
    age: 21,
    sex: "female",
    description: {
      en: "21-year-old female, ambulant, able to stand and follow breathing instructions.",
      ar: "أنثى عمرها ٢١ عامًا، قادرة على الوقوف واتباع تعليمات التنفس.",
    },
  },
  clinicalScenario: {
    en: "Persistent cough for three weeks. Referred by the outpatient clinic.",
    ar: "سعال مستمر منذ ثلاثة أسابيع. محوَّل من العيادة الخارجية.",
  },
  requestedExamination: {
    en: "Chest X-ray, PA erect.",
    ar: "أشعة صدر، وضعية PA وقوفًا.",
  },
  patientCondition: {
    en: "Stable. No mobility limitations. The patient has arrived slightly turned to one side.",
    ar: "حالتها مستقرة ولا توجد قيود على الحركة. وصلت المريضة وهي مائلة قليلًا إلى أحد الجانبين.",
  },
  // How strongly this simulated patient attenuates the beam. The technique PROTOCOL is the exam's; the patient is
  // the case's, so a larger patient is a new case (data), never a new exam.
  patientTechnique: {
    attenuation: 1,
    label: { en: "Average adult (reference attenuation)", ar: "بالغ متوسط (توهين مرجعي)" },
    evidence: {
      status: "educational-simplification",
      reference: "Technique ref §10",
      note: "One reference attenuation for now. The engine already takes attenuation as an input so other body habitus can be added as data later.",
    },
  },
  radiograph: chestPaRadiograph,
  patientCooperation: chestPaCooperativeAdult,
  initialSettings: {
    projection: "ap-erect",
    rotationDeg: 8,
    centralRay: { x: 0.23, y: 0.3 },
    collimation: { width: 1, height: 1 },
    chinPosition: "tucked",
    shoulderPosition: "relaxed",
    sideMarker: null,
    markerPosition: { x: 0.84, y: -0.44 },
    sidCm: 120,
    kvp: 70,
    mas: 12,
    exposureMode: "manual",
    aecChambers: [],
    breathing: "no-instruction",
    motionInstruction: "none",
  },
};

/**
 * Compatibility view: today's single `RadCase` (what the engine, renderer, store and UI consume), composed from the
 * exam and the case. Value-identical to the former hand-written object (Session 7 characterisation snapshot).
 */
export const chestPaErect = composeCase(chestPaErectExam, chestPaAdultDemo);
