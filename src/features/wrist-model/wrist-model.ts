/**
 * ONE small rotation model for both WRIST exams (S-VIS-1b, closes O45). Pure (no React, no randomness): the SVG scene draws its projection
 * and the result-image effect takes its displacements from the SAME functions, so the drawing and the picture turn in the same direction by
 * construction (the pattern of `features/elbow-model` and `features/hand-model`; the pixel steps are the elbow's, shared).
 *
 * ENGINE / TEACHING CHOICE (not an anatomical measurement; listed in REVIEW_PACKAGE and O45 / O73): every number below is read by eye from the
 * two baseline images (A-011 PA 690 × 980, A-013 lateral 559 × 1400) and is illustrative. The model is 2.5D: a structure at X (across the
 * wrist, px from the rotation axis) and Z (depth, + toward the viewer) turns about the forearm's long axis by θ and projects to
 *     x' = X·cosθ + Z·sinθ            (PA: the axis is vertical in the image, Z is dorsal)
 * Drawn angle θ = GAIN × (the internal rotation value): the gain is an illustrative TEACHING EXAGGERATION (2.3×, the same as the hand, elbow
 * and lower limb) so ±15° reads as a clear turn. The depth offsets below (a few mm of arch, ±60 px = ≈ 0.75 cm for the two forearm bones) are
 * illustrative too. Scoring never uses any of it.
 *
 * PA (Bontrager p.156: equal concavity on both sides of the proximal metacarpal shafts, near-equal distances between the proximal metacarpals,
 * distal radius and ulna separated with only minimal superimposition). The five proximal metacarpal columns are displaced by their depth offsets
 * (a dorsal arch: the middle metacarpals highest, the thumb metacarpal lowest), so the spaces between them become unequal (the even part cosθ
 * also narrows the wrist), and the ulna and the radius move as two layers below the radiocarpal joint. SIGN (defined by the RESULT IMAGE, as
 * the elbow AP, S14.3-10): a POSITIVE value moves the ulna toward the viewer's LEFT and the radius toward the RIGHT relative to each other
 * (the distal radioulnar space opens); a NEGATIVE value moves them toward each other until they overlap; the thumb-side metacarpal moves left
 * for a positive value (the palmar side), the middle metacarpals right. Feedback stays magnitude-only (±2° / ±5°).
 *
 * LATERAL (p.158: the ulnar head superimposed over the distal radius, the proximal 2nd–5th metacarpals superimposed). The structures that must be
 * superimposed are drawn as TWO copies each (farther from / nearer to the detector, x' = ±half·sinθ, 40 % / 60 %): one outline at the base pose.
 * SIGN: POSITIVE = the far-side copy toward the viewer's RIGHT and the near-side copy toward the LEFT (the stronger copy is on the left);
 * negative = the mirror image. Ghosting of whole windows, not occlusion; real carpal kinematics are not modelled.
 */
import { TUNING } from "@/features/radiograph/tuning";

export const WRIST_MODEL = {
  /** Drawn degrees per degree of the internal rotation value (the value lives in `features/radiograph/tuning.ts`). */
  gain: TUNING.limbRotation.wristModelGainPerDeg,
  maxDeg: 15,
  pa: { widthPx: 690, heightPx: 980, axis: 345 },
  lateral: { widthPx: 559, heightPx: 1400 },
} as const;

const clampDeg = (r: number) => Math.max(-WRIST_MODEL.maxDeg, Math.min(WRIST_MODEL.maxDeg, r));
/** Drawn angle (radians) for an internal rotation value. */
export const wristDrawnRad = (rotationDeg: number): number => (clampDeg(rotationDeg) * WRIST_MODEL.gain * Math.PI) / 180;

export interface WarpAnchor { u: number; du: number }
export interface WristCopy { du: number; w: number }

// ───────────────────────── PA ─────────────────────────

/** The columns of the PA baseline (image px of A-011) that the rotation displaces: x = position, Z = depth (+ toward the viewer, dorsal). Read by eye, illustrative. */
export const PA_COLUMNS = {
  /** Proximal metacarpal bases, left → right (5th … 2nd, then the cut-off thumb metacarpal). */
  metacarpals: [
    { x: 160, Z: 20 },
    { x: 280, Z: 50 },
    { x: 390, Z: 70 },
    { x: 520, Z: 60 },
    { x: 640, Z: -30 },
  ],
  ulna: { x: 205, Z: -60 },
  radius: { x: 460, Z: 60 },
} as const;

/** Where the forearm rows begin (fraction of the image height) and the contact line between ulna and radius (fraction of the width), read by eye. */
export const PA_FOREARM = { v1: 0.52, splitU: 0.457 } as const;

function paShiftPx(col: { x: number; Z: number }, rotationDeg: number): number {
  const th = wristDrawnRad(rotationDeg);
  const X = col.x - WRIST_MODEL.pa.axis;
  return X * (Math.cos(th) - 1) + col.Z * Math.sin(th);
}

/** A warp must not fold: keep the displaced anchors in order, each at least `MIN_SLOPE` of its original spacing apart. */
const MIN_SLOPE = 0.2;
function monotone(a: WarpAnchor[]): WarpAnchor[] {
  const out = a.map((x) => ({ ...x }));
  for (let k = 1; k < out.length; k++) {
    const p = out[k - 1]!, q = out[k]!;
    const min = p.u + p.du + MIN_SLOPE * (q.u - p.u);
    if (q.u + q.du < min) q.du = min - q.u;
  }
  return out;
}

/**
 * PA result-image / scene input (fractions of the image width): the displacement anchors of the whole image (the metacarpal columns,
 * interpolated piecewise-linearly, constant beyond the outer ones) and the single anchor of each forearm layer (the ulna and the radius move
 * rigidly below the radiocarpal joint; the soft tissue beside each follows). `ulna` / `radius` = their shifts.
 */
export function wristPaShifts(rotationDeg: number): { anchors: WarpAnchor[]; ulnaAnchors: WarpAnchor[]; radiusAnchors: WarpAnchor[]; ulna: number; radius: number } {
  const W = WRIST_MODEL.pa.widthPx;
  const anchors = monotone(PA_COLUMNS.metacarpals.map((c) => ({ u: c.x / W, du: paShiftPx(c, rotationDeg) / W })));
  const ulna = paShiftPx(PA_COLUMNS.ulna, rotationDeg) / W;
  const radius = paShiftPx(PA_COLUMNS.radius, rotationDeg) / W;
  return {
    anchors,
    ulnaAnchors: [{ u: PA_COLUMNS.ulna.x / W, du: ulna }],
    radiusAnchors: [{ u: PA_COLUMNS.radius.x / W, du: radius }],
    ulna,
    radius,
  };
}

/** Piecewise-linear interpolation through anchors sorted by u (constant beyond the outer ones). */
export function interpolateAnchors(anchors: WarpAnchor[], u: number): number {
  const n = anchors.length;
  if (n === 0) return 0;
  if (u <= anchors[0]!.u) return anchors[0]!.du;
  if (u >= anchors[n - 1]!.u) return anchors[n - 1]!.du;
  for (let k = 0; k < n - 1; k++) {
    const p = anchors[k]!, q = anchors[k + 1]!;
    if (u <= q.u) return q.u === p.u ? p.du : p.du + ((u - p.u) / (q.u - p.u)) * (q.du - p.du);
  }
  return 0;
}

// ───────────────────────── lateral ─────────────────────────

/** Half-distances (image px of A-013) of the far-side and near-side structures from the rotation axis, read by eye (illustrative). */
export const LATERAL_HALF_PX = { metacarpals: 45, ulnarHead: 40 } as const;
/** Weights of the far-side (weaker) and near-side (sharper) copies. */
export const LATERAL_COPY_WEIGHTS = { far: 0.4, near: 0.6 } as const;

/**
 * Lateral result-image / scene input: per band [proximal metacarpals, ulnar head / distal radius] the copies to blend (fraction of the image
 * width; all at 0 at the base pose). Sign = the odd part (the far-side copy moves to the RIGHT for a positive value).
 */
export function wristLateralCopies(rotationDeg: number): { metacarpals: WristCopy[]; head: WristCopy[] } {
  const th = wristDrawnRad(rotationDeg);
  const W = WRIST_MODEL.lateral.widthPx;
  const pair = (half: number): WristCopy[] => [
    { du: (half * Math.sin(th)) / W, w: LATERAL_COPY_WEIGHTS.far },
    { du: (-half * Math.sin(th)) / W, w: LATERAL_COPY_WEIGHTS.near },
  ];
  return { metacarpals: pair(LATERAL_HALF_PX.metacarpals), head: pair(LATERAL_HALF_PX.ulnarHead) };
}
