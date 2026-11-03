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
import { anchorShift, bandWeight, prepareLimbRow, twoLayerValue, warpColumnsShiftU } from "./limb-effects";
import { inspirationLut, rotationShiftU, lateralSeparation, scapulaOverlay, jawOverlay } from "./chest-operations";
export { inspirationLut, rotationShiftU, lateralSeparation, scapulaOverlay, jawOverlay };

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

// ───────────────────────── limb rotation (every limb exam; see limbRotationValue) ─────────────────────────

/** Compatibility API: generic operations live with the registered limb effect. */
export { bandWeight, anchorShift };
export function handPaShiftU(u: number, v: number, rot: NonNullable<RenderPlan["limb"]>["rotation"], lm: { bands: (ImageBand & { u1?: number; u2?: number })[] }): number {
  return warpColumnsShiftU(u, v, rot.hand?.anchors, lm.bands);
}
export function elbowApValue(
  anchors: { u: number; du: number }[],
  layers: { ulna: { u: number; du: number }[]; radius: { u: number; du: number }[] },
  lm: { forearm: ImageBand & { splitU: number } },
  sample: (u: number, v: number) => number,
  u: number,
  v: number,
): number {
  return twoLayerValue(anchors, { first: layers.ulna, second: layers.radius }, { band: lm.forearm, splitU: lm.forearm.splitU }, sample, u, v);
}
export function limbRotationValue(
  rot: NonNullable<RenderPlan["limb"]>["rotation"],
  lm: NonNullable<RadiographAssetSpec["limbRotation"]>,
  sample: (u: number, v: number) => number,
  u: number,
  v: number,
): number {
  return prepareLimbRow(rot, lm, sample, v)(u);
}

// ───────────────────────── schematic overlays / zones ─────────────────────────

function ellipseR(e: ImageEllipse, u: number, v: number): number {
  return Math.hypot((u - e.cu) / e.ru, (v - e.cv) / e.rv);
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
  const separated = rot !== null && spec.midlineU === undefined;
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
    const vc = clamp01(vSrc);
    const limbSample = plan.limb && spec.limbRotation ? prepareLimbRow(plan.limb.rotation, spec.limbRotation, sample, vc) : null;
    for (let x = 0; x < W; x++) {
      const cx = ox + (x + 0.5) / pxPerCm;
      const i = y * W + x;
      const fm = fRow * edge(cx, f.x1, f.x2), dm = dRow * edge(cx, im.x1, im.x1 + im.widthCm);
      fieldMask[i] = fm;
      dataMask[i] = dm;
      mask[i] = fm * dm;
      const uOut = (cx - im.x1) / im.widthCm;
      let uSrc = uOut;
      if (rot && !separated) {
        // Backward mapping with one refinement step: content at u moves by rotationShiftU(u).
        const first = uOut - rotationShiftU(uOut, rot, spec);
        uSrc = uOut - rotationShiftU(first, rot, spec);
      }
      const uc = clamp01(uSrc);
      let value = limbSample ? limbSample(uOut) : sample(uc, vc);
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
