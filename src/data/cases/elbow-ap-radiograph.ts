import type { RadiographAssetSpec } from "@/domain/radiograph";
import { elbowImage } from "../exams/xray/elbow-geometry";

/**
 * Educational baseline radiograph for Elbow AP v1 (registry entries A-018 → A-019 in docs/ASSET_PROVENANCE_AND_LICENSES.md; the owner's
 * file, author Mikael Häggström, M.D., CC0 1.0 as seen by the owner; Commons API verification outstanding, O47). A real normal adult LEFT elbow
 * (31-year-old male, per its author, the same person as the wrist and hand images), used as a TEACHING APPROXIMATION and an appearance
 * reference only: never ground truth for any simulated error. It is not the person of the chest cases. The mirrored “Sin” and the small “F” burned into the master were removed (a fill and a crop, S14.3-7).
 *
 * Left elbow, supinated, AP: the ulna on the viewer's left (medial), the radius on the right (lateral); both epicondyles are inside the image, the medial one larger. Landmarks below were read from the image by eye (849 × 1097 px) and are approximate: TODO(medical-review): have an educator confirm
 * the landmark placement. Unscored / not drawn: shielding, anode-heel placement, fat-pad visibility, arm / shoulder position, flexion angle (S14.3-5).
 */
export const elbowApRadiograph: RadiographAssetSpec = {
  id: "elbow-ap-baseline",
  src: "/images/elbow/elbow-ap-baseline.jpg",
  widthPx: 849,
  heightPx: 1097,
  projection: "elbow-ap",
  registryIds: ["A-018", "A-019"],
  credit: {
    en: "Reference radiograph: a normal adult left elbow, AP, fully extended, supinated, Mikael Häggström, M.D., Wikimedia Commons, CC0 1.0 (licence confirmed by the project owner). The mirrored “Sin” and the small “F” burned into the master were removed (a fill and a crop, S14.3-7). A real left elbow (a 31-year-old male, per its author) used as a teaching approximation: not a diagnostic image and not a person from the chest cases.",
    ar: "الصورة المرجعية: مرفق أيسر طبيعي لشخص بالغ، إسقاط AP، ممدود بالكامل وراحة اليد للأعلى، Mikael Häggström, M.D.، ويكيميديا كومنز، CC0 1.0 (الترخيص أكده مالك المشروع). أُزيلت الكتابة المطبوعة على الصورة (Sin المعكوسة وحرف F) بملء وقص (S14.3-7). مرفق أيسر حقيقي (ذكر عمره 31 عامًا بحسب صاحب الصورة) يُستخدم كتقريب تعليمي: وليس صورة تشخيصية وليس لأحد من حالات الصدر.",
  },
  evidence: {
    status: "educational-simplification",
    reference: "S14.3-5…11; docs/ASSET_PROVENANCE_AND_LICENSES.md (A-018, A-019)",
    note: "Educational appearance baseline of a real normal elbow. Not clinical ground truth for any simulated error. Landmarks read by eye; scale assumed (0.0155 cm / px); licence owner-verified (O47).",
  },
  // The region around the target (elbow-geometry.ts); the rest of the image is collimated out. Result canvas at 48 px/cm (the baseline has ≈ 64 px/cm), drawn
  // as the required region + marker + 0.5 cm (not the whole 24 × 30 cm detector); capped by the canvas.
  render: { pxPerCm: 48, viewMarginCm: 0.5 },
  anatomyBox: { ...elbowImage("ap").box },
  // the distal humerus condyles and the proximal ulna (rows ≈ 330–530 of 1097, columns ≈ 150–590): the dense zone that low penetration makes less visible.
  denseZones: [{ cu: 0.43, cv: 0.39, ru: 0.33, rv: 0.12 }],
  limbRotation: {
    kind: "elbow-ap",
    // The forearm rows (from the joint down): the ulna layer (source columns left of the contact line) and the radius layer (right of it) move separately; contact line ≈ column 395 of 849.
    forearm: { v1: 0.51, v2: 1, splitU: 0.465 },
  },
};
