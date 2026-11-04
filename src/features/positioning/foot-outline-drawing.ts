/**
 * Foot detector-view drawing from the TRACED outlines (RAD-072 2b; owner decision DECISIONS #rad072-2b-owner-2026-10-23). Pure (no React):
 * the outlines in `foot-outlines.json` (traced from A-027 / A-029, approved by the owner; illustrative, drawing-only, not a measurement)
 * are moved by the EXISTING lower-limb model (`features/lower-limb-model/lower-limb-model.ts`, unchanged), through the same ray shifts that
 * displace the result image, so the drawing moves the same parts in the same direction by the same amount.
 *
 * Rigid rays (owner finding #13; owner decision DECISIONS #radiograph-foot-edges-owner-2026-11-04, item 4). Every bone is moved as a
 * RIGID piece, never bent or resized. Each metatarsal ray, the metatarsal AND its toe's phalanges, moves by ONE displacement: the ray
 * shift the result image uses (the model's metatarsal anchor of that ray, `footAnchors(...).metatarsal`, the plan's band 2 read by
 * `footRayAnchors` in `features/radiograph/limb-effects.ts`), so a toe always moves with its metatarsal and never by its own toe anchors.
 * The joint spaces travel with the bones that own them. The tarsals are not displaced and stay put. The result image's declared limits
 * (the 5th-ray base hold-back, the soft-tissue step at the outer base edge) are not drawn: the drawing shows the rays rigidly.
 * The soft tissue follows its nearest traced bone. Sesamoids (`drawn: false`) are not drawn.
 *
 * Left / right: both images are a RIGHT foot and the foot exams are fixed-side R. A left-foot case would pass `mirror: true` (x reflected
 * about the traced soft tissue's centre after the projection). RTL never mirrors anatomy.
 */
import outlines from "./foot-outlines.json";
import { footAnchors, footValue, FOOT_MODEL, type FootKind } from "@/features/lower-limb-model/lower-limb-model";
import { closeOnBorder, followNearest, type DrawnPart as SharedPart, type Pt } from "./outline-geometry";

export type { Pt, FootKind };
type Group = "soft" | "phalanges" | "metatarsals" | "tarsals" | "sesamoids" | "joints" | "prominences";
interface Structure { id: string; group: Group; closed: boolean; follows: string | null; drawn?: boolean; points: Pt[] }
export type DrawnPart = SharedPart<Group>;
export interface FootOutlineDrawing {
  /** The soft-tissue silhouette (one open outline). */
  soft: DrawnPart[];
  bones: DrawnPart[];
  joints: DrawnPart[];
}

const structures = (kind: FootKind) => outlines.views[kind].structures as unknown as Structure[];
const isBone = (s: Structure) => s.group !== "soft" && s.group !== "joints" && s.points.length > 2;
const drawn = (s: Structure) => s.drawn !== false && s.points.length > 2;

/** The ray (1…5) a structure belongs to: `t3-distal` → toe 3, `mt3` → metatarsal 3, `t3-mtp` → both. */
const toeOf = (id: string) => /^t(\d)-/.exec(id)?.[1];
const mtOf = (id: string) => /^mt(\d)$/.exec(id)?.[1];

/**
 * The rigid displacement (image px, x only) of each moving ray, the result image's own ray shift (metatarsal anchor du × image width):
 * key `mt{n}` for metatarsal n and `t{n}` for its toe, always equal (the toe moves with its ray). Everything else (tarsals) is 0.
 */
export function footRigidShifts(kind: FootKind, consoleDeg: number): Record<string, number> {
  const ray = footAnchors(kind, footValue(kind, consoleDeg)).metatarsal;
  const out: Record<string, number> = {};
  for (let n = 1; n <= 5; n++) out[`t${n}`] = out[`mt${n}`] = (ray[n - 1]?.du ?? 0) * FOOT_MODEL[kind].widthPx;
  return out;
}

/** The displacement (image px) of one structure under the rigid shifts. */
function shiftOf(s: Structure, rigid: Record<string, number>): number {
  const mt = mtOf(s.id), toe = toeOf(s.id);
  if (/^t\d-mtp$/.test(s.id)) return (rigid[`t${toe}`]! + rigid[`mt${toe}`]!) / 2; // the joint between a toe and its metatarsal head (one ray shift)
  if (toe) return rigid[`t${toe}`]!;
  if (mt) return rigid[`mt${mt}`]!;
  if (s.id === "tmt-1") return rigid.mt1!; // the first tarsometatarsal line travels with its metatarsal base
  if (s.id === "tmt-2-5") return (rigid.mt2! + rigid.mt3! + rigid.mt4! + rigid.mt5!) / 4;
  return 0; // tarsals (not displaced by the model), intercuneiform and cuneonavicular lines
}

/** Centre x (image px) about which a left-foot case would be mirrored: the middle of the traced soft tissue. */
function mirrorAxis(kind: FootKind): number {
  const xs = structures(kind).filter((s) => s.group === "soft").flatMap((s) => s.points.map((p) => p[0]));
  return (Math.min(...xs) + Math.max(...xs)) / 2;
}

/** The foot drawing at a console value (the AP: the turn in degrees; the oblique: the plantar angle, whose deviation from 40° the model uses). */
export function footOutlineDrawing(kind: FootKind, consoleDeg: number, opts: { mirror?: boolean } = {}): FootOutlineDrawing {
  const all = structures(kind);
  const rigid = footRigidShifts(kind, consoleDeg);
  const dx = new Map(all.map((s) => [s.id, shiftOf(s, rigid)]));
  const { widthPx: W, heightPx: H } = FOOT_MODEL[kind];
  const part = (s: Structure): DrawnPart => {
    const mv = ([x, y]: Pt): Pt => [x + dx.get(s.id)!, y];
    // a bone cut by the image edge (the hindfoot) is an open outline: its fill follows the image border
    const closure = s.closed || s.points.length < 3 ? [] : closeOnBorder(s.points[s.points.length - 1]!, s.points[0]!, W, H);
    return { id: s.id, group: s.group, closed: s.closed, copy: 0, copies: 1, points: s.points.map(mv), ...(closure.length ? { fillPoints: [...s.points, ...closure].map(mv) } : {}) };
  };
  const bonesBase = all.filter((b) => isBone(b) && drawn(b));
  const flip = opts.mirror ? mirrorAxis(kind) * 2 : null;
  const fx = (p: DrawnPart): DrawnPart => (flip === null ? p : { ...p, points: p.points.map(([x, y]): Pt => [flip - x, y]), ...(p.fillPoints ? { fillPoints: p.fillPoints.map(([x, y]): Pt => [flip - x, y]) } : {}) });
  // soft tissue: one open run (the silhouette leaves the image at the bottom); its fill is closed along the image border
  const nearestShift = (id: string) => [([x, y]: Pt): Pt => [x + dx.get(id)!, y]];
  const soft = all.filter((s) => s.group === "soft").map((s): DrawnPart => {
    const closure = closeOnBorder(s.points[s.points.length - 1]!, s.points[0]!, W, H);
    const follow = (pts: Pt[]) => followNearest(pts, bonesBase, nearestShift);
    return fx({ id: s.id, group: "soft", closed: false, copy: 0, copies: 1, points: follow(s.points), fillPoints: follow([...s.points, ...closure]) });
  });
  return { soft, bones: bonesBase.map(part).map(fx), joints: all.filter((s) => s.group === "joints" && drawn(s)).map(part).map(fx) };
}
