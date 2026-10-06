import type { RadiographAssetSpec } from "@/domain/radiograph";

/**
 * Educational baseline radiograph for Chest Lateral v1 (registry entries A-006 → A-007 in
 * docs/ASSET_PROVENANCE_AND_LICENSES.md; CC0 1.0 as stated by the owner from the Wikimedia Commons file page,
 * "owner-verified, attached file, re-verify later").
 *
 * S12-4: a representative normal ADULT lateral radiograph of a DIFFERENT PERSON from the PA case's baseline; D7 (patient
 * data aligned to the baseline) applies to the PA baseline only. It is a TEACHING APPROXIMATION and an appearance
 * reference only. Which side of the patient was against the detector cannot be read from the image and is not claimed.
 * Landmarks below were read from the image by eye and are approximate: TODO(medical-review): have an educator confirm
 * the landmark placement.
 *
 * The anterior chest is on the viewer's left and the spine on the right (the lateral display convention of this
 * simulator, see `positioning.markerSide` in the exam). No `midlineU`, `scapulae`, `jaw` or `denseZones`: a lateral has
 * no frontal midline and the chin / arm overlays are not drawn in this version (the checks are scored and labelled
 * "not drawn"); low penetration is therefore scored but not drawn either.
 */
export const chestLateralRadiograph: RadiographAssetSpec = {
  id: "chest-lateral-baseline",
  src: "/images/chest-lateral/chest-lateral-baseline-1000.jpg",
  widthPx: 1000,
  heightPx: 1387,
  projection: "lateral-left",
  registryIds: ["A-006", "A-007"],
  credit: {
    en: "Reference radiograph: “Normal lateral chest radiograph (X-ray)”, Wikimedia Commons, CC0 1.0. Teaching approximation: a representative normal adult lateral radiograph of a different person, not the patient of this case or of the PA case.",
    ar: "الصورة المرجعية: «Normal lateral chest radiograph (X-ray)»، ويكيميديا كومنز، CC0 1.0. تقريب تعليمي: صورة جانبية طبيعية تمثيلية لشخص بالغ آخر، وليست للمريضة في هذه الحالة ولا في حالة PA.",
  },
  evidence: {
    status: "educational-simplification",
    reference: "S12-4; docs/ASSET_PROVENANCE_AND_LICENSES.md (A-006, A-007)",
    note: "Educational appearance baseline of a different person. Not clinical ground truth for any simulated error and not an image of the case patient. Landmarks read by eye.",
  },
  // Apices (top of the lung fields) to the posterior costophrenic recesses; sternum side to posterior ribs.
  anatomyBox: { u1: 0.1, v1: 0.19, u2: 0.82, v2: 0.84 },
  lungApexV: 0.2,
  diaphragmDomeV: 0.755,
};
