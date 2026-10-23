import type { CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";
import { shoulderGrasheyErectExam } from "../exams/xray/shoulder-grashey-erect";
import { shoulderGrasheyRadiograph } from "./shoulder-grashey-radiograph";
/**
 * Case "adult-demo" of the Shoulder Grashey exam (S-SHOULDER-3). The fictional patient is NOT the person in the baseline image (S12-4) and no posture or
 * clinical history of that person is claimed. The case is erect (S-SHOULDER-2-3). Attenuation 1 is the reference value, not measured.
 */
export const shoulderGrasheyAdultDemo: CaseDefinition = {
  schemaVersion: 1, id: "adult-demo", examId: "shoulder-grashey-erect", provisional: true,
  patient: { age: 35, sex: "male", description: { en: "Adult male, standing and cooperative; a fictional non-acute positioning exercise.", ar: "ذكر بالغ، واقف ومتعاون؛ تدريب افتراضي على الوضعية دون إصابة حادة." } },
  clinicalScenario: { en: "Practise an AP oblique glenoid (Grashey) setup of the right shoulder for a cooperative adult without acute trauma. The reference radiograph is an educational appearance reference from another person, not a diagnosis.", ar: "تدرّب على إعداد الإسقاط الأمامي الخلفي المائل للجوف الحقاني (غراشي) للكتف الأيمن لبالغ متعاون دون إصابة حادة. صورة الأشعة مرجع مظهر تعليمي من شخص آخر وليست تشخيصًا." },
  requestedExamination: { en: "Right shoulder, AP oblique glenoid (Grashey), erect.", ar: "الكتف الأيمن، الإسقاط الأمامي الخلفي المائل للجوف الحقاني (غراشي)، واقف." },
  patientCondition: { en: "Stable, standing with the back to the detector; arm at the side and body not yet turned. Breathing is not yet instructed.", ar: "مستقر، واقف وظهره إلى الكاشف؛ الذراع إلى الجانب والجسم غير مُدار بعد. لم تُعطَ تعليمات التنفس بعد." },
  patientTechnique: { attenuation: 1, label: { en: "Reference adult attenuation", ar: "توهين بالغ مرجعي" }, evidence: { status: "educational-simplification", reference: "docs/DECISIONS.md S-SHOULDER-3-3", note: "Reference anchor, not measured patient attenuation." } },
  radiograph: shoulderGrasheyRadiograph,
  patientCooperation: { id: "shoulder-cooperative-adult", label: { en: "Cooperative adult (assumed)", ar: "بالغ متعاون (افتراضي)" }, motionResponse: { none: "motion", "remain-still": "none", "relax-and-move": "motion" }, evidence: { status: "educational-simplification", reference: "docs/DECISIONS.md S-SHOULDER-3-3", note: "Case assumption only. No chest inspiration response or lung deformation is declared." } },
  initialSettings: { projection: "shoulder-grashey", rotationDeg: 15, centralRay: { x: 0.14, y: 0.14 }, collimation: { width: 1, height: 1 }, sideMarker: null, markerPosition: { x: 0.37, y: -0.38 }, sidCm: 90, kvp: 100, mas: 8, exposureMode: "manual", aecChambers: [], motionInstruction: "none", tubeAngulationDeg: 6, choices: { armPosition: "external", respiration: "none" } },
};
export const shoulderGrasheyErect = composeCase(shoulderGrasheyErectExam, shoulderGrasheyAdultDemo);
