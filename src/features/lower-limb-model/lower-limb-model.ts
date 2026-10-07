/**
 * ONE small rotation model for the four KNEE / FOOT exams (S14.4). Pure (no React, no randomness): the SVG scenes draw its projection and the
 * result-image effects take their displacements from the SAME functions, so the drawing and the picture turn in the same direction by
 * construction (the pattern of `features/hand-model` and `features/elbow-model`).
 *
 * ENGINE / TEACHING CHOICE (not an anatomical measurement; listed in REVIEW_PACKAGE and O62): every number below is read by eye from the four
 * baseline images (A-023, A-025, A-027, A-029) and is illustrative. The model is 2.5D: a structure at X (across the limb, px from the
 * rotation axis) and Z (depth, + toward the viewer) turns about the limb's long axis by θ and projects to
 *     x' = X·cosθ + Z·sinθ            (frontal views: the axis is vertical in the image, Z is anterior / dorsal)
 * Drawn angle θ = GAIN × (the value): the gain (an illustrative choice, as the hand's and the elbow's) makes ±15° read as a clear turn. Scoring
 * never uses it. SIGN: defined by the RESULT IMAGE (never mirrored by RTL), written down per exam below; feedback is magnitude-only.
 *
 * FOOT AP / DP (Bontrager p.232 criteria: nearly equal spacing of metatarsals 2–5; bases of 1 / 2 separated, bases 2–5 overlapping): the
 * metatarsal columns and the toe columns are displaced by their depth offsets (a dorsal arch: the medial rays higher than the 5th), so the
 * spacing between neighbours becomes unequal (the even part cosθ also narrows the foot). The value is the foot's turn about its long axis.
 * FOOT MEDIAL OBLIQUE (p.233: metatarsals 3–5 free of superimposition): the value is the DEVIATION of the plantar angle from the 40° the book
 * recommends (the console value is the absolute angle, `FOOT_OBLIQUE_REFERENCE_DEG`; the image's own obliquity is unmeasured, O63); the lateral
 * rays are higher, so a smaller angle brings metatarsals 3–5 toward each other and a larger one spreads them.
 * KNEE AP (p.246: symmetric condyles and joint space; about the medial half of the fibular head superimposed by the tibia; eminence centred): the
 * condyle edges and the intercondylar eminence move by depth (the eminence moves relative to the condyles), and the fibula (posterior) and the tibia
 * move as two layers below the joint, so the fibular head is more or less covered by the tibia.
 * KNEE LATERAL (p.249: posterior borders of the femoral condyles superimposed; fibular head overlap): the condyle outline and the fibular-head
 * region are drawn as TWO copies, one for the structures farther from the detector and one for those nearer (x' = ±half·sinθ, 40 % / 60 %),
 * one outline at the base pose; ghosting of whole windows, not occlusion.
 */
import type { LowerLimbModelId } from "@/domain/radiograph";
import { TUNING } from "@/features/radiograph/tuning";

export const LOWER_LIMB_MODEL = {
  /** Drawn degrees per degree of the value (the value lives in `features/radiograph/tuning.ts`). */
  gain: TUNING.limbRotation.lowerLimbModelGainPerDeg,
  maxDeg: 15,
} as const;

/** The plantar angle (° to the detector) Bontrager recommends for the medial oblique foot (p.233: 30°–40°, 40° preferred); the oblique's console value is the absolute angle. */
export const FOOT_OBLIQUE_REFERENCE_DEG = 40;

const clampDeg = (r: number) => Math.max(-LOWER_LIMB_MODEL.maxDeg, Math.min(LOWER_LIMB_MODEL.maxDeg, r));
/** Drawn angle (radians) for a value. */
export const lowerLimbDrawnRad = (value: number): number => (clampDeg(value) * LOWER_LIMB_MODEL.gain * Math.PI) / 180;

export interface WarpAnchor { u: number; du: number }
export interface Column { x: number; Z: number }
export interface ModelCopy { du: number; w: number }

/** A warp must not fold: keep the displaced anchors in order, each at least `MIN_SLOPE` of its original spacing apart. */
const MIN_SLOPE = 0.2;
function monotone(a: WarpAnchor[]): WarpAnchor[] {
  const out = a.map((x) => ({ ...x }));
  for (let k = 1; k < out.length; k++) {
    const p = out[k - 1]!, q = out[k]!;
    const min = p.u + p.du + MIN_SLOPE * (q.u - p.u);
    if (q.u + q.du < min) q.du = min - q.u;
  }
  return out;
}

/** Piecewise-linear interpolation through anchors sorted by u (constant beyond the outer ones). */
export function interpolateAnchors(anchors: WarpAnchor[], u: number): number {
  const n = anchors.length;
  if (n === 0) return 0;
  if (u <= anchors[0]!.u) return anchors[0]!.du;
  if (u >= anchors[n - 1]!.u) return anchors[n - 1]!.du;
  for (let k = 0; k < n - 1; k++) {
    const p = anchors[k]!, q = anchors[k + 1]!;
    if (u <= q.u) return q.u === p.u ? p.du : p.du + ((u - p.u) / (q.u - p.u)) * (q.du - p.du);
  }
  return 0;
}

/** Odd part of f at r: the sign carrier (rotating narrows a limb for either sign; only the depth term is odd). */
export const oddPart = (f: (r: number) => number, r: number): number => (f(r) - f(-r)) / 2;

// ───────────────────────── foot (AP and medial oblique) ─────────────────────────

export type FootKind = "ap" | "oblique";

/**
 * The columns of each foot baseline that the rotation displaces (image px of A-027 / A-029): the five metatarsal shafts (band 2) and the five
 * toes (band 1). x = position, Z = depth (+ toward the viewer); the axis is the long axis of the foot. Read by eye, illustrative (O62).
 */
export const FOOT_MODEL = {
  ap: {
    widthPx: 1061,
    heightPx: 2405,
    axis: 560,
    metatarsal: [{ x: 290, Z: 60 }, { x: 460, Z: 120 }, { x: 596, Z: 100 }, { x: 715, Z: 50 }, { x: 860, Z: -40 }] as Column[],
    toes: [{ x: 235, Z: 40 }, { x: 445, Z: 70 }, { x: 595, Z: 60 }, { x: 722, Z: 30 }, { x: 890, Z: -10 }] as Column[],
  },
  oblique: {
    widthPx: 1077,
    heightPx: 1960,
    axis: 580,
    metatarsal: [{ x: 275, Z: 40 }, { x: 450, Z: -40 }, { x: 585, Z: 40 }, { x: 722, Z: 100 }, { x: 880, Z: 170 }] as Column[],
    toes: [{ x: 300, Z: 20 }, { x: 500, Z: 20 }, { x: 640, Z: 60 }, { x: 755, Z: 90 }, { x: 905, Z: 130 }] as Column[],
  },
} as const;

/** The signed value the foot model draws: the AP turn itself; the oblique's deviation from the reference angle. */
export const footValue = (kind: FootKind, consoleDeg: number): number => (kind === "oblique" ? consoleDeg - FOOT_OBLIQUE_REFERENCE_DEG : consoleDeg);

function colShiftPx(axis: number, col: Column, value: number): number {
  const th = lowerLimbDrawnRad(value);
  return (col.x - axis) * (Math.cos(th) - 1) + col.Z * Math.sin(th);
}

/** Result-image / scene input of a foot exam: per band [toes, metatarsals] the displacement anchors (fractions of the image width, sorted by u). */
export function footAnchors(kind: FootKind, value: number): { toes: WarpAnchor[]; metatarsal: WarpAnchor[] } {
  const m = FOOT_MODEL[kind];
  const mk = (cols: readonly Column[]) => monotone(cols.map((c) => ({ u: c.x / m.widthPx, du: colShiftPx(m.axis, c, value) / m.widthPx })));
  return { toes: mk(m.toes), metatarsal: mk(m.metatarsal) };
}

// ───────────────────────── knee AP ─────────────────────────

/**
 * Columns of the AP knee baseline (A-023, 1067 px wide) that the rotation displaces: the fibula and the lateral condyle edge (first layer),
 * the intercondylar eminence and the medial condyle edge (second layer). The fibula is posterior to the tibia (large negative Z).
 */
export const KNEE_AP_MODEL = {
  widthPx: 1067,
  heightPx: 1913,
  axis: 545,
  columns: [
    { x: 140, Z: -150 }, // fibula (head, lateral part)
    { x: 200, Z: -20 }, // lateral condyle edge / lateral tibial plateau edge
    { x: 510, Z: 80 }, // intercondylar eminence
    { x: 905, Z: -20 }, // medial condyle edge
  ] as Column[],
} as const;

/** AP knee result-image input (fractions of the image width): whole-image anchors, and the anchors of the fibula layer (columns 0–1) and the tibia layer (columns 2–3) of the rows below the joint. */
export function kneeApShifts(value: number): { anchors: WarpAnchor[]; fibulaAnchors: WarpAnchor[]; tibiaAnchors: WarpAnchor[]; fibula: number; tibia: number } {
  const m = KNEE_AP_MODEL;
  const anchors = monotone(m.columns.map((c) => ({ u: c.x / m.widthPx, du: colShiftPx(m.axis, c, value) / m.widthPx })));
  return {
    anchors,
    fibulaAnchors: anchors.slice(0, 2).map((a) => ({ ...a })),
    tibiaAnchors: anchors.slice(2).map((a) => ({ ...a })),
    fibula: anchors[0]!.du,
    tibia: anchors[2]!.du,
  };
}

// ───────────────────────── knee lateral ─────────────────────────

/** Half-distances (image px of A-025) of the far-side and near-side structures from the rotation axis, read by eye (illustrative). */
export const KNEE_LATERAL_HALF_PX = { condyles: 110, fibularHead: 80 } as const;
export const KNEE_LATERAL_WIDTH_PX = 1133;
/** Weights of the farther-from-the-detector (weaker) and nearer (sharper) copies. */
export const KNEE_LATERAL_COPY_WEIGHTS = { far: 0.4, near: 0.6 } as const;

/** Lateral knee result-image input: per band [condyle outlines, fibular head / tibia], the copies to blend (fraction of the image width; all at 0 at the base pose). */
export function kneeLateralCopies(value: number): { condyles: ModelCopy[]; head: ModelCopy[] } {
  const th = lowerLimbDrawnRad(value);
  const pair = (half: number): ModelCopy[] => [
    { du: (half * Math.sin(th)) / KNEE_LATERAL_WIDTH_PX, w: KNEE_LATERAL_COPY_WEIGHTS.far },
    { du: (-half * Math.sin(th)) / KNEE_LATERAL_WIDTH_PX, w: KNEE_LATERAL_COPY_WEIGHTS.near },
  ];
  return { condyles: pair(KNEE_LATERAL_HALF_PX.condyles), head: pair(KNEE_LATERAL_HALF_PX.fibularHead) };
}

/** True for the models whose console value is the absolute angle rather than a turn about 0 (the foot oblique). */
export const modelUsesReference = (model: LowerLimbModelId): boolean => model === "foot-oblique";
