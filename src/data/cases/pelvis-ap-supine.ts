import type { CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";
import { pelvisApSupineExam } from "../exams/xray/pelvis-ap-supine";
import { pelvisApRadiograph } from "./pelvis-ap-radiograph";
export const pelvisApAdultDemo: CaseDefinition = {
  schemaVersion: 1, id: "adult-demo", examId: "pelvis-ap-supine", provisional: true,
  patient: { age: 18, sex: "male", description: { en: "Adult male, supine and cooperative; a fictional non-trauma positioning exercise.", ar: "ذكر بالغ، مستلقٍ ومتعاون؛ تدريب افتراضي على الوضعية دون رضوض." } },
  clinicalScenario: { en: "Practise a routine AP pelvis setup for a cooperative adult without suspected hip fracture or dislocation. The reference radiograph is an educational appearance reference from another person, not a diagnosis.", ar: "تدرّب على إعداد الحوض AP الروتيني لبالغ متعاون دون اشتباه بكسر أو خلع في الورك. صورة الأشعة مرجع مظهر تعليمي من شخص آخر وليست تشخيصًا." },
  requestedExamination: { en: "Pelvis AP, supine, both hips.", ar: "الحوض AP، مستلقٍ، كلا الوركين." },
  patientCondition: { en: "Stable, no trauma; legs initially neutral. Do not apply internal leg rotation in a suspected fracture/dislocation case.", ar: "مستقر، دون رضوض؛ الطرفان في الوضع المحايد أولًا. لا تطبق الدوران الداخلي عند الاشتباه بكسر أو خلع." },
  patientTechnique: { attenuation: 1, label: { en: "Reference adult attenuation (teaching assumption)", ar: "توهين بالغ مرجعي (افتراض تعليمي)" }, evidence: { status: "educational-simplification", reference: "docs/DECISIONS.md S-PELVIS-1-3", note: "Reference anchor, not measured patient attenuation." } },
  radiograph: pelvisApRadiograph,
  patientCooperation: { id: "pelvis-cooperative-adult", label: { en: "Cooperative adult (assumed)", ar: "بالغ متعاون (افتراضي)" }, motionResponse: { none: "motion", "remain-still": "none", "relax-and-move": "motion" }, evidence: { status: "educational-simplification", reference: "docs/DECISIONS.md S-PELVIS-1-2", note: "Case assumption only. No chest inspiration response or lung deformation is declared." } },
  initialSettings: { projection: "pelvis-ap", rotationDeg: 8, centralRay: { x: 0.14, y: 0.14 }, collimation: { width: 1, height: 1 }, sideMarker: null, markerPosition: { x: -0.86, y: -0.743 }, sidCm: 90, kvp: 100, mas: 8, exposureMode: "manual", aecChambers: [], motionInstruction: "none", tubeAngulationDeg: 6, choices: { legPosition: "neutral", respiration: "none" } },
};
export const pelvisApSupine = composeCase(pelvisApSupineExam, pelvisApAdultDemo);
