import type { RadiographAssetSpec } from "@/domain/radiograph";
import type { CaseDefinition } from "@/domain/exam";
import type { SimulationSettings } from "@/domain/simulation";
import type { UpperLimbFamily, UpperLimbKind } from "../exams/xray/upper-limb-common";
import { elbowApRadiograph } from "./elbow-ap-radiograph";
import { elbowLateralRadiograph } from "./elbow-lateral-radiograph";
import { handLateralRadiograph } from "./hand-lateral-radiograph";
import { handPaRadiograph } from "./hand-pa-radiograph";
import { upperLimbCooperativeAdult } from "./upper-limb-patient";
import { wristLateralRadiograph } from "./wrist-lateral-radiograph";
import { wristPaRadiograph } from "./wrist-pa-radiograph";

/**
 * Cases of the six upper-limb exams: "adult-demo", the demo adult patient of each (wrist S14.1c, hand S14.2b, elbow S14.3; CLN-016, RAD-068).
 *
 * PROVISIONAL / DEMO DATA. LEFT limb (S14.1c-1 wrist, S14.2-8 hand, S14.3-5 elbow). The patient data (31-year-old male) matches the description
 * of each baseline image (a real normal left wrist / hand / elbow, per its author; the two wrist baselines are the same person's left wrist); the
 * case text calls the image a teaching approximation. The two exams of a body part use the same limb; none is a person from the chest cases
 * (S12-4). The attenuation is the reference value 1 (not measured).
 */
type CaseText = { en: string; ar: string };

/** Per-body-part case text (the same patient for both projections). */
const FAMILY: Record<UpperLimbFamily, { condition: CaseText; attenuationLabel: CaseText; attenuationRef: string }> = {
  wrist: {
    condition: {
      en: "Stable and cooperative. No cast, splint or jewellery on the left wrist. The patient has arrived with the hand slightly turned.",
      ar: "حالته مستقرة ومتعاون. لا جبيرة ولا مجوهرات على الرسغ الأيسر. وصل المريض ويده مائلة قليلًا.",
    },
    attenuationLabel: { en: "Average adult wrist (reference attenuation; provisional)", ar: "رسغ بالغ متوسط (توهين مرجعي؛ مؤقت)" },
    attenuationRef: "S14.1c-6; S10b-9; O26",
  },
  hand: {
    condition: {
      en: "Stable and cooperative. No cast, splint, rings or jewellery on the left hand. The patient has arrived with the hand slightly turned.",
      ar: "حالته مستقرة ومتعاون. لا جبيرة ولا خواتم ولا مجوهرات على اليد اليسرى. وصل المريض ويده مائلة قليلًا.",
    },
    attenuationLabel: { en: "Average adult hand (reference attenuation; provisional)", ar: "يد بالغ متوسطة (توهين مرجعي؛ مؤقت)" },
    attenuationRef: "S14.2-10; S10b-9; O26",
  },
  elbow: {
    condition: {
      en: "Stable and cooperative. No cast, splint or jewellery on the left arm. The patient has arrived with the forearm slightly turned.",
      ar: "حالته مستقرة ومتعاون. لا جبيرة ولا مجوهرات على الذراع اليسرى. وصل المريض وساعده مائل قليلًا.",
    },
    attenuationLabel: { en: "Average adult elbow (reference attenuation; provisional)", ar: "مرفق بالغ متوسط (توهين مرجعي؛ مؤقت)" },
    attenuationRef: "S14.3-9; S10b-9; O26",
  },
};

const WRIST_DESCRIPTION: CaseText = {
  en: "31-year-old male, seated at the end of the table, able to rest the forearm and hand on the detector as instructed.",
  ar: "ذكر عمره ٣١ عامًا، جالس عند طرف الطاولة، قادر على وضع الساعد واليد على الكاشف حسب التعليمات.",
};
const HAND_DESCRIPTION: CaseText = {
  en: "31-year-old male, seated at the end of the table, able to rest the hand and forearm on the detector as instructed.",
  ar: "ذكر عمره ٣١ عامًا، جالس عند طرف الطاولة، قادر على وضع اليد والساعد على الكاشف حسب التعليمات.",
};

/** Per-exam case text and baseline image. */
const PER: Record<UpperLimbKind, { description: CaseText; scenario: CaseText; request: CaseText; radiograph: RadiographAssetSpec }> = {
  "wrist-pa": {
    description: WRIST_DESCRIPTION,
    scenario: {
      en: "Pain in the left wrist after a minor fall. Referred from the emergency department for a PA wrist X-ray.",
      ar: "ألم في الرسغ الأيسر بعد سقوط بسيط. محوَّل من قسم الطوارئ لأشعة الرسغ بإسقاط PA.",
    },
    request: { en: "Wrist X-ray, left, PA.", ar: "أشعة الرسغ، الأيسر، إسقاط PA." },
    radiograph: wristPaRadiograph,
  },
  "wrist-lateral": {
    description: WRIST_DESCRIPTION,
    scenario: {
      en: "Pain in the left wrist after a minor fall. Referred from the emergency department for a lateral wrist X-ray to accompany the PA.",
      ar: "ألم في الرسغ الأيسر بعد سقوط بسيط. محوَّل من قسم الطوارئ لأشعة الرسغ بالإسقاط الجانبي مع إسقاط PA.",
    },
    request: { en: "Wrist X-ray, left, lateral.", ar: "أشعة الرسغ، الأيسر، إسقاط جانبي." },
    radiograph: wristLateralRadiograph,
  },
  "hand-pa": {
    description: HAND_DESCRIPTION,
    scenario: {
      en: "Pain in the left hand after a minor fall. Referred from the emergency department for a PA hand X-ray.",
      ar: "ألم في اليد اليسرى بعد سقوط بسيط. محوَّل من قسم الطوارئ لأشعة اليد بإسقاط PA.",
    },
    request: { en: "Hand X-ray, left, PA.", ar: "أشعة اليد، اليسرى، إسقاط PA." },
    radiograph: handPaRadiograph,
  },
  "hand-lateral": {
    description: HAND_DESCRIPTION,
    scenario: {
      en: "Pain in the left hand after a minor fall. Referred from the emergency department for a lateral hand X-ray (fingers extended) to accompany the PA.",
      ar: "ألم في اليد اليسرى بعد سقوط بسيط. محوَّل من قسم الطوارئ لأشعة اليد بالإسقاط الجانبي (مع بسط الأصابع) مع إسقاط PA.",
    },
    request: { en: "Hand X-ray, left, lateral (fingers extended).", ar: "أشعة اليد، اليسرى، إسقاط جانبي (مع بسط الأصابع)." },
    radiograph: handLateralRadiograph,
  },
  "elbow-ap": {
    description: {
      en: "31-year-old male, seated at the end of the table, able to extend the left arm fully and rest it on the detector as instructed.",
      ar: "ذكر عمره ٣١ عامًا، جالس عند طرف الطاولة، قادر على بسط ذراعه اليسرى بالكامل ووضعها على الكاشف حسب التعليمات.",
    },
    scenario: {
      en: "Pain in the left elbow after a minor fall. Referred from the emergency department for an AP elbow X-ray. The patient can extend the arm fully.",
      ar: "ألم في المرفق الأيسر بعد سقوط بسيط. محوَّل من قسم الطوارئ لأشعة المرفق بإسقاط AP. يستطيع المريض بسط ذراعه بالكامل.",
    },
    request: { en: "Elbow X-ray, left, AP (fully extended).", ar: "أشعة المرفق، الأيسر، إسقاط AP (ممدود بالكامل)." },
    radiograph: elbowApRadiograph,
  },
  "elbow-lateral": {
    description: {
      en: "31-year-old male, seated at the end of the table, able to flex the left elbow to 90° and rest the arm on the detector as instructed.",
      ar: "ذكر عمره ٣١ عامًا، جالس عند طرف الطاولة، قادر على ثني مرفقه الأيسر إلى 90° ووضع الذراع على الكاشف حسب التعليمات.",
    },
    scenario: {
      en: "Pain in the left elbow after a minor fall. Referred from the emergency department for a lateral elbow X-ray. The patient can flex the elbow to 90°.",
      ar: "ألم في المرفق الأيسر بعد سقوط بسيط. محوَّل من قسم الطوارئ لأشعة المرفق بإسقاط جانبي. يستطيع المريض ثني مرفقه إلى 90°.",
    },
    request: { en: "Elbow X-ray, left, lateral (flexed 90°).", ar: "أشعة المرفق، الأيسر، إسقاط جانبي (مثني 90°)." },
    radiograph: elbowLateralRadiograph,
  },
};

// Deliberately NOT the answer: the other projection, rotated, off-centre, a fully open field, no marker, SID and kV outside the band (the wrist
// lateral: rotated the other way, SID above the band, kV below it).
const INITIAL: Record<UpperLimbKind, Pick<SimulationSettings, "projection" | "rotationDeg" | "centralRay" | "markerPosition" | "sidCm" | "kvp" | "mas">> = {
  "wrist-pa": { projection: "wrist-lateral", rotationDeg: 7, centralRay: { x: 0.28, y: 0.3 }, markerPosition: { x: -0.62, y: 0 }, sidCm: 90, kvp: 80, mas: 12.5 },
  "wrist-lateral": { projection: "wrist-pa", rotationDeg: -6, centralRay: { x: -0.3, y: -0.4 }, markerPosition: { x: -0.62, y: 0 }, sidCm: 125, kvp: 50, mas: 1 },
  "hand-pa": { projection: "hand-lateral", rotationDeg: 7, centralRay: { x: 0.28, y: 0.3 }, markerPosition: { x: -0.68, y: 0 }, sidCm: 90, kvp: 80, mas: 12.5 },
  "hand-lateral": { projection: "hand-pa", rotationDeg: 7, centralRay: { x: 0.28, y: 0.3 }, markerPosition: { x: -0.55, y: 0 }, sidCm: 90, kvp: 80, mas: 12.5 },
  "elbow-ap": { projection: "elbow-lateral", rotationDeg: 7, centralRay: { x: 0.28, y: 0.3 }, markerPosition: { x: -0.46, y: 0 }, sidCm: 90, kvp: 85, mas: 12.5 },
  "elbow-lateral": { projection: "elbow-ap", rotationDeg: -7, centralRay: { x: 0.28, y: 0.3 }, markerPosition: { x: 0.35, y: 0 }, sidCm: 90, kvp: 85, mas: 12.5 },
};

export const makeUpperLimbCase = (k: UpperLimbKind): CaseDefinition => {
  const family = k.split("-")[0] as UpperLimbFamily;
  const f = FAMILY[family];
  const p = PER[k];
  const i = INITIAL[k];
  return {
    schemaVersion: 1,
    id: "adult-demo",
    examId: k,
    provisional: true,
    patient: { age: 31, sex: "male", description: p.description },
    clinicalScenario: p.scenario,
    requestedExamination: p.request,
    patientCondition: f.condition,
    patientTechnique: {
      attenuation: 1,
      label: f.attenuationLabel,
      evidence: {
        status: "provisional",
        reference: f.attenuationRef,
        note: "The reference attenuation 1 is the model's anchor, not a measured value; no mAs target is claimed.",
      },
    },
    radiograph: p.radiograph,
    patientCooperation: upperLimbCooperativeAdult(family),
    initialSettings: {
      projection: i.projection,
      rotationDeg: i.rotationDeg,
      centralRay: i.centralRay,
      collimation: { width: 1, height: 1 },
      sideMarker: null,
      markerPosition: i.markerPosition,
      sidCm: i.sidCm,
      kvp: i.kvp,
      mas: i.mas,
      exposureMode: "manual",
      aecChambers: [],
      motionInstruction: "none",
    },
  };
};
