/**
 * Geometry of the wrist side view (S14.1c). These numbers only drive DRAWING of the set-up; scoring uses the internal rotation
 * value (`rotationDeg`). The rotation cues themselves are drawn by the result image (`features/radiograph/limb-effects.ts`).
 */
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
