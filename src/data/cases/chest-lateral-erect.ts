import type { CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";
import { chestLateralErectExam } from "../exams/xray/chest-lateral-erect";
import { chestPaCooperativeAdult } from "./chest-pa-patient";
import { chestLateralRadiograph } from "./chest-lateral-radiograph";

/**
 * Case: "adult-demo" — the demo adult patient of the Chest Lateral erect exam (Session 12).
 *
 * PROVISIONAL / DEMO DATA. S12-4: the baseline radiograph shows a representative normal adult of a DIFFERENT person; D7 (align
 * the patient to the baseline) applies to the PA baseline only. The patient story continues the PA case (adult female, 21).
 * The lateral beam path is longer than the PA one: the case declares a per-projection attenuation (S11 mechanism). The factor
 * 2 is a provisional teaching value (S10b-9: the lateral is expected to need more exposure than the PA; no mAs figure is claimed).
 */
export const chestLateralAdultDemo: CaseDefinition = {
  schemaVersion: 1,
  id: "adult-demo",
  examId: "chest-lateral-erect",
  provisional: true,
  patient: {
    age: 21,
    sex: "female",
    description: {
      en: "21-year-old female, ambulant, able to stand, raise both arms and follow breathing instructions.",
      ar: "أنثى عمرها ٢١ عامًا، قادرة على الوقوف ورفع الذراعين واتباع تعليمات التنفس.",
    },
  },
  clinicalScenario: {
    en: "Persistent cough for three weeks. Referred by the outpatient clinic for a lateral view to accompany the PA chest.",
    ar: "سعال مستمر منذ ثلاثة أسابيع. محوَّل من العيادة الخارجية لصورة جانبية مرافقة لصورة الصدر PA.",
  },
  requestedExamination: {
    en: "Chest X-ray, lateral erect.",
    ar: "أشعة صدر، وضعية جانبية وقوفًا.",
  },
  patientCondition: {
    en: "Stable. No mobility limitations. The patient has arrived slightly turned to one side.",
    ar: "حالتها مستقرة ولا توجد قيود على الحركة. وصلت المريضة وهي مائلة قليلًا إلى أحد الجانبين.",
  },
  patientTechnique: {
    attenuation: 1,
    attenuationByProjection: { "lateral-left": 2 },
    label: { en: "Average adult (lateral path about 2× the PA exposure; teaching value)", ar: "بالغ متوسط (مسار جانبي نحو ضعف تعريض PA؛ قيمة تعليمية)" },
    evidence: {
      status: "provisional",
      reference: "S10b-9; WHO-TECH p.6-7; EC16260 p.21",
      note: "The lateral is expected to need more exposure than the PA (sources give the direction; mAs about twice in WHO-TECH). The factor 2 is a provisional teaching value, not a validated attenuation, and no mAs target is claimed. PA selected in this exam uses the reference attenuation 1.",
    },
  },
  radiograph: chestLateralRadiograph,
  patientCooperation: chestPaCooperativeAdult,
  initialSettings: {
    projection: "pa-erect",
    rotationDeg: 8,
    centralRay: { x: 0.23, y: 0.3 },
    collimation: { width: 1, height: 1 },
    chinPosition: "tucked",
    shoulderPosition: "relaxed",
    sideMarker: null,
    markerPosition: { x: -0.84, y: -0.44 },
    sidCm: 120,
    kvp: 70,
    mas: 12,
    exposureMode: "manual",
    aecChambers: [],
    breathing: "no-instruction",
    motionInstruction: "none",
    choices: { side: "R", arms: "lowered" },
  },
};

/** Compatibility view (what the engine, renderer, store and UI consume): the case composed with its exam. */
export const chestLateralErect = composeCase(chestLateralErectExam, chestLateralAdultDemo);
