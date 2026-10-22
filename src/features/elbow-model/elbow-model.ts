/**
 * ONE small rotation model for both ELBOW exams (S14.3). Pure (no React, no randomness): the SVG scene draws its projection and the
 * result-image effect takes its displacements from the SAME functions, so the drawing and the picture turn in the same direction by
 * construction (the pattern of `features/hand-model`).
 *
 * ENGINE / TEACHING CHOICE (not an anatomical measurement; listed in REVIEW_PACKAGE and O49): every number below is read by eye from the
 * two baseline images (A-019 AP, A-021 lateral) and is illustrative. The model is 2.5D: a structure at X (across the arm, px from the
 * rotation axis) and Z (depth, + toward the viewer) turns about the arm's long axis by θ and projects to
 *     x' = X·cosθ + Z·sinθ            (AP: the axis is vertical in the image, Z is anterior)
 * Drawn angle θ = GAIN × (the internal rotation value): the gain (an illustrative choice, as the hand's) makes ±15° read as a clear turn.
 * Scoring never uses it.
 *
 * AP (Bontrager p.166 true-AP criteria: epicondyles in profile; radial head, neck and tubercle separated from, or only slightly
 * superimposed by, the ulna). Four columns of the baseline are displaced: the two epicondyles, the ulna column and the radius column.
 * Rotating narrows the projected distance between the epicondyles for either sign (the even part cosθ); the radius column and the ulna column
 * carry opposite depth offsets (Z), so the odd part moves them apart or together. SIGN (defined by the RESULT IMAGE, S14.3-10): a POSITIVE
 * value moves the ulna column toward the viewer's LEFT and the radius column toward the RIGHT relative to each other (the radial head, neck and
 * tuberosity move away from the ulna); a NEGATIVE value moves them toward each other until the radius is drawn over the ulna (superimposed).
 *
 * LATERAL (p.172 true-lateral criteria: epicondyles / condyle outlines superimposed, about half of the radial head covered by the coronoid
 * process). The medial-side structures (nearer the detector in a lateromedial projection) and the lateral-side structures (farther) are
 * drawn at x' = ±X·sinθ: one copy each, at the same position at the base pose. The two copies are not equally strong (the structure nearer the
 * detector is sharper: 60 % / 40 %), which is what lets the picture carry a SIGN: POSITIVE = the lateral-side copy lies toward the viewer's
 * RIGHT and the medial-side copy toward the LEFT; negative = the mirror image. It does NOT draw the three concentric arcs of the trochlear
 * sulcus or the double ridges (one baseline image cannot show them honestly).
 */
import { TUNING } from "@/features/radiograph/tuning";
import { interpolateAnchors, monotone, type WarpAnchor } from "@/features/limb-warp/warp";

export const ELBOW_MODEL = {
  /** Drawn degrees per degree of the internal rotation value (the value lives in `features/radiograph/tuning.ts`). */
  gain: TUNING.limbRotation.elbowModelGainPerDeg,
  maxDeg: 15,
  ap: { widthPx: 849, heightPx: 1097, axis: 365 },
  lateral: { widthPx: 1086, heightPx: 1103 },
} as const;

const clampDeg = (r: number) => Math.max(-ELBOW_MODEL.maxDeg, Math.min(ELBOW_MODEL.maxDeg, r));
/** Drawn angle (radians) for an internal rotation value. */
export const elbowDrawnRad = (rotationDeg: number): number => (clampDeg(rotationDeg) * ELBOW_MODEL.gain * Math.PI) / 180;

export { interpolateAnchors, type WarpAnchor };

// ───────────────────────── AP ─────────────────────────

/** The four columns of the AP baseline that the rotation displaces (image px of A-019): x = position, Z = depth (+ toward the viewer). */
export const AP_COLUMNS = {
  medialEpicondyle: { x: 165, Z: -20 },
  ulna: { x: 285, Z: -40 },
  radius: { x: 470, Z: 40 },
  lateralEpicondyle: { x: 585, Z: -20 },
} as const;

/** Displacement in image px of an AP column at a rotation value (x' − x at the base pose). */
function apShiftPx(col: { x: number; Z: number }, rotationDeg: number): number {
  const th = elbowDrawnRad(rotationDeg);
  const X = col.x - ELBOW_MODEL.ap.axis;
  return X * (Math.cos(th) - 1) + col.Z * Math.sin(th);
}

/**
 * AP result-image input (fractions of the image width): the displacement anchors of the whole image (interpolated piecewise-linearly,
 * constant beyond the outer ones), and the anchors of the ULNA layer (medial epicondyle → ulna column, constant beyond: the ulna moves
 * rigidly, the soft tissue medial to it follows the warp) and of the RADIUS layer (radius column → lateral epicondyle, constant before) of
 * the forearm rows; the two layers may overlap. `ulna` / `radius` = the rigid shifts of the two bones (their columns).
 */
export function elbowApShifts(rotationDeg: number): { anchors: WarpAnchor[]; ulnaAnchors: WarpAnchor[]; radiusAnchors: WarpAnchor[]; ulna: number; radius: number } {
  const W = ELBOW_MODEL.ap.widthPx;
  const cols = [AP_COLUMNS.medialEpicondyle, AP_COLUMNS.ulna, AP_COLUMNS.radius, AP_COLUMNS.lateralEpicondyle];
  const anchors = monotone(cols.map((c) => ({ u: c.x / W, du: apShiftPx(c, rotationDeg) / W })));
  return {
    anchors,
    ulnaAnchors: anchors.slice(0, 2).map((a) => ({ ...a })),
    radiusAnchors: anchors.slice(2).map((a) => ({ ...a })),
    ulna: apShiftPx(AP_COLUMNS.ulna, rotationDeg) / W,
    radius: apShiftPx(AP_COLUMNS.radius, rotationDeg) / W,
  };
}

// ───────────────────────── lateral ─────────────────────────

/** Half-distances (image px of A-021) of the lateral-side and medial-side structures from the rotation axis, read by eye (illustrative). */
export const LATERAL_HALF_PX = { condyles: 95, radialHeadCoronoid: 75 } as const;
/** Weights of the lateral-side (farther from the detector) and medial-side (nearer) copies: the nearer one is sharper. */
export const LATERAL_COPY_WEIGHTS = { lateral: 0.4, medial: 0.6 } as const;

export interface ElbowCopy { du: number; w: number }

/**
 * Lateral result-image input: per band [condyle outlines, radial head / coronoid], the copies to blend (fraction of the image width;
 * all at 0 at the base pose). Sign = the odd part (the lateral-side copy moves to the RIGHT for a positive value).
 */
export function elbowLateralCopies(rotationDeg: number): { condyles: ElbowCopy[]; head: ElbowCopy[] } {
  const th = elbowDrawnRad(rotationDeg);
  const W = ELBOW_MODEL.lateral.widthPx;
  const pair = (half: number): ElbowCopy[] => [
    { du: (half * Math.sin(th)) / W, w: LATERAL_COPY_WEIGHTS.lateral },
    { du: (-half * Math.sin(th)) / W, w: LATERAL_COPY_WEIGHTS.medial },
  ];
  return { condyles: pair(LATERAL_HALF_PX.condyles), head: pair(LATERAL_HALF_PX.radialHeadCoronoid) };
}
