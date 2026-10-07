/**
 * Geometry of the two HAND baselines on the 24 × 30 cm detector (S14.2b; DECISIONS S14.2-10). Everything here is READ BY EYE from
 * the two baseline images (A-015 / A-017) and is an EDUCATIONAL ESTIMATE, not a measurement: TODO(medical-review).
 *
 *  - SCALE: 0.0113 cm per image pixel for both images (an assumption: the third metacarpal of a 31-year-old male ≈ 6.5 cm and ≈ 580
 *    px long in the PA). The images' real scale is unknown.
 *  - REQUIRED REGION (Bontrager p.150 / 153: entire hand and wrist plus about 2.5 cm of distal forearm) = from the fingertips to
 *    2.5 cm (≈ 221 px) below the radiocarpal joint; the baselines show a little more forearm, which is collimated out.
 *  - CENTRAL-RAY TARGET (PA: third MCP joint, p.150; lateral: centre of the second–fifth MCP joints, p.153): the images are placed
 *    so that the target lies at the centre of the detector, i.e. at normalised (0, 0).
 */
export const HAND_CM_PER_PX = 0.0113;

/** The detector the hand is imaged on: 24 × 30 cm portrait (Bontrager p.150 / 152 / 153: the smallest available receptor). */
export const HAND_DETECTOR = { widthCm: 24, heightCm: 30 } as const;

export type HandKind = "pa" | "lateral";

const IMAGE = {
  // PA: 1466 × 2082 px. Box u 29–1422 px (little-finger edge → thumb edge), v 0 → 2030 px (fingertip → 2.5 cm below the radiocarpal joint ≈ 1810 px).
  // Third MCP joint read at (632, 895).
  pa: { widthPx: 1466, heightPx: 2082, box: { u1: 29 / 1466, u2: 1422 / 1466, v1: 0, v2: 2030 / 2082 }, targetPx: { x: 632, y: 895 } },
  // Lateral (extension): 686 × 2123 px. Box u 14–650 px, v 0 → 2061 px (radiocarpal joint ≈ 1840 px). Centre of the 2nd–5th MCP joints read at (450, 785).
  lateral: { widthPx: 686, heightPx: 2123, box: { u1: 14 / 686, u2: 650 / 686, v1: 0, v2: 2061 / 2123 }, targetPx: { x: 450, y: 785 } },
} as const;

export const handImage = (k: HandKind) => IMAGE[k];

/** The required-anatomy region (cm on the detector) of the exam: the baseline's anatomy box at HAND_CM_PER_PX, placed so the target sits at the detector centre. */
export function handRegion(k: HandKind) {
  const im = IMAGE[k];
  const x0 = im.box.u1 * im.widthPx;
  const y0 = im.box.v1 * im.heightPx;
  const r = (v: number) => Math.round(v * 100) / 100;
  return {
    xCm: r(HAND_DETECTOR.widthCm / 2 - (im.targetPx.x - x0) * HAND_CM_PER_PX),
    yCm: r(HAND_DETECTOR.heightCm / 2 - (im.targetPx.y - y0) * HAND_CM_PER_PX),
    widthCm: r((im.box.u2 - im.box.u1) * im.widthPx * HAND_CM_PER_PX),
    heightCm: r((im.box.v2 - im.box.v1) * im.heightPx * HAND_CM_PER_PX),
  };
}
