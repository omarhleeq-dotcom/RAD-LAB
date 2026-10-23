import { TUNING } from "@/features/radiograph/tuning";
import { SHOULDER_BAND_DEG } from "@/data/exams/xray/shoulder-geometry";

/**
 * ONE-CUE rotation model of the Shoulder AP oblique glenoid (Grashey) exam (S-SHOULDER-2-4 / 2-6, S-SHOULDER-3).
 * Pure (no React, no randomness): the SVG scene and the result-image warp read the SAME functions, so the drawing and the picture agree.
 *
 * EDUCATIONAL APPROXIMATION from ONE baseline image (A-038), not a kinematic model and not a measurement of degrees:
 *  - The console value is the ABSOLUTE body obliquity toward the affected side. Bontrager p.196 gives 35°–45° (an equal-credit plateau, no 40° optimum).
 *  - DEAD BAND (educational simplification, S-SHOULDER-2-6): the baseline is rendered UNCHANGED anywhere inside 35°–45°; outside it the model value is the
 *    distance to the nearest band edge. The source says the angle needed varies with build, and the baseline's true angle is unknown.
 *  - The closure grows with the distance from the band edge out to the console limits (0° and 60°); the dead band is unchanged.
 *  - The ONLY cue drawn is the closing of the open joint space (Bontrager p.196: glenoid in profile without humeral-head superimposition, open joint
 *    space): the humeral-head side of the image is shifted toward the glenoid line and the gap between them is compressed by a smooth horizontal warp.
 *    The cue is the SAME for a deviation on either side (the source gives no direction-specific appearance) and the picture's feedback is magnitude-only.
 *  - NOT drawn: the anterior / posterior glenoid rims superimposed (the image has one rim line; a second one would be hidden anatomy), true overlap of the
 *    head over the glenoid (a warp compresses, it does not add densities), the scapular body, any effect of arm posture.
 * The size of the closure per degree and its limit are illustrative (`TUNING.limbRotation.shoulderClosurePerDeg`); scoring never uses them.
 */
export const SHOULDER_MAX_DEG = TUNING.limbRotation.shoulderMaxDeg;

/** Model value for a console obliquity: 0 inside the source band, the signed distance to the nearest band edge outside it. */
export function shoulderValue(consoleDeg: number): number {
  const [lo, hi] = SHOULDER_BAND_DEG;
  return consoleDeg < lo ? consoleDeg - lo : consoleDeg > hi ? consoleDeg - hi : 0;
}

/**
 * Anchor columns of the closing warp (fractions of the image width; read by eye on A-038): nothing moves left of the arm's soft tissue; the
 * humeral-head side moves the full closure; the glenoid line (u 0.72) and everything medial of it stay put. `k` = fraction of the closure.
 */
export const SHOULDER_COLUMNS = [
  { u: 0, k: 0 }, { u: 0.126, k: 0 }, { u: 0.385, k: 0.5 }, { u: 0.641, k: 1 }, { u: 0.721, k: 0 }, { u: 1, k: 0 },
] as const;

/** Closure (fraction of the image width) for a model value: grows with the distance from the band edge over the whole console range (0°…60°; cap lifted, DECISIONS 2c D2). */
export const shoulderClosureU = (value: number): number =>
  TUNING.limbRotation.shoulderClosurePerDeg * Math.min(SHOULDER_MAX_DEG, Math.abs(value));

export function shoulderAnchors(value: number): { u: number; du: number }[] {
  const c = shoulderClosureU(value);
  return SHOULDER_COLUMNS.map(({ u, k }) => ({ u, du: k * c }));
}

/** Horizontal displacement (image-width fraction) of the source column `u` for a model value: what the scene draws and the result warp applies. */
export function shoulderShift(u: number, value: number): number {
  const a = shoulderAnchors(value);
  if (u <= 0 || u >= 1) return 0;
  const i = a.findIndex((p) => p.u >= u);
  const lo = a[i - 1]!, hi = a[i]!;
  return hi.u === lo.u ? lo.du : lo.du + ((hi.du - lo.du) * (u - lo.u)) / (hi.u - lo.u);
}
