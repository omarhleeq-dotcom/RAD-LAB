import type { CaseDefinition } from "@/domain/exam";
import type { SimulationSettings } from "@/domain/simulation";
import { type LowerLimbKind } from "../exams/xray/lower-limb-geometry";
import { lowerLimbCooperativeAdult } from "./lower-limb-patient";
import { LOWER_LIMB_RADIOGRAPHS } from "./lower-limb-radiographs";

/**
 * Cases of the four knee / foot exams: "adult-demo", the demo adult patient of each (S14.4).
 *
 * PROVISIONAL / DEMO DATA. S14.4-2: RIGHT limb. The knee patient (31-year-old male) matches the description of the baseline image (a real normal
 * right knee, per its Commons description); the foot cases use the same adult description (the foot file's own description was not read, O65). The
 * case text calls the image a teaching approximation; none is a person from the chest cases (S12-4). The patient is an AVERAGE build (knee AP: ASIS-to-table
 * about 21 cm) with an AVERAGE arch (class C, S14.4-3), so the tube-angle targets are Bontrager's average-patient values. The attenuation is the reference
 * value 1 (not measured).
 */
type CaseText = { en: string; ar: string };

const TEXT: Record<LowerLimbKind, { description: CaseText; scenario: CaseText; request: CaseText; condition: CaseText; attenuationLabel: CaseText }> = {
  "knee-ap": {
    description: {
      en: "31-year-old male, lying supine on the table, able to extend the right leg fully. Average build: the distance from the anterior superior iliac spine to the table is about 21 cm.",
      ar: "ذكر عمره ٣١ عامًا، مستلقٍ على ظهره على الطاولة، قادر على بسط ساقه اليمنى بالكامل. بنية متوسطة: المسافة من الشوكة الحرقفية الأمامية العليا إلى الطاولة نحو 21 سم.",
    },
    scenario: {
      en: "Pain in the right knee after a twisting injury. Referred from the emergency department for an AP knee X-ray. The patient can extend the leg fully.",
      ar: "ألم في الركبة اليمنى بعد التواء. محوَّل من قسم الطوارئ لأشعة الركبة بإسقاط AP. يستطيع المريض بسط ساقه بالكامل.",
    },
    request: { en: "Knee X-ray, right, AP (leg extended).", ar: "أشعة الركبة، اليمنى، إسقاط AP (الساق ممدودة)." },
    condition: {
      en: "Stable and cooperative. No cast, splint or jewellery on the right leg. The pelvis is level. The patient has arrived with the leg slightly turned.",
      ar: "حالته مستقرة ومتعاون. لا جبيرة ولا مجوهرات على الساق اليمنى. الحوض مستوٍ. وصل المريض وساقه مائلة قليلًا.",
    },
    attenuationLabel: { en: "Average adult knee (reference attenuation; provisional)", ar: "ركبة بالغ متوسطة (توهين مرجعي؛ مؤقت)" },
  },
  "knee-lateral": {
    description: {
      en: "31-year-old male, lying on his right side on the table, able to bend the right knee as instructed. Average build.",
      ar: "ذكر عمره ٣١ عامًا، مستلقٍ على جانبه الأيمن على الطاولة، قادر على ثني ركبته اليمنى حسب التعليمات. بنية متوسطة.",
    },
    scenario: {
      en: "Pain in the right knee after a twisting injury. Referred from the emergency department for a lateral knee X-ray. The patient can lie on the side and flex the knee.",
      ar: "ألم في الركبة اليمنى بعد التواء. محوَّل من قسم الطوارئ لأشعة الركبة بإسقاط جانبي. يستطيع المريض الاستلقاء على جانبه وثني ركبته.",
    },
    request: { en: "Knee X-ray, right, lateral (lateral recumbent, knee flexed).", ar: "أشعة الركبة، اليمنى، إسقاط جانبي (استلقاء جانبي، الركبة مثنية)." },
    condition: {
      en: "Stable and cooperative. No cast, splint or jewellery on the right leg. The patient has arrived with the leg slightly turned.",
      ar: "حالته مستقرة ومتعاون. لا جبيرة ولا مجوهرات على الساق اليمنى. وصل المريض وساقه مائلة قليلًا.",
    },
    attenuationLabel: { en: "Average adult knee (reference attenuation; provisional)", ar: "ركبة بالغ متوسطة (توهين مرجعي؛ مؤقت)" },
  },
  "foot-ap": {
    description: {
      en: "Adult male, lying supine on the table with the right knee bent and the sole of the foot on the detector, as instructed. Average arch.",
      ar: "ذكر بالغ، مستلقٍ على ظهره على الطاولة وركبته اليمنى مثنية وأخمص قدمه على الكاشف حسب التعليمات. قوس قدم متوسط.",
    },
    scenario: {
      en: "Pain in the right foot after a twisting injury. Referred from the emergency department for an AP foot X-ray. The patient can place the sole flat on the detector.",
      ar: "ألم في القدم اليمنى بعد التواء. محوَّل من قسم الطوارئ لأشعة القدم بإسقاط AP. يستطيع المريض وضع أخمص قدمه مسطحًا على الكاشف.",
    },
    request: { en: "Foot X-ray, right, AP (dorsoplantar).", ar: "أشعة القدم، اليمنى، إسقاط AP (ظهري أخمصي)." },
    condition: {
      en: "Stable and cooperative. No cast, splint or jewellery on the right foot. The patient has arrived with the foot slightly turned.",
      ar: "حالته مستقرة ومتعاون. لا جبيرة ولا مجوهرات على القدم اليمنى. وصل المريض وقدمه مائلة قليلًا.",
    },
    attenuationLabel: { en: "Average adult foot (reference attenuation; provisional)", ar: "قدم بالغ متوسطة (توهين مرجعي؛ مؤقت)" },
  },
  "foot-oblique": {
    description: {
      en: "Adult male, lying supine on the table with the right knee bent and the foot on the detector, able to turn the foot medially as instructed. Average arch.",
      ar: "ذكر بالغ، مستلقٍ على ظهره على الطاولة وركبته اليمنى مثنية وقدمه على الكاشف، قادر على إدارة قدمه إنسيًّا حسب التعليمات. قوس قدم متوسط.",
    },
    scenario: {
      en: "Pain in the right foot after a twisting injury. Referred from the emergency department for an AP medial oblique foot X-ray. The patient can turn the foot medially.",
      ar: "ألم في القدم اليمنى بعد التواء. محوَّل من قسم الطوارئ لأشعة القدم بإسقاط AP المائل الإنسي. يستطيع المريض إدارة قدمه إنسيًّا.",
    },
    request: { en: "Foot X-ray, right, AP medial oblique.", ar: "أشعة القدم، اليمنى، إسقاط AP المائل الإنسي." },
    condition: {
      en: "Stable and cooperative. No cast, splint or jewellery on the right foot. The patient has arrived with the foot lying flat.",
      ar: "حالته مستقرة ومتعاون. لا جبيرة ولا مجوهرات على القدم اليمنى. وصل المريض وقدمه مسطحة.",
    },
    attenuationLabel: { en: "Average adult foot (reference attenuation; provisional)", ar: "قدم بالغ متوسطة (توهين مرجعي؛ مؤقت)" },
  },
};

// Deliberately NOT the answer: the other projection of the pair, turned, off-centre, a fully open field, no marker, SID below the minimum,
// kV above the band, a wrong tube angle.
const INITIAL: Record<LowerLimbKind, Pick<SimulationSettings, "projection" | "rotationDeg" | "centralRay" | "tubeAngulationDeg">> = {
  "knee-ap": { projection: "knee-lateral", rotationDeg: 7, centralRay: { x: 0.28, y: 0.3 }, tubeAngulationDeg: 8 },
  "knee-lateral": { projection: "knee-ap", rotationDeg: -7, centralRay: { x: 0.28, y: 0.3 }, tubeAngulationDeg: 0 },
  "foot-ap": { projection: "foot-oblique", rotationDeg: 7, centralRay: { x: 0.28, y: -0.3 }, tubeAngulationDeg: 0 },
  "foot-oblique": { projection: "foot-ap", rotationDeg: 12, centralRay: { x: -0.28, y: -0.3 }, tubeAngulationDeg: 10 },
};

export const makeLowerLimbCase = (k: LowerLimbKind): CaseDefinition => {
  const t = TEXT[k];
  return {
    schemaVersion: 1,
    id: "adult-demo",
    examId: k,
    provisional: true,
    patient: { age: 31, sex: "male", description: t.description },
    clinicalScenario: t.scenario,
    requestedExamination: t.request,
    patientCondition: t.condition,
    patientTechnique: {
      attenuation: 1,
      label: t.attenuationLabel,
      evidence: {
        status: "provisional",
        reference: "S14.4-3; S10b-9; O26",
        note: "The reference attenuation 1 is the model's anchor, not a measured value; no mAs target is claimed.",
      },
    },
    radiograph: LOWER_LIMB_RADIOGRAPHS[k],
    patientCooperation: lowerLimbCooperativeAdult,
    initialSettings: {
      ...INITIAL[k],
      collimation: { width: 1, height: 1 },
      sideMarker: null,
      markerPosition: { x: -0.46, y: 0 },
      sidCm: 90,
      kvp: 90,
      mas: 12.5,
      exposureMode: "manual",
      aecChambers: [],
      motionInstruction: "none",
    },
  };
};
