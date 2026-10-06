import type { CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";
import { chestApSupineExam } from "../exams/xray/chest-ap-supine";
import { chestApRadiograph } from "./chest-ap-radiograph";
import { chestPaCooperativeAdult } from "./chest-pa-patient";

/**
 * Case: "adult-demo" — the demo adult patient of the Chest AP supine exam (Session 13).
 *
 * PROVISIONAL / DEMO DATA. S12-4: the baseline radiograph shows a representative normal adult of a DIFFERENT person; D7 (align the
 * patient to the baseline) applies to the PA baseline only. The patient story continues the PA / lateral case (adult female, 21),
 * now unable to stand. The initial settings are deliberately wrong (a PA projection, erect-style set-up, no tube angle) so the
 * learner has to set the AP supine technique. The AP beam path through a supine adult is taken as the PA's (attenuation 1; not
 * measured); a lateral selected by mistake needs the same provisional 2× as in the Lateral exam.
 */
export const chestApAdultDemo: CaseDefinition = {
  schemaVersion: 1,
  id: "adult-demo",
  examId: "chest-ap-supine",
  provisional: true,
  patient: {
    age: 21,
    sex: "female",
    description: {
      en: "21-year-old female, on a bed, unable to stand. Can follow breathing instructions.",
      ar: "أنثى عمرها ٢١ عامًا، على سرير، غير قادرة على الوقوف. تستطيع اتباع تعليمات التنفس.",
    },
  },
  clinicalScenario: {
    en: "Admitted to the ward with a fever and a cough. She cannot stand, so the doctor asks for a chest X-ray with her lying on the bed.",
    ar: "أُدخلت إلى الجناح بحمّى وسعال. لا تستطيع الوقوف، فيطلب الطبيب أشعة صدر وهي مستلقية على السرير.",
  },
  requestedExamination: {
    en: "Chest X-ray, AP supine.",
    ar: "أشعة صدر، وضعية AP مستلقيًا.",
  },
  patientCondition: {
    en: "Stable, lying flat. The patient is slightly turned to one side and her shoulders are relaxed.",
    ar: "حالتها مستقرة وهي مستلقية. المريضة مائلة قليلًا إلى أحد الجانبين وكتفاها مسترخيان.",
  },
  patientTechnique: {
    attenuation: 1,
    attenuationByProjection: { "lateral-left": 2 },
    label: { en: "Average adult (AP path taken as the PA reference; provisional)", ar: "بالغ متوسط (مسار AP كمرجع PA؛ مؤقت)" },
    evidence: {
      status: "provisional",
      reference: "S10b-9; WHO-TECH p.6-7; EC16260 p.21",
      note: "The AP path through an average adult is taken as the PA reference (attenuation 1; not measured in the sources read). A lateral selected by mistake uses the same provisional teaching value 2 as the Lateral exam. No mAs target is claimed.",
    },
  },
  radiograph: chestApRadiograph,
  patientCooperation: chestPaCooperativeAdult,
  initialSettings: {
    projection: "pa-erect",
    rotationDeg: 8,
    centralRay: { x: 0.23, y: 0.3 },
    collimation: { width: 1, height: 1 },
    // Chin is not scored for the AP (no source for it) and is not drawn; start with it clear of the apices.
    chinPosition: "elevated",
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
    tubeAngulationDeg: 0,
    choices: { state: "semierect" },
  },
};

/** Compatibility view (what the engine, renderer, store and UI consume): the case composed with its exam. */
export const chestApSupine = composeCase(chestApSupineExam, chestApAdultDemo);
