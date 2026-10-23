import { HAND_CM_PER_PX } from "@/data/exams/xray/hand-geometry";
import outlines from "./hand-outlines.json";

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

/**
 * Hand and forearm HEIGHTS of the side view (RAD-072 2a: proportions aligned with the traced hand, `hand-outlines.json`; drawing only,
 * not a measurement). The side view looks across the table: palm down (PA) it shows the hand's palmar–dorsal thickness, which is the
 * width of the LATERAL image; standing on its ulnar edge (lateral) it shows the hand's width, the width of the PA image. Rows (image
 * px) are a drawing choice: across the metacarpals and across the distal forearm; at each row the soft-tissue span around the hand's
 * centre line is read (the thumb is a separate span and is not counted).
 */
const SIDE_ROWS = { palm: { y: 1100, x: { pa: 600, lateral: 470 } }, forearm: { y: 2000, x: { pa: 500, lateral: 460 } } } as const;

function softSpanPx(view: "pa" | "lateral", y: number, x: number): number {
  const pts = outlines.views[view].structures.find((s) => s.group === "soft")!.points;
  const xs: number[] = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x1, y1] = pts[i]!, [x2, y2] = pts[i + 1]!;
    if (y1! > y !== y2! > y) xs.push(x1! + ((y - y1!) * (x2! - x1!)) / (y2! - y1!));
  }
  xs.sort((a, b) => a - b);
  for (let i = 0; i + 1 < xs.length; i += 2) if (xs[i]! <= x && x <= xs[i + 1]!) return xs[i + 1]! - xs[i]!;
  throw new Error(`no soft-tissue span at ${view} (${x}, ${y})`);
}

/** Drawn heights (side-view units) of the hand and the distal forearm for a PA (palm down) or lateral (ulnar edge down) set-up. */
export function handSideHeights(lateral: boolean): { hand: number; forearm: number } {
  const seen = lateral ? "pa" : "lateral"; // the image whose width is this set-up's height
  const h = (row: (typeof SIDE_ROWS)["palm" | "forearm"]) => Math.round(softSpanPx(seen, row.y, row.x[seen]) * HAND_CM_PER_PX * HAND_SIDE.pxPerCm);
  return { hand: h(SIDE_ROWS.palm), forearm: h(SIDE_ROWS.forearm) };
}
