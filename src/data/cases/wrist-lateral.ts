import type { CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";
import { wristLateralExam } from "../exams/xray/wrist-lateral";
import { wristCooperativeAdult } from "./wrist-patient";
import { wristLateralRadiograph } from "./wrist-lateral-radiograph";

/**
 * Case: "adult-demo" — the demo adult patient of the Wrist Lateral exam (S14.1c). The same left wrist and the same patient data as the
 * Wrist PA case (S14.1c-1: the owner-found baselines are the same person's left wrist, 31-year-old male per the author). A teaching
 * approximation; not a person from the chest cases (S12-4). PROVISIONAL / DEMO DATA.
 */
export const wristLateralAdultDemo: CaseDefinition = {
  schemaVersion: 1,
  id: "adult-demo",
  examId: "wrist-lateral",
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
    en: "Pain in the left wrist after a minor fall. Referred from the emergency department for a lateral wrist X-ray to accompany the PA.",
    ar: "ألم في الرسغ الأيسر بعد سقوط بسيط. محوَّل من قسم الطوارئ لأشعة الرسغ بالإسقاط الجانبي مع إسقاط PA.",
  },
  requestedExamination: {
    en: "Wrist X-ray, left, lateral.",
    ar: "أشعة الرسغ، الأيسر، إسقاط جانبي.",
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
  radiograph: wristLateralRadiograph,
  patientCooperation: wristCooperativeAdult,
  // Deliberately NOT the answer: the other projection, rotated the other way, off-centre, a fully open field, no marker, SID above the band, kV below it.
  initialSettings: {
    projection: "wrist-pa",
    rotationDeg: -6,
    centralRay: { x: -0.3, y: -0.4 },
    collimation: { width: 1, height: 1 },
    sideMarker: null,
    markerPosition: { x: -0.62, y: 0 },
    sidCm: 125,
    kvp: 50,
    mas: 1,
    exposureMode: "manual",
    aecChambers: [],
    motionInstruction: "none",
  },
};

/** Compatibility view (what the engine, renderer, store and UI consume): the case composed with its exam. */
export const wristLateral = composeCase(wristLateralExam, wristLateralAdultDemo);
