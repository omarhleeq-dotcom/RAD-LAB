import outlines from "./wrist-outlines.json";
import { softSpanPx, type Pt } from "./outline-geometry";
import { WRIST_IMAGE } from "./wrist-outline-drawing";

/**
 * Geometry of the wrist side view (S14.1c). These numbers only drive DRAWING of the set-up; scoring uses the internal rotation
 * value (`rotationDeg`). The rotation cues in the figure are drawn by `WristFigure.tsx` from the 2.5D wrist model (`features/wrist-model`,
 * S-VIS-1b), with the same functions that displace the result image.
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

/**
 * Hand (carpus) and forearm HEIGHTS of the side view (RAD-072 2b: proportions read from the traced wrist, `wrist-outlines.json`; drawing only, not a
 * measurement). The side view looks across the table: palm down (PA) it shows the wrist's palmar–dorsal thickness, which is the width of the LATERAL
 * image; standing on its ulnar edge (lateral) it shows the wrist's width, the width of the PA image. Rows (image px) are a drawing choice: across the
 * carpus and across the distal forearm; at each row the soft-tissue span around the limb's centre line is read.
 */
const SIDE_ROWS = { hand: { y: { pa: 450, lateral: 450 }, x: { pa: 420, lateral: 300 } }, forearm: { y: { pa: 900, lateral: 1300 }, x: { pa: 380, lateral: 280 } } } as const;

function spanUnits(view: "pa" | "lateral", row: keyof typeof SIDE_ROWS): number {
  const runs = outlines.views[view].structures.filter((s) => s.group === "soft").map((s) => s.points as Pt[]);
  const r = SIDE_ROWS[row];
  return Math.round(softSpanPx(runs, r.y[view], r.x[view]) * WRIST_IMAGE[view].cmPerPx * WRIST_SIDE.pxPerCm);
}

/** Drawn heights (side-view units) of the hand and the distal forearm for a PA (palm down) or lateral (ulnar edge down) set-up. */
export function wristSideHeights(lateral: boolean): { hand: number; forearm: number } {
  const seen = lateral ? "pa" : "lateral"; // the image whose width is this set-up's height
  return { hand: spanUnits(seen, "hand"), forearm: spanUnits(seen, "forearm") };
}
