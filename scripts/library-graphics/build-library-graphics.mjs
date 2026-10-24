// Builds src/features/platform/library-graphics.json: the schematic navigation art of the exam library (RAD-069 B2b, F8).
// Derived graphics (hand, wrist, foot, shoulder) come from the project's own traced outlines, simplified to icon scale;
// the others come from ./designs.mjs. Deterministic: no randomness, no timestamps.
//   node scripts/library-graphics/build-library-graphics.mjs           write the JSON
//   node scripts/library-graphics/build-library-graphics.mjs --check   regenerate in memory; exit 1 unless byte-identical
import { readFileSync, writeFileSync } from "node:fs";
import { designs } from "./designs.mjs";

export const VIEW_W = 240, VIEW_H = 168;
const OUT = "src/features/platform/library-graphics.json";
const traced = (name) => JSON.parse(readFileSync(`src/features/positioning/${name}-outlines.json`, "utf8"));
const r1 = (n) => Math.round(n * 10) / 10;

/** Sutherland–Hodgman: a polygon clipped to the window [x0, y0, x1, y1]. */
function clipPoly(pts, [x0, y0, x1, y1]) {
  const edges = [
    [(p) => p[0] >= x0, (a, b) => [x0, a[1] + (b[1] - a[1]) * (x0 - a[0]) / (b[0] - a[0])]],
    [(p) => p[0] <= x1, (a, b) => [x1, a[1] + (b[1] - a[1]) * (x1 - a[0]) / (b[0] - a[0])]],
    [(p) => p[1] >= y0, (a, b) => [a[0] + (b[0] - a[0]) * (y0 - a[1]) / (b[1] - a[1]), y0]],
    [(p) => p[1] <= y1, (a, b) => [a[0] + (b[0] - a[0]) * (y1 - a[1]) / (b[1] - a[1]), y1]],
  ];
  let out = pts;
  for (const [inside, cross] of edges) {
    const input = out;
    out = [];
    input.forEach((cur, i) => {
      const prev = input[(i + input.length - 1) % input.length];
      if (inside(cur)) { if (!inside(prev)) out.push(cross(prev, cur)); out.push(cur); } else if (inside(prev)) out.push(cross(prev, cur));
    });
  }
  return out;
}

/** Ramer–Douglas–Peucker on an open polyline. */
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let worst = -1, at = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = segDist(pts[i], a, b);
    if (d > worst) { worst = d; at = i; }
  }
  if (worst <= eps) return [a, b];
  return [...rdp(pts.slice(0, at + 1), eps).slice(0, -1), ...rdp(pts.slice(at), eps)];
}
function segDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0;
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}
const simplify = (pts, closed, eps) => {
  if (!closed) return rdp(pts, eps);
  // split a ring at its two farthest-apart points so RDP has stable anchors
  let bi = 0, bj = 0, best = -1;
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
    const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
    if (d > best) { best = d; bi = i; bj = j; }
  }
  const one = rdp(pts.slice(bi, bj + 1), eps), two = rdp([...pts.slice(bj), ...pts.slice(0, bi + 1)], eps);
  return [...one.slice(0, -1), ...two.slice(0, -1)];
};

/** Path through the points with rounded corners (quadratic through edge midpoints), open or closed. */
export function smoothPath(pts, closed) {
  const f = (p) => `${r1(p[0])} ${r1(p[1])}`;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  if (pts.length < 3) return `M${f(pts[0])}${pts.slice(1).map((p) => `L${f(p)}`).join("")}`;
  if (closed) {
    let d = `M${f(mid(pts[pts.length - 1], pts[0]))}`;
    for (let i = 0; i < pts.length; i++) d += `Q${f(pts[i])} ${f(mid(pts[i], pts[(i + 1) % pts.length]))}`;
    return `${d}Z`;
  }
  let d = `M${f(pts[0])}`;
  for (let i = 1; i < pts.length - 1; i++) d += `Q${f(pts[i])} ${f(mid(pts[i], pts[i + 1]))}`;
  return `${d}L${f(pts[pts.length - 1])}`;
}

/** Fit a bounding box into the viewBox (aspect kept, centred, margin in viewBox units). */
function fitter(points, margin = 12, bias = [0, 0]) {
  const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const s = Math.min((VIEW_W - 2 * margin) / (x1 - x0), (VIEW_H - 2 * margin) / (y1 - y0));
  const ox = (VIEW_W - s * (x1 - x0)) / 2 - s * x0 + bias[0], oy = (VIEW_H - s * (y1 - y0)) / 2 - s * y0 + bias[1];
  return (p) => [p[0] * s + ox, p[1] * s + oy];
}

const area = (pts) => Math.abs(pts.reduce((sum, p, i) => { const q = pts[(i + 1) % pts.length]; return sum + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;

/**
 * One derived graphic. Roles: "soft" structures form one filled silhouette (the open runs joined in order and closed straight,
 * no stroke on that closing line) plus an open stroke along each run, so a frame-cut end carries no edge line; "bone" is an
 * outline (closed when the trace is closed, dropped under `minArea` viewBox units squared); "line" an open stroke. `eps` is
 * the simplification tolerance in viewBox units.
 */
function derive(file, view, { margin, bias, eps = 0.9, minArea = 0, tx = (p) => p, closeWith = [], clip, softEdge = true, boneFill = false, include }) {
  const v = traced(file).views[view];
  let chosen = include(new Map(v.structures.map((s) => [s.id, s])), v.structures);
  // `clip` [x0, y0, x1, y1]: the drawing shows only that window of the trace and every outline is closed on the cut,
  // so nothing is left open or cut by the frame (open lines that leave the window are dropped).
  if (clip) chosen = [
    ...(chosen.some(([, role]) => role === "soft") ? [[{ id: "soft", closed: true, points: chosen.filter(([, role]) => role === "soft").flatMap(([x]) => x.points) }, "soft"]] : []),
    ...chosen.filter(([, role]) => role !== "soft"),
  ].flatMap(([s, role, e]) => {
    if (role === "line") return s.points.every(([x, y]) => x >= clip[0] && x <= clip[2] && y >= clip[1] && y <= clip[3]) ? [[s, role, e]] : [];
    const points = clipPoly(s.points, clip);
    return points.length > 2 ? [[{ ...s, closed: true, points }, role, e]] : [];
  });
  const fit = fitter([...chosen.flatMap(([s]) => s.points), ...closeWith].map(tx), margin, bias);
  const place = (s) => s.points.map((p) => fit(tx(p)));
  const soft = chosen.filter(([, role]) => role === "soft").map(([s]) => s);
  const parts = [];
  if (soft.length) {
    parts.push({ role: "fill", d: smoothPath(simplify([...soft.flatMap(place), ...closeWith.map((p) => fit(tx(p)))], true, eps), true) });
    for (const s of soft) if (softEdge) parts.push(clip ? { role: "bone", d: smoothPath(simplify(place(s), true, eps), true) } : { role: "line", d: smoothPath(simplify(place(s), false, eps), false) });
  }
  for (const [s, role, e] of chosen) {
    if (role === "soft") continue;
    const closed = s.closed && role !== "line";
    const pts = simplify(place(s), closed, e ?? eps);
    if (closed && area(pts) < minArea) continue;
    if (closed && boneFill) parts.push({ role: "fill", d: smoothPath(pts, closed) });
    parts.push({ role: closed ? "bone" : "line", d: smoothPath(pts, closed) });
  }
  return parts;
}

const ids = (byId, list) => list.map((id) => {
  const s = byId.get(id);
  if (!s) throw new Error(`Unknown traced structure: ${id}`);
  return s;
});

/** Reads `export const NAME = …;` from a TypeScript source as data (type casts and comments dropped); no TS toolchain needed. */
function tsConst(file, name) {
  const src = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const start = src.indexOf(`export const ${name} = `);
  if (start < 0) throw new Error(`${file}: no export ${name}`);
  let depth = 0, i = src.indexOf("{", start);
  const from = i;
  for (; i < src.length; i++) { if (src[i] === "{") depth++; else if (src[i] === "}" && --depth === 0) break; }
  return new Function(`return (${src.slice(from, i + 1).replace(/\s+as\s+(const|Pt(\[\])?|\[Pt, Pt\])(?=[,;\s}\]])/g, "")})`)();
}

/**
 * Project geometry (polygons in image px; the knee/ankle/elbow/pelvis models) windowed to the frame the drawing shows: points
 * outside `win` ([x0, y0, x1, y1]) are clamped and the segments lying on the cut are dropped, so a limb leaves the picture
 * without a closing line. Roles: "soft" = filled silhouette + edge strokes, "bone" = outline, "line" = open stroke.
 */
function geometry({ win, items, margin = 12, bias = [0, 0], eps = 0.9, minArea = 0 }) {
  const clampP = (p) => [Math.min(win[2], Math.max(win[0], p[0])), Math.min(win[3], Math.max(win[1], p[1]))];
  const prepared = items.map((it) => {
    const raw = it.pts, pts = raw.map(clampP);
    const cutAt = (i) => {
      const a = pts[i], b = pts[(i + 1) % pts.length], ra = raw[i], rb = raw[(i + 1) % raw.length];
      const moved = (p, r) => p[0] !== r[0] || p[1] !== r[1];
      if (!(moved(a, ra) && moved(b, rb))) return false;
      return (a[0] === b[0] && (a[0] === win[0] || a[0] === win[2])) || (a[1] === b[1] && (a[1] === win[1] || a[1] === win[3]));
    };
    return { ...it, pts, cutAt };
  });
  const fit = fitter(prepared.flatMap((it) => it.pts), margin, bias);
  const runsOf = (it) => {
    const n = it.pts.length, closed = it.role !== "line";
    const last = closed ? n : n - 1, cuts = [];
    for (let i = 0; i < last; i++) if (it.cutAt(i)) cuts.push(i);
    if (!cuts.length) return { ring: it.pts.map(fit), runs: [] };
    const order = closed ? [...it.pts.slice(cuts[0] + 1), ...it.pts.slice(0, cuts[0] + 1)] : it.pts;
    const rot = closed ? cuts[0] + 1 : 0, runs = [];
    let run = [];
    for (let j = 0; j < order.length; j++) {
      run.push(fit(order[j]));
      if (j < order.length - 1 && it.cutAt((j + rot) % n)) { runs.push(run); run = []; }
    }
    runs.push(run);
    return { ring: null, runs: runs.filter((r) => r.length > 1) };
  };
  const parts = [];
  for (const it of prepared.filter((x) => x.role === "soft")) parts.push({ role: "fill", d: smoothPath(simplify(it.pts.map(fit), true, eps), true) });
  for (const it of prepared) {
    const { ring, runs } = runsOf(it);
    const role = it.role === "soft" ? "line" : it.role === "bone" && ring ? "bone" : "line";
    if (ring) {
      const pts = simplify(ring, it.role !== "line", it.eps ?? eps);
      if (it.role !== "line" && area(pts) < minArea) continue;
      if (it.fill && it.role === "bone") parts.push({ role: "fill", d: smoothPath(pts, true) });
      parts.push({ role, d: smoothPath(pts, it.role !== "line") });
    }
    for (const r of runs) if (!it.keepRun || it.keepRun(r)) parts.push({ role: "line", d: smoothPath(simplify(r, false, it.eps ?? eps), false) });
  }
  return parts;
}

const helpers = { smoothPath, simplify, fitter, area, geometry, tsConst, traced, VIEW_W, VIEW_H };

const softAnd = (groups, extra = []) => (byId, list) => list
  .filter((s) => s.drawn !== false && (s.group === "soft" || groups.includes(s.group) || extra.includes(s.id)))
  .map((s) => [s, s.group === "soft" ? "soft" : s.group === "joints" ? "line" : "bone"]);

/** [file, view, options] per derived graphic: which traced structures stay at icon scale, and how coarsely. */
export const DERIVED = {
  "hand-pa": ["hand", "pa", { eps: 1, minArea: 6, include: softAnd(["digits", "metacarpals", "thumb", "carpus", "forearm"]) }],
  "hand-lateral": ["hand", "lateral", { eps: 1, minArea: 6, include: softAnd(["digits", "metacarpals", "thumb", "carpus", "forearm"]) }],
  // Phase B: carpal row and distal radius/ulna only, the whole drawing inside the frame (outlines closed on the cut)
  "wrist-pa": ["wrist", "pa", { eps: 1.3, minArea: 6, margin: 14, clip: [100, 170, 700, 900], boneFill: true, include: (byId, list) => list.filter((x) => x.group === "carpals" || x.group === "forearm").map((x) => [x, "bone"]) }],
  "wrist-lateral": ["wrist", "lateral", { eps: 1, minArea: 6, include: softAnd(["metacarpals", "carpals", "forearm"]) }],
  "foot-ap": ["foot", "ap", { eps: 1, minArea: 6, include: softAnd(["phalanges", "metatarsals", "tarsals"]) }],
  "foot-oblique": ["foot", "oblique", { eps: 1, minArea: 6, include: softAnd(["phalanges", "metatarsals", "tarsals"]) }],
  // Phase B: humeral head, glenoid, acromion and clavicle line, a shorter shaft and fewer inner lines at a larger scale
  "shoulder-grashey": ["shoulder", "grashey", {
    eps: 1.4, margin: 8, clip: [380, 40, 1192, 1020], boneFill: true,
    include: (byId) => [...["humerus-proximal", "acromion", "clavicle-distal", "glenoid-neck"].map((id) => [byId.get(id), "bone"]), ...["greater-tuberosity-line", "humeral-head-arc"].map((id) => [byId.get(id), "line"])],
  }],
};
export function build() {
  const out = {};
  for (const [kind, spec] of Object.entries(DERIVED)) out[kind] = derive(...spec);
  for (const [kind, parts] of Object.entries(designs(helpers))) out[kind] = parts;
  const sorted = Object.fromEntries(Object.keys(out).sort().map((k) => [k, out[k]]));
  return `${JSON.stringify({ version: 1, viewBox: [VIEW_W, VIEW_H], graphics: sorted }, null, 1)}\n`;
}

export { derive, ids, helpers };

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const text = build();
  if (process.argv.includes("--check")) {
    if (readFileSync(OUT, "utf8") !== text) { console.error(`${OUT} is not byte-identical to the regenerated output`); process.exit(1); }
    console.log(`${OUT}: byte-identical`);
  } else { writeFileSync(OUT, text); console.log(`wrote ${OUT} (${text.length} bytes)`); }
}
