/**
 * Geometry of the KNEE / FOOT scenes (S14.4; drawing units). Not to scale: a schematic, never a measurement. The outlines (`lower-limb-outlines.json`)
 * are READ BY EYE from the four baseline images (A-023, A-025, A-027, A-029; image px) and are ILLUSTRATIVE (O62); the rotation drawing of the detector
 * view comes from the lower-limb model (`features/lower-limb-model`), which is also the source of the result image's displacements.
 */
import type { ImageBand } from "@/domain/radiograph";
import { bandWeight } from "@/features/radiograph/pipeline";
import { interpolateAnchors, type WarpAnchor } from "@/features/lower-limb-model/lower-limb-model";
import outlines from "./lower-limb-outlines.json";

export type Pt = [number, number];
export const OUTLINES = outlines as unknown as {
  kneeAp: { soft: Pt[]; femur: Pt[]; tibia: Pt[]; fibula: Pt[]; epicondyles: Pt[]; eminence: Pt };
  kneeLateral: { soft: Pt[]; femur: Pt[]; patella: Pt[]; tibia: Pt[]; fibula: Pt[]; condyleArc: Pt[]; fibularHead: Pt[]; centre: Pt };
  footAp: FootOutline;
  footOblique: FootOutline;
};

export interface FootRay { id: string; band: "toes" | "metatarsal"; pts: [Pt, Pt]; w: number }
export interface FootBlob { id: string; band: "toes" | "metatarsal" | "tarsal"; cx: number; cy: number; rx: number; ry: number }
export interface FootOutline { soft: Pt[]; rays: FootRay[]; blobs: FootBlob[]; tuberosity: Pt; sesamoids: Pt[] }

/** Horizontal displacement (image px) of a foot point under the model's band anchors: the same band-weighted interpolation as the result image (`handPaShiftU`). */
export function footShiftPx(x: number, y: number, widthPx: number, heightPx: number, bands: ImageBand[], anchors: WarpAnchor[][]): number {
  let shift = 0;
  bands.forEach((b, i) => {
    const w = bandWeight(b, y / heightPx);
    if (w > 0) shift += w * interpolateAnchors(anchors[i] ?? [], x / widthPx);
  });
  return shift * widthPx;
}

/**
 * Side view of the table set-up. The detector's long axis (30 cm) lies along the table, the patient's head at the LEFT, the feet at the RIGHT.
 * Knee: the detector's top (y = 0, the femur end) is at the LEFT; foot: the top (y = 0, the toes) is at the RIGHT.
 */
export const LOWER_LIMB_SIDE = {
  slabRight: 396,
  pxPerCm: 7.2,
  surfaceY: 282,
  /** SID is drawn at this scale along the beam. */
  sidPxPerCm: 1,
} as const;

/** x of a detector y position (cm from the top) on the slab. */
export const slabX = (yCm: number, toesAtTop: boolean, lengthCm = 30): number =>
  toesAtTop ? LOWER_LIMB_SIDE.slabRight - yCm * LOWER_LIMB_SIDE.pxPerCm : LOWER_LIMB_SIDE.slabRight - (lengthCm - yCm) * LOWER_LIMB_SIDE.pxPerCm;
