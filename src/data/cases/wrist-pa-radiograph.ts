import type { RadiographAssetSpec } from "@/domain/radiograph";

/**
 * Educational baseline radiograph for Wrist PA v1 (registry entries A-010 → A-011 in docs/ASSET_PROVENANCE_AND_LICENSES.md;
 * Wikimedia Commons "X-ray of normal wrist by dorsoplantar projection (crop).jpg", author Mikael Häggström, M.D., CC0 1.0, verified
 * through the Commons API on 2026-10-07). A real normal adult LEFT wrist (31-year-old male, per its author), used as a TEACHING
 * APPROXIMATION and an appearance reference only: never ground truth for any simulated error. It is not the person of the chest cases.
 *
 * The image is the author's crop: it shows the distal radius and ulna, the carpals and the PROXIMAL metacarpals; the mid-metacarpal
 * area Bontrager names is not in it and the thumb side is cut by the right edge (S14.1c-7, O28). Left wrist, thumb on the viewer's
 * right. Landmarks below were read from the image by eye (690 × 980 px) and are approximate: TODO(medical-review): have an educator
 * confirm the landmark placement. Unscored / not drawn: the hand arch, the shoulder-elbow-wrist plane and shielding (O30).
 */
export const wristPaRadiograph: RadiographAssetSpec = {
  id: "wrist-pa-baseline",
  src: "/images/wrist/wrist-pa-baseline.jpg",
  widthPx: 690,
  heightPx: 980,
  projection: "wrist-pa",
  registryIds: ["A-010", "A-011"],
  credit: {
    en: "Reference radiograph: “X-ray of normal wrist by dorsoplantar projection (crop)”, Mikael Häggström, M.D., Wikimedia Commons, CC0 1.0. A real normal adult left wrist (a 31-year-old male, per its author) used as a teaching approximation: not a diagnostic image and not a person from the chest cases.",
    ar: "الصورة المرجعية: «X-ray of normal wrist by dorsoplantar projection (crop)»، Mikael Häggström, M.D.، ويكيميديا كومنز، CC0 1.0. رسغ أيسر حقيقي طبيعي لشخص بالغ (ذكر عمره 31 عامًا بحسب صاحب الصورة) يُستخدم كتقريب تعليمي: وليست صورة تشخيصية وليست لأحد من حالات الصدر.",
  },
  evidence: {
    status: "educational-simplification",
    reference: "S14.1c-1, S14.1c-3, S14.1c-7; docs/ASSET_PROVENANCE_AND_LICENSES.md (A-010, A-011)",
    note: "Educational appearance baseline of a real normal wrist. Not clinical ground truth for any simulated error. Landmarks read by eye; the image stops at the proximal metacarpals.",
  },
  // The whole image: distal radius / ulna → proximal metacarpals (the required region ends at the top edge of the available image).
  anatomyBox: { u1: 0, v1: 0, u2: 1, v2: 1 },
  // The carpal bones: the dense zone that low penetration makes less visible.
  denseZones: [{ cu: 0.5, cv: 0.36, ru: 0.36, rv: 0.2 }],
  // 2.5D wrist model (S-VIS-1b, features/wrist-model): the forearm rows start at the radiocarpal joint (row ≈ 510 of 980); the contact line between
  // the ulna (columns ≈ 105–310) and the radius (≈ 320–600) is at column ≈ 315. Read by eye, approximate.
  limbRotation: { kind: "wrist-pa", forearm: { v1: 0.52, v2: 1, splitU: 0.457 } },
  // Result canvas at 48 px/cm (the baseline has ≈ 80 px/cm at the assumed 0.01245 cm/px: no upscaling; S-VIS-1b-5). Capped by the canvas.
  render: { pxPerCm: 48 },
};
