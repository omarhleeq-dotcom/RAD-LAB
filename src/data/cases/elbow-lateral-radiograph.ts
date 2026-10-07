import type { RadiographAssetSpec } from "@/domain/radiograph";
import { elbowImage } from "../exams/xray/elbow-geometry";

/**
 * Educational baseline radiograph for Elbow Lateral v1 (registry entries A-020 → A-021 in docs/ASSET_PROVENANCE_AND_LICENSES.md; the owner's
 * file, author Mikael Häggström, M.D., CC0 1.0 as seen by the owner; Commons API verification outstanding, O47). A real normal adult LEFT elbow
 * (31-year-old male, per its author, the same person as the wrist and hand images), used as a TEACHING APPROXIMATION and an appearance
 * reference only: never ground truth for any simulated error. It is not the person of the chest cases. The master carries no burned-in text.
 *
 * Left elbow, lateral, flexed ≈ 90°: the humerus vertical, the forearm toward the viewer's left (the radius on top, thumb side up), the olecranon at the lower right. Landmarks below were read from the image by eye (1086 × 1103 px) and are approximate: TODO(medical-review): have an educator confirm
 * the landmark placement. Unscored / not drawn: shielding, anode-heel placement, fat-pad visibility, arm / shoulder position, flexion angle (S14.3-5).
 */
export const elbowLateralRadiograph: RadiographAssetSpec = {
  id: "elbow-lateral-baseline",
  src: "/images/elbow/elbow-lateral-baseline.jpg",
  widthPx: 1086,
  heightPx: 1103,
  projection: "elbow-lateral",
  registryIds: ["A-020", "A-021"],
  credit: {
    en: "Reference radiograph: a normal adult left elbow, lateral, flexed 90°, thumb side up, Mikael Häggström, M.D., Wikimedia Commons, CC0 1.0 (licence confirmed by the project owner). The master carries no burned-in text. A real left elbow (a 31-year-old male, per its author) used as a teaching approximation: not a diagnostic image and not a person from the chest cases.",
    ar: "الصورة المرجعية: مرفق أيسر طبيعي لشخص بالغ، إسقاط جانبي، مثني 90° وجهة الإبهام لأعلى، Mikael Häggström, M.D.، ويكيميديا كومنز، CC0 1.0 (الترخيص أكده مالك المشروع). لا تحمل الصورة الأصلية أي كتابة مطبوعة. مرفق أيسر حقيقي (ذكر عمره 31 عامًا بحسب صاحب الصورة) يُستخدم كتقريب تعليمي: وليس صورة تشخيصية وليس لأحد من حالات الصدر.",
  },
  evidence: {
    status: "educational-simplification",
    reference: "S14.3-5…11; docs/ASSET_PROVENANCE_AND_LICENSES.md (A-020, A-021)",
    note: "Educational appearance baseline of a real normal elbow. Not clinical ground truth for any simulated error. Landmarks read by eye; scale assumed (0.0155 cm / px); licence owner-verified (O47).",
  },
  // The region around the target (elbow-geometry.ts); the rest of the image is collimated out. Result canvas at 48 px/cm (the baseline has ≈ 64 px/cm), drawn
  // as the required region + marker + 0.5 cm (not the whole 24 × 30 cm detector); capped by the canvas.
  render: { pxPerCm: 48, viewMarginCm: 0.5 },
  anatomyBox: { ...elbowImage("lateral").box },
  // the distal humerus condyles and the proximal ulna / olecranon (rows ≈ 740–1000 of 1103, columns ≈ 600–850): the dense zone that low penetration makes less visible.
  denseZones: [{ cu: 0.71, cv: 0.79, ru: 0.18, rv: 0.1 }],
  limbRotation: {
    kind: "elbow-lateral",
    bands: [
      // The distal humerus condyle outlines (the circle and the posterior condyle contour; rows ≈ 705–905 of 1103, columns ≈ 690–915).
      { v1: 0.64, v2: 0.82, u1: 0.635, u2: 0.843 },
      // The radial head and the coronoid process (rows ≈ 730–880, columns ≈ 545–690).
      { v1: 0.66, v2: 0.8, u1: 0.502, u2: 0.635 },
    ],
  },
};
