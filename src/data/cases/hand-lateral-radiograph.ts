import type { RadiographAssetSpec } from "@/domain/radiograph";
import { handImage } from "../exams/xray/hand-geometry";

/**
 * Educational baseline radiograph for Hand Lateral v1, EXTENSION variant (S14.2-6; registry entries A-016 → A-017 in
 * docs/ASSET_PROVENANCE_AND_LICENSES.md; the owner's file "X-ray of normal hand by lateral projection", author Mikael Häggström, M.D.,
 * CC0 1.0 as seen by the owner; Commons API verification outstanding, O39). The SAME real normal adult left hand as the PA baseline
 * (31-year-old male, per its author), a TEACHING APPROXIMATION and an appearance reference only. The master carries a burned-in "SIDA"
 * (bottom right): the web copy has it filled with background (S14.2-7). Which side is dorsal / palmar is NOT claimed.
 *
 * Fingers extended and superimposed, the thumb separated (on the viewer's left). Landmarks were read by eye (686 × 2123 px) and are
 * approximate: TODO(medical-review): have an educator confirm them.
 */
export const handLateralRadiograph: RadiographAssetSpec = {
  id: "hand-lateral-baseline",
  src: "/images/hand/hand-lateral-baseline.jpg",
  widthPx: 686,
  heightPx: 2123,
  projection: "hand-lateral",
  registryIds: ["A-016", "A-017"],
  credit: {
    en: "Reference radiograph: “X-ray of normal hand by lateral projection”, Mikael Häggström, M.D., Wikimedia Commons, CC0 1.0 (licence confirmed by the project owner), burned-in text removed. A real normal adult left hand (a 31-year-old male, per its author) used as a teaching approximation: not a diagnostic image and not a person from the chest cases.",
    ar: "الصورة المرجعية: «X-ray of normal hand by lateral projection»، Mikael Häggström, M.D.، ويكيميديا كومنز، CC0 1.0 (الترخيص أكده مالك المشروع)، مع إزالة كتابة مطبوعة على الصورة. يد يسرى حقيقية طبيعية لشخص بالغ (ذكر عمره 31 عامًا بحسب صاحب الصورة) تُستخدم كتقريب تعليمي: وليست صورة تشخيصية وليست لأحد من حالات الصدر.",
  },
  evidence: {
    status: "educational-simplification",
    reference: "S14.2-6…11; docs/ASSET_PROVENANCE_AND_LICENSES.md (A-016, A-017)",
    note: "Educational appearance baseline of a real normal hand. Not clinical ground truth for any simulated error. Landmarks read by eye; scale assumed (0.0113 cm / px); dorsal / palmar side not claimed; licence owner-verified (O39).",
  },
  // The region from the fingertips to 2.5 cm below the radiocarpal joint (hand-geometry.ts); the rest of the image is more distal forearm.
  anatomyBox: { ...handImage("lateral").box },
  // The carpal bones (rows ≈ 1560–1800 of 2123, columns ≈ 260–520).
  denseZones: [{ cu: 0.57, cv: 0.79, ru: 0.22, rv: 0.08 }],
  limbRotation: {
    kind: "hand-lateral",
    bands: [
      // The extended fingers over the metacarpals (rows 0–1480; the column at columns ≈ 290–600, so the separated thumb is not duplicated).
      { v1: 0, v2: 0.7, u1: 0.42, u2: 0.88 },
      // The distal radius over the ulna (rows ≈ 1830–2123).
      { v1: 0.86, v2: 1 },
    ],
  },
};
