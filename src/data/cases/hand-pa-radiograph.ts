import type { RadiographAssetSpec } from "@/domain/radiograph";
import { handImage } from "../exams/xray/hand-geometry";

/**
 * Educational baseline radiograph for Hand PA v1 (registry entries A-014 → A-015 in docs/ASSET_PROVENANCE_AND_LICENSES.md; the owner's
 * file "X-ray of normal hand by dorsoplantar projection", author Mikael Häggström, M.D., CC0 1.0 as seen by the owner; Commons API
 * verification outstanding, O39). A real normal adult LEFT hand (31-year-old male, per its author, the same person as the wrist images),
 * used as a TEACHING APPROXIMATION and an appearance reference only: never ground truth for any simulated error. It is not the person
 * of the chest cases. The master carries a burned-in mirrored "Sin" (top left, above the little finger); the web copy has it filled
 * with background (S14.2-7), so no text remains.
 *
 * Left hand, palm down, fingers up, thumb on the viewer's right. Landmarks below were read from the image by eye (1466 × 2082 px)
 * and are approximate: TODO(medical-review): have an educator confirm the landmark placement. Unscored / not drawn: finger spread,
 * thumb obliquity, shielding (O30).
 */
export const handPaRadiograph: RadiographAssetSpec = {
  id: "hand-pa-baseline",
  src: "/images/hand/hand-pa-baseline.jpg",
  widthPx: 1466,
  heightPx: 2082,
  projection: "hand-pa",
  registryIds: ["A-014", "A-015"],
  credit: {
    en: "Reference radiograph: “X-ray of normal hand by dorsoplantar projection”, Mikael Häggström, M.D., Wikimedia Commons, CC0 1.0 (licence confirmed by the project owner), burned-in text removed. A real normal adult left hand (a 31-year-old male, per its author) used as a teaching approximation: not a diagnostic image and not a person from the chest cases.",
    ar: "الصورة المرجعية: «X-ray of normal hand by dorsoplantar projection»، Mikael Häggström, M.D.، ويكيميديا كومنز، CC0 1.0 (الترخيص أكده مالك المشروع)، مع إزالة كتابة مطبوعة على الصورة. يد يسرى حقيقية طبيعية لشخص بالغ (ذكر عمره 31 عامًا بحسب صاحب الصورة) تُستخدم كتقريب تعليمي: وليست صورة تشخيصية وليست لأحد من حالات الصدر.",
  },
  evidence: {
    status: "educational-simplification",
    reference: "S14.2-6…11; docs/ASSET_PROVENANCE_AND_LICENSES.md (A-014, A-015)",
    note: "Educational appearance baseline of a real normal hand. Not clinical ground truth for any simulated error. Landmarks read by eye; scale assumed (0.0113 cm / px); licence owner-verified (O39).",
  },
  // The region from the fingertips to 2.5 cm below the radiocarpal joint (hand-geometry.ts); the rest of the image is more distal forearm.
  anatomyBox: { ...handImage("pa").box },
  // The carpal bones (rows ≈ 1480–1800 of 2082, columns ≈ 300–1000): the dense zone that low penetration makes less visible.
  denseZones: [{ cu: 0.45, cv: 0.79, ru: 0.28, rv: 0.1 }],
  limbRotation: {
    kind: "hand-pa",
    bands: [
      // Phalanges of digits 2–5 (rows ≈ 30–880 of 2082; columns ≈ 44–1100).
      { v1: 0.01, v2: 0.42, u1: 0.03, u2: 0.75 },
      // Metacarpal shafts 2–5 (rows ≈ 920–1480; columns ≈ 117–1056).
      { v1: 0.44, v2: 0.71, u1: 0.08, u2: 0.72 },
    ],
  },
};
