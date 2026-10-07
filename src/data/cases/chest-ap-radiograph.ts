import type { RadiographAssetSpec } from "@/domain/radiograph";

/**
 * Educational baseline radiograph for Chest AP v1 (registry entries A-008 → A-009 in
 * docs/ASSET_PROVENANCE_AND_LICENSES.md): NIH ChestX-ray14 image (AP, "No Finding", adult), used under the NIH Clinical Center
 * terms recorded in the registry (SECONDARY source — re-verify at the official NIH page, O16).
 *
 * S12-4 / S13: a representative normal ADULT AP chest radiograph of a DIFFERENT PERSON from the PA and lateral baselines.
 * It is a TEACHING APPROXIMATION and an appearance reference only: whether the patient was supine, semi-erect or erect when
 * it was taken is NOT claimed; the exam variant (supine) is a teaching approximation. Landmarks below were read from the image
 * by eye and are approximate: TODO(medical-review): have an educator confirm the landmark placement.
 *
 * `projection: "ap-erect"` is the id of the AP projection (the patient position is the exam's `state` choice). No `scapulae`
 * or `jaw` group: the shoulder check is scored and labelled "not drawn" (no polish in S13).
 */
export const chestApRadiograph: RadiographAssetSpec = {
  id: "chest-ap-baseline",
  src: "/images/chest-ap/chest-ap-baseline-1024.png",
  widthPx: 1024,
  heightPx: 1024,
  projection: "ap-erect",
  registryIds: ["A-008", "A-009"],
  credit: {
    en: "Reference radiograph: an AP chest radiograph from the NIH ChestX-ray14 dataset (teaching approximation: a representative normal adult of a different person, not the patient of this case). Data provider: NIH Clinical Center, download site https://nihcc.app.box.com/v/ChestXray-NIHCC. Citation: Xiaosong Wang, Yifan Peng, Le Lu, Zhiyong Lu, Mohammadhadi Bagheri, Ronald Summers, ChestX-ray8: Hospital-scale Chest X-ray Database and Benchmarks on Weakly-Supervised Classification and Localization of Common Thorax Diseases, IEEE CVPR, pp. 3462-3471, 2017.",
    ar: "الصورة المرجعية: صورة صدر AP من مجموعة بيانات NIH ChestX-ray14 (تقريب تعليمي: صورة تمثيلية طبيعية لشخص بالغ آخر، وليست للمريضة في هذه الحالة). مزوّد البيانات: المركز السريري في المعاهد الوطنية للصحة الأمريكية (NIH Clinical Center)، موقع التنزيل: https://nihcc.app.box.com/v/ChestXray-NIHCC. المرجع: Xiaosong Wang, Yifan Peng, Le Lu, Zhiyong Lu, Mohammadhadi Bagheri, Ronald Summers, ChestX-ray8: Hospital-scale Chest X-ray Database and Benchmarks on Weakly-Supervised Classification and Localization of Common Thorax Diseases, IEEE CVPR, pp. 3462-3471, 2017.",
  },
  evidence: {
    status: "educational-simplification",
    reference: "S12-4; S13; docs/ASSET_PROVENANCE_AND_LICENSES.md (A-008, A-009)",
    note: "Educational appearance baseline of a different person. Not clinical ground truth for any simulated error and not an image of the case patient. The patient position of the original exposure is not claimed. Landmarks read by eye.",
  },
  // Lung apices to the costophrenic angles; lateral lung / rib margins (read by eye on the 1024 px image).
  anatomyBox: { u1: 0.13, v1: 0.04, u2: 0.92, v2: 0.82 },
  midlineU: 0.51,
  lungApexV: 0.05,
  diaphragmDomeV: 0.77,
  denseZones: [
    { cu: 0.52, cv: 0.5, ru: 0.07, rv: 0.36 }, // mediastinum + spine
    { cu: 0.6, cv: 0.66, ru: 0.13, rv: 0.13 }, // heart + retrocardiac region
  ],
};
