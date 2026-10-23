/**
 * Wrist detector-view drawing from the TRACED outlines (RAD-072 2b; owner decision DECISIONS #rad072-2b-owner-2026-10-23). Pure (no React):
 * the outlines in `wrist-outlines.json` (traced from A-011 / A-013, approved by the owner; illustrative, drawing-only, not a measurement) are
 * moved by the EXISTING wrist model (`features/wrist-model/wrist-model.ts`, unchanged), the same functions that displace the result image,
 * so the drawing turns with the same parts in the same direction.
 *
 * PA (the model's `wristPaShifts`): the metacarpal-column anchors warp the whole image (carpals, metacarpal bases, soft tissue: "anchors");
 * from the forearm rows on (`forearm.v1`, soft edge `bandSoft`) the ULNA and the RADIUS move rigidly as two layers by their own shift. A
 * point of a forearm bone is placed by the blend of the two, per row, as the result image blends them.
 * Lateral (`wristLateralCopies`): two bands, [proximal metacarpals, ulnar head over the distal radius], each drawn as TWO copies of the
 * structures that must be superimposed (far side `+`, near side `−`, weights 40 % / 60 % in the result image), displaced by the band's row
 * weight and horizontal window. At the base pose the copies coincide, so the drawing is the traced outline exactly.
 * The soft tissue follows its nearest traced bone (for a group with copies, the copy that moves it farthest outward).
 *
 * Left / right: both images are a LEFT wrist and both wrist exams are fixed-side L. A right-wrist case would pass `mirror: true` (x reflected
 * about the traced soft tissue's centre after the projection). RTL never mirrors anatomy.
 */
import outlines from "./wrist-outlines.json";
import { interpolateAnchors, wristLateralCopies, wristPaShifts, WRIST_MODEL } from "@/features/wrist-model/wrist-model";
import { wristLateralRadiograph } from "@/data/cases/wrist-lateral-radiograph";
import { wristPaRadiograph } from "@/data/cases/wrist-pa-radiograph";
import { TUNING } from "@/features/radiograph/tuning";
import { closeOnBorder, followNearest, type DrawnPart as SharedPart, type Pt } from "./outline-geometry";

export type { Pt };
export type WristKind = "pa" | "lateral";
type Group = "soft" | "metacarpals" | "carpals" | "forearm" | "joints" | "prominences";
interface Structure { id: string; group: Group; closed: boolean; follows: string | null; drawn?: boolean; points: Pt[] }
export type DrawnPart = SharedPart<Group>;
export interface WristOutlineDrawing {
  /** The soft-tissue silhouette: one open outline per run (the image edge cuts the silhouette). */
  soft: DrawnPart[];
  bones: DrawnPart[];
  joints: DrawnPart[];
}

/** Image size and scale (cm per px) of the two baselines: the exams' regions are these images at these scales (`upper-limb-common.ts`). */
export const WRIST_IMAGE = {
  pa: { widthPx: WRIST_MODEL.pa.widthPx, heightPx: WRIST_MODEL.pa.heightPx, cmPerPx: 0.01245 },
  lateral: { widthPx: WRIST_MODEL.lateral.widthPx, heightPx: WRIST_MODEL.lateral.heightPx, cmPerPx: 0.0125 },
} as const;

const structures = (kind: WristKind) => outlines.views[kind].structures as unknown as Structure[];
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** The row weight of a band (the same formula as the result image's `bandWeight`). */
const bandWeight = (b: { v1: number; v2: number }, v: number) => {
  const s = TUNING.limbRotation.bandSoft;
  return smoothstep(b.v1 - s, b.v1 + s, v) * (1 - smoothstep(b.v2 - s, b.v2 + s, v));
};

const isBone = (s: Structure) => s.group !== "soft" && s.group !== "joints" && s.points.length > 2;
const drawn = (s: Structure) => s.drawn !== false && s.points.length > 2;

type PointMap = (q: Pt) => Pt;

function paMaps(rotationDeg: number): Record<string, PointMap> {
  const W = WRIST_IMAGE.pa.widthPx, H = WRIST_IMAGE.pa.heightPx;
  const sh = wristPaShifts(rotationDeg);
  const { v1 } = wristPaRadiograph.limbRotation!.kind === "wrist-pa" ? wristPaRadiograph.limbRotation!.forearm : { v1: 0.52 };
  const s = TUNING.limbRotation.bandSoft;
  const warp = (x: number) => interpolateAnchors(sh.anchors, x / W) * W;
  // weight of the forearm layers at a row: 0 above the radiocarpal joint, 1 in the forearm (the result image's `elbowApValue`)
  const wf = (y: number) => smoothstep(v1 - s, v1 + s, y / H);
  const layer = (shift: number): PointMap => ([x, y]) => [x + (1 - wf(y)) * warp(x) + wf(y) * shift * W, y];
  return { anchors: ([x, y]) => [x + warp(x), y], ulna: layer(sh.ulna), radius: layer(sh.radius) };
}

/** Both copies of a lateral band: the point map per copy (far side first, as `wristLateralCopies`). */
function lateralMaps(rotationDeg: number): Record<string, PointMap[]> {
  const W = WRIST_IMAGE.lateral.widthPx, H = WRIST_IMAGE.lateral.heightPx;
  const c = wristLateralCopies(rotationDeg);
  const bands = wristLateralRadiograph.limbRotation!.kind === "wrist-lateral" ? wristLateralRadiograph.limbRotation!.bands : [];
  const copyMaps = (band: (typeof bands)[number], copies: { du: number }[]): PointMap[] =>
    copies.map((cp) => ([x, y]) => {
      const u = x / W;
      const win = smoothstep((band.u1 ?? 0) - 0.02, (band.u1 ?? 0) + 0.02, u) * (1 - smoothstep((band.u2 ?? 1) - 0.02, (band.u2 ?? 1) + 0.02, u));
      return [x + cp.du * W * bandWeight(band, y / H) * win, y];
    });
  return { metacarpals: copyMaps(bands[0]!, c.metacarpals), head: copyMaps(bands[1]!, c.head) };
}

function mapsFor(kind: WristKind, rotationDeg: number): (s: Structure) => PointMap[] {
  if (kind === "pa") {
    const m = paMaps(rotationDeg);
    return (s) => [m[s.follows ?? "anchors"] ?? m.anchors!];
  }
  const m = lateralMaps(rotationDeg);
  return (s) => m[s.follows ?? ""] ?? [(q) => q];
}

/** Centre x (image px) about which a right-wrist case would be mirrored: the middle of the traced soft tissue. */
function mirrorAxis(kind: WristKind): number {
  const xs = structures(kind).filter((s) => s.group === "soft").flatMap((s) => s.points.map((p) => p[0]));
  return (Math.min(...xs) + Math.max(...xs)) / 2;
}

/** The wrist drawing at a rotation value (degrees of the internal rotation setting; the model's own gain and clamp apply). */
export function wristOutlineDrawing(kind: WristKind, rotationDeg: number, opts: { mirror?: boolean } = {}): WristOutlineDrawing {
  const all = structures(kind);
  const mapsOf = mapsFor(kind, rotationDeg);
  const maps = new Map(all.map((s) => [s.id, mapsOf(s)]));
  const { widthPx: W, heightPx: H } = WRIST_IMAGE[kind];
  const parts = (s: Structure): DrawnPart[] => {
    const ms = maps.get(s.id)!;
    // a bone cut by the image edge is an open outline: its fill follows the image border (not a chord across the picture)
    const closure = s.closed || s.points.length < 3 ? [] : closeOnBorder(s.points[s.points.length - 1]!, s.points[0]!, W, H);
    return ms.map((m, copy) => ({ id: s.id, group: s.group, closed: s.closed, copy, copies: ms.length, points: s.points.map(m), ...(closure.length ? { fillPoints: [...s.points, ...closure].map(m) } : {}) }));
  };
  const bonesBase = all.filter((b) => isBone(b) && drawn(b));
  const flip = opts.mirror ? mirrorAxis(kind) * 2 : null;
  const fx = (p: DrawnPart): DrawnPart => (flip === null ? p : { ...p, points: p.points.map(([x, y]): Pt => [flip - x, y]), ...(p.fillPoints ? { fillPoints: p.fillPoints.map(([x, y]): Pt => [flip - x, y]) } : {}) });
  // soft tissue: the silhouette is cut into open runs by the image edge; the first run carries the fill of the whole silhouette (the runs in order of their left edge, each
  // running along the silhouette, joined along the image border), every run is stroked on its own
  const runs = all.filter((s) => s.group === "soft").sort((u, v) => Math.min(...u.points.map((p) => p[0])) - Math.min(...v.points.map((p) => p[0])));
  const join: Pt[] = runs.flatMap((s, i) => {
    const next = runs[(i + 1) % runs.length]!;
    return [...s.points, ...closeOnBorder(s.points[s.points.length - 1]!, next.points[0]!, W, H)];
  });
  const follow = (pts: Pt[]) => followNearest(pts, bonesBase, (id) => maps.get(id)!);
  const joinMapped = follow(join);
  const soft = runs.map((s, i): DrawnPart => fx({ id: s.id, group: "soft", closed: false, copy: 0, copies: 1, points: follow(s.points), fillPoints: i === 0 ? joinMapped : [] }));
  return {
    soft,
    bones: bonesBase.flatMap(parts).map(fx),
    joints: all.filter((s) => s.group === "joints" && drawn(s)).flatMap(parts).map(fx),
  };
}
