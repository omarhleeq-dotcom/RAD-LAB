/**
 * Shared warp math of the limb rotation models (wrist, elbow, hand, lower limb) and the radiograph pixel step. Pure; imports nothing.
 * The family constants (columns, depths, caps, gains) stay in each model.
 */

export interface WarpAnchor { u: number; du: number }

/** A warp must not fold: keep the displaced anchors in order, each at least `MIN_SLOPE` of its original spacing apart. */
export const MIN_SLOPE = 0.2;
export function monotone(a: WarpAnchor[]): WarpAnchor[] {
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

/** The part of a displacement that is odd in the rotation value (the even part, the narrowing by cos θ, is the same for both signs): defines the SIGN. */
export const oddPart = (f: (r: number) => number, r: number): number => (f(r) - f(-r)) / 2;
