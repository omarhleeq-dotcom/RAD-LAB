#!/usr/bin/env python3
"""Trace drawing outlines of the HAND from the project's own two baselines (RAD-072 part 2a, Phase A).

Run (offline, Pillow + NumPy only):
    python3 -I scripts/trace-outlines/trace-hand-outlines.py              # write src/features/positioning/hand-outlines.json
    python3 -I scripts/trace-outlines/trace-hand-outlines.py --check      # regenerate in memory; fail unless byte-identical
    python3 -I scripts/trace-outlines/trace-hand-outlines.py --overlays   # also write the review PNGs in docs/review/rad-072-hand/

Sources (no other image is read): A-015 `public/images/hand/hand-pa-baseline.jpg` and A-017 `public/images/hand/hand-lateral-baseline.jpg`
(CC0, owner-verified; ASSET_PROVENANCE A-014 … A-017). Coordinates are image px of those web copies (origin top-left, x right,
y down): the same space as `features/hand-model/hand-model.ts`. The output is ILLUSTRATIVE and DRAWING-ONLY, never a measurement.

Method (semi-automatic, deterministic; see README.md beside this file):
  * SEEDS below are the curated part: for each structure an approximate axis (distal end centre, proximal end centre) and half-widths,
    read by eye from the same two images. They only place a search window; the edge itself is found in the pixels.
  * Edge detection proposes candidates: the image is Gaussian-smoothed, then intensity profiles are sampled PERPENDICULAR to the axis
    (sides) and in a FAN from each end (joint surfaces). The edge is the steepest bright→dark step going outward (bone is bright),
    or for a superimposed GROUP the outermost strong step. Candidate distances are median-filtered against outliers.
  * Joint spaces: along the line between two traced bones, the darkest point of each axial profile (the radiolucent gap).
  * Soft tissue: Otsu threshold of the smoothed image, largest connected region, boundary walk; image-edge runs are cut (open outline).
  * Every polyline is simplified (Ramer–Douglas–Peucker) to a small number of integer control points.
Structures the two images do not show clearly are simplified, not invented (the carpus is ONE outline; no individual carpal bones;
in the lateral the superimposed digits and metacarpals are one outline each).
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent.parent
OUT_JSON = ROOT / "src/features/positioning/hand-outlines.json"
OUT_REVIEW = ROOT / "docs/review/rad-072-hand"
DATE = "2026-10-23"

SOURCES = {
    "pa": {"asset": "A-015", "derivedFrom": "A-014", "file": "public/images/hand/hand-pa-baseline.jpg"},
    "lateral": {"asset": "A-017", "derivedFrom": "A-016", "file": "public/images/hand/hand-lateral-baseline.jpg"},
}

# ─────────────────────────────── curated seeds (image px, read by eye; search windows only) ───────────────────────────────
# bone: a = distal end centre, b = proximal end centre, he = half-width at the ends, hs = half-width of the shaft.
# mode "steepest" = single bone; "outer" = superimposed group (outermost strong edge). open = proximal end runs off the image.
# tracer "radial" = the smoothed radial tracer (bones the owner's Phase A review asked to re-trace); others use the ribbon tracer.
# follows = the hand-model tube whose rotation the drawing will follow in Phase B (drawing link only; the model is not changed).
PA_BONES = [
    # digit 5 (little finger, viewer's left)
    {"id": "d5-distal", "tracer": "radial", "group": "digits", "a": (104, 402), "b": (134, 548), "he": 36, "hs": 22, "follows": "p5-2"},
    {"id": "d5-middle", "group": "digits", "a": (140, 557), "b": (196, 708), "he": 40, "hs": 27, "follows": "p5-1"},
    {"id": "d5-proximal", "group": "digits", "a": (202, 716), "b": (290, 995), "he": 47, "hs": 30, "follows": "p5-0"},
    {"id": "mc5", "group": "metacarpals", "a": (305, 1008), "b": (382, 1495), "he": 50, "hs": 30, "follows": "m5", "limits": ["cmc"]},
    # digit 4
    {"id": "d4-distal", "tracer": "radial", "group": "digits", "a": (375, 127), "b": (382, 295), "he": 36, "hs": 22, "follows": "p4-2"},
    {"id": "d4-middle", "group": "digits", "a": (395, 306), "b": (416, 545), "he": 46, "hs": 30, "follows": "p4-1"},
    {"id": "d4-proximal", "group": "digits", "a": (422, 556), "b": (450, 935), "he": 56, "hs": 36, "follows": "p4-0"},
    {"id": "mc4", "group": "metacarpals", "a": (458, 950), "b": (455, 1495), "he": 50, "hs": 28, "follows": "m4", "limits": ["cmc"]},
    # digit 3
    {"id": "d3-distal", "tracer": "radial", "group": "digits", "a": (665, 52), "b": (665, 212), "he": 44, "hs": 24, "follows": "p3-2"},
    {"id": "d3-middle", "group": "digits", "a": (655, 223), "b": (650, 470), "he": 56, "hs": 34, "follows": "p3-1"},
    {"id": "d3-proximal", "group": "digits", "a": (650, 485), "b": (635, 888), "he": 66, "hs": 40, "follows": "p3-0"},
    {"id": "mc3", "tracer": "radial", "group": "metacarpals", "a": (625, 905), "b": (560, 1500), "he": 62, "hs": 30, "follows": "m3", "limits": ["cmc"]},
    # digit 2 (index)
    {"id": "d2-distal", "tracer": "radial", "group": "digits", "a": (1005, 198), "b": (995, 345), "he": 44, "hs": 26, "follows": "p2-2"},
    {"id": "d2-middle", "group": "digits", "a": (985, 355), "b": (950, 548), "he": 50, "hs": 32, "follows": "p2-1"},
    {"id": "d2-proximal", "group": "digits", "a": (940, 556), "b": (860, 915), "he": 62, "hs": 38, "follows": "p2-0"},
    {"id": "mc2", "tracer": "radial", "group": "metacarpals", "a": (822, 928), "b": (690, 1505), "he": 60, "hs": 30, "follows": "m2", "limits": ["cmc"]},
    # thumb (viewer's right)
    {"id": "thumb-distal", "tracer": "radial", "harmonics": 6, "group": "thumb", "a": (1400, 926), "b": (1272, 1060), "he": 50, "hs": 34, "follows": "t-dp"},
    # axis and widths from perpendicular profiles (centres (1102, 1289) … (1246, 1100), shaft ≈ 80 px; owner review 2026-10-23)
    {"id": "thumb-proximal", "tracer": "radial", "group": "thumb", "a": (1262, 1080), "b": (1092, 1306), "he": 66, "hs": 40, "follows": "t-pp"},
    # mc1 axis re-read from vertical profiles at x = 850…1000 (owner review 2026-10-23; the first axis ran ≈ 25 px ulnar)
    {"id": "mc1", "tracer": "radial", "group": "thumb", "a": (1108, 1328), "b": (800, 1628), "he": 62, "hs": 47, "follows": "t-mc", "limits": ["cmc1"]},
    # forearm (proximal ends run off the image)
    # ulna: the head; its styloid process is traced as its own small outline (a narrow process beside the head)
    {"id": "ulna", "group": "forearm", "a": (341, 1845), "b": (338, 2082), "he": 76, "hs": 66, "open": True, "follows": "ulna"},
    {"id": "ulnar-styloid-process", "tracer": "radial", "harmonics": 3, "openBelowY": 1842, "group": "prominences", "a": (322, 1793), "b": (323, 1850), "he": 24, "hs": 22, "follows": "ulna"},
    # radius: bounded by the radiocarpal joint line (its distal surface never crosses the joint space)
    {"id": "radius", "group": "forearm", "a": (590, 1812), "b": (585, 2082), "he": 150, "hs": 130, "open": True, "reach": 2.3, "rays": 21, "limits": ["radiocarpal"], "follows": "radius"},
]
PA_BLOBS = [
    # the carpus as ONE simplified outline (individual carpal bones are not separated: they overlap in this projection)
    {"id": "carpus", "group": "carpus", "c": (548, 1655), "rx": 245, "ry": 160, "mode": "outer", "limits": ["cmc", "cmc1", "radiocarpal"], "ulnarBound": True, "steepSector": (100, 175), "follows": "carpals"},
    # rounded density beside the thumb MCP joint (sesamoid appearance; identity not reviewed)
    {"id": "thumb-mcp-sesamoid", "group": "prominences", "c": (1010, 1286), "rx": 22, "ry": 20, "mode": "steepest", "drawn": False, "follows": "t-mc"},
]
# joint-space search centre where the midpoint of the two seed ends misses the gap (read at 3×, owner review 2026-10-23)
JOINT_CENTRE = {("pa", "thumb-mcp"): (1088, 1305)}
# joint-line half-length where the default (0.8 × the narrower end) stops short of a wide base
JOINT_HALF = {("pa", "thumb-mcp"): 64}
# joint spaces: (id, distal bone, proximal bone)
PA_JOINTS = [
    *[(f"d{n}-dip", f"d{n}-distal", f"d{n}-middle") for n in (5, 4, 3, 2)],
    *[(f"d{n}-pip", f"d{n}-middle", f"d{n}-proximal") for n in (5, 4, 3, 2)],
    *[(f"d{n}-mcp", f"d{n}-proximal", f"mc{n}") for n in (5, 4, 3, 2)],
    ("thumb-ip", "thumb-distal", "thumb-proximal"),
    ("thumb-mcp", "thumb-proximal", "mc1"),
]
# joint LINES of the carpus, curated end points + an axial search (the carpus has no single bone pair)
PA_LINES = [
    # carpometacarpal line of digits 2–5: the metacarpal bases overlap the distal carpal row, so this line is APPROXIMATE
    {"id": "cmc", "p": (335, 1472), "q": (725, 1512), "dir": (0, 1), "g": 28, "follows": "carpals"},
    {"id": "radiocarpal", "p": (445, 1842), "q": (708, 1742), "dir": (0, 1), "g": 26, "follows": "radius"},
    # CMC1 re-read at 2× (owner review 2026-10-23): a near-vertical curved gap between the trapezium and the mc1 base
    {"id": "cmc1", "p": (768, 1538), "q": (792, 1648), "dir": (1, -0.22), "g": 20, "follows": "t-mc"},
]

LAT_BONES = [
    # the digits 2–5 are superimposed: ONE outline of the group (tips to the MCP joints); the end half-width covers the spread
    # proximal-phalanx bases (x≈370–545; owner review 2026-10-23: the narrower seed cut one base off at the MCP)
    {"id": "digits-group", "group": "digits", "a": (405, 52), "b": (468, 905), "he": 88, "hs": 62, "mode": "outer", "limits": ["mcp-group"], "follows": "column"},
    # the metacarpals 2–5, superimposed: ONE outline (heads to bases)
    {"id": "metacarpal-stack", "group": "metacarpals", "a": (452, 925), "b": (488, 1560), "he": 100, "hs": 78, "mode": "outer", "limits": ["cmc"], "follows": "column"},
    # thumb, separated (viewer's left)
    # seeds re-read from an intensity profile along the thumb axis (owner review 2026-10-23): bone from y≈688, IP gap at y≈885,
    # MCP gap at y≈1205 (the first seeds put the IP joint ≈ 75 px too high, inside the distal phalanx)
    {"id": "thumb-distal", "tracer": "radial", "group": "thumb", "a": (114, 690), "b": (127, 878), "he": 62, "hs": 44, "follows": "t-dp"},
    {"id": "thumb-proximal", "tracer": "radial", "group": "thumb", "a": (132, 893), "b": (173, 1197), "he": 68, "hs": 42, "follows": "t-pp"},
    {"id": "mc1", "tracer": "radial", "group": "thumb", "a": (188, 1214), "b": (285, 1555), "he": 74, "hs": 46, "follows": "t-mc"},
    # radius and ulna superimposed (one outline), proximal end off the image
    {"id": "radius-ulna", "group": "forearm", "a": (500, 1893), "b": (500, 2123), "he": 118, "hs": 110, "mode": "outer", "open": True, "limits": ["radiocarpal"], "follows": "forearm"},
]
LAT_BLOBS = [
    {"id": "carpus", "group": "carpus", "c": (418, 1720), "rx": 165, "ry": 170, "mode": "outer", "limits": ["cmc", "radiocarpal"], "follows": "carpals"},
    {"id": "thumb-mcp-sesamoid", "group": "prominences", "c": (128, 1228), "rx": 22, "ry": 22, "mode": "steepest", "drawn": False, "follows": "t-mc"},
]
LAT_JOINTS = [
    ("thumb-ip", "thumb-distal", "thumb-proximal"),
    ("thumb-mcp", "thumb-proximal", "mc1"),
]
LAT_LINES = [
    {"id": "mcp-group", "p": (400, 912), "q": (540, 915), "dir": (0, 1), "g": 22, "follows": "column"},
    # carpometacarpal level of the superimposed metacarpal bases: overlapped, APPROXIMATE
    {"id": "cmc", "p": (385, 1578), "q": (585, 1572), "dir": (0, 1), "g": 30, "follows": "carpals"},
    {"id": "radiocarpal", "p": (395, 1888), "q": (600, 1885), "dir": (0, 1), "g": 24, "follows": "radius"},
]

SOFT_TOWARD_BG = {"pa": 0.0, "lateral": 0.5}  # curated: the lateral's finger soft tissue is very faint
OUTER_STRENGTH = 0.3  # curated: a group outline step must be at least this fraction of the strongest step
BRIGHT_FACTOR = {"pa": 0.6, "lateral": 0.6}  # curated: fraction of the bone-brightness level a group outline must enclose
SOFT_MARGIN = 10  # px: the soft-tissue outline keeps at least this margin outside every bone outline
GAP_HALF = 4  # px: half a joint-space width, between a traced gap line and the bone surface beside it

# ───────────────────────────────────────────────────── image helpers ─────────────────────────────────────────────────────


def load(path):
    return np.asarray(Image.open(path).convert("L"), dtype=np.float64)


def gauss(img, sigma):
    r = int(3 * sigma + 0.5)
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2)
    k /= k.sum()
    out = img
    for axis in (0, 1):
        pad = [(0, 0), (0, 0)]
        pad[axis] = (r, r)
        p = np.pad(out, pad, mode="edge")
        acc = np.zeros_like(out)
        n = out.shape[axis]
        for i, w in enumerate(k):
            acc += w * (p[i:i + n, :] if axis == 0 else p[:, i:i + n])
        out = acc
    return out


def sample(img, xs, ys):
    h, w = img.shape
    xs = np.clip(xs, 0, w - 1.001)
    ys = np.clip(ys, 0, h - 1.001)
    x0 = np.floor(xs).astype(int)
    y0 = np.floor(ys).astype(int)
    fx, fy = xs - x0, ys - y0
    return (img[y0, x0] * (1 - fx) * (1 - fy) + img[y0, x0 + 1] * fx * (1 - fy)
            + img[y0 + 1, x0] * (1 - fx) * fy + img[y0 + 1, x0 + 1] * fx * fy)


def ray_hit(ox, oy, dx, dy, lines):
    """Nearest distance along the ray to any of the limit polylines (inf if none is crossed)."""
    best = np.inf
    for ln in lines:
        for (x1, y1), (x2, y2) in zip(ln[:-1], ln[1:]):
            ex, ey = x2 - x1, y2 - y1
            den = dx * ey - dy * ex
            if abs(den) < 1e-9:
                continue
            r = ((x1 - ox) * ey - (y1 - oy) * ex) / den
            f = ((x1 - ox) * dy - (y1 - oy) * dx) / den
            if r > 0 and -0.15 <= f <= 1.15:
                best = min(best, r)
    return best


def edge_on_ray(img, ox, oy, dx, dy, r0, r1, mode, limits=(), expect=None, bright=None, clips=()):
    """Distance along the ray (ox,oy)+r·(dx,dy), r in [r0,r1], of the bright→dark edge; None if there is no clear step.
    A traced joint line crossed by the ray (limits) decides the end: the bone ends at the near side of the joint space.
    `expect` (the seed's distance) mildly favours a step near the expected surface over an internal or neighbouring one.
    `bright` (outer mode): a step only counts if the side inside it is bone-bright, so the soft-tissue edge is never taken.
    `clips`: polylines that only cap the search (the edge is still searched inside them; at worst the cap itself)."""
    lim = ray_hit(ox, oy, dx, dy, limits)
    if lim < r1 + 6:
        # the ray meets a traced joint space inside the window: the bone surface is the near side of that gap
        # (half a typical gap width before the gap's darkest line)
        return float(max(lim - GAP_HALF, 1.0))
    cap_r = ray_hit(ox, oy, dx, dy, clips)
    if cap_r < r1:
        r1 = cap_r - 2
        r0 = min(r0, 0.5 * r1)
    rs = np.arange(r0, r1 + 0.5, 1.0)
    if len(rs) < 4:
        return None
    prof = sample(img, ox + rs * dx, oy + rs * dy)
    d = np.gradient(prof)
    lo = d.min()
    if lo > -0.6:  # no bright→dark step at all in the window
        return None
    if mode == "inner":
        # innermost local minimum of the derivative that is at least half as strong as the strongest one (first surface met)
        idx = [i for i in range(1, len(d) - 1) if d[i] <= d[i - 1] and d[i] <= d[i + 1] and d[i] <= 0.5 * lo]
        i = idx[0] if idx else int(np.argmin(d))
    elif mode == "outer":
        # outermost local minimum of the derivative that is at least OUTER_STRENGTH as strong as the strongest one
        idx = [i for i in range(1, len(d) - 1) if d[i] <= d[i - 1] and d[i] <= d[i + 1] and d[i] <= OUTER_STRENGTH * lo
               and (bright is None or prof[max(i - 3, 0)] >= bright)]
        if bright is not None and not idx:
            idx = [i for i in range(1, len(d) - 1) if prof[max(i - 3, 0)] >= bright]
            if not idx:
                return None
            i = min(idx[-1] + 1, len(d) - 1)  # no clear step: the last bone-bright sample
        else:
            i = idx[-1] if idx else int(np.argmin(d))
    elif expect:
        i = int(np.argmin(d * (0.55 + 0.45 * np.exp(-(((rs - expect) / (0.45 * expect)) ** 2)))))
    else:
        i = int(np.argmin(d))
    return float(rs[i])


def median_filter_circular(v, k=2, closed=True):
    v = np.asarray(v, dtype=float)
    n = len(v)
    out = v.copy()
    for i in range(n):
        idx = [(i + j) % n for j in range(-k, k + 1)] if closed else [j for j in range(i - k, i + k + 1) if 0 <= j < n]
        vals = [v[j] for j in idx if not np.isnan(v[j])]
        out[i] = np.median(vals) if vals else np.nan
    return out


def robust_fourier(q, fixed, harmonics=7, iters=5):
    """Smooth a closed sequence of radius ratios: a low-order Fourier series fitted with outlier rejection (samples whose
    residual exceeds max(0.04, 2.5 robust SD) are dropped and the fit repeated). Samples set by a joint line (`fixed`) always
    stay in the fit and keep their traced value. Returns smoothed ratios for every sample (gaps filled by interpolation)."""
    q = np.asarray(q, float)
    n = len(q)
    ang = 2 * np.pi * np.arange(n) / n
    # rays with no clear edge: fill by circular linear interpolation first, so the series never swings across a gap
    ok = ~np.isnan(q)
    if ok.sum() >= 3 and not ok.all():
        xi = np.arange(n)
        q = q.copy()
        q[~ok] = np.interp(xi[~ok], np.concatenate([xi[ok] - n, xi[ok], xi[ok] + n]), np.tile(q[ok], 3))
    A = np.column_stack([np.ones(n)] + [f(k * ang) for k in range(1, harmonics + 1) for f in (np.cos, np.sin)])
    keep = ~np.isnan(q)
    fit = q
    for _ in range(iters):
        coef = np.linalg.lstsq(A[keep], q[keep], rcond=None)[0]
        fit = A @ coef
        res = q - fit
        mad = np.median(np.abs(res[keep] - np.median(res[keep])))
        new = ~np.isnan(q) & ((np.abs(res) <= max(0.04, 2.5 * 1.4826 * mad)) | fixed)
        if new.sum() < 2 * harmonics + 3 or (new == keep).all():
            break
        keep = new
    return np.where(fixed, q, fit)


def rdp(points, eps):
    pts = np.asarray(points, dtype=float)
    if len(pts) < 3:
        return pts
    a, b = pts[0], pts[-1]
    ab = b - a
    L = np.hypot(*ab)
    if L == 0:
        dist = np.hypot(*(pts - a).T)
    else:
        dist = np.abs(ab[0] * (pts[:, 1] - a[1]) - ab[1] * (pts[:, 0] - a[0])) / L
    i = int(np.argmax(dist))
    if dist[i] > eps:
        left = rdp(pts[: i + 1], eps)
        right = rdp(pts[i:], eps)
        return np.vstack([left[:-1], right])
    return np.vstack([a, b])


def simplify_closed(pts, eps):
    pts = np.asarray(pts, dtype=float)
    # split at the two mutually farthest points so RDP keeps the shape's extremes
    i0 = 0
    i1 = int(np.argmax(np.hypot(*(pts - pts[i0]).T)))
    i0 = int(np.argmax(np.hypot(*(pts - pts[i1]).T)))
    i0, i1 = sorted((i0, i1))
    a = rdp(pts[i0: i1 + 1], eps)
    b = rdp(np.vstack([pts[i1:], pts[: i0 + 1]]), eps)
    return np.vstack([a[:-1], b[:-1]])


def ints(pts):
    out = []
    for x, y in np.asarray(pts):
        p = [int(round(x)), int(round(y))]
        if not out or out[-1] != p:
            out.append(p)
    return out


# ───────────────────────────────────────────────────── tracers ─────────────────────────────────────────────────────


def trace_bone(img, s, h, limits=()):
    """Ribbon tracer: perpendicular profiles along the axis (sides) + a fan at each end (joint surfaces)."""
    a, b = np.array(s["a"], float), np.array(s["b"], float)
    c = (a + b) / 2
    u = (a - b) / np.hypot(*(a - b))  # unit axis, toward distal
    v = np.array([-u[1], u[0]])  # perpendicular
    L = np.hypot(*(a - b)) / 2
    he, hs = s["he"], s["hs"]
    mode = s.get("mode", "steepest")
    side_mode = s.get("sideMode", mode)  # a single bone's sides: the steepest step; a group's sides: the outermost
    cap = min(he, 0.45 * L)  # radius of the end fans
    width = lambda t: hs + (he - hs) * abs(t / L) ** 2.5  # noqa: E731  (narrow shaft, wide ends)

    st = np.linspace(-(L - cap), L - cap, 20)
    sides = {}
    for sign in (1, -1):
        ds = []
        for t in st:
            w = width(t)
            o = c + t * u
            ds.append(edge_on_ray(img, o[0], o[1], sign * v[0], sign * v[1], 0.45 * w, 1.6 * w, side_mode, limits, w, s.get("bright")) or np.nan)
        # a single bone's cortex is smooth: robust polynomial; a superimposed group keeps its shape (median only)
        sides[sign] = median_filter_circular(ds, 2, closed=False)

    def fan(end_sign):
        # rays from a point `cap` inside the end toward a half-ellipse (cap along the axis, he across): covers wide ends too
        o = c + end_sign * (L - cap) * u
        out = []
        angs = np.linspace(80, -80, s.get("rays", 11))  # from the +v side to the −v side at the distal end, the reverse at the proximal end
        for g in angs:
            gr = np.radians(g)
            e = end_sign * (cap * np.cos(gr) * u + he * np.sin(gr) * v)
            rE = np.hypot(*e)
            dvec = e / rE
            r1 = s.get("reach", 1.5) * rE
            r = edge_on_ray(img, o[0], o[1], dvec[0], dvec[1], 0.5 * rE, r1, mode, limits, rE, s.get("bright"))
            out.append((dvec, rE, r, ray_hit(o[0], o[1], dvec[0], dvec[1], limits) < r1 + 6))
        # filter the distance RATIO to the seed (rays differ in expected length); ends set by a joint line are kept as traced
        q = median_filter_circular([np.nan if r is None else r / rE for _, rE, r, _ in out], 1, closed=False)
        return [o + (r if at_joint else qi * rE) * dvec for (dvec, rE, r, at_joint), qi in zip(out, q)
                if not np.isnan(qi) and r is not None]

    # order: +v side proximal→distal, distal fan, −v side distal→proximal, proximal fan  (closed loop)
    pts = []
    for t, d in zip(st, sides[1]):
        if not np.isnan(d):
            pts.append(c + t * u + d * v)
    pts += fan(1)
    for t, d in zip(st[::-1], sides[-1][::-1]):
        if not np.isnan(d):
            pts.append(c + t * u - d * v)
    if s.get("open"):
        # the proximal end is off the image: cut there and return an open outline (−v side … +v side)
        # (the list already runs +v side → distal fan → −v side; extend both ends straight down to the image edge)
        pts = [p for p in pts if p[1] < h - 2]
        pts = [np.array([pts[0][0], h - 1.0])] + pts + [np.array([pts[-1][0], h - 1.0])]
        return ints(rdp(np.array(pts), 2.0)), False
    pts += fan(-1)
    return ints(simplify_closed(np.array(pts), 2.0)), True


def trace_bone_radial(img, s, limits=()):
    """Radial tracer for one bone (used where the ribbon tracer zig-zagged or notched; owner review 2026-10-23): rays from the
    bone centre through points spaced evenly along a prior shape (a rounded box with a narrow shaft and wide ends), the edge
    searched within ±0.6 × the local prior half-width, then the radius ratios smoothed around the whole outline (robust Fourier fit), so the
    sides and the ends join without a step. Ends at a traced joint line stay on that line."""
    a, b = np.array(s["a"], float), np.array(s["b"], float)
    c = (a + b) / 2
    u = (a - b) / np.hypot(*(a - b))
    v = np.array([-u[1], u[0]])
    L = np.hypot(*(a - b)) / 2
    he, hs = s["he"], s["hs"]
    phi = np.linspace(0, 2 * np.pi, 720, endpoint=False)
    p = 4.0
    tt = L * np.sign(np.cos(phi)) * np.abs(np.cos(phi)) ** (2 / p)
    ww = (hs + (he - hs) * np.abs(tt / L) ** 2.5) * np.sign(np.sin(phi)) * np.abs(np.sin(phi)) ** (2 / p)
    prior = c + tt[:, None] * u + ww[:, None] * v
    seg = np.hypot(*np.diff(np.vstack([prior, prior[:1]]), axis=0).T)
    cum = np.concatenate([[0], np.cumsum(seg)])[:-1]
    n = s.get("rays", 72)
    idx = [int(np.searchsorted(cum, k * cum[-1] / n + 0.0)) % len(prior) for k in range(n)]
    q, fixed, dirs = [], [], []
    for k in idx:
        e = prior[k] - c
        rP = np.hypot(*e)
        d = e / rP
        # window ±0.6 × the prior's local half-width (narrow on the shaft, wider at the ends)
        half = 0.6 * max(abs(ww[k]), 0.5 * he)
        r0, r1 = max(0.3 * rP, rP - half), rP + half
        r = edge_on_ray(img, c[0], c[1], d[0], d[1], r0, r1, s.get("mode", "steepest"), limits, rP, s.get("bright"))
        q.append(np.nan if r is None else r / rP)
        fixed.append(r is not None and ray_hit(c[0], c[1], d[0], d[1], limits) < r1 + 6)
        dirs.append((d, rP))
    qs = robust_fourier(q, np.array(fixed), s.get("harmonics", 9))
    pts = [c + qi * rP * d for qi, (d, rP) in zip(qs, dirs)]
    if "openBelowY" in s:
        # a process that grows out of a larger bone: keep only the tip (above the base level), as an open curve
        keep = [p[1] < s["openBelowY"] for p in pts]
        k = keep.index(False)
        loop = pts[k:] + pts[:k]
        kept = [p for p, ok in zip(loop, keep[k:] + keep[:k]) if ok]
        return ints(rdp(np.array(kept), 1.5)), False
    return ints(simplify_closed(np.array(pts), 1.5)), True


def trace_blob(img, s, limits=(), clips=()):
    c = np.array(s["c"], float)
    rr, dirs, ers = [], [], []
    n = 48
    for i in range(n):
        t = 2 * np.pi * i / n
        e = np.array([s["rx"] * np.cos(t), s["ry"] * np.sin(t)])
        rE = np.hypot(*e)
        d = e / rE
        mode = s.get("mode", "steepest")
        lo_deg, hi_deg = s.get("steepSector", (999, 999))
        if lo_deg <= np.degrees(t) <= hi_deg:
            mode = "steepest"  # a sector where the outermost step would be soft tissue: take the bone's own edge
        r = edge_on_ray(img, c[0], c[1], d[0], d[1], 0.55 * rE, 1.35 * rE, mode, limits, None, s.get("bright"), clips)
        rr.append(np.nan if r is None else r / rE)
        dirs.append((d, rE, r, ray_hit(c[0], c[1], d[0], d[1], limits) < 1.35 * rE + 6))
    q = median_filter_circular(rr, 2, closed=True)
    pts = [c + (r if at_joint else qi * rE) * d for qi, (d, rE, r, at_joint) in zip(q, dirs) if not np.isnan(qi) and r is not None]
    return ints(simplify_closed(np.array(pts), 2.0 if s["rx"] < 60 else 3.0))


def axis_of(spec):
    a, b = np.array(spec["a"], float), np.array(spec["b"], float)
    return a, b, (a - b) / np.hypot(*(a - b))


def trace_gap(img, p, q, u, g):
    """Joint space: on stations between p and q, the darkest point of the profile along u (±g px)."""
    p, q = np.array(p, float), np.array(q, float)
    out = []
    for f in np.linspace(0, 1, 7):
        o = p + f * (q - p)
        rs = np.arange(-g, g + 0.5, 1.0)
        prof = sample(img, o[0] + rs * u[0], o[1] + rs * u[1])
        out.append(rs[int(np.argmin(prof))])
    out = median_filter_circular(out, 1, closed=False)
    return ints([p + f * (q - p) + r * u for f, r in zip(np.linspace(0, 1, 7), out)])


def trace_joint(img, distal, proximal, centre=None, half=None):
    a1, b1, u1 = axis_of(distal)
    a2, b2, u2 = axis_of(proximal)
    u = (u1 + u2) / np.hypot(*(u1 + u2))
    v = np.array([-u[1], u[0]])
    m = (b1 + a2) / 2 if centre is None else np.array(centre, float)
    w = 0.8 * min(distal["he"], proximal["he"]) if half is None else half
    return trace_gap(img, m - w * v, m + w * v, -u, 18)


def otsu(vals, lo, hi, bins=128):
    hist, edges = np.histogram(vals, bins=bins, range=(lo, hi))
    tot = hist.sum()
    centres = (edges[:-1] + edges[1:]) / 2
    sw = (hist * centres).sum()
    best, thr, w0, s0, m0 = -1.0, lo, 0.0, 0.0, lo
    for i in range(bins):
        w0 += hist[i]
        s0 += hist[i] * centres[i]
        if w0 == 0 or w0 == tot:
            continue
        a, b = s0 / w0, (sw - s0) / (tot - w0)
        bv = w0 * (tot - w0) * (a - b) ** 2
        if bv > best:
            best, thr, m0 = bv, edges[i + 1], a
    return float(thr), float(m0)


def soft_threshold(img, toward_background):
    small = gauss(img, 3.0)[::2, ::2]
    # Otsu on the darker 75 % of the pixels only (background vs soft tissue; most bone is left out of the split)
    cap = float(np.percentile(small, 75))
    thr, bg = otsu(small[small < cap].ravel(), 0.0, cap)
    # the thin distal soft tissue is fainter than the palm: a curated fraction moves the cut toward the background mean
    return thr - toward_background * (thr - bg)


def bone_guard(shape, outlines, margin):
    """Half-resolution mask of every traced bone outline grown by `margin` px. Where the soft tissue is too faint for the
    threshold (owner review 2026-10-23: the lateral thumb), the soft-tissue region is united with it, so the outline is a
    smooth margin outside the bone edge and never crosses a bone."""
    H, W = (shape[0] + 1) // 2, (shape[1] + 1) // 2
    im = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(im)
    for pts in outlines:
        d.polygon([(x / 2, y / 2) for x, y in pts], fill=255)
    r = int(round(margin / 2))
    im = im.filter(ImageFilter.MaxFilter(2 * r + 1))
    return np.asarray(im) > 0


def soft_tissue(img, thr, guard):
    small = gauss(img, 3.0)[::2, ::2]
    mask = (small > thr) | guard
    # largest 4-connected region (iterative flood fill)
    H, W = mask.shape
    lab = np.zeros(mask.shape, dtype=np.int32)
    sizes = {}
    cur = 0
    for y0 in range(H):
        row = mask[y0]
        for x0 in np.nonzero(row & (lab[y0] == 0))[0]:
            if lab[y0, x0]:
                continue
            cur += 1
            stack = [(y0, x0)]
            lab[y0, x0] = cur
            n = 0
            while stack:
                y, x = stack.pop()
                n += 1
                for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                    if 0 <= yy < H and 0 <= xx < W and mask[yy, xx] and not lab[yy, xx]:
                        lab[yy, xx] = cur
                        stack.append((yy, xx))
            sizes[cur] = n
    big = max(sizes, key=sizes.get)
    m = lab == big
    # fill holes: everything not reachable from the border through background is inside
    bg = np.zeros_like(m)
    stack = [(y, x) for y in (0, H - 1) for x in range(W) if not m[y, x]] + [(y, x) for x in (0, W - 1) for y in range(H) if not m[y, x]]
    for y, x in stack:
        bg[y, x] = True
    while stack:
        y, x = stack.pop()
        for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= yy < H and 0 <= xx < W and not m[yy, xx] and not bg[yy, xx]:
                bg[yy, xx] = True
                stack.append((yy, xx))
    m = ~bg
    # Moore boundary walk from the top-most, left-most pixel (clockwise in image coordinates)
    ys, xs = np.nonzero(m)
    start = (int(ys.min()), int(xs[ys == ys.min()].min()))
    nb = [(-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1), (-1, -1)]
    inside = lambda y, x: 0 <= y < H and 0 <= x < W and m[y, x]  # noqa: E731
    path = [start]
    cur, back = start, 6  # came from the west
    for _ in range(4 * H * W):
        for k in range(8):
            d = (back + 1 + k) % 8
            ny, nx = cur[0] + nb[d][0], cur[1] + nb[d][1]
            if inside(ny, nx):
                back = (d + 4) % 8
                cur = (ny, nx)
                break
        if cur == start:
            break
        path.append(cur)
    pts = np.array([(x * 2 + 0.5, y * 2 + 0.5) for y, x in path], dtype=float)
    hh, ww = img.shape
    on_edge = (pts[:, 0] < 3) | (pts[:, 0] > ww - 4) | (pts[:, 1] < 3) | (pts[:, 1] > hh - 4)
    # rotate so the loop starts on an image-edge run, then keep the longest run that is NOT on the edge (open outline)
    runs, curr = [], []
    for i in range(len(pts)):
        if on_edge[i]:
            if curr:
                runs.append(curr)
            curr = []
        else:
            curr.append(i)
    if curr:
        if runs and not on_edge[0] and runs[0][0] == 0:
            runs[0] = curr + runs[0]
        else:
            runs.append(curr)
    run = max(runs, key=len)
    seg = pts[run]
    return ints(rdp(seg, 5.0))


# ───────────────────────────────────────────────────── assemble ─────────────────────────────────────────────────────


def view(kind, img, bones, blobs, joints, lines):
    h = img.shape[0]
    sm = gauss(img, 2.0)
    gap = gauss(img, 1.2)
    out = []
    thr = soft_threshold(img, SOFT_TOWARD_BG[kind])
    # bone-brightness level for group outlines: Otsu of the smoothed image above the soft-tissue cut
    bone_t, _ = otsu(sm[sm > thr].ravel()[::7], thr, 255.0)
    for item in [*bones, *blobs]:
        if item.get("mode") == "outer" and BRIGHT_FACTOR[kind]:
            item["bright"] = BRIGHT_FACTOR[kind] * bone_t
    spec = {b["id"]: b for b in bones}
    # joint spaces first (they depend on the seeds only); each bone / blob is then bounded by the joint lines it touches
    jl = {}
    jout = []
    for jid, d, p in joints:
        jl[jid] = trace_joint(gap, spec[d], spec[p], JOINT_CENTRE.get((kind, jid)), JOINT_HALF.get((kind, jid)))
        jout.append({"id": jid, "group": "joints", "closed": False, "follows": spec[d]["follows"], "points": jl[jid]})
    for ln in lines:
        u = np.array(ln["dir"], float)
        u /= np.hypot(*u)
        jl[ln["id"]] = trace_gap(gap, ln["p"], ln["q"], u, ln["g"])
        jout.append({"id": ln["id"], "group": "joints", "closed": False, "follows": ln["follows"], "points": jl[ln["id"]]})
    touching = {}
    for jid, d, p in joints:
        touching.setdefault(d, []).append(jid)
        touching.setdefault(p, []).append(jid)
    for item in [*bones, *blobs]:
        for jid in item.get("limits", []):
            touching.setdefault(item["id"], []).append(jid)
    lim = lambda sid: [np.array(jl[j], float) for j in touching.get(sid, [])]  # noqa: E731
    for b in bones:
        pts, closed = trace_bone_radial(sm, b, lim(b["id"])) if b.get("tracer") == "radial" else trace_bone(sm, b, h, lim(b["id"]))
        out.append({"id": b["id"], "group": b["group"], "closed": closed, "follows": b["follows"], "points": pts})
    traced = {o["id"]: o for o in out}
    for b in blobs:
        limits, clips = lim(b["id"]), []
        if b.get("ulnarBound"):
            # PA carpus (owner review 2026-10-23): the carpal bones end above the line from the ulnar end of the radiocarpal
            # joint line to the ulnar styloid tip (continued 80 px ulnarward), so the outline never dips into the space
            # between the ulna and the radius. A drawing bound between two traced landmarks, not a traced joint.
            tip = min(traced["ulnar-styloid-process"]["points"], key=lambda p: p[1])
            rc = jl["radiocarpal"][0]
            clips = [np.array([[tip[0] - 80, tip[1]], tip, rc], float)]
        item = {"id": b["id"], "group": b["group"], "closed": True, "follows": b["follows"]}
        if b.get("drawn") is False:
            # kept as traced, but the scene drawing leaves it out (owner review 2026-10-23)
            item["drawn"] = False
            item["note"] = "kept as traced; not drawn (identity not reviewed)"
        out.append({**item, "points": trace_blob(sm, b, limits, clips)})
    out += jout
    # prominences derived from the traced outlines
    by = {s["id"]: s for s in out}
    if kind == "pa":
        ul = np.array(by["ulnar-styloid-process"]["points"])
        tip = ul[np.argmin(ul[:, 1])]
        out.append({"id": "ulnar-styloid", "group": "prominences", "closed": False, "follows": "ulna", "points": ints([tip])})
        ra = np.array(by["radius"]["points"])
        tip = ra[np.argmin(ra[:, 1] - ra[:, 0])]  # top-right extreme: the radial side is the viewer's right (left hand, PA)
        out.append({"id": "radial-styloid", "group": "prominences", "closed": False, "follows": "radius", "points": ints([tip])})
    # soft tissue last (it is united with the grown bone outlines), stored first
    bones_px = [st["points"] if st["closed"] else st["points"] + [st["points"][0]]
                for st in out if st["group"] not in ("joints",) and len(st["points"]) > 2]
    soft = soft_tissue(img, thr, bone_guard(img.shape, bones_px, SOFT_MARGIN))
    out.insert(0, {"id": "soft-tissue", "group": "soft", "closed": False, "follows": None,
                   "note": f"Otsu threshold {round(float(thr), 1)} of the smoothed image, united with the bone outlines grown by "
                           f"{SOFT_MARGIN} px; open where the forearm leaves the image", "points": soft})
    bad = soft_inside_bone(out)
    if bad:
        sys.exit(f"{kind}: soft-tissue points inside a bone outline: {bad[:5]}")
    return out


def point_in_polygon(x, y, poly):
    inside = False
    for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
        if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1):
            inside = not inside
    return inside


def soft_inside_bone(structures):
    """Automated check (owner review 2026-10-23): no soft-tissue point lies inside any bone outline. Open bone outlines
    (forearm, styloid tip) are closed by the chord between their ends. Returns [(soft point, bone id), …]."""
    soft = next(st for st in structures if st["group"] == "soft")["points"]
    bones = [st for st in structures if st["group"] not in ("soft", "joints") and len(st["points"]) > 2]
    return [(p, b["id"]) for p in soft for b in bones if point_in_polygon(p[0], p[1], b["points"])]


def file_sha256(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def build():
    views = {}
    imgs = {}
    for kind, (bones, blobs, joints, lines) in {"pa": (PA_BONES, PA_BLOBS, PA_JOINTS, PA_LINES),
                                                "lateral": (LAT_BONES, LAT_BLOBS, LAT_JOINTS, LAT_LINES)}.items():
        img = load(ROOT / SOURCES[kind]["file"])
        imgs[kind] = img
        views[kind] = {"widthPx": img.shape[1], "heightPx": img.shape[0], "structures": view(kind, img, bones, blobs, joints, lines)}
    doc = {
        "format": "rad-lab-traced-outlines/1",
        "note": "illustrative, drawing-only; not a measurement",
        "region": "hand",
        "side": "LEFT (both images are a left hand; a right-hand case mirrors the drawing, never the RTL layout)",
        "date": DATE,
        "method": "semi-automatic: curated axis seeds; edges from smoothed intensity profiles (steepest or outermost bright-to-dark step), "
                  "median-filtered and Ramer-Douglas-Peucker simplified; joint spaces = darkest point of axial profiles; soft tissue = Otsu "
                  "threshold boundary. Script: scripts/trace-outlines/trace-hand-outlines.py",
        "coordinates": "image px of the web copy (origin top-left, x right, y down), the space of features/hand-model/hand-model.ts",
        "follows": "hand-model tube id, or tube group (column = one copy per digit, forearm = radius and ulna copies, carpals), whose rotation the drawing follows (drawing link only; the model is unchanged)",
        "drawn": "absent = drawn; false = kept in the data but not drawn",
        "sources": {k: {**v, "sha256": file_sha256(ROOT / v["file"])} for k, v in SOURCES.items()},
        "views": views,
    }
    text = json.dumps(doc, indent=1, ensure_ascii=False)
    # keep each point list on one line (readable diff, small file)
    import re
    text = re.sub(r"\[\n\s+(-?\d+),\n\s+(-?\d+)\n\s+\]", r"[\1, \2]", text)
    text = re.sub(r"\[\n\s+((?:\[-?\d+, -?\d+\],?\n\s+)+)\]", lambda m: "[" + " ".join(m.group(1).split()) + "]", text)
    return text + "\n", doc, imgs


# ───────────────────────────────────────────────────── review overlays ─────────────────────────────────────────────────────

COLOURS = {"soft": (0, 255, 255), "digits": (255, 235, 0), "metacarpals": (255, 140, 0), "thumb": (0, 255, 90),
           "carpus": (255, 60, 255), "forearm": (80, 170, 255), "joints": (255, 40, 40), "prominences": (255, 255, 255)}


def font(size):
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def overlay(img, structures, groups, box, scale, title, path, labels):
    x0, y0, x1, y1 = box
    base = Image.fromarray(img.astype(np.uint8)).crop(box).convert("RGB")
    base = base.resize((int((x1 - x0) * scale), int((y1 - y0) * scale)), Image.Resampling.LANCZOS)
    d = ImageDraw.Draw(base)
    f = font(max(14, int(22 * min(1.0, scale * 1.6))))
    T = lambda p: ((p[0] - x0) * scale, (p[1] - y0) * scale)  # noqa: E731
    lw = 3
    for s in structures:
        if s["group"] not in groups:
            continue
        col = (150, 150, 150) if s.get("drawn") is False else COLOURS[s["group"]]  # grey: kept in the data, not drawn
        pts = [T(p) for p in s["points"]]
        if len(pts) == 1:
            x, y = pts[0]
            d.ellipse([x - 9, y - 9, x + 9, y + 9], outline=col, width=3)
            d.line([x - 14, y, x + 14, y], fill=col, width=2)
            d.line([x, y - 14, x, y + 14], fill=col, width=2)
        else:
            d.line(pts + ([pts[0]] if s["closed"] else []), fill=col, width=lw, joint="curve")
            for x, y in pts:
                d.ellipse([x - 2.5, y - 2.5, x + 2.5, y + 2.5], fill=col)
        if labels:
            px = np.array(pts)
            cx, cy = px[:, 0].mean(), px[:, 1].mean()
            if s["group"] == "joints" or len(pts) == 1:
                cx, cy = px[:, 0].max() + 8, px[:, 1].mean() - 10
            if s.get("drawn") is False:  # short label under the shape, so it never covers a neighbouring label
                d.text((px[:, 0].min(), px[:, 1].max() + 4), "sesamoid (not drawn)", fill=col, font=font(15), stroke_width=3, stroke_fill=(0, 0, 0))
            else:
                d.text((cx, cy), s["id"], fill=col, font=f, stroke_width=3, stroke_fill=(0, 0, 0))
    ft = font(26)
    page = Image.new("RGB", (base.width, base.height + 44), (0, 0, 0))
    page.paste(base, (0, 44))
    ImageDraw.Draw(page).text((8, 8), title, fill=(255, 255, 255), font=ft)
    page.save(path, optimize=True)


REVIEW = [
    # (file, view, groups, box or None, scale, title, labels)
    ("pa-all.png", "pa", list(COLOURS), None, 0.62, "Hand PA (A-015): all traced lines", False),
    ("pa-soft-tissue.png", "pa", ["soft"], None, 0.62, "Hand PA: soft-tissue outline (cyan)", False),
    ("pa-digits-joints.png", "pa", ["digits", "joints", "thumb"], (0, 0, 1466, 1400), 0.7, "Hand PA: phalanges, thumb, MCP/PIP/DIP/IP joint spaces (red)", True),
    ("pa-metacarpals-thumb.png", "pa", ["metacarpals", "thumb", "prominences"], (150, 850, 1466, 1700), 0.75, "Hand PA: metacarpals (orange), thumb (green)", True),
    ("pa-wrist.png", "pa", ["carpus", "forearm", "joints", "prominences"], (200, 1350, 950, 2082), 1.0, "Hand PA: carpus (one outline), radius, ulna, styloids", True),
    ("lateral-all.png", "lateral", list(COLOURS), None, 0.62, "Hand lateral (A-017): all traced lines", False),
    ("lateral-digits-thumb.png", "lateral", ["digits", "metacarpals", "thumb", "joints", "prominences"], (0, 0, 686, 1600), 0.8, "Hand lateral: digit group, metacarpal stack, thumb", True),
    ("lateral-wrist.png", "lateral", ["soft", "carpus", "forearm", "joints", "metacarpals"], (150, 1350, 686, 2123), 1.0, "Hand lateral: carpus, radius+ulna, joint lines", True),
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="fail unless the committed JSON is reproduced byte-identically")
    ap.add_argument("--overlays", action="store_true", help="also write the review PNGs")
    args = ap.parse_args()
    text, doc, imgs = build()
    if args.check:
        same = OUT_JSON.exists() and OUT_JSON.read_text(encoding="utf-8") == text
        print(f"{OUT_JSON.relative_to(ROOT)}: {'byte-identical' if same else 'DIFFERS'}")
        sys.exit(0 if same else 1)
    OUT_JSON.write_text(text, encoding="utf-8")
    print(f"wrote {OUT_JSON.relative_to(ROOT)} ({len(text.encode())} bytes, sha256 {hashlib.sha256(text.encode()).hexdigest()[:16]}…)")
    if args.overlays:
        OUT_REVIEW.mkdir(parents=True, exist_ok=True)
        for name, kind, groups, box, scale, title, labels in REVIEW:
            img = imgs[kind]
            overlay(img, doc["views"][kind]["structures"], groups, box or (0, 0, img.shape[1], img.shape[0]), scale, title, OUT_REVIEW / name, labels)
            print(f"wrote {(OUT_REVIEW / name).relative_to(ROOT)}")


if __name__ == "__main__":
    main()
