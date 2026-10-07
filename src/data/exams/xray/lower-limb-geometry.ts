/**
 * Geometry of the four KNEE / FOOT baselines on the 24 × 30 cm detector (S14.4; DECISIONS S14.4-10). Everything here is READ BY EYE from the
 * four baseline images (A-023 knee AP, A-025 knee lateral, A-027 foot AP, A-029 foot oblique; web copies, px) and is an EDUCATIONAL ESTIMATE, not a
 * measurement: TODO(medical-review), O62.
 *
 *  - SCALE (cm per image pixel, an ASSUMPTION, the real scale is unknown): knee 0.0125 (the femoral condyles are ≈ 735 px wide in the AP and an adult
 *    male's biepicondylar breadth is ≈ 9 cm); foot AP 0.0100 (the 1st metatarsal ≈ 600 px and ≈ 6 cm); foot oblique 0.0090 (the 1st metatarsal ≈ 700 px
 *    and ≈ 6.3 cm: the two foot images do not share a scale).
 *  - REQUIRED REGION (an engine estimate of Bontrager's anatomy lists): knee AP / lateral = about 7 cm of femur above and 7 cm of tibia / fibula below the
 *    joint (p.246 / p.249: "distal femur and proximal tibia / fibula"); foot AP = the whole foot from the toes to the navicular / cuboid (p.232), foot
 *    oblique = from the distal phalanges to the bottom edge of the image (p.233 asks for the posterior calcaneus and proximal talus, which this image does
 *    NOT show: O61). The images show more, the rest is collimated out.
 *  - CENTRAL-RAY TARGET: knee AP = the mid-knee joint (p.246: about 1.25 cm distal to the patellar apex, which this image does not show clearly), knee
 *    lateral = the joint, about 2.5 cm distal to the medial epicondyle (p.249), foot AP / oblique = the base of the 3rd metatarsal (p.232 / 233). The
 *    image is placed so that the target lies at the centre of the detector, i.e. at normalised (0, 0).
 */
export const LOWER_LIMB_DETECTOR = { widthCm: 24, heightCm: 30 } as const;

export type LowerLimbKind = "knee-ap" | "knee-lateral" | "foot-ap" | "foot-oblique";

const IMAGE = {
  // Knee AP: 1067 × 1913 px. Box x 60–980, y 370–1520 (±575 px about the target at y 945: 7.2 cm above and below).
  "knee-ap": { cmPerPx: 0.0125, widthPx: 1067, heightPx: 1913, box: { u1: 60 / 1067, u2: 980 / 1067, v1: 370 / 1913, v2: 1520 / 1913 }, targetPx: { x: 545, y: 945 } },
  // Knee lateral: 1133 × 1939 px. Box x 60–1100, y 335–1455 (±560 px about the target at y 895).
  "knee-lateral": { cmPerPx: 0.0125, widthPx: 1133, heightPx: 1939, box: { u1: 60 / 1133, u2: 1100 / 1133, v1: 335 / 1939, v2: 1455 / 1939 }, targetPx: { x: 590, y: 895 } },
  // Foot AP: 1061 × 2405 px (the web copy: the master's bottom frame line was cropped). Box x 60–1010, y 20–1900 (toes to navicular / cuboid); the target (base of the 3rd metatarsal) is at (598, 1235).
  "foot-ap": { cmPerPx: 0.01, widthPx: 1061, heightPx: 2405, box: { u1: 60 / 1061, u2: 1010 / 1061, v1: 20 / 2405, v2: 1900 / 2405 }, targetPx: { x: 598, y: 1235 } },
  // Foot oblique: 1077 × 1960 px. Box x 100–1050, y 80–1960 (distal phalanges to the bottom edge of the image, O61); the target (base of the 3rd metatarsal) is at (565, 1335).
  "foot-oblique": { cmPerPx: 0.009, widthPx: 1077, heightPx: 1960, box: { u1: 100 / 1077, u2: 1050 / 1077, v1: 80 / 1960, v2: 1 }, targetPx: { x: 565, y: 1335 } },
} as const;

export const lowerLimbImage = (k: LowerLimbKind) => IMAGE[k];
export const lowerLimbCmPerPx = (k: LowerLimbKind) => IMAGE[k].cmPerPx;

/** The required-anatomy region (cm on the detector) of the exam: the baseline's anatomy box at its scale, placed so the target sits at the detector centre. */
export function lowerLimbRegion(k: LowerLimbKind) {
  const im = IMAGE[k];
  const x0 = im.box.u1 * im.widthPx;
  const y0 = im.box.v1 * im.heightPx;
  const r = (v: number) => Math.round(v * 100) / 100;
  return {
    xCm: r(LOWER_LIMB_DETECTOR.widthCm / 2 - (im.targetPx.x - x0) * im.cmPerPx),
    yCm: r(LOWER_LIMB_DETECTOR.heightCm / 2 - (im.targetPx.y - y0) * im.cmPerPx),
    widthCm: r((im.box.u2 - im.box.u1) * im.widthPx * im.cmPerPx),
    heightCm: r((im.box.v2 - im.box.v1) * im.heightPx * im.cmPerPx),
  };
}
