/**
 * Geometry of the hand SIDE view (S14.2b; drawing units). Not to scale: a schematic of the set-up, never a measurement.
 * (The rotation drawing of the detector view comes from the 2.5D hand model, `features/hand-model`.)
 */
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
