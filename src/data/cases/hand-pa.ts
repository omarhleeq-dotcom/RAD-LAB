import type { CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";
import { handPaExam } from "../exams/xray/hand-pa";
import { handCooperativeAdult } from "./hand-patient";
import { handPaRadiograph } from "./hand-pa-radiograph";

/**
 * Case: "adult-demo" — the demo adult patient of the Hand PA exam (S14.2b).
 *
 * PROVISIONAL / DEMO DATA. S14.2-8: LEFT hand. The patient data (31-year-old male) matches the description of the baseline image (a
 * real normal left hand, per its author); the case text calls the image a teaching approximation. The two hand exams use the same
 * hand; neither is a person from the chest cases (S12-4). The attenuation is the reference value 1 (not measured).
 */
export const handPaAdultDemo: CaseDefinition = {
  schemaVersion: 1,
  id: "adult-demo",
  examId: "hand-pa",
  provisional: true,
  patient: {
    age: 31,
    sex: "male",
    description: {
      en: "31-year-old male, seated at the end of the table, able to rest the hand and forearm on the detector as instructed.",
      ar: "ذكر عمره ٣١ عامًا، جالس عند طرف الطاولة، قادر على وضع اليد والساعد على الكاشف حسب التعليمات.",
    },
  },
  clinicalScenario: {
    en: "Pain in the left hand after a minor fall. Referred from the emergency department for a PA hand X-ray.",
    ar: "ألم في اليد اليسرى بعد سقوط بسيط. محوَّل من قسم الطوارئ لأشعة اليد بإسقاط PA.",
  },
  requestedExamination: {
    en: "Hand X-ray, left, PA.",
    ar: "أشعة اليد، اليسرى، إسقاط PA.",
  },
  patientCondition: {
    en: "Stable and cooperative. No cast, splint, rings or jewellery on the left hand. The patient has arrived with the hand slightly turned.",
    ar: "حالته مستقرة ومتعاون. لا جبيرة ولا خواتم ولا مجوهرات على اليد اليسرى. وصل المريض ويده مائلة قليلًا.",
  },
  patientTechnique: {
    attenuation: 1,
    label: { en: "Average adult hand (reference attenuation; provisional)", ar: "يد بالغ متوسطة (توهين مرجعي؛ مؤقت)" },
    evidence: {
      status: "provisional",
      reference: "S14.2-10; S10b-9; O26",
      note: "The reference attenuation 1 is the model's anchor, not a measured value; no mAs target is claimed.",
    },
  },
  radiograph: handPaRadiograph,
  patientCooperation: handCooperativeAdult,
  // Deliberately NOT the answer: the other projection, rotated, off-centre, a fully open field, no marker, SID below the minimum, kV above the band.
  initialSettings: {
    projection: "hand-lateral",
    rotationDeg: 7,
    centralRay: { x: 0.28, y: 0.3 },
    collimation: { width: 1, height: 1 },
    sideMarker: null,
    markerPosition: { x: -0.68, y: 0 },
    sidCm: 90,
    kvp: 80,
    mas: 12.5,
    exposureMode: "manual",
    aecChambers: [],
    motionInstruction: "none",
  },
};

/** Compatibility view (what the engine, renderer, store and UI consume): the case composed with its exam. */
export const handPa = composeCase(handPaExam, handPaAdultDemo);
