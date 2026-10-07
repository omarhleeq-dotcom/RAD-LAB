import type { CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";
import { elbowLateralExam } from "../exams/xray/elbow-lateral";
import { elbowCooperativeAdult } from "./elbow-patient";
import { elbowLateralRadiograph } from "./elbow-lateral-radiograph";

/**
 * Case: "adult-demo" — the demo adult patient of the Elbow Lateral exam (S14.3).
 *
 * PROVISIONAL / DEMO DATA. S14.3-5: LEFT elbow. The patient data (31-year-old male) matches the description of the baseline image (a real
 * normal left elbow, per its author); the case text calls the image a teaching approximation. The two elbow exams use the same elbow; neither is
 * a person from the chest cases (S12-4). The attenuation is the reference value 1 (not measured).
 */
export const elbowLateralAdultDemo: CaseDefinition = {
  schemaVersion: 1,
  id: "adult-demo",
  examId: "elbow-lateral",
  provisional: true,
  patient: {
    age: 31,
    sex: "male",
    description: {
      en: "31-year-old male, seated at the end of the table, able to flex the left elbow to 90° and rest the arm on the detector as instructed.",
      ar: "ذكر عمره ٣١ عامًا، جالس عند طرف الطاولة، قادر على ثني مرفقه الأيسر إلى 90° ووضع الذراع على الكاشف حسب التعليمات.",
    },
  },
  clinicalScenario: {
    en: "Pain in the left elbow after a minor fall. Referred from the emergency department for a lateral elbow X-ray. The patient can flex the elbow to 90°.",
    ar: "ألم في المرفق الأيسر بعد سقوط بسيط. محوَّل من قسم الطوارئ لأشعة المرفق بإسقاط جانبي. يستطيع المريض ثني مرفقه إلى 90°.",
  },
  requestedExamination: {
    en: "Elbow X-ray, left, lateral (flexed 90°).",
    ar: "أشعة المرفق، الأيسر، إسقاط جانبي (مثني 90°).",
  },
  patientCondition: {
    en: "Stable and cooperative. No cast, splint or jewellery on the left arm. The patient has arrived with the forearm slightly turned.",
    ar: "حالته مستقرة ومتعاون. لا جبيرة ولا مجوهرات على الذراع اليسرى. وصل المريض وساعده مائل قليلًا.",
  },
  patientTechnique: {
    attenuation: 1,
    label: { en: "Average adult elbow (reference attenuation; provisional)", ar: "مرفق بالغ متوسط (توهين مرجعي؛ مؤقت)" },
    evidence: {
      status: "provisional",
      reference: "S14.3-9; S10b-9; O26",
      note: "The reference attenuation 1 is the model's anchor, not a measured value; no mAs target is claimed.",
    },
  },
  radiograph: elbowLateralRadiograph,
  patientCooperation: elbowCooperativeAdult,
  // Deliberately NOT the answer: the other projection, rotated, off-centre, a fully open field, no marker, SID below the minimum, kV above the band.
  initialSettings: {
    projection: "elbow-ap",
    rotationDeg: -7,
    centralRay: { x: 0.28, y: 0.3 },
    collimation: { width: 1, height: 1 },
    sideMarker: null,
    markerPosition: { x: 0.35, y: 0 },
    sidCm: 90,
    kvp: 85,
    mas: 12.5,
    exposureMode: "manual",
    aecChambers: [],
    motionInstruction: "none",
  },
};

/** Compatibility view (what the engine, renderer, store and UI consume): the case composed with its exam. */
export const elbowLateral = composeCase(elbowLateralExam, elbowLateralAdultDemo);
