/** Public inputs of the EXISTING drawings, extracted without changing their values.
 * Image coordinate frames and displacement bands only; no grading targets, asset
 * sources, credits, evidence, review or author metadata. Educational estimates,
 * not measured anatomy. Original evidence stays in data/exams/xray and data/cases.
 */

export const HAND_CM_PER_PX = 0.0113;

export const HAND_DRAWING = {
  pa: { widthPx: 1466, heightPx: 2082, box: { u1: 29 / 1466, u2: 1422 / 1466, v1: 0, v2: 2030 / 2082 } },
  lateral: { widthPx: 686, heightPx: 2123, box: { u1: 14 / 686, u2: 650 / 686, v1: 0, v2: 2061 / 2123 } },
} as const;

export type HandKind = "pa" | "lateral";

export const ELBOW_CM_PER_PX = 0.0155;

export const ELBOW_DRAWING = {
  ap: { widthPx: 849, heightPx: 1097, box: { u1: 100 / 849, u2: 640 / 849, v1: 60 / 1097, v2: 990 / 1097 } },
  lateral: { widthPx: 1086, heightPx: 1103, box: { u1: 350 / 1086, u2: 930 / 1086, v1: 350 / 1103, v2: 1060 / 1103 } },
} as const;

export type ElbowKind = "ap" | "lateral";

export const LOWER_LIMB_DRAWING = {
  "knee-ap": { cmPerPx: 0.0125, widthPx: 1067, heightPx: 1913, box: { u1: 60 / 1067, u2: 980 / 1067, v1: 370 / 1913, v2: 1520 / 1913 } },
  "knee-lateral": { cmPerPx: 0.0125, widthPx: 1133, heightPx: 1939, box: { u1: 60 / 1133, u2: 1100 / 1133, v1: 335 / 1939, v2: 1455 / 1939 } },
  "foot-ap": { cmPerPx: 0.01, widthPx: 1061, heightPx: 2405, box: { u1: 60 / 1061, u2: 1010 / 1061, v1: 20 / 2405, v2: 1900 / 2405 } },
  "foot-oblique": { cmPerPx: 0.009, widthPx: 1077, heightPx: 1960, box: { u1: 100 / 1077, u2: 1050 / 1077, v1: 80 / 1960, v2: 1 } },
  "ankle-ap": { cmPerPx: 0.0125, widthPx: 728, heightPx: 1631, box: { u1: 40 / 728, u2: 700 / 728, v1: 330 / 1631, v2: 1 } },
  "ankle-lateral": { cmPerPx: 0.0125, widthPx: 932, heightPx: 1678, box: { u1: 0, u2: 905 / 932, v1: 130 / 1678, v2: 1640 / 1678 } },
} as const;

export type LowerLimbKind = "knee-ap" | "knee-lateral" | "foot-ap" | "foot-oblique" | "ankle-ap" | "ankle-lateral";

export const PELVIS_IMAGE = { widthPx: 2675, heightPx: 2084, cmPerPx: 0.015,
  anatomyBox: { u1: 100 / 2675, u2: 2640 / 2675, v1: 30 / 2084, v2: 2070 / 2084 } };

export const SHOULDER_CM_PER_PX = 0.011;

export const SHOULDER_DRAWING = {
  widthPx: 1193,
  heightPx: 1800,
  // Box u 120–1193 px (the left edge of the arm's soft tissue → the frame's right edge), v 0 → 1350 px (the top of the acromion region → mid-humerus).
  anatomyBox: { u1: 120 / 1193, u2: 1, v1: 0, v2: 1350 / 1800 },
} as const;

export const WRIST_PA_DISPLACEMENT = { kind: "wrist-pa", forearm: { v1: 0.52, v2: 1, splitU: 0.457 } } satisfies NonNullable<import("@/domain/radiograph").RadiographAssetSpec["limbRotation"]>;

export const WRIST_LATERAL_DISPLACEMENT = {
    kind: "wrist-lateral",
    // The bands that must be superimposed in a true lateral: the proximal metacarpals (rows 0–270, columns ≈ 110–559) and the ulnar head over the distal radius (rows ≈ 590–800, columns ≈ 185–440). 2.5D wrist model (S-VIS-1b).
    bands: [{ v1: 0, v2: 0.19, u1: 0.2, u2: 1 }, { v1: 0.42, v2: 0.57, u1: 0.33, u2: 0.79 }],
  } satisfies NonNullable<import("@/domain/radiograph").RadiographAssetSpec["limbRotation"]>;

export const FOOT_AP_DISPLACEMENT = {
    kind: "limb-warp",
    model: "foot-ap",
    bands: [
      // The toes (rows 0–640 of 2405) and the metatarsals (rows ≈ 640–1330): adjacent bands, so their weights add up to 1 at the boundary.
      { v1: -0.05, v2: 0.266 },
      { v1: 0.266, v2: 0.553 },
    ],
  } satisfies NonNullable<import("@/domain/radiograph").RadiographAssetSpec["limbRotation"]>;

export const FOOT_OBLIQUE_DISPLACEMENT = {
    kind: "limb-warp",
    model: "foot-oblique",
    bands: [
      // The toes (rows 0–650 of 1960) and the metatarsals (rows ≈ 650–1420).
      { v1: -0.05, v2: 0.33 },
      { v1: 0.33, v2: 0.72 },
    ],
  } satisfies NonNullable<import("@/domain/radiograph").RadiographAssetSpec["limbRotation"]>;

export const handDrawingImage = (k: HandKind) => HAND_DRAWING[k];
export const elbowDrawingImage = (k: ElbowKind) => ELBOW_DRAWING[k];
export const lowerLimbDrawingImage = (k: LowerLimbKind) => LOWER_LIMB_DRAWING[k];
