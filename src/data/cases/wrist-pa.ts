import type { CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";
import { wristPaExam } from "../exams/xray/wrist-pa";
import { wristCooperativeAdult } from "./wrist-patient";
import { wristPaRadiograph } from "./wrist-pa-radiograph";

/**
 * Case: "adult-demo" — the demo adult patient of the Wrist PA exam (S14.1c).
 *
 * PROVISIONAL / DEMO DATA. S14.1c-1: LEFT wrist. The patient data (31-year-old male) matches the description of the baseline image
 * (a real normal left wrist, per its author); the case text calls the image a teaching approximation. The two wrist exams use the same
 * wrist; neither is a person from the chest cases (S12-4). The attenuation is the reference value 1 (not measured).
 */
export const wristPaAdultDemo: CaseDefinition = {
  schemaVersion: 1,
  id: "adult-demo",
  examId: "wrist-pa",
  provisional: true,
  patient: {
    age: 31,
    sex: "male",
    description: {
      en: "31-year-old male, seated at the end of the table, able to rest the forearm and hand on the detector as instructed.",
      ar: "ذكر عمره ٣١ عامًا، جالس عند طرف الطاولة، قادر على وضع الساعد واليد على الكاشف حسب التعليمات.",
    },
  },
  clinicalScenario: {
    en: "Pain in the left wrist after a minor fall. Referred from the emergency department for a PA wrist X-ray.",
    ar: "ألم في الرسغ الأيسر بعد سقوط بسيط. محوَّل من قسم الطوارئ لأشعة الرسغ بإسقاط PA.",
  },
  requestedExamination: {
    en: "Wrist X-ray, left, PA.",
    ar: "أشعة الرسغ، الأيسر، إسقاط PA.",
  },
  patientCondition: {
    en: "Stable and cooperative. No cast, splint or jewellery on the left wrist. The patient has arrived with the hand slightly turned.",
    ar: "حالته مستقرة ومتعاون. لا جبيرة ولا مجوهرات على الرسغ الأيسر. وصل المريض ويده مائلة قليلًا.",
  },
  patientTechnique: {
    attenuation: 1,
    label: { en: "Average adult wrist (reference attenuation; provisional)", ar: "رسغ بالغ متوسط (توهين مرجعي؛ مؤقت)" },
    evidence: {
      status: "provisional",
      reference: "S14.1c-6; S10b-9; O26",
      note: "The reference attenuation 1 is the model's anchor, not a measured value; no mAs target is claimed.",
    },
  },
  radiograph: wristPaRadiograph,
  patientCooperation: wristCooperativeAdult,
  // Deliberately NOT the answer: the other projection, rotated, off-centre, a fully open field, no marker, SID below the minimum, kV above the band.
  initialSettings: {
    projection: "wrist-lateral",
    rotationDeg: 7,
    centralRay: { x: 0.28, y: 0.3 },
    collimation: { width: 1, height: 1 },
    sideMarker: null,
    markerPosition: { x: -0.62, y: 0 },
    sidCm: 90,
    kvp: 80,
    mas: 12.5,
    exposureMode: "manual",
    aecChambers: [],
    motionInstruction: "none",
  },
};

/** Compatibility view (what the engine, renderer, store and UI consume): the case composed with its exam. */
export const wristPa = composeCase(wristPaExam, wristPaAdultDemo);
