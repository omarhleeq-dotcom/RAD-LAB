/**
 * Hand detector-view drawing from the TRACED outlines (RAD-072 2a Phase B; owner decision DECISIONS #rad072-2a-hand-owner-2026-10-23).
 * Pure (no React): the outlines in `hand-outlines.json` (traced from A-015 / A-017, approved by the owner; illustrative,
 * drawing-only, not a measurement) are moved by the EXISTING 2.5D hand model (`features/hand-model/hand-model.ts`, unchanged), so the
 * drawing turns with the same parts, in the same direction, as the result image's displacements.
 *
 * Mapping. Each structure names the model part it `follows`. A point keeps its position ALONG that tube (fraction t of the tube's
 * base-pose projected segment) and its signed offset ACROSS it; at a rotation the point is placed on the tube's rotated projected
 * segment, the offset scaled by the tube's projected width ratio. At rotation 0 the projection is the base pose, so every
 * outline is drawn exactly as traced. Groups:
 *  - "column" (lateral digit group / metacarpal stack / MCP line): one COPY per digit 5…2 (its phalanx line or its metacarpal), as
 *    the result image draws one copy per digit (`handLateralShifts`). At 0° the copies coincide.
 *  - "forearm" (lateral radius + ulna, superimposed): one copy for the radius and one for the ulna.
 *  - "carpals": the least-squares x-map of the model's carpal blobs (y is unchanged by the model).
 *  - soft tissue: each point moves with its nearest traced bone (the copy farthest outward for a group), so it stays around it.
 * Structures with `drawn: false` (the sesamoid-like densities) and single-point prominences are not drawn.
 *
 * Left / right: both images are a LEFT hand and both hand exams are fixed-side L. A right-hand case would pass `mirror: true`
 * (x reflected about the traced hand's centre after the projection). RTL never mirrors anatomy.
 */
import outlines from "./hand-outlines.json";
import { projectHand, type HandKind, type Projected } from "@/features/hand-model/hand-model";

import { followNearest, polygonArea, type DrawnPart as SharedPart, type Pt } from "./outline-geometry";

export type { Pt };
export { polygonArea };
type Group = "soft" | "digits" | "metacarpals" | "thumb" | "carpus" | "forearm" | "joints" | "prominences";
interface Structure { id: string; group: Group; closed: boolean; follows: string | null; drawn?: boolean; points: Pt[] }

/** One drawn copy of a structure, in image px of the baseline (the figure maps px to detector units). */
export type DrawnPart = SharedPart<Group>;
export interface HandOutlineDrawing {
  /** The soft-tissue silhouette edge (open where the forearm leaves the image). */
  soft: DrawnPart;
  /** Bones (every traced bone, including the thumb, carpus and forearm), in the traced order. */
  bones: DrawnPart[];
  joints: DrawnPart[];
}

const DIGITS = [5, 4, 3, 2] as const;
const structures = (kind: HandKind) => outlines.views[kind].structures as unknown as Structure[];

/** A virtual tube (projected segment and widths) from two projected parts' ends: a digit's whole phalanx line. */
const span = (a: Projected, b: Projected): Projected => ({ ...a, x2: b.x2, y2: b.y2, w2: b.w2 });

/** The base-pose → rotated-pose point map of one tube. */
function tubeMap(p0: Projected, p: Projected): (q: Pt) => Pt {
  const ax = p0.x1, ay = p0.y1, dx = p0.x2 - ax, dy = p0.y2 - ay;
  const L2 = dx * dx + dy * dy || 1, L = Math.sqrt(L2);
  const nx = -dy / L, ny = dx / L;
  const ex = p.x2 - p.x1, ey = p.y2 - p.y1, M = Math.hypot(ex, ey) || 1;
  const mx = -ey / M, my = ex / M;
  return ([x, y]) => {
    const t = ((x - ax) * dx + (y - ay) * dy) / L2;
    const s = (x - ax) * nx + (y - ay) * ny;
    const tc = Math.max(0, Math.min(1, t));
    const scale = (p.w1 + (p.w2 - p.w1) * tc) / (p0.w1 + (p0.w2 - p0.w1) * tc || 1);
    return [p.x1 + t * ex + s * scale * mx, p.y1 + t * ey + s * scale * my];
  };
}

/** x' = α + β·x fitted to the carpal blobs' base and rotated centres (y unchanged). */
function carpalMap(base: Projected[], rot: Projected[]): (q: Pt) => Pt {
  const xs = base.map((p) => p.x1), ys = rot.map((p) => p.x1);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
  const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  const beta = sxx ? xs.reduce((a, x, i) => a + (x - mx) * (ys[i]! - my), 0) / sxx : 1;
  return ([x, y]) => [my + beta * (x - mx), y];
}

/** The point maps of a structure: one per drawn copy. */
function mapsFor(s: Structure, base: Map<string, Projected>, rot: Map<string, Projected>): ((q: Pt) => Pt)[] {
  const tube = (id: string) => tubeMap(base.get(id)!, rot.get(id)!);
  switch (s.follows) {
    case "column":
      return DIGITS.map((n) =>
        s.group === "digits"
          ? tubeMap(span(base.get(`p${n}-0`)!, base.get(`p${n}-2`)!), span(rot.get(`p${n}-0`)!, rot.get(`p${n}-2`)!))
          : tube(`m${n}`),
      );
    case "forearm":
      return [tube("radius"), tube("ulna")];
    case "carpals": {
      const ids = [...base.keys()].filter((id) => /^c\d+$/.test(id));
      return [carpalMap(ids.map((id) => base.get(id)!), ids.map((id) => rot.get(id)!))];
    }
    default:
      return s.follows && base.has(s.follows) ? [tube(s.follows)] : [(q) => q];
  }
}

const isBone = (s: Structure) => s.group !== "soft" && s.group !== "joints" && s.points.length > 2;
const drawn = (s: Structure) => s.drawn !== false && s.points.length > 2;

/** Centre x (image px) about which a right-hand case would be mirrored: the middle of the traced soft tissue. */
function mirrorAxis(kind: HandKind): number {
  const xs = structures(kind).find((s) => s.group === "soft")!.points.map((p) => p[0]);
  return (Math.min(...xs) + Math.max(...xs)) / 2;
}

/** The hand drawing at a rotation value (degrees of the internal rotation setting; the model's own gain and clamp apply). */
export function handOutlineDrawing(kind: HandKind, rotationDeg: number, opts: { mirror?: boolean } = {}): HandOutlineDrawing {
  const base = new Map(projectHand(kind, 0).map((p) => [p.tube.id, p]));
  const rot = new Map(projectHand(kind, rotationDeg).map((p) => [p.tube.id, p]));
  const all = structures(kind);
  const maps = new Map(all.map((s) => [s.id, mapsFor(s, base, rot)]));
  const parts = (s: Structure): DrawnPart[] => {
    const ms = maps.get(s.id)!;
    return ms.map((m, copy) => ({ id: s.id, group: s.group, closed: s.closed, copy, copies: ms.length, points: s.points.map(m) }));
  };

  // Soft tissue: each point follows its nearest traced bone; for a group with copies, the copy that moves it farthest outward.
  const bonesBase = all.filter((b) => isBone(b) && drawn(b)); // a structure that is not drawn owns no soft tissue
  const softS = all.find((s) => s.group === "soft")!;
  const softPts = followNearest(softS.points, bonesBase, (id) => maps.get(id)!);
  const flip = opts.mirror ? mirrorAxis(kind) * 2 : null;
  const fx = (p: DrawnPart): DrawnPart => (flip === null ? p : { ...p, points: p.points.map(([x, y]): Pt => [flip - x, y]) });
  return {
    soft: fx({ id: softS.id, group: "soft", closed: false, copy: 0, copies: 1, points: softPts }),
    bones: all.filter((s) => isBone(s) && drawn(s)).flatMap(parts).map(fx),
    joints: all.filter((s) => s.group === "joints" && drawn(s)).flatMap(parts).map(fx),
  };
}
