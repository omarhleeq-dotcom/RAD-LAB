/**
 * Educational visual model of the wrist scene (S14.1c). These numbers only drive DRAWING; scoring uses the internal rotation value
 * (`rotationDeg`). They are the drawn counterpart of the result image's rotation effect (`features/radiograph/limb-effects.ts`):
 * the same cues (PA: unequal proximal metacarpal spacing + the distal ulna moving over the radius; lateral: the bands that must
 * be superimposed drawn apart), the same SIGN (defined by the result image: positive = toward the viewer's right), no direction
 * of turn claimed. Nothing here maps drawing distances to clinical degrees.
 */
export const WRIST_VISUAL = {
  /** PA: bump (cm on the detector per degree) of the metacarpal shaft positions, sign = the sign of the value. */
  bumpCmPerDeg: 0.1,
  /** PA: how far the ulna moves toward the radius (cm per degree of |value|). */
  ulnaShiftCmPerDeg: 0.14,
  /** Lateral: offset (cm per degree) of the second shaft bundle / the ulnar head, sign = the sign of the value. */
  lateralOffsetCmPerDeg: 0.16,
  maxDeg: 15,
} as const;

const clamp = (v: number) => Math.max(-WRIST_VISUAL.maxDeg, Math.min(WRIST_VISUAL.maxDeg, v));

export interface WristPaVisual {
  /** Peak horizontal displacement (cm) of the metacarpal band, signed. */
  bumpCm: number;
  /** Displacement (cm, ≥ 0) of the ulna toward the radius. */
  ulnaShiftCm: number;
}

export function wristPaVisual(rotationDeg: number): WristPaVisual {
  const d = clamp(rotationDeg);
  return { bumpCm: d * WRIST_VISUAL.bumpCmPerDeg, ulnaShiftCm: Math.abs(d) * WRIST_VISUAL.ulnaShiftCmPerDeg };
}

export interface WristLateralVisual {
  /** Signed offset (cm) of the second copy of the structures that overlap in a true lateral. */
  offsetCm: number;
}

export function wristLateralVisual(rotationDeg: number): WristLateralVisual {
  return { offsetCm: clamp(rotationDeg) * WRIST_VISUAL.lateralOffsetCmPerDeg };
}

/** Horizontal position (fraction of the region width) of a metacarpal shaft after the PA bump: the sin bump of the pixel step. */
export const bumpedU = (u: number, bumpCm: number, regionWidthCm: number, u1 = 0.12, u2 = 0.98): number =>
  u + (bumpCm / regionWidthCm) * Math.sin(Math.PI * Math.max(0, Math.min(1, (u - u1) / (u2 - u1))));

/** Geometry of the side view (drawing units). Not to scale: a schematic of the set-up, never a measurement. */
export const WRIST_SIDE = {
  /** The detector's long axis laid along the table: the fingers' end (detector y = 0) is at the RIGHT, the body end at the left. */
  slabRight: 396,
  pxPerCm: 8.5,
  surfaceY: 282,
  /** SID is drawn at this scale along the beam. */
  sidPxPerCm: 1,
} as const;

/** x of a detector long-axis position (cm from the top = fingers' end) on the slab. */
export const slabX = (yCm: number): number => WRIST_SIDE.slabRight - yCm * WRIST_SIDE.pxPerCm;
