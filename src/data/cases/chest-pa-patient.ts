import type { PatientCooperationProfile } from "@/domain/patient";

/**
 * Cooperative adult: follows exactly the instructions it is given, and — in this simplified model — does not
 * hold still unless it is told to. This is a deterministic EDUCATIONAL ASSUMPTION (instruction → assumed
 * response), not a measurement of any patient's inspiration or movement. A future case may supply a patient
 * who needs reinforcement or has difficulty following breathing instructions by changing only this data.
 */
export const chestPaCooperativeAdult: PatientCooperationProfile = {
  id: "cooperative-adult",
  label: { en: "Cooperative adult (follows the instructions given)", ar: "بالغ متعاون (ينفّذ التعليمات المعطاة)" },
  inspirationResponse: {
    "deep-inspiration-hold": "adequate",
    "expiration-hold": "reduced",
    "normal-breathing": "reduced",
    "no-instruction": "reduced",
  },
  motionResponse: {
    "remain-still": "none",
    none: "motion",
    "relax-and-move": "motion",
  },
  evidence: {
    status: "educational-simplification",
    reference: "Image-quality ref (Inspiration; Motion)",
    note: "Deep/full inspiration with suspended respiration is a common PA chest quality criterion; motion causing loss of sharpness is a validated principle. That a given instruction produces a given patient response is an educational assumption.",
  },
};
