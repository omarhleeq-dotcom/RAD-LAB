import type { PatientCooperationProfile } from "@/domain/patient";

/**
 * Cooperative adult for the wrist exams (S14.1c): follows the instructions it is given and, in this simplified model, does not hold
 * the hand still unless it is told to. A deterministic EDUCATIONAL ASSUMPTION (instruction → assumed response), not a measurement.
 * No breathing response: a wrist exam has no breathing instruction (S14.1b).
 */
export const wristCooperativeAdult: PatientCooperationProfile = {
  id: "cooperative-adult-wrist",
  label: { en: "Cooperative adult (follows the instructions given)", ar: "بالغ متعاون (ينفّذ التعليمات المعطاة)" },
  motionResponse: {
    "remain-still": "none",
    none: "motion",
    "relax-and-move": "motion",
  },
  evidence: {
    status: "educational-simplification",
    reference: "Image-quality ref (Motion); BONTRAGER-9 p.156, 158 (no motion)",
    note: "Motion causing loss of sharpness is a validated principle. That a given instruction produces a given patient response is an educational assumption.",
  },
};
