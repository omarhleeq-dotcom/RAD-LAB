/**
 * Pure pixel pipeline: `RenderPlan` + source luminance → display luminance. No DOM, no canvas, no React, no
 * randomness (noise is a counter-based hash of the pixel index and the plan's seed), so tests run it in Node
 * and the same plan always gives byte-identical output.
 *
 * Fixed layer order (so effects never fight each other):
 *   1  projection / anatomy      geometric warps of the source: reduced inspiration (vertical, diaphragm),
 *                                rotation (horizontal, coordinated cues) — never a whole-image rotation
 *   2  positioning effects       schematic scapula / jaw overlays, in source space, so they move with anatomy
 *   3  motion                    loss of sharpness (blur) of the anatomy — before detector noise, because
 *                                quantum noise is added at the detector and is not blurred by patient motion
 *   4  technique effects         low penetration (dense zones), then low-exposure detail loss and noise
 *   5  display processing        brightness normalised to the pre-technique level inside the field, so no
 *                                exposure/penetration value can lighten or darken the picture
 *   6  field / collimation mask  unexposed (dark) outside the collimated field; 'no reference data' hatch where the
 *                                source image does not cover an exposed part of the detector
 * Detector area inside the field that the source image does not cover is a neutral grey hatch ("no reference
 * data"), never black, so it cannot be mistaken for direct exposure, collimation or anatomy.
 * The learner's side marker is an annotation layer drawn on top by the canvas component (not here).
 *
 * Every effect size is an EDUCATIONAL VISUAL APPROXIMATION (see tuning.ts).
 */
import type { ImageBand, ImageEllipse, RadiographAssetSpec } from "@/domain/radiograph";
import type { RenderPlan } from "./plan";
import { TUNING } from "./tuning";
import { interpolateAnchors as anchorShift } from "@/features/limb-warp/warp";

export interface LumaImage {
  width: number;
  height: number;
  /** 0–255 greyscale, row-major. Dense structures are bright (radiograph convention). */
  data: ArrayLike<number>;
}

export interface RenderedRadiograph {
  width: number;
  height: number;
  pxPerCm: number;
  luma: Uint8ClampedArray;
  /** Detector cm of the canvas's top-left corner (0, 0 unless the plan has a `view`). */
  originCm: { x: number; y: number };
  /** Field in output pixels (for the annotation layer's clip). */
  fieldPx: { x1: number; y1: number; x2: number; y2: number };
  /** Mean of the displayed luma inside the exposed image area (display-processing diagnostics only). */
  meanInField: number;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// ───────────────────────── small deterministic helpers ─────────────────────────

function hash32(x: number): number {
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  return (x ^ (x >>> 16)) >>> 0;
}

/** Approximately N(0,1), deterministic in (index, seed). */
export function gaussianNoise(index: number, seed: number): number {
  const base = Math.imul(index, 4) ^ seed;
  let s = 0;
  for (let k = 0; k < 4; k++) s += hash32(base + k * 0x9e3779b9) / 4294967296;
  return (s - 2) * Math.sqrt(3);
}

/** Separable box blur with edge clamping; `rx`/`ry` are radii in pixels (0 = none on that axis). */
export function boxBlur(src: Float32Array, w: number, h: number, rx: number, ry: number): Float32Array {
  let cur = src;
  if (rx > 0) {
    const out = new Float32Array(w * h);
    const n = 2 * rx + 1;
    for (let y = 0; y < h; y++) {
      const row = y * w;
      let sum = 0;
      for (let k = -rx; k <= rx; k++) sum += cur[row + Math.min(w - 1, Math.max(0, k))]!;
      for (let x = 0; x < w; x++) {
        out[row + x] = sum / n;
        sum += cur[row + Math.min(w - 1, x + rx + 1)]! - cur[row + Math.max(0, x - rx)]!;
      }
    }
    cur = out;
  }
  if (ry > 0) {
    const out = new Float32Array(w * h);
    const n = 2 * ry + 1;
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let k = -ry; k <= ry; k++) sum += cur[Math.min(h - 1, Math.max(0, k)) * w + x]!;
      for (let y = 0; y < h; y++) {
        out[y * w + x] = sum / n;
        sum += cur[Math.min(h - 1, y + ry + 1) * w + x]! - cur[Math.max(0, y - ry) * w + x]!;
      }
    }
    cur = out;
  }
  return cur === src ? new Float32Array(src) : cur;
}

/** Three box passes ≈ a Gaussian. */
function gaussBlur(src: Float32Array, w: number, h: number, radius: number): Float32Array {
  const r = Math.max(1, Math.round(radius / 1.7));
  return boxBlur(boxBlur(boxBlur(src, w, h, r, r), w, h, r, r), w, h, r, r);
}

// ───────────────────────── anatomy warps (source-space coordinates) ─────────────────────────

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

// ───────────────────────── limb rotation (every limb exam; see limbRotationValue) ─────────────────────────

/** Weight (0–1) of a horizontal band of the image with a soft edge, v = fraction of the image height. */
export function bandWeight(band: { v1: number; v2: number }, v: number): number {
  const s = TUNING.limbRotation.bandSoft;
  return smoothstep(band.v1 - s, band.v1 + s, v) * (1 - smoothstep(band.v2 - s, band.v2 + s, v));
}

/** Piecewise-linear interpolation through anchors sorted by u (constant beyond the outer ones): the shared limb warp math. */
export { anchorShift };

/** Hand PA (S14.2b-FIX): displacement (fraction of the image width) of the source content at (u, v): the band-weighted anchor interpolation of the 2.5D hand model. */
export function handPaShiftU(u: number, v: number, rot: NonNullable<RenderPlan["limb"]>["rotation"], lm: { bands: (ImageBand & { u1?: number; u2?: number })[] }): number {
  let shift = 0;
  lm.bands.forEach((b, i) => {
    // A band may carry a horizontal window of the SOURCE content (soft edge 0.06 of the image width): the thumb band moves the thumb only.
    const win = b.u1 === undefined || b.u2 === undefined ? 1 : smoothstep(b.u1 - 0.06, b.u1 + 0.06, u) * (1 - smoothstep(b.u2 - 0.06, b.u2 + 0.06, u));
    const w = bandWeight(b, v) * win;
    if (w > 0) shift += w * anchorShift(rot.hand?.anchors?.[i] ?? [], u);
  });
  return shift;
}

/**
 * Elbow AP (S14.3) output pixel. The whole image is warped by the elbow model's column anchors (backward map by fixed-point iteration, as the
 * hand PA); in the forearm rows (from `forearm.v1`, soft edge) the ULNA layer (source u below the contact line `splitU`) and the RADIUS layer
 * (above it) are instead displaced by their own anchors (each bone rigid, the soft tissue beside it following the warp): where they overlap both are drawn (equal blend: a superimposition drawn as an
 * average, not an additive density), where they part the gap is filled with the mean of the baseline row around the contact line. At the base
 * pose every shift is 0 and the result is the baseline pixel.
 */
export function elbowApValue(
  anchors: { u: number; du: number }[],
  layers: { ulna: { u: number; du: number }[]; radius: { u: number; du: number }[] },
  lm: { forearm: ImageBand & { splitU: number } },
  sample: (u: number, v: number) => number,
  u: number,
  v: number,
): number {
  let us = u;
  for (let k = 0; k < 4; k++) us = u - anchorShift(anchors, us);
  const warped = sample(clamp01(us), v);
  const s = TUNING.limbRotation.bandSoft;
  const wf = smoothstep(lm.forearm.v1 - s, lm.forearm.v1 + s, v);
  if (wf <= 0) return warped;
  const e = 0.02, sp = lm.forearm.splitU;
  let su = u, sr = u;
  for (let k = 0; k < 4; k++) { su = u - anchorShift(layers.ulna, su); sr = u - anchorShift(layers.radius, sr); }
  const wU = 1 - smoothstep(sp - e, sp + e, su);
  const wR = smoothstep(sp - e, sp + e, sr);
  const tot = wU + wR;
  let fv = 0;
  if (wU > 0) fv += wU * sample(clamp01(su), v);
  if (wR > 0) fv += wR * sample(clamp01(sr), v);
  if (tot < 1) {
    let gap = 0;
    for (let k = -2; k <= 2; k++) gap += sample(clamp01(sp + k * 0.02), v);
    fv += (1 - tot) * (gap / 5);
  }
  fv /= Math.max(1, tot);
  return warped + wf * (fv - warped);
}

/**
 * Value of one output pixel under a limb rotation effect, from the backward-mapped sample function. Pure and deterministic. Covers every limb exam:
 *  - hand PA and `limb-warp` (foot, ankle AP, shoulder Grashey, pelvis AP): the band-weighted anchor warp;
 *  - hand lateral: one copy per structure inside each band;
 *  - elbow AP, wrist PA (S-VIS-1b) and `limb-layers` (knee AP): the warp plus two forearm/leg layers (`elbowApValue`);
 *  - elbow lateral, wrist lateral (S-VIS-1b) and `limb-copies` (knee and ankle lateral): weighted far-/near-side copies per band.
 */
export function limbRotationValue(
  rot: NonNullable<RenderPlan["limb"]>["rotation"],
  lm: NonNullable<RadiographAssetSpec["limbRotation"]>,
  sample: (u: number, v: number) => number,
  u: number,
  v: number,
): number {
  if ((lm.kind === "hand-pa" && rot.kind === "hand-pa") || (lm.kind === "limb-warp" && rot.kind === "limb-warp")) {
    // (limb-warp = foot, ankle AP, shoulder Grashey and pelvis AP: the same band-weighted anchor warp as hand PA)
    // Backward map u_out → u_src by fixed-point iteration (the model's displacement field is smooth and slowly varying).
    let us = u;
    for (let k = 0; k < 4; k++) us = u - handPaShiftU(us, v, rot, lm);
    return sample(clamp01(us), v);
  }
  if (lm.kind === "hand-lateral" && rot.kind === "hand-lateral") {
    // One copy per structure at its projected position, blended equally inside each band (the optional horizontal window limits the band
    // to the finger / metacarpal column so the separated thumb is not copied). At the base pose every shift is 0: the picture is the baseline.
    const value = sample(clamp01(u), v);
    let out = value;
    lm.bands.forEach((b, i) => {
      const shifts = rot.hand?.shifts?.[i];
      if (!shifts || shifts.length === 0) return;
      const wv = bandWeight(b, v);
      if (wv <= 0) return;
      let sum = 0, win = 0;
      for (const sh of shifts) {
        const us = clamp01(u - sh);
        const w = b.u1 === undefined || b.u2 === undefined ? 1 : smoothstep(b.u1 - 0.02, b.u1 + 0.02, us) * (1 - smoothstep(b.u2 - 0.02, b.u2 + 0.02, us));
        sum += sample(us, v) * w + value * (1 - w);
        win += 1;
      }
      out += wv * (sum / win - value);
    });
    return out;
  }
  if (((lm.kind === "elbow-ap" && rot.kind === "elbow-ap") || (lm.kind === "wrist-pa" && rot.kind === "wrist-pa") || (lm.kind === "limb-layers" && rot.kind === "limb-layers")) && rot.elbow?.anchors && rot.elbow.layers) {
    return elbowApValue(rot.elbow.anchors, rot.elbow.layers, lm, sample, u, v);
  }
  if ((lm.kind === "elbow-lateral" && rot.kind === "elbow-lateral") || (lm.kind === "wrist-lateral" && rot.kind === "wrist-lateral") || (lm.kind === "limb-copies" && rot.kind === "limb-copies")) {
    // Per band: the lateral-side and the medial-side copy of the structures (window of the SOURCE content), weighted; at the base pose every shift is 0 and the picture is the baseline.
    const value = sample(clamp01(u), v);
    let out = value;
    lm.bands.forEach((band, i) => {
      const b = { u1: 0, u2: 1, ...band }; // (the wrist's windows are optional: default the whole width)
      const copies = rot.elbow?.copies?.[i];
      if (!copies || copies.length === 0) return;
      const wv = bandWeight(b, v);
      if (wv <= 0) return;
      let sum = 0, wsum = 0;
      for (const c of copies) {
        const us = clamp01(u - c.du);
        const w = smoothstep(b.u1 - 0.02, b.u1 + 0.02, us) * (1 - smoothstep(b.u2 - 0.02, b.u2 + 0.02, us));
        sum += c.w * (sample(us, v) * w + value * (1 - w));
        wsum += c.w;
      }
      out += wv * (sum / wsum - value);
    });
    return out;
  }
  return sample(u, v);
}

// ───────────────────────── schematic overlays / zones ─────────────────────────

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

function denseZoneWeight(zones: ImageEllipse[], u: number, v: number): number {
  let w = 0;
  for (const z of zones) w = Math.max(w, 1 - smoothstep(0.6, 1.05, ellipseR(z, u, v)));
  return w;
}

// ───────────────────────── pipeline ─────────────────────────

export function renderRadiograph(
  plan: RenderPlan,
  spec: RadiographAssetSpec,
  src: LumaImage,
  pxPerCm: number,
): RenderedRadiograph {
  const ox = plan.view?.x1 ?? 0, oy = plan.view?.y1 ?? 0;
  const W = Math.round((plan.view ? plan.view.x2 - plan.view.x1 : plan.detector.widthCm) * pxPerCm);
  const H = Math.round((plan.view ? plan.view.y2 - plan.view.y1 : plan.detector.heightCm) * pxPerCm);
  const N = W * H;
  const sw = src.width, sh = src.height;
  const feather = TUNING.featherCm;
  const rot = plan.anatomy.rotation;
  const lut = plan.anatomy.inspiration && spec.lungApexV !== undefined ? inspirationLut(spec, plan.anatomy.inspiration.extentReduction) : null;
  const needZone = plan.technique.penetrationContrastKept !== null;

  // Two independent masks, each with a soft penumbra: the collimated field (what is exposed) and the extent of
  // the source image (where reference data exist). Field-but-no-data is drawn as a neutral hatch, never black.
  const f = plan.fieldCm, im = plan.image;
  const edge = (c: number, lo: number, hi: number) => smoothstep(lo - feather / 2, lo + feather / 2, c) * (1 - smoothstep(hi - feather / 2, hi + feather / 2, c));
  const mask = new Float32Array(N); // field × data: where the image is real, exposed data
  const fieldMask = new Float32Array(N);
  const dataMask = new Float32Array(N);
  const luma = new Float32Array(N);
  const zone = needZone ? new Float32Array(N) : null;

  const sample = (u: number, v: number): number => {
    const fx = u * (sw - 1), fy = v * (sh - 1);
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const x1 = Math.min(sw - 1, x0 + 1), y1 = Math.min(sh - 1, y0 + 1);
    const tx = fx - x0, ty = fy - y0;
    const a = src.data[y0 * sw + x0]!, b = src.data[y0 * sw + x1]!, c = src.data[y1 * sw + x0]!, d = src.data[y1 * sw + x1]!;
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
  };

  for (let y = 0; y < H; y++) {
    const cy = oy + (y + 0.5) / pxPerCm;
    const fRow = edge(cy, f.y1, f.y2), dRow = edge(cy, im.y1, im.y1 + im.heightCm);
    const vOut = (cy - im.y1) / im.heightCm;
    const vSrc = lut ? lut[Math.round(clamp01(vOut) * (lut.length - 1))]! : vOut;
    for (let x = 0; x < W; x++) {
      const cx = ox + (x + 0.5) / pxPerCm;
      const i = y * W + x;
      const fm = fRow * edge(cx, f.x1, f.x2), dm = dRow * edge(cx, im.x1, im.x1 + im.widthCm);
      fieldMask[i] = fm;
      dataMask[i] = dm;
      mask[i] = fm * dm;
      const uOut = (cx - im.x1) / im.widthCm;
      let uSrc = uOut;
      const separated = rot !== null && spec.midlineU === undefined;
      if (rot && !separated) {
        // Backward mapping with one refinement step: content at u moves by rotationShiftU(u).
        const first = uOut - rotationShiftU(uOut, rot, spec);
        uSrc = uOut - rotationShiftU(first, rot, spec);
      }
      const uc = clamp01(uSrc), vc = clamp01(vSrc);
      let value = plan.limb && spec.limbRotation ? limbRotationValue(plan.limb.rotation, spec.limbRotation, sample, uOut, vc) : sample(uc, vc);
      if (separated) {
        const sep = lateralSeparation(uc, rot, spec);
        value += sep.weight * (sample(clamp01(uc - sep.shiftU), vc) - value);
      }
      if (plan.positioning.scapulaeOverlap && spec.scapulae) {
        value += scapulaOverlay(spec.scapulae.left, "left", uc, vc) + scapulaOverlay(spec.scapulae.right, "right", uc, vc);
      }
      if (plan.positioning.jawOverlap) value += jawOverlay(spec, uc, vc);
      if (rot && spec.midlineU !== undefined) {
        // Relative transradiancy difference between the hemithoraces (educational, small).
        const side = Math.max(-1, Math.min(1, (uc - spec.midlineU) / 0.4));
        value *= 1 - rot.transradiancy * side;
      }
      luma[i] = value;
      if (zone) zone[i] = denseZoneWeight(spec.denseZones ?? [], uc, vc);
    }
  }

  // Reference level for display processing: mean over the exposed image area, before motion/technique effects.
  const meanOf = (a: Float32Array) => {
    let sum = 0, n = 0;
    for (let i = 0; i < N; i++) if (mask[i]! > 0.5) { sum += a[i]!; n++; }
    return n ? sum / n : 0;
  };
  const meanRef = meanOf(luma);

  let img: Float32Array = luma;
  if (plan.motion) {
    img = boxBlur(img, W, H, Math.max(1, Math.round(plan.motion.horizontalCm * pxPerCm)), Math.max(1, Math.round(plan.motion.verticalCm * pxPerCm)));
  }

  if (plan.technique.penetrationContrastKept !== null && zone) {
    const base = gaussBlur(img, W, H, TUNING.penetration.baseRadiusCm * pxPerCm);
    const keep = plan.technique.penetrationContrastKept;
    const out = new Float32Array(N);
    for (let i = 0; i < N; i++) out[i] = img[i]! - (1 - keep) * zone[i]! * (img[i]! - base[i]!);
    img = out;
  }

  if (plan.technique.detailGain < 1) {
    const base = boxBlur(img, W, H, Math.max(1, Math.round(TUNING.noise.detailRadiusCm * pxPerCm)), Math.max(1, Math.round(TUNING.noise.detailRadiusCm * pxPerCm)));
    const g = plan.technique.detailGain;
    const out = new Float32Array(N);
    for (let i = 0; i < N; i++) out[i] = base[i]! + g * (img[i]! - base[i]!);
    img = out;
  }

  if (plan.technique.noiseSigma > 0) {
    // Mottle: white deterministic noise, lightly correlated ([1 2 1]² kernel, re-scaled to unit variance).
    const white = new Float32Array(N);
    for (let i = 0; i < N; i++) white[i] = gaussianNoise(i, plan.technique.noiseSeed);
    const smooth = boxBlurBinomial(white, W, H);
    const sigma = plan.technique.noiseSigma;
    const out = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const density = Math.min(1, Math.max(0, img[i]! / 255));
      out[i] = img[i]! + sigma * (1 - TUNING.noise.densityBias / 2 + TUNING.noise.densityBias * density) * smooth[i]! / 0.375;
    }
    img = out;
  }

  // Display processing: keep the displayed brightness at the pre-technique level (DR image processing).
  const meanNow = meanOf(img);
  const gain = meanNow > 0 ? Math.min(TUNING.maxDisplayGain, Math.max(1 / TUNING.maxDisplayGain, meanRef / meanNow)) : 1;

  const bg = TUNING.background;
  const outLuma = new Uint8ClampedArray(N);
  let sum = 0, n = 0;
  const period = TUNING.noData.periodCm * pxPerCm;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const d = dataMask[i]!, fm = fieldMask[i]!;
      // Diagonal hatch in detector space: the same pattern regardless of any effect on the image.
      const hatch = Math.floor((x + y) / period) % 2 === 0 ? TUNING.noData.light : TUNING.noData.dark;
      const exposed = d * Math.min(255, Math.max(0, img[i]! * gain)) + (1 - d) * hatch;
      outLuma[i] = bg + (exposed - bg) * fm;
      if (mask[i]! > 0.5) { sum += outLuma[i]!; n++; }
    }
  }
  return {
    width: W,
    height: H,
    pxPerCm,
    luma: outLuma,
    originCm: { x: ox, y: oy },
    fieldPx: { x1: (f.x1 - ox) * pxPerCm, y1: (f.y1 - oy) * pxPerCm, x2: (f.x2 - ox) * pxPerCm, y2: (f.y2 - oy) * pxPerCm },
    meanInField: n ? sum / n : 0,
  };
}

/** [1 2 1]/4 in x then y. Reduces unit-variance white noise to variance 0.375² (so callers divide by 0.375). */
function boxBlurBinomial(src: Float32Array, w: number, h: number): Float32Array {
  const tmp = new Float32Array(src.length);
  for (let y = 0; y < h; y++) {
    const r = y * w;
    for (let x = 0; x < w; x++) {
      tmp[r + x] = 0.25 * src[r + Math.max(0, x - 1)]! + 0.5 * src[r + x]! + 0.25 * src[r + Math.min(w - 1, x + 1)]!;
    }
  }
  const out = new Float32Array(src.length);
  for (let y = 0; y < h; y++) {
    const ym = Math.max(0, y - 1) * w, y0 = y * w, yp = Math.min(h - 1, y + 1) * w;
    for (let x = 0; x < w; x++) out[y0 + x] = 0.25 * tmp[ym + x]! + 0.5 * tmp[y0 + x]! + 0.25 * tmp[yp + x]!;
  }
  return out;
}
