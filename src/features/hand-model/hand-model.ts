/**
 * ONE parametric 2.5D hand model for both hand exams (S14.2b-FIX phase 3). Pure (no React, no randomness): the SVG scene draws its
 * projection and the result-image effect takes its displacement anchors from the SAME functions, so the drawing and the picture turn
 * in the same direction by construction.
 *
 * ENGINE / TEACHING CHOICE (not an anatomical measurement; listed in REVIEW_PACKAGE): every number below is read by eye from the two
 * baseline images (A-015 PA, A-017 lateral) and is illustrative. What is modelled: each part is a TUBE with an elliptical cross-section
 * (X = across the hand, Y = along the forearm / hand long axis, Z = depth / thickness; px of the baseline image, relative to the
 * rotation axis = the forearm long axis). Rotating the hand by θ about that axis projects a point to
 *     x' = X·cosθ + Z·sinθ,           depth z' = −X·sinθ + Z·cosθ,
 * and the width of a tube to  w' = sqrt((wX·cosθ)² + (wZ·sinθ)²).
 *   PA base θ = 0° (palm down, digits slightly spread, thumb on the viewer's right);
 *   lateral (extension) base θ = 90° (thumb side up: image-x = Z, the digits' X-spread becomes depth, so they are superimposed).
 * At the base pose the projection reproduces the approved silhouettes. The two exams use the same algorithm with a per-exam POSE
 * (the digits are spread in the PA and together in the extension lateral, `xFactor`), and the same Z values (thumb palmar, digits in
 * a shallow arch).
 *
 * Drawn angle θ = base + GAIN × (the internal rotation value): the gain (an illustrative choice) makes ±15° read as a clear turn.
 * Scoring never uses it. SIGN (defined by the RESULT IMAGE, S14.1c-2 / S14.2-11): a positive value moves the thumb (radial side) toward
 * the viewer's LEFT in the PA (the digits mostly narrow toward the axis for either sign), and in the lateral the ulnar-side digits and the
 * ulna toward the viewer's RIGHT and the radial side toward the left (a fan). A negative value is the mirror image of the odd part.
 */
import { TUNING } from "@/features/radiograph/tuning";
import { monotone, oddPart, type WarpAnchor } from "@/features/limb-warp/warp";

export type HandKind = "pa" | "lateral";

export const HAND_MODEL = {
  /** Drawn degrees per degree of the internal rotation value (the value lives in `features/radiograph/tuning.ts`). */
  gain: TUNING.limbRotation.handModelGainPerDeg,
  maxDeg: 15,
  /** Rotation axis (the forearm long axis) in image px: PA image x, lateral image x. */
  axis: { pa: 490, lateral: 460 },
  imageWidthPx: { pa: 1466, lateral: 686 },
  baseDeg: { pa: 0, lateral: 90 },
  /** Digits are spread in the PA and together in the extension lateral: factor on the PA across-hand offsets. */
  xFactorPhalanx: 0.3,
  xFactorMetacarpal: 0.6,
} as const;

export interface P3 { X: number; Y: number; Z: number }
export interface Tube {
  id: string;
  /** soft tissue is drawn first (all of it), then the bones from far to near. */
  layer: "soft" | "bone";
  /** ends: position and cross-section (wX across, wZ depth), px. */
  a: P3;
  b: P3;
  wa: [number, number];
  wb: [number, number];
  /** "digit" tubes are drawn as round-capped lines; "slab" tubes (palm, forearm) as polygons; "blob" is a single ellipse at `a`. */
  shape: "line" | "poly" | "blob";
  /** Anchor group for the result-image warp. */
  group?: "phalanx" | "metacarpal" | "thumb-mc" | "column" | "radius" | "ulna";
  /** Digit number 5 … 2 (ulnar → radial) for anchors. */
  digit?: number;
}

const DIGITS = [
  { n: 5, mcp: [285, 990], tip: [105, 390], base: [330, 1500], z: -40 },
  { n: 4, mcp: [440, 925], tip: [375, 125], base: [500, 1490], z: -10 },
  { n: 3, mcp: [632, 895], tip: [655, 30], base: [580, 1480], z: 25 },
  { n: 2, mcp: [850, 930], tip: [990, 195], base: [690, 1470], z: 10 },
] as const;
/** Lateral (extension) finger column: tip, MCP, metacarpal base (image px of A-017). */
const COL = { tip: [420, 80], mcp: [455, 790], base: [478, 1480] } as const;
const PHAL = [[0.03, 0.4, 74], [0.46, 0.72, 62], [0.78, 1, 54]] as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const A = HAND_MODEL.axis;

/** The model's parts for one exam's pose, at the base pose coordinates. */
export function handTubes(kind: HandKind): Tube[] {
  const pa = kind === "pa";
  const out: Tube[] = [];
  const P = (xPa: number, yPa: number, xLat: number, yLat: number, z: number, xf: number): P3 =>
    pa ? { X: xPa - A.pa, Y: yPa, Z: z } : { X: (xPa - A.pa) * xf, Y: yLat, Z: xLat - A.lateral };
  const T = (t: Tube) => out.push(t);

  // soft tissue
  T({ id: "forearm", layer: "soft", shape: "poly", a: P(495, 2082, 475, 2123, 15, 1), b: P(495, 1800, 450, 1800, -10, 1), wa: [580, 340], wb: [610, 330] });
  T({ id: "palm", layer: "soft", shape: "poly", a: P(495, 1800, 445, 1780, -15, 1), b: P(580, 1050, 445, 830, -15, 1), wa: [610, 320], wb: [860, 310] });
  for (const d of DIGITS) {
    const xf = HAND_MODEL.xFactorPhalanx;
    T({ id: `soft${d.n}`, layer: "soft", shape: "line", digit: d.n, group: "column",
      a: P(d.mcp[0], d.mcp[1], COL.mcp[0], COL.mcp[1], d.z, xf), b: P(d.tip[0], d.tip[1], COL.tip[0], COL.tip[1], d.z, xf), wa: [150, 130], wb: [150, 130] });
  }
  T({ id: "soft1", layer: "soft", shape: "line", group: "thumb-mc", a: P(770, 1580, 150, 1590, -310, 1), b: P(1370, 900, 92, 680, -368, 1), wa: [170, 170], wb: [170, 170] });

  // bones: digits 2–5 (three phalanges + the metacarpal)
  for (const d of DIGITS) {
    PHAL.forEach(([t0, t1, w], j) => {
      const xf = HAND_MODEL.xFactorPhalanx;
      const at = (t: number) => P(lerp(d.mcp[0], d.tip[0], t), lerp(d.mcp[1], d.tip[1], t), lerp(COL.mcp[0], COL.tip[0], t), lerp(COL.mcp[1], COL.tip[1], t), d.z, xf);
      T({ id: `p${d.n}-${j}`, layer: "bone", shape: "line", group: "phalanx", digit: d.n, a: at(t0), b: at(t1), wa: [w, w * 0.9], wb: [w, w * 0.9] });
    });
    const xf = HAND_MODEL.xFactorMetacarpal;
    T({ id: `m${d.n}`, layer: "bone", shape: "line", group: "metacarpal", digit: d.n,
      a: P(d.mcp[0] + 4, d.mcp[1] + 30, COL.mcp[0] - 3, 830, d.z * 0.5, xf), b: P(d.base[0], d.base[1], COL.base[0], COL.base[1], d.z * 0.5, xf), wa: [78, 70], wb: [78, 70] });
  }
  // thumb: metacarpal, proximal and distal phalanx (palmar to the finger column: Z from the lateral baseline)
  T({ id: "t-mc", layer: "bone", shape: "line", group: "thumb-mc", a: P(780, 1570, 150, 1580, -310, 1), b: P(1080, 1340, 205, 1260, -255, 1), wa: [80, 72], wb: [80, 72] });
  T({ id: "t-pp", layer: "bone", shape: "line", a: P(1110, 1320, 110, 1180, -350, 1), b: P(1240, 1190, 105, 910, -355, 1), wa: [66, 60], wb: [66, 60] });
  T({ id: "t-dp", layer: "bone", shape: "line", a: P(1260, 1170, 96, 830, -364, 1), b: P(1360, 930, 92, 680, -368, 1), wa: [56, 50], wb: [56, 50] });
  // carpals (blobs): two rows in the PA, four in the lateral
  const carpals: [number, number, number][] = pa
    ? [[400, 1570, 100], [570, 1590, 100], [740, 1570, 105], [900, 1650, 95], [330, 1720, 95], [520, 1740, 105], [700, 1720, 100]]
    : [[430, 1560, 95], [350, 1660, 90], [480, 1690, 100], [540, 1590, 80]];
  carpals.forEach(([cx, cy, r], i) => {
    const p: P3 = pa ? { X: cx - A.pa, Y: cy, Z: 0 } : { X: 0, Y: cy, Z: cx - A.lateral };
    T({ id: `c${i}`, layer: "bone", shape: "blob", a: p, b: p, wa: [2 * r, 1.8 * r], wb: [2 * r, 1.8 * r] });
  });
  // distal radius (radial side, +X) and ulna: apart in the PA, superimposed in a true lateral
  T({ id: "radius", layer: "bone", shape: "line", group: "radius", a: P(610, 1840, 475, 1830, 15, 1), b: P(585, 2082, 470, 2123, 15, 1), wa: [300, 190], wb: [260, 190] });
  T({ id: "ulna", layer: "bone", shape: "line", group: "ulna", a: P(340, 1840, 470, 1830, 10, 1), b: P(335, 2082, 468, 2123, 10, 1), wa: [160, 150], wb: [150, 150] });
  return out;
}

const clampDeg = (r: number) => Math.max(-HAND_MODEL.maxDeg, Math.min(HAND_MODEL.maxDeg, r));
/** Drawn angle θ (degrees) of an exam for an internal rotation value. */
export const drawnAngleDeg = (kind: HandKind, rotationDeg: number): number => HAND_MODEL.baseDeg[kind] + clampDeg(rotationDeg) * HAND_MODEL.gain;

export interface Projected {
  tube: Tube;
  /** projected image-px positions of the two ends (x' absolute in image px), y unchanged */
  x1: number; y1: number; x2: number; y2: number;
  /** projected widths at the two ends */
  w1: number; w2: number;
  /** mean depth z' (larger = nearer the viewer) */
  depth: number;
}

const proj = (p: P3, c: number, s: number, axis: number) => ({ x: axis + p.X * c + p.Z * s, z: -p.X * s + p.Z * c });
const wProj = (w: [number, number], c: number, s: number) => Math.hypot(w[0] * c, w[1] * s);

/** Project the model at a rotation value; soft tissue first, then bones from far to near (stable order for equal depth). */
export function projectHand(kind: HandKind, rotationDeg: number): Projected[] {
  const th = (drawnAngleDeg(kind, rotationDeg) * Math.PI) / 180;
  const c = Math.cos(th), s = Math.sin(th);
  const axis = A[kind];
  const res = handTubes(kind).map((tube, i): Projected & { i: number } => {
    const a = proj(tube.a, c, s, axis), b = proj(tube.b, c, s, axis);
    return { i, tube, x1: a.x, y1: tube.a.Y, x2: b.x, y2: tube.b.Y, w1: wProj(tube.wa, c, s), w2: wProj(tube.wb, c, s), depth: (a.z + b.z) / 2 };
  });
  res.sort((p, q) => (p.tube.layer === q.tube.layer ? p.depth - q.depth || p.i - q.i : p.tube.layer === "soft" ? -1 : 1));
  return res;
}

// ───────────────────────── result-image anchors (the pixel step's input) ─────────────────────────

export { oddPart, type WarpAnchor };

/** Displacement (fraction of the image width) of a tube's centre between the base pose and the rotated pose. */
function shiftOf(kind: HandKind, t: Tube, rotationDeg: number): { u0: number; du: number } {
  const th = (drawnAngleDeg(kind, rotationDeg) * Math.PI) / 180, th0 = (HAND_MODEL.baseDeg[kind] * Math.PI) / 180;
  const mid: P3 = { X: (t.a.X + t.b.X) / 2, Y: 0, Z: (t.a.Z + t.b.Z) / 2 };
  const x0 = mid.X * Math.cos(th0) + mid.Z * Math.sin(th0);
  const x1 = mid.X * Math.cos(th) + mid.Z * Math.sin(th);
  const W = HAND_MODEL.imageWidthPx[kind];
  return { u0: (A[kind] + x0) / W, du: (x1 - x0) / W };
}

// `monotone` (shared warp math) keeps the anchors from folding: it only bites at the extremes of the range, where the thumb would otherwise
// slide under digit 2. The scene is not clamped.
/** Cap of the thumb's displacement in the result image (fraction of the image width, ≈ 0.9 cm). */
const THUMB_CAP = 0.06;

/**
 * PA: displacement anchors of the PHALANGEAL band (digits 5…2, middle phalanx), the METACARPAL band (digits 5…2) and the THUMB band
 * (its three bones; its own horizontal window, so the thumb moves as a unit and the palm is not sheared), sorted by u. The pixel step interpolates between them (constant beyond the outer ones).
 */
export function handPaAnchors(rotationDeg: number): { phalanx: WarpAnchor[]; metacarpal: WarpAnchor[]; thumb: WarpAnchor[] } {
  const tubes = handTubes("pa");
  const pick = (f: (t: Tube) => boolean) =>
    tubes.filter(f).map((t) => { const s = shiftOf("pa", t, rotationDeg); return { u: s.u0, du: s.du }; }).sort((p, q) => p.u - q.u);
  return {
    phalanx: monotone(pick((t) => t.group === "phalanx" && t.id.endsWith("-1"))),
    metacarpal: monotone(pick((t) => t.group === "metacarpal")),
    // The picture's thumb displacement is capped (a bigger warp tears the thumb off the palm); the scene is not capped.
    thumb: monotone(pick((t) => t.id.startsWith("t-")).map((a) => ({ u: a.u, du: Math.max(-THUMB_CAP, Math.min(THUMB_CAP, a.du)) }))),
  };
}

/**
 * Lateral (extension): the copies of the structures that must be superimposed: the finger / metacarpal column (one shift per digit)
 * and the distal forearm (radius, ulna), fraction of the image width. At the base pose every shift is 0 (one copy).
 */
export function handLateralShifts(rotationDeg: number): { column: number[]; forearm: number[] } {
  const tubes = handTubes("lateral");
  const of = (f: (t: Tube) => boolean) => tubes.filter(f).map((t) => shiftOf("lateral", t, rotationDeg).du);
  return {
    column: [5, 4, 3, 2].map((n) => {
      const ds = tubes.filter((t) => t.digit === n && (t.group === "phalanx" || t.group === "metacarpal")).map((t) => shiftOf("lateral", t, rotationDeg).du);
      return ds.reduce((p, q) => p + q, 0) / ds.length;
    }),
    forearm: of((t) => t.group === "radius" || t.group === "ulna"),
  };
}
