import type { RadiographAssetSpec } from "@/domain/radiograph";

/**
 * Educational baseline radiograph for Wrist Lateral v1 (registry entries A-012 → A-013 in docs/ASSET_PROVENANCE_AND_LICENSES.md;
 * Wikimedia Commons "X-ray of normal wrist by lateral projection.jpg", author Mikael Häggström, M.D., CC0 1.0, verified through the
 * Commons API on 2026-10-07). The SAME real normal adult left wrist as the PA baseline (31-year-old male, per its author), a
 * TEACHING APPROXIMATION and an appearance reference only. The master carries a burned-in side annotation ("Sin", bottom right): the
 * web copy is CROPPED to rows 0–1400 of 1756 (A-013), so no text remains. Which side is dorsal / palmar is NOT claimed.
 *
 * The image shows the carpals, the distal radius and ulna and the proximal metacarpals; the mid-metacarpal area is not in it (S14.1c-7,
 * O28). Landmarks were read by eye (559 × 1400 px) and are approximate: TODO(medical-review): have an educator confirm them.
 */
export const wristLateralRadiograph: RadiographAssetSpec = {
  id: "wrist-lateral-baseline",
  src: "/images/wrist/wrist-lateral-baseline.jpg",
  widthPx: 559,
  heightPx: 1400,
  projection: "wrist-lateral",
  registryIds: ["A-012", "A-013"],
  credit: {
    en: "Reference radiograph: “X-ray of normal wrist by lateral projection”, Mikael Häggström, M.D., Wikimedia Commons, CC0 1.0, cropped to remove a burned-in side annotation. A real normal adult left wrist (a 31-year-old male, per its author) used as a teaching approximation: not a diagnostic image and not a person from the chest cases.",
    ar: "الصورة المرجعية: «X-ray of normal wrist by lateral projection»، Mikael Häggström, M.D.، ويكيميديا كومنز، CC0 1.0، مقصوصة لإزالة كتابة جانبية مطبوعة على الصورة. رسغ أيسر حقيقي طبيعي لشخص بالغ (ذكر عمره 31 عامًا بحسب صاحب الصورة) يُستخدم كتقريب تعليمي: وليست صورة تشخيصية وليست لأحد من حالات الصدر.",
  },
  evidence: {
    status: "educational-simplification",
    reference: "S14.1c-1, S14.1c-3, S14.1c-7; docs/ASSET_PROVENANCE_AND_LICENSES.md (A-012, A-013)",
    note: "Educational appearance baseline of a real normal wrist. Not clinical ground truth for any simulated error. Landmarks read by eye; dorsal / palmar side not claimed.",
  },
  // Proximal metacarpals → distal radius / ulna (rows 0–1000 of 1400); the rest of the image is distal forearm.
  anatomyBox: { u1: 0, v1: 0, u2: 1, v2: 1000 / 1400 },
  // The carpal bones (rows ≈ 280–640).
  denseZones: [{ cu: 0.5, cv: 0.33, ru: 0.4, rv: 0.13 }],
  limbRotation: {
    kind: "wrist-lateral",
    // The bands that must be superimposed in a true lateral: the proximal metacarpals (rows 0–270, columns ≈ 110–559) and the ulnar head over the distal radius (rows ≈ 590–800, columns ≈ 185–440). 2.5D wrist model (S-VIS-1b).
    bands: [{ v1: 0, v2: 0.19, u1: 0.2, u2: 1 }, { v1: 0.42, v2: 0.57, u1: 0.33, u2: 0.79 }],
  },
  // Result canvas at 48 px/cm (the baseline has 80 px/cm at the assumed 0.0125 cm/px: no upscaling; S-VIS-1b-5). Capped by the canvas.
  render: { pxPerCm: 48 },
};
