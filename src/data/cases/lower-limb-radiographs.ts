import type { ImageEllipse, RadiographAssetSpec } from "@/domain/radiograph";
import { lowerLimbImage, type LowerLimbKind } from "../exams/xray/lower-limb-geometry";

/**
 * Educational baseline radiographs of the four knee / foot exams (registry entries A-022 … A-029 in docs/ASSET_PROVENANCE_AND_LICENSES.md; the
 * owner's files, author Mikael Häggström, M.D., CC0 1.0 as seen by the owner; Commons verification outstanding, O56). Real normal adult RIGHT limbs,
 * used as a TEACHING APPROXIMATION and an appearance reference only: never ground truth for any simulated error. They are not the person of the
 * chest cases. The "Dx" (dexter = right) burned into every master was removed (a documented fill; the foot oblique's bottom frame line was cropped,
 * S14.4-7).
 *
 * Landmarks below were read from the images by eye and are approximate: TODO(medical-review): have an educator confirm the landmark placement
 * (O62). Unscored / not drawn: shielding, grid, posture details, the arch height (S14.4-3).
 */
const credit = (en: string, ar: string): { en: string; ar: string } => ({ en, ar });

const ankle = (k: LowerLimbKind) => k.startsWith("ankle");

const common = (k: LowerLimbKind) => ({
  anatomyBox: { ...lowerLimbImage(k).box },
  // Result canvas at 48 px/cm (S-VIS-1b-5): the masters have 80 (knees) / 100 (foot AP) / 111 (foot oblique) px/cm at the assumed scales (no upscaling);
  // the canvas caps it at 1.8 Mpx (24 × 30 cm -> 48 px/cm fits). The shared 24 px/cm default softened the trabecular detail (O68).
  render: { pxPerCm: 48 },
  evidence: ankle(k)
    ? {
        status: "educational-simplification" as const,
        reference: "S14.5-3…6; docs/ASSET_PROVENANCE_AND_LICENSES.md (A-030 … A-033)",
        note: "Educational appearance baseline of a real adult ankle (left side inferred). Not clinical ground truth for any simulated error. Landmarks read by eye; scale assumed; licence owner-verified (O75, O80).",
      }
    : {
        status: "educational-simplification" as const,
        reference: "S14.4-3…10; docs/ASSET_PROVENANCE_AND_LICENSES.md (A-022 … A-029)",
        note: "Educational appearance baseline of a real normal limb. Not clinical ground truth for any simulated error. Landmarks read by eye; scale assumed; licence owner-verified (O56, O62).",
      },
});

const zone = (cu: number, cv: number, ru: number, rv: number): ImageEllipse => ({ cu, cv, ru, rv });

export const KNEE_AP_RADIOGRAPH: RadiographAssetSpec = {
  id: "knee-ap-baseline",
  src: "/images/knee/knee-ap-baseline.jpg",
  widthPx: 1067,
  heightPx: 1913,
  projection: "knee-ap",
  registryIds: ["A-022", "A-023"],
  credit: credit(
    "Reference radiograph: an adult right knee (the source description mentions no trauma), AP, Mikael Häggström, M.D., Wikimedia Commons, CC0 1.0 (licence confirmed by the project owner). The side text burned into the original was removed (a fill). A real right knee (a 31-year-old male, per the file description) used as a teaching approximation: not a diagnostic image and not a person from the chest cases.",
    "الصورة المرجعية: ركبة يمنى لشخص بالغ (لا تظهر إصابة في وصف المصدر)، إسقاط AP، Mikael Häggström, M.D.، ويكيميديا كومنز، CC0 1.0 (الترخيص أكده مالك المشروع). أُزيلت الكتابة الجانبية المطبوعة على الصورة الأصلية (بملء). ركبة يمنى حقيقية (ذكر عمره 31 عامًا بحسب وصف الملف) تُستخدم كتقريب تعليمي: وليست صورة تشخيصية وليست لأحد من حالات الصدر.",
  ),
  ...common("knee-ap"),
  // the femoral condyles and the tibial plateau (rows ≈ 520–1050 of 1913): the dense zone that low penetration makes less visible.
  denseZones: [zone(0.5, 0.42, 0.4, 0.14)],
  limbRotation: {
    kind: "limb-layers",
    model: "knee-ap",
    // The rows below the joint: the fibula layer (source columns left of the contact line) and the tibia layer move separately; contact line ≈ column 288 of 1067.
    forearm: { v1: 0.59, v2: 1, splitU: 0.27 },
  },
};

export const KNEE_LATERAL_RADIOGRAPH: RadiographAssetSpec = {
  id: "knee-lateral-baseline",
  src: "/images/knee/knee-lateral-baseline.jpg",
  widthPx: 1133,
  heightPx: 1939,
  projection: "knee-lateral",
  registryIds: ["A-024", "A-025"],
  credit: credit(
    "Reference radiograph: an adult right knee (the source description mentions no trauma), lateral, Mikael Häggström, M.D., Wikimedia Commons, CC0 1.0 (licence confirmed by the project owner). The side text burned into the original was removed (a fill). A real right knee (a 31-year-old male, per the file description) used as a teaching approximation: not a diagnostic image and not a person from the chest cases.",
    "الصورة المرجعية: ركبة يمنى لشخص بالغ (لا تظهر إصابة في وصف المصدر)، إسقاط جانبي، Mikael Häggström, M.D.، ويكيميديا كومنز، CC0 1.0 (الترخيص أكده مالك المشروع). أُزيلت الكتابة الجانبية المطبوعة على الصورة الأصلية (بملء). ركبة يمنى حقيقية (ذكر عمره 31 عامًا بحسب وصف الملف) تُستخدم كتقريب تعليمي: وليست صورة تشخيصية وليست لأحد من حالات الصدر.",
  ),
  ...common("knee-lateral"),
  denseZones: [zone(0.48, 0.38, 0.28, 0.13)],
  limbRotation: {
    kind: "limb-copies",
    model: "knee-lateral",
    bands: [
      // The femoral condyle outlines (rows ≈ 480–930 of 1939, columns ≈ 270–830 of 1133).
      { v1: 0.25, v2: 0.48, u1: 0.24, u2: 0.73 },
      // The fibular head and the tibia's posterior margin (rows ≈ 1000–1260, columns ≈ 760–960).
      { v1: 0.516, v2: 0.65, u1: 0.67, u2: 0.85 },
    ],
  },
};

export const FOOT_AP_RADIOGRAPH: RadiographAssetSpec = {
  id: "foot-ap-baseline",
  src: "/images/foot/foot-ap-baseline.jpg",
  widthPx: 1061,
  heightPx: 2405,
  projection: "foot-ap",
  registryIds: ["A-026", "A-027"],
  credit: credit(
    "Reference radiograph: an adult right foot (the source description mentions no trauma), AP (dorsoplantar), Mikael Häggström, M.D., Wikimedia Commons, CC0 1.0 (licence confirmed by the project owner). The side text burned into the original was removed (a fill). A real right foot used as a teaching approximation: not a diagnostic image and not a person from the chest cases.",
    "الصورة المرجعية: قدم يمنى لشخص بالغ (لا تظهر إصابة في وصف المصدر)، إسقاط AP (ظهري أخمصي)، Mikael Häggström, M.D.، ويكيميديا كومنز، CC0 1.0 (الترخيص أكده مالك المشروع). أُزيلت الكتابة الجانبية المطبوعة على الصورة الأصلية (بملء). قدم يمنى حقيقية تُستخدم كتقريب تعليمي: وليست صورة تشخيصية وليست لأحد من حالات الصدر.",
  ),
  ...common("foot-ap"),
  // the tarsal bones (rows ≈ 1500–2300 of 2405).
  denseZones: [zone(0.45, 0.79, 0.35, 0.15)],
  limbRotation: {
    kind: "limb-warp",
    model: "foot-ap",
    bands: [
      // The toes (rows 0–640 of 2405) and the metatarsals (rows ≈ 640–1330): adjacent bands, so their weights add up to 1 at the boundary.
      { v1: -0.05, v2: 0.266 },
      { v1: 0.266, v2: 0.553 },
    ],
  },
};

export const FOOT_OBLIQUE_RADIOGRAPH: RadiographAssetSpec = {
  id: "foot-oblique-baseline",
  src: "/images/foot/foot-oblique-baseline.jpg",
  widthPx: 1077,
  heightPx: 1960,
  projection: "foot-oblique",
  registryIds: ["A-028", "A-029"],
  credit: credit(
    "Reference radiograph: an adult right foot (the source description mentions no trauma), AP medial oblique, Mikael Häggström, M.D., Wikimedia Commons, CC0 1.0 (licence confirmed by the project owner). The side text, a small mark and a frame line at the bottom edge burned into the original were removed (a fill and a crop). A real right foot used as a teaching approximation: not a diagnostic image and not a person from the chest cases.",
    "الصورة المرجعية: قدم يمنى لشخص بالغ (لا تظهر إصابة في وصف المصدر)، إسقاط AP المائل الإنسي، Mikael Häggström, M.D.، ويكيميديا كومنز، CC0 1.0 (الترخيص أكده مالك المشروع). أُزيلت الكتابة الجانبية وعلامة صغيرة وخط إطار عند الحافة السفلية كانت مطبوعة على الصورة الأصلية (بملء وقص). قدم يمنى حقيقية تُستخدم كتقريب تعليمي: وليست صورة تشخيصية وليست لأحد من حالات الصدر.",
  ),
  ...common("foot-oblique"),
  denseZones: [zone(0.5, 0.85, 0.4, 0.12)],
  limbRotation: {
    kind: "limb-warp",
    model: "foot-oblique",
    bands: [
      // The toes (rows 0–650 of 1960) and the metatarsals (rows ≈ 650–1420).
      { v1: -0.05, v2: 0.33 },
      { v1: 0.33, v2: 0.72 },
    ],
  },
};

export const ANKLE_AP_RADIOGRAPH: RadiographAssetSpec = {
  id: "ankle-ap-baseline",
  src: "/images/ankle/ankle-ap-baseline.jpg",
  widthPx: 728,
  heightPx: 1631,
  projection: "ankle-ap",
  registryIds: ["A-030", "A-031"],
  credit: credit(
    "Reference radiograph: an adult ankle (the source description mentions no trauma), AP (frontal), Mikael Häggström, Wikimedia Commons, CC0 1.0 (licence confirmed by the project owner). The edge artefacts of the original were repaired. A real ankle (a 24-year-old male, per the file description) used as a teaching approximation: not a diagnostic image and not a person from the chest cases.",
    "الصورة المرجعية: كاحل لشخص بالغ (لا تظهر إصابة في وصف المصدر)، إسقاط AP (أمامي)، Mikael Häggström، ويكيميديا كومنز، CC0 1.0 (الترخيص أكده مالك المشروع). أُصلحت عيوب الحواف في الصورة الأصلية. كاحل حقيقي (ذكر عمره 24 عامًا بحسب وصف الملف) يُستخدم كتقريب تعليمي: وليست صورة تشخيصية وليست لأحد من حالات الصدر.",
  ),
  ...common("ankle-ap"),
  // the talus and the upper calcaneus (rows ≈ 1100–1631 of 1631): the dense zone that low penetration makes less visible.
  denseZones: [zone(0.47, 0.82, 0.34, 0.15)],
  limbRotation: {
    kind: "limb-warp",
    model: "ankle-ap",
    // One band over the whole image: the 2.5D column anchors (the malleoli, the plafond edges) displace the leg and the ankle together.
    bands: [{ v1: -0.05, v2: 1.05 }],
  },
};

export const ANKLE_LATERAL_RADIOGRAPH: RadiographAssetSpec = {
  id: "ankle-lateral-baseline",
  src: "/images/ankle/ankle-lateral-baseline.jpg",
  widthPx: 932,
  heightPx: 1678,
  projection: "ankle-lateral",
  registryIds: ["A-032", "A-033"],
  credit: credit(
    "Reference radiograph: an adult ankle (the source description mentions no trauma), lateral, Mikael Häggström, Wikimedia Commons, CC0 1.0 (licence confirmed by the project owner). The edge artefacts of the original were repaired. A real ankle (a 24-year-old male, per the file description) used as a teaching approximation: not a diagnostic image and not a person from the chest cases.",
    "الصورة المرجعية: كاحل لشخص بالغ (لا تظهر إصابة في وصف المصدر)، إسقاط جانبي، Mikael Häggström، ويكيميديا كومنز، CC0 1.0 (الترخيص أكده مالك المشروع). أُصلحت عيوب الحواف في الصورة الأصلية. كاحل حقيقي (ذكر عمره 24 عامًا بحسب وصف الملف) يُستخدم كتقريب تعليمي: وليست صورة تشخيصية وليست لأحد من حالات الصدر.",
  ),
  ...common("ankle-lateral"),
  // the talus and the calcaneus (rows ≈ 900–1450 of 1678).
  denseZones: [zone(0.54, 0.7, 0.36, 0.16)],
  limbRotation: {
    kind: "limb-copies",
    model: "ankle-lateral",
    bands: [
      // The distal fibula and the posterior tibia above the plafond (rows ≈ 670–870 of 1678, columns ≈ 330–590 of 932).
      { v1: 0.4, v2: 0.52, u1: 0.35, u2: 0.63 },
      // The tibiotalar joint: the plafond and the talar dome (rows ≈ 840–975, columns ≈ 205–580).
      { v1: 0.5, v2: 0.58, u1: 0.22, u2: 0.62 },
    ],
  },
};

export const LOWER_LIMB_RADIOGRAPHS: Record<LowerLimbKind, RadiographAssetSpec> = {
  "knee-ap": KNEE_AP_RADIOGRAPH,
  "knee-lateral": KNEE_LATERAL_RADIOGRAPH,
  "foot-ap": FOOT_AP_RADIOGRAPH,
  "foot-oblique": FOOT_OBLIQUE_RADIOGRAPH,
  "ankle-ap": ANKLE_AP_RADIOGRAPH,
  "ankle-lateral": ANKLE_LATERAL_RADIOGRAPH,
};
