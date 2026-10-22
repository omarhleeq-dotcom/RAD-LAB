import type { PatientCooperationProfile } from "@/domain/patient";
import type { UpperLimbFamily } from "../exams/xray/upper-limb-common";

/** The Bontrager pages of each upper-limb family (the "no motion" criterion of both projections). */
const PAGES: Record<UpperLimbFamily, string> = { wrist: "p.156, 158", hand: "p.150, 153", elbow: "p.166, 172" };

/**
 * Cooperative adult for the upper-limb exams (wrist S14.1c, hand S14.2b, elbow S14.3): follows the instructions it is given and, in this
 * simplified model, does not hold the hand / arm still unless it is told to. A deterministic EDUCATIONAL ASSUMPTION (instruction → assumed
 * response), not a measurement. No breathing response: these exams have no breathing instruction (S14.1b).
 */
export const upperLimbCooperativeAdult = (family: UpperLimbFamily): PatientCooperationProfile => ({
  id: `cooperative-adult-${family}`,
  label: { en: "Cooperative adult (follows the instructions given)", ar: "بالغ متعاون (ينفّذ التعليمات المعطاة)" },
  motionResponse: {
    "remain-still": "none",
    none: "motion",
    "relax-and-move": "motion",
  },
  evidence: {
    status: "educational-simplification",
    reference: `Image-quality ref (Motion); BONTRAGER-9 ${PAGES[family]} (no motion)`,
    note: "Motion causing loss of sharpness is a validated principle. That a given instruction produces a given patient response is an educational assumption.",
  },
});
