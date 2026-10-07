import type { PatientCooperationProfile } from "@/domain/patient";

/**
 * Cooperative adult for the elbow exams (S14.3): follows the instructions it is given and, in this simplified model, does not hold the
 * arm still unless it is told to. A deterministic EDUCATIONAL ASSUMPTION (instruction → assumed response), not a measurement. No breathing
 * response: an elbow exam has no breathing instruction.
 */
export const elbowCooperativeAdult: PatientCooperationProfile = {
  id: "cooperative-adult-elbow",
  label: { en: "Cooperative adult (follows the instructions given)", ar: "بالغ متعاون (ينفّذ التعليمات المعطاة)" },
  motionResponse: {
    "remain-still": "none",
    none: "motion",
    "relax-and-move": "motion",
  },
  evidence: {
    status: "educational-simplification",
    reference: "Image-quality ref (Motion); BONTRAGER-9 p.166, 172 (no motion)",
    note: "Motion causing loss of sharpness is a validated principle. That a given instruction produces a given patient response is an educational assumption.",
  },
};
