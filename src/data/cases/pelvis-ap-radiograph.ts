import type { RadiographAssetSpec } from "@/domain/radiograph";
import { PELVIS_IMAGE } from "../exams/xray/pelvis-geometry";
export const pelvisApRadiograph: RadiographAssetSpec = {
  id: "pelvis-ap-baseline", src: "/images/pelvis/pelvis-ap-baseline.png", widthPx: 2675, heightPx: 2084, projection: "pelvis-ap", registryIds: ["A-034", "A-035", "A-036"],
  credit: { en: "Reference: AP pelvis of an 18-year-old male, per UC San Diego Health radiology staff / bonepit.com, Wikimedia Commons, public domain. Edge marker/graphics removed from background only. Educational appearance reference, not a diagnostic image or the fictional case patient. Pelvic rotation is approximated by a warp of this one image; femoral-neck/hidden-trochanter changes are not reconstructed.", ar: "المرجع: حوض AP لذكر عمره 18 عامًا بحسب طاقم الأشعة في UC San Diego Health / bonepit.com، ويكيميديا كومنز، ملكية عامة. أُزيلت علامة الحافة ورسومها من الخلفية فقط. مرجع مظهر تعليمي، وليس صورة تشخيصية أو للمريض الافتراضي في الحالة. يُقرّب دوران الحوض بتحويل هذه الصورة الواحدة؛ لا يُعاد بناء تغيّرات عنق الفخذ أو المدورات المخفية." },
  evidence: { status: "educational-simplification", reference: "docs/ASSET_PROVENANCE_AND_LICENSES.md (A-034/A-035/A-036); docs/DECISIONS.md S-PELVIS-1-4; O84/O85", note: "Geometry and rotation depths are illustrative, not measurements. Clinical suitability pending educator review O5." },
  anatomyBox: PELVIS_IMAGE.anatomyBox,
  limbRotation: { kind: "limb-warp", model: "pelvis-ap", bands: [{ v1: 0, v2: 1 }] },
  // Read by eye from this image, approximate: TODO(medical-review): have an educator confirm the zones.
  denseZones: [
    { cu: 0.5, cv: 0.41, ru: 0.12, rv: 0.18 }, // sacrum
    { cu: 0.235, cv: 0.665, ru: 0.09, rv: 0.11 }, // image-left acetabulum + femoral head
    { cu: 0.765, cv: 0.665, ru: 0.09, rv: 0.11 }, // image-right acetabulum + femoral head
  ],
  render: { pxPerCm: 48, viewMarginCm: 1 },
};
