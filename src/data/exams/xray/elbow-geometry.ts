/**
 * Geometry of the two ELBOW baselines on the 24 × 30 cm detector (S14.3; DECISIONS S14.3-9). Everything here is READ BY EYE from the two
 * baseline images (A-019 AP, A-021 lateral) and is an EDUCATIONAL ESTIMATE, not a measurement: TODO(medical-review), O49.
 *
 *  - SCALE: 0.0155 cm per image pixel for both images (an ASSUMPTION: the radial head of an adult ≈ 2.3 cm is ≈ 150 px wide in the AP; the
 *    humeral biepicondylar breadth is ≈ 7 cm ≈ 470 px). The images' real scale is unknown.
 *  - REQUIRED REGION (an engine estimate of Bontrager's "distal humerus, elbow joint and proximal radius and ulna" (p.166) / "distal humerus
 *    and proximal forearm including the olecranon" (p.172)): about 7 cm of humerus above the target and about 6–7 cm of forearm below it
 *    (AP), 6 cm of forearm beyond the joint (lateral). The baselines show more, the rest is collimated out. Because the field is centred on
 *    the central ray in this simulator, the region is chosen close to symmetric about the target (O40-like).
 *  - CENTRAL-RAY TARGET: AP = the mid-elbow joint, about 2 cm distal to the midpoint of the line between the epicondyles (p.166; read at
 *    (365, 525) of A-019, the epicondyles at (128, 330) and (598, 460)); lateral = the mid-elbow joint (p.172; the centre of the condyle
 *    outline, (752, 810) of A-021). The image is placed so that the target lies at the centre of the detector, i.e. at normalised (0, 0).
 */
export const ELBOW_CM_PER_PX = 0.0155;

/** The detector the elbow is imaged on: 24 × 30 cm portrait (Bontrager p.166 / 172: the smallest available receptor; AP one exposure; O43). */
export const ELBOW_DETECTOR = { widthCm: 24, heightCm: 30 } as const;

export type ElbowKind = "ap" | "lateral";

const IMAGE = {
  // AP: 849 × 1097 px. Box u 100–640 px, v 60 → 990 px (the target is at y 525: 7.2 cm above, 7.2 cm below).
  ap: { widthPx: 849, heightPx: 1097, box: { u1: 100 / 849, u2: 640 / 849, v1: 60 / 1097, v2: 990 / 1097 }, targetPx: { x: 365, y: 525 } },
  // Lateral: 1086 × 1103 px. Box u 350–930 px (forearm beyond the radial head → the back of the elbow), v 350 → 1060 px (distal humerus → the olecranon).
  lateral: { widthPx: 1086, heightPx: 1103, box: { u1: 350 / 1086, u2: 930 / 1086, v1: 350 / 1103, v2: 1060 / 1103 }, targetPx: { x: 752, y: 810 } },
} as const;

export const elbowImage = (k: ElbowKind) => IMAGE[k];

/** The required-anatomy region (cm on the detector) of the exam: the baseline's anatomy box at ELBOW_CM_PER_PX, placed so the target sits at the detector centre. */
export function elbowRegion(k: ElbowKind) {
  const im = IMAGE[k];
  const x0 = im.box.u1 * im.widthPx;
  const y0 = im.box.v1 * im.heightPx;
  const r = (v: number) => Math.round(v * 100) / 100;
  return {
    xCm: r(ELBOW_DETECTOR.widthCm / 2 - (im.targetPx.x - x0) * ELBOW_CM_PER_PX),
    yCm: r(ELBOW_DETECTOR.heightCm / 2 - (im.targetPx.y - y0) * ELBOW_CM_PER_PX),
    widthCm: r((im.box.u2 - im.box.u1) * im.widthPx * ELBOW_CM_PER_PX),
    heightCm: r((im.box.v2 - im.box.v1) * im.heightPx * ELBOW_CM_PER_PX),
  };
}
