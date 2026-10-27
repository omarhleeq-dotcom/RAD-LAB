/**
 * Shoulder (Grashey) detector-view drawing from the TRACED outlines (RAD-072 2c Phase B; owner decision DECISIONS #rad072-2c-owner-2026-10-24).
 * Pure (no React): the outlines in `shoulder-outlines.json` (traced from A-038, all identities accepted by the owner; illustrative, drawing-only, not a
 * measurement) are moved by the EXISTING shoulder model (`features/shoulder-model/shoulder-model.ts`), the same displacement field that closes the joint
 * space in the result image: a point at column `x` and row `y` moves by `shoulderShift(x / W, value) · W · bandWeight(y / H)` (columns of the model, rows 0.12–0.46
 * with the model's soft edge), so the drawing and the picture close the joint in the same direction by the same amount (magnitude only, the same cue on both
 * sides of the 35°–45° band, nothing at all inside it). Every traced structure carries this one field (`follows: "closure-field"`): the warp is monotone, so no
 * outline folds.
 *
 * Drawn: soft tissue, the humerus (head, neck, tuberosity and shaft as ONE outline; the head arc is part of it), acromion, distal clavicle, coracoid, the
 * glenoid/neck band, the glenohumeral and AC joint spaces; the greater-tuberosity line (D3: stays a line) and the two scapular border lines (D4: lightly) as light
 * lines. Not drawn: nothing is added (no second glenoid rim, no hidden anatomy). Right shoulder only (the exam is fixed-side R); a left case would mirror about the
 * image's vertical axis, never by RTL.
 */
import outlines from "./shoulder-outlines.json";
import { shoulderShift, shoulderValue } from "@/features/shoulder-model/shoulder-model";
import { SHOULDER_DRAWING } from "@/features/positioning/drawing-data";
import { TUNING } from "@/features/radiograph/tuning";
import { closeOnBorder, type DrawnPart as SharedPart, type Pt } from "./outline-geometry";

export type { Pt };
type Group = "soft" | "humerus" | "scapula" | "clavicle" | "joints";
interface Structure { id: string; group: Group; closed: boolean; follows: string | null; drawn?: boolean; points: Pt[] }
export type DrawnPart = SharedPart<Group>;
export interface ShoulderOutlineDrawing {
  /** The soft-tissue silhouette: one open outline carrying the fill of the whole silhouette. */
  soft: DrawnPart[];
  bones: DrawnPart[];
  /** Joint spaces (gaps): the glenohumeral crescent and the AC joint. */
  joints: DrawnPart[];
  /** Light lines: the greater-tuberosity line and the scapular border lines. */
  lines: DrawnPart[];
}

/** The rows of the closing field (fractions of the image height), as `shoulder-grashey-radiograph.ts`. */
export const SHOULDER_BAND = { v1: 0.12, v2: 0.46 } as const;
/** Structures drawn as light lines (not as bones, not as gaps). */
export const SHOULDER_LIGHT_LINES = ["greater-tuberosity-line", "scapular-border-inner", "scapular-border-outer"] as const;
/** Traced but derived or redundant: the head arc is a part of the humerus outline. */
const NOT_DRAWN = new Set(["humeral-head-arc"]);

const structures = outlines.views.grashey.structures as unknown as Structure[];
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** The row weight of the band (the same formula as the result image's `bandWeight`). */
const bandWeight = (v: number) => {
  const s = TUNING.limbRotation.bandSoft;
  return smoothstep(SHOULDER_BAND.v1 - s, SHOULDER_BAND.v1 + s, v) * (1 - smoothstep(SHOULDER_BAND.v2 - s, SHOULDER_BAND.v2 + s, v));
};

/** The closing field as a point map at a console angle (the dead band and the closure per degree live in the model). */
export function shoulderPointMap(consoleDeg: number): (q: Pt) => Pt {
  const { widthPx: W, heightPx: H } = SHOULDER_DRAWING;
  const value = shoulderValue(consoleDeg);
  return ([x, y]) => [x + shoulderShift(x / W, value) * W * bandWeight(y / H), y];
}

/** The shoulder drawing at a console body obliquity (degrees, absolute). */
export function shoulderOutlineDrawing(consoleDeg: number): ShoulderOutlineDrawing {
  const { widthPx: W, heightPx: H } = SHOULDER_DRAWING;
  const m = shoulderPointMap(consoleDeg);
  const part = (s: Structure, fill?: Pt[]): DrawnPart => ({ id: s.id, group: s.group, closed: s.closed, copy: 0, copies: 1, points: s.points.map(m), ...(fill?.length ? { fillPoints: fill.map(m) } : {}) });
  const drawn = (s: Structure) => s.drawn !== false && s.points.length > 2 && !NOT_DRAWN.has(s.id);
  const isLight = (s: Structure) => (SHOULDER_LIGHT_LINES as readonly string[]).includes(s.id);
  const bones = structures.filter((s) => s.group !== "soft" && s.group !== "joints" && drawn(s));
  // an open bone cut by the frame edge is filled along the image border (the humerus along the bottom, the clavicle along the right edge)
  const boneParts = bones.map((s) => {
    const closure = s.closed ? [] : closeOnBorder(s.points[s.points.length - 1]!, s.points[0]!, W, H);
    return part(s, closure.length || !s.closed ? [...s.points, ...closure] : undefined);
  });
  // soft tissue: the traced skin line runs from the bottom-left to the top; the silhouette is the body side of it, i.e. closed through the right-hand corners
  const soft = structures.filter((s) => s.group === "soft");
  const skin = soft[0]!;
  const fill: Pt[] = [...skin.points, [W, 0], [W, H]];
  const joints = structures.filter((s) => s.group === "joints" && drawn(s) && !isLight(s));
  const lines = structures.filter((s) => s.group === "joints" && drawn(s) && isLight(s));
  return {
    soft: [part(skin, fill)],
    bones: boneParts,
    joints: joints.map((s) => part(s)),
    lines: lines.map((s) => part(s)),
  };
}
