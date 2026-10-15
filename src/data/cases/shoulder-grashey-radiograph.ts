import type { RadiographAssetSpec } from "@/domain/radiograph";
import { SHOULDER_IMAGE } from "../exams/xray/shoulder-geometry";
export const shoulderGrasheyRadiograph: RadiographAssetSpec = {
  id: "shoulder-grashey-baseline", src: "/images/shoulder/shoulder-grashey-baseline.png", widthPx: SHOULDER_IMAGE.widthPx, heightPx: SHOULDER_IMAGE.heightPx, projection: "shoulder-grashey", registryIds: ["A-037", "A-038"],
  credit: { en: "Reference: AP glenoid (Grashey) radiograph of the right shoulder of a 31-year-old man, by Mikael Häggström, Wikimedia Commons, CC0 1.0. The uploader describes recurrent shoulder dislocation with no visible abnormality; it is not presented as a normal or asymptomatic shoulder. Educational appearance reference, not a diagnostic image or the fictional case patient. The only simulated cue is the closing of the joint space, drawn by a warp of this one image outside the 35°–45° body-turn range.", ar: "المرجع: صورة أشعة للجوف الحقاني (غراشي) للكتف الأيمن لرجل عمره 31 عامًا، بواسطة Mikael Häggström، ويكيميديا كومنز، CC0 1.0. يصف الرافع خلعًا متكررًا في الكتف دون شذوذ ظاهر؛ ولا تُعرض على أنها كتف سليم أو بلا أعراض. مرجع مظهر تعليمي، وليس صورة تشخيصية أو للمريض الافتراضي في الحالة. الإشارة المحاكاة الوحيدة هي انغلاق الحيّز المفصلي، وتُرسم بتحويل هذه الصورة الواحدة خارج نطاق دوران الجسم 35°–45°." },
  evidence: { status: "educational-simplification", reference: "docs/ASSET_PROVENANCE_AND_LICENSES.md (A-037/A-038); docs/DECISIONS.md S-SHOULDER-3-4; O88/O91", note: "Scale, region box and landmarks are read by eye, not measured. Clinical suitability of the image (rotated frame, coverage ends mid-humerus, clinical history) pending educator review O91/O5." },
  anatomyBox: SHOULDER_IMAGE.anatomyBox,
  limbRotation: { kind: "limb-warp", model: "shoulder-grashey", bands: [{ v1: 0.12, v2: 0.46 }] },
  render: { pxPerCm: 48, viewMarginCm: 1 },
};
