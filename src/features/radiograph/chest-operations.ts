/** Chest-only source-space operations; extracted without numerical changes. */
import type { ImageEllipse, RadiographAssetSpec } from "@/domain/radiograph";
import type { RenderPlan } from "./plan";
import { TUNING } from "./tuning";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * Vertical map output-v → source-v for reduced inspiration: lung fields shorten and the diaphragm rises; the
 * region below the dome is stretched so the frame stays filled. Piecewise-linear control points, smoothed.
 * Returns identity (null) when inspiration is not reduced.
 */
export function inspirationLut(spec: RadiographAssetSpec, extentReduction: number, size = 2048): Float32Array {
  const apex = spec.lungApexV, dome = spec.diaphragmDomeV;
  // No lung landmarks (a limb baseline, S14.1b): the identity map.
  if (apex === undefined || dome === undefined) return Float32Array.from({ length: size }, (_, i) => i / (size - 1));
  const domeOut = apex + (dome - apex) * (1 - extentReduction);
  const pts: [number, number][] = [[0, 0], [apex, apex], [domeOut, dome], [1, 1]];
  const lut = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    const v = i / (size - 1);
    let k = 0;
    while (k < pts.length - 2 && v > pts[k + 1]![0]) k++;
    const [a0, b0] = pts[k]!, [a1, b1] = pts[k + 1]!;
    lut[i] = b0 + ((v - a0) / (a1 - a0)) * (b1 - b0);
  }
  // Smooth (monotonicity is preserved by averaging), keep the end points fixed.
  const win = Math.round(size * 0.03);
  const out = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    let sum = 0;
    for (let k = -win; k <= win; k++) sum += lut[Math.min(size - 1, Math.max(0, i + k))]!;
    out[i] = sum / (2 * win + 1);
  }
  out[0] = 0;
  out[size - 1] = 1;
  return out;
}

/** Horizontal displacement (fraction of image width) of source content at u for a given rotation. */
export function rotationShiftU(u: number, rot: NonNullable<RenderPlan["anatomy"]["rotation"]>, spec: RadiographAssetSpec): number {
  const { u1, u2 } = spec.anatomyBox;
  // No frontal midline in the asset (S11, e.g. a lateral): no spine cue, only the thorax interior shift.
  const spine = spec.midlineU === undefined ? 0 : rot.spineShiftU * Math.exp(-0.5 * ((u - spec.midlineU) / TUNING.rotation.spineSigma) ** 2);
  const interior = rot.thoraxShiftU * Math.sin(Math.PI * clamp01((u - u1) / (u2 - u1)));
  return spine + interior;
}

/**
 * Lateral baseline (no frontal midline, S12): offset (fraction of image width, + = toward the viewer's right = posterior
 * in this simulator's lateral display) of the SECOND copy of the posterior thorax, and the weight of that copy (0 at the
 * sternum side, `separationBlend` at the posterior chest wall). Together they draw the posterior ribs and costophrenic
 * angles doubled by an amount that grows with the internal rotation value — an educational "separation" cue.
 */
export function lateralSeparation(u: number, rot: NonNullable<RenderPlan["anatomy"]["rotation"]>, spec: RadiographAssetSpec): { shiftU: number; weight: number } {
  const { u1, u2 } = spec.anatomyBox;
  const x = clamp01((u - u1) / (u2 - u1));
  return { shiftU: rot.thoraxShiftU, weight: TUNING.rotation.separationBlend * smoothstep(0.35, 0.95, x) };
}

function ellipseR(e: ImageEllipse, u: number, v: number): number {
  return Math.hypot((u - e.cu) / e.ru, (v - e.cv) / e.rv);
}

/** Added grey level of one schematic scapula (dense = brighter), with a brighter medial border. */
export function scapulaOverlay(e: ImageEllipse, side: "left" | "right", u: number, v: number): number {
  const r = ellipseR(e, u, v);
  if (r >= 1.15) return 0;
  const body = 1 - smoothstep(0.55, 1, r);
  const medial = ((u - e.cu) / e.ru) * (side === "left" ? 1 : -1); // toward the spine = positive
  const ridge = Math.exp(-(((r - 0.92) / 0.09) ** 2)) * smoothstep(-0.2, 0.5, medial);
  return body * TUNING.scapula.body + ridge * TUNING.scapula.border;
}

/** Added grey level of the schematic lower jaw + soft tissue over the apices. */
export function jawOverlay(spec: RadiographAssetSpec, u: number, v: number): number {
  if (!spec.jaw) return 0;
  const pts = spec.jaw.border;
  const first = pts[0]!, last = pts[pts.length - 1]!;
  if (u < first.u || u > last.u) return 0;
  let vb = last.v;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!, b = pts[i + 1]!;
    if (u >= a.u && u <= b.u) {
      vb = a.v + ((u - a.u) / (b.u - a.u)) * (b.v - a.v);
      break;
    }
  }
  const side = smoothstep(first.u, first.u + 0.04, u) * (1 - smoothstep(last.u - 0.04, last.u, u));
  const soft = (1 - smoothstep(vb - 0.012, vb + 0.004, v)) * TUNING.jaw.softTissue;
  const ridge = Math.exp(-(((v - vb) / 0.008) ** 2)) * TUNING.jaw.ridge;
  return (soft + ridge) * side;
}
