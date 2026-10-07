/**
 * Educational visual model of the hand scene (S14.2b). These numbers only drive DRAWING; scoring uses the internal rotation value
 * (`rotationDeg`). They are the drawn counterpart of the result image's rotation effect (`features/radiograph/limb-effects.ts`):
 * the same cues (PA: unequal spacing of the metacarpal shafts and phalanges; lateral (extension): the structures that must be
 * superimposed drawn apart), the same SIGN (defined by the result image: positive = toward the viewer's right), no direction of
 * turn claimed. Nothing here maps drawing distances to clinical degrees.
 */
export const HAND_VISUAL = {
  /** PA: peak horizontal displacement (cm on the detector per degree) of the digit / metacarpal bands, sign = the sign of the value. */
  bumpCmPerDeg: 0.085,
  /** Lateral: offset (cm per degree) of the second copy of the bundles that must be superimposed, sign = the sign of the value. */
  lateralOffsetCmPerDeg: 0.15,
  maxDeg: 15,
} as const;

const clamp = (v: number) => Math.max(-HAND_VISUAL.maxDeg, Math.min(HAND_VISUAL.maxDeg, v));

/** Peak bump (cm, signed) of the PA digit / metacarpal bands. */
export const handPaBumpCm = (rotationDeg: number): number => clamp(rotationDeg) * HAND_VISUAL.bumpCmPerDeg;

/** Signed offset (cm) of the second copy of the lateral bundles. */
export const handLateralOffsetCm = (rotationDeg: number): number => clamp(rotationDeg) * HAND_VISUAL.lateralOffsetCmPerDeg;

/** Geometry of the side view (drawing units). Not to scale: a schematic of the set-up, never a measurement. */
export const HAND_SIDE = {
  /** The detector's long axis (30 cm) laid along the table: the fingers' end (detector y = 0) is at the RIGHT, the body end at the left. */
  slabRight: 396,
  pxPerCm: 7.2,
  surfaceY: 282,
  /** SID is drawn at this scale along the beam. */
  sidPxPerCm: 1,
} as const;

/** x of a detector long-axis position (cm from the top = fingers' end) on the slab. */
export const handSlabX = (yCm: number): number => HAND_SIDE.slabRight - yCm * HAND_SIDE.pxPerCm;
