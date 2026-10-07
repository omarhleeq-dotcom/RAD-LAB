import type { CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";
import { handLateralExam } from "../exams/xray/hand-lateral";
import { handCooperativeAdult } from "./hand-patient";
import { handLateralRadiograph } from "./hand-lateral-radiograph";

/**
 * Case: "adult-demo" — the demo adult patient of the Hand Lateral exam, extension variant (S14.2b, S14.2-6).
 *
 * PROVISIONAL / DEMO DATA. S14.2-8: LEFT hand. The patient data (31-year-old male) matches the description of the baseline image (a
 * real normal left hand, per its author); the case text calls the image a teaching approximation. The two hand exams use the same
 * hand; neither is a person from the chest cases (S12-4). The attenuation is the reference value 1 (not measured).
 */
export const handLateralAdultDemo: CaseDefinition = {
  schemaVersion: 1,
  id: "adult-demo",
  examId: "hand-lateral",
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
    en: "Pain in the left hand after a minor fall. Referred from the emergency department for a lateral hand X-ray (fingers extended) to accompany the PA.",
    ar: "ألم في اليد اليسرى بعد سقوط بسيط. محوَّل من قسم الطوارئ لأشعة اليد بالإسقاط الجانبي (مع بسط الأصابع) مع إسقاط PA.",
  },
  requestedExamination: {
    en: "Hand X-ray, left, lateral (fingers extended).",
    ar: "أشعة اليد، اليسرى، إسقاط جانبي (مع بسط الأصابع).",
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
  radiograph: handLateralRadiograph,
  patientCooperation: handCooperativeAdult,
  // Deliberately NOT the answer: the other projection, rotated, off-centre, a fully open field, no marker, SID below the minimum, kV above the band.
  initialSettings: {
    projection: "hand-pa",
    rotationDeg: 7,
    centralRay: { x: 0.28, y: 0.3 },
    collimation: { width: 1, height: 1 },
    sideMarker: null,
    markerPosition: { x: -0.55, y: 0 },
    sidCm: 90,
    kvp: 80,
    mas: 12.5,
    exposureMode: "manual",
    aecChambers: [],
    motionInstruction: "none",
  },
};

/** Compatibility view (what the engine, renderer, store and UI consume): the case composed with its exam. */
export const handLateral = composeCase(handLateralExam, handLateralAdultDemo);
