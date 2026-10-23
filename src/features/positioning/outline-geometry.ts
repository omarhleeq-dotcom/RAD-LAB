/**
 * Pure geometry shared by the traced-outline drawings of the limbs (hand 2a, wrist and foot 2b). No React. A traced structure is a point list
 * in image px of its baseline; a drawing moves it with the part of the existing 2.5D model it follows (`hand-outline-drawing.ts`,
 * `wrist-outline-drawing.ts`, `foot-outline-drawing.ts`). Illustrative, drawing-only, never a measurement.
 */
export type Pt = [number, number];

/** One drawn copy of a structure, in image px of the baseline (the figure maps px to detector units). */
export interface DrawnPart<G extends string = string> {
  id: string;
  group: G;
  closed: boolean;
  /** 0 … n-1 for the copies of a superimposed group, 0 otherwise. */
  copy: number;
  copies: number;
  points: Pt[];
  /** Optional: the polygon that FILLS an open outline (the outline closed along the image border, see `closeOnBorder`); absent = the outline's own chord; `[]` on a soft run = it has no fill of its own (another run carries the silhouette's). */
  fillPoints?: Pt[];
}

export const centroid = (pts: Pt[]): Pt => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];

/** Distance (image px) from a point to a polyline / polygon. */
export function segDist([x, y]: Pt, pts: Pt[], closed: boolean): number {
  let best = Infinity;
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = pts[i]!, [x2, y2] = pts[(i + 1) % pts.length]!;
    const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / L2));
    best = Math.min(best, Math.hypot(x - x1 - t * dx, y - y1 - t * dy));
  }
  return best;
}

/** Area of a closed polygon (image px²). */
export const polygonArea = (pts: Pt[]): number => Math.abs(pts.reduce((a, [x, y], i) => { const [u, v] = pts[(i + 1) % pts.length]!; return a + x * v - u * y; }, 0)) / 2;

/**
 * Soft tissue: each point follows its nearest traced bone (a bone's `maps` give one point map per drawn copy); for a group with copies, the copy
 * that moves the point farthest outward (away from the bone's centroid). Keeps the soft-tissue line around the bones it was traced around.
 */
export function followNearest(soft: Pt[], bones: { id: string; closed: boolean; points: Pt[] }[], mapsOf: (id: string) => ((q: Pt) => Pt)[]): Pt[] {
  return soft.map((q): Pt => {
    let near = bones[0]!, d = Infinity;
    for (const b of bones) {
      const e = segDist(q, b.points, b.closed);
      if (e < d) [near, d] = [b, e];
    }
    const out = q[0] - centroid(near.points)[0];
    const cands = mapsOf(near.id).map((m) => m(q));
    return cands.reduce((a, c) => ((c[0] - a[0]) * out > 0 ? c : a));
  });
}

/** Position of a point on the image border, measured clockwise from the top-left corner; null if the point is not on the border (within 6 px: the traced runs stop a few px short of the edge). */
function borderPos([x, y]: Pt, W: number, H: number): number | null {
  const e = 6;
  if (y <= e) return Math.max(0, Math.min(W, x));
  if (x >= W - e) return W + Math.max(0, Math.min(H, y));
  if (y >= H - e) return W + H + (W - Math.max(0, Math.min(W, x)));
  if (x <= e) return 2 * W + H + (H - Math.max(0, Math.min(H, y)));
  return null;
}

/**
 * The image corners passed when going from `from` to `to` along the image border by the shorter way (empty if either is not on the border, or no
 * corner lies between them). An open outline that leaves the image (a bone cut by the edge, the silhouette) is FILLED as the outline plus these
 * corners, so the fill follows the image edge instead of cutting a chord across the picture.
 */
export function closeOnBorder(from: Pt, to: Pt, W: number, H: number): Pt[] {
  const a = borderPos(from, W, H), b = borderPos(to, W, H);
  if (a === null || b === null) return [];
  const P = 2 * (W + H);
  const corners: [number, Pt][] = [[0, [0, 0]], [W, [W, 0]], [W + H, [W, H]], [2 * W + H, [0, H]]];
  const cw = (b - a + P) % P;
  const pick = cw <= P / 2
    ? corners.filter(([s]) => ((s - a + P) % P) > 0 && ((s - a + P) % P) < cw).sort((u, v) => ((u[0] - a + P) % P) - ((v[0] - a + P) % P))
    : corners.filter(([s]) => ((a - s + P) % P) > 0 && ((a - s + P) % P) < P - cw).sort((u, v) => ((a - u[0] + P) % P) - ((a - v[0] + P) % P));
  return pick.map(([, c]) => c);
}

/**
 * The span (image px) of the traced soft tissue across a row: the pair of outline crossings of `y` that encloses `x`. The silhouette may be
 * several open runs (the image edge cuts it): every run's crossings are taken together. Throws if no pair encloses `x` (a seed row must be inside the limb).
 */
export function softSpanPx(runs: Pt[][], y: number, x: number): number {
  const xs: number[] = [];
  for (const pts of runs)
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x1, y1] = pts[i]!, [x2, y2] = pts[i + 1]!;
      if (y1 > y !== y2 > y) xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
    }
  xs.sort((a, b) => a - b);
  for (let i = 0; i + 1 < xs.length; i++) if (xs[i]! <= x && x <= xs[i + 1]!) return xs[i + 1]! - xs[i]!;
  throw new Error(`no soft-tissue span at (${x}, ${y})`);
}
