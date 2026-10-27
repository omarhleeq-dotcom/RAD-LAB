import { SHOULDER_CM_PER_PX, SHOULDER_DRAWING } from "@/features/positioning/drawing-data";
/**
 * Geometry of the Shoulder AP oblique glenoid (Grashey) baseline on the 24 × 30 cm detector (S-SHOULDER-3; DECISIONS S-SHOULDER-3-1…).
 * Everything here is READ BY EYE from the baseline image (A-037 / A-038, 1193 × 1800 px) and is an EDUCATIONAL ESTIMATE, not a
 * measurement: TODO(medical-review).
 *
 *  - SCALE: 0.011 cm per image pixel (an assumption: it makes the humeral head about 5.5 cm across). The image's real scale is unknown.
 *  - FRAME: the image is a rotated / cropped copy (its right margin is a straight dark edge about 11–13° from vertical) and ends in mid-humerus,
 *    so the required region is the part of the frame that holds the head, glenoid, acromion, coracoid, lateral clavicle and proximal humerus.
 *  - CENTRAL-RAY TARGET (Bontrager p.196: the scapulohumeral joint, perpendicular ray): read at pixel (815, 515), between the humeral head and
 *    the glenoid line; the image is placed so that this pixel lies at the centre of the detector, i.e. at normalised (0, 0).
 *  - DETECTOR: 24 × 30 cm landscape (owner choice S-SHOULDER-3-1; Bontrager p.196 allows 18 × 24 or 24 × 30 cm landscape).
 */
export { SHOULDER_CM_PER_PX };

export const SHOULDER_DETECTOR = { widthCm: 30, heightCm: 24 } as const;

/** Source band of the body obliquity toward the affected side (Bontrager p.196: 35°–45°). An equal-credit plateau: NO 40° optimum (S-SHOULDER-2-4). */
export const SHOULDER_BAND_DEG: readonly [number, number] = [35, 45];

export const SHOULDER_IMAGE = { ...SHOULDER_DRAWING, targetPx: { x: 815, y: 515 } } as const;

/** The required-anatomy region (cm on the detector): the anatomy box at `SHOULDER_CM_PER_PX`, placed so the target sits at the detector centre. */
export function shoulderRegion() {
  const im = SHOULDER_IMAGE;
  const x0 = im.anatomyBox.u1 * im.widthPx;
  const y0 = im.anatomyBox.v1 * im.heightPx;
  const r = (v: number) => Math.round(v * 100) / 100;
  return {
    xCm: r(SHOULDER_DETECTOR.widthCm / 2 - (im.targetPx.x - x0) * SHOULDER_CM_PER_PX),
    yCm: r(SHOULDER_DETECTOR.heightCm / 2 - (im.targetPx.y - y0) * SHOULDER_CM_PER_PX),
    widthCm: r((im.anatomyBox.u2 - im.anatomyBox.u1) * im.widthPx * SHOULDER_CM_PER_PX),
    heightCm: r((im.anatomyBox.v2 - im.anatomyBox.v1) * im.heightPx * SHOULDER_CM_PER_PX),
  };
}
export const SHOULDER_REGION = shoulderRegion();
