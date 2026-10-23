"""Shared tracer for the drawing outlines of the limb exams (RAD-072 part 2a hand, part 2b wrist and foot).

Imported by `trace-hand-outlines.py`, `trace-wrist-outlines.py` and `trace-foot-outlines.py` (one per exam family: curated seeds, sources,
output paths). This module holds everything that is region-neutral: image helpers, the ribbon / radial / blob / snap tracers, joint-space
tracing, the soft-tissue outline with its automated "never inside a bone" check, the simplifier, the JSON writer and the review overlays.
See README.md beside this file. Offline; needs only Pillow and NumPy. Deterministic (no randomness, no timestamps).
"""
import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent.parent
SOFT_MARGIN = 10  # px: the soft-tissue outline keeps at least this margin outside every bone outline
GAP_HALF = 4  # px: half a joint-space width, between a traced gap line and the bone surface beside it
OUTER_STRENGTH = 0.3  # curated: a group outline step must be at least this fraction of the strongest step

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


def densify(poly, spacing, closed):
    """Points every ~`spacing` px along a polyline / polygon (the corners are kept)."""
    pts = [np.asarray(q, float) for q in poly]
    n = len(pts) if closed else len(pts) - 1
    out = []
    for i in range(n):
        a, b = pts[i], pts[(i + 1) % len(pts)]
        k = max(1, int(round(np.hypot(*(b - a)) / spacing)))
        out += [a + (b - a) * j / k for j in range(k)]
    if not closed:
        out.append(pts[-1])
    return np.array(out)


def trace_snap(img, s, limits=()):
    """Snap tracer (RAD-072 2b; carpal bones, bone ends cut by the image edge): the CURATED polygon `poly` (read by eye at 3x from the
    same image) is resampled every `spacing` px and every sample moves along its outward normal, within ±`search` px, to the steepest
    bright→dark step (the cortex edge), mildly favouring a step near the seed. Samples with no clear step keep the seed. The shifts are
    median-filtered and smoothed along the outline, then the outline is simplified. A sample on the image border is pinned; an outline
    touching the border becomes an OPEN outline between its two border points (the bone continues beyond the image).
    `pin` = list of seed indices that must not move (a shared edge with a neighbouring structure)."""
    h, w = img.shape
    spacing, R = s.get("spacing", 5), s.get("search", 10)
    poly = np.array(s["poly"], float)
    poly[:, 0] = np.clip(poly[:, 0], 0, w - 1)
    poly[:, 1] = np.clip(poly[:, 1], 0, h - 1)
    pts = densify(poly, spacing, True)
    n = len(pts)
    area = 0.5 * np.sum(pts[:, 0] * np.roll(pts[:, 1], -1) - np.roll(pts[:, 0], -1) * pts[:, 1])
    tang = np.roll(pts, -2, axis=0) - np.roll(pts, 2, axis=0)
    tang /= np.hypot(*tang.T)[:, None] + 1e-9
    nrm = np.stack([tang[:, 1], -tang[:, 0]], axis=1) * (1 if area > 0 else -1)  # outward
    border = (pts[:, 0] <= 1.5) | (pts[:, 0] >= w - 2.5) | (pts[:, 1] <= 1.5) | (pts[:, 1] >= h - 2.5)
    rs = np.arange(-R, R + 0.5, 1.0)
    shift = np.zeros(n)
    got = np.zeros(n, bool)
    for i in range(n):
        if border[i]:
            continue
        prof = sample(img, pts[i, 0] + rs * nrm[i, 0], pts[i, 1] + rs * nrm[i, 1])
        d = np.gradient(prof)
        score = d * (0.55 + 0.45 * np.exp(-((rs / (0.7 * R)) ** 2)))
        j = int(np.argmin(score))
        if d[j] < -s.get("minStep", 0.8):
            shift[i], got[i] = rs[j], True
    # no clear step: interpolate the shift from the neighbours that have one (0 if none)
    if got.any() and not got.all():
        xi = np.arange(n)
        shift = np.interp(xi, np.concatenate([xi[got] - n, xi[got], xi[got] + n]), np.tile(shift[got], 3))
    shift = median_filter_circular(shift, 2, closed=True)
    k = np.ones(5) / 5
    shift = np.convolve(np.concatenate([shift[-2:], shift, shift[:2]]), k, mode="valid")
    shift[border] = 0
    for i in s.get("pin", []):
        shift[int(i)] = 0
    out = pts + shift[:, None] * nrm
    out[:, 0] = np.clip(out[:, 0], 0, w - 1)
    out[:, 1] = np.clip(out[:, 1], 0, h - 1)
    if border.any() and not border.all():
        # open outline: start at the first sample of a border run, drop the border samples, and run both ends onto the border
        i0 = next(i for i in range(n) if border[i] and not border[i - 1])
        order = [(i0 + j) % n for j in range(n)]
        lead = [i for i in order[: next(j for j, i in enumerate(order) if not border[i])]]
        run = [out[i] for i in order if not border[i]]
        return ints(rdp(np.array([out[lead[-1]]] + run + [out[i0]]), 1.5)), False
    return ints(simplify_closed(out, 1.5)), True


def prior_polygon(s, n=40):
    """The radial tracer's prior shape (a rounded box with a narrow shaft and wide ends) from an axis seed, as a polygon of n points."""
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
    idx = [int(np.searchsorted(cum, k * cum[-1] / n)) % len(prior) for k in range(n)]
    return [tuple(prior[i]) for i in idx]


def trace_path_gap(img, pts, g, step=10):
    """Joint line along a curated polyline: on stations every ~`step` px, the darkest point of the profile along the local normal
    (±g px); the median-filtered offsets move the polyline's points. Returns the simplified path."""
    pts = densify(pts, step, False)
    tang = np.gradient(pts, axis=0)
    tang /= np.hypot(*tang.T)[:, None] + 1e-9
    nrm = np.stack([-tang[:, 1], tang[:, 0]], axis=1)
    rs = np.arange(-g, g + 0.5, 1.0)
    off = []
    for p, nv in zip(pts, nrm):
        prof = sample(img, p[0] + rs * nv[0], p[1] + rs * nv[1])
        off.append(rs[int(np.argmin(prof))])
    off = median_filter_circular(off, 1, closed=False)
    return ints(rdp(pts + np.array(off)[:, None] * nrm, 1.5))


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


def soft_tissue(img, thr, guard, max_runs=1):
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
    runs.sort(key=len, reverse=True)
    # the longest run, then (max_runs > 1: a silhouette cut into several open runs by the image edge) every run at least a fifth as long
    keep = [r for r in runs[:max_runs] if r is runs[0] or len(r) >= 0.2 * len(runs[0])]
    return [ints(rdp(pts[r], 5.0)) for r in keep]


# ───────────────────────────────────────────────────── assemble ─────────────────────────────────────────────────────



def view(kind, img, bones, blobs, joints, lines, cfg):
    h = img.shape[0]
    sm = gauss(img, 2.0)
    gap = gauss(img, 1.2)
    out = []
    thr = soft_threshold(img, cfg["soft_toward_bg"][kind])
    # bone-brightness level for group outlines: Otsu of the smoothed image above the soft-tissue cut
    bone_t, _ = otsu(sm[sm > thr].ravel()[::7], thr, 255.0)
    for item in [*bones, *blobs]:
        if item.get("mode") == "outer" and cfg["bright_factor"][kind]:
            item["bright"] = cfg["bright_factor"][kind] * bone_t
    spec = {b["id"]: b for b in bones}
    # joint spaces first (they depend on the seeds only); each bone / blob is then bounded by the joint lines it touches
    jl = {}
    jout = []
    for jid, d, p in joints:
        jl[jid] = trace_joint(gap, spec[d], spec[p], cfg.get("joint_centre", {}).get((kind, jid)), cfg.get("joint_half", {}).get((kind, jid)))
        jout.append({"id": jid, "group": "joints", "closed": False, "follows": spec[d]["follows"], "points": jl[jid]})
    for ln in lines:
        if "pts" in ln:
            jl[ln["id"]] = trace_path_gap(gap, ln["pts"], ln["g"])
            jout.append({"id": ln["id"], "group": "joints", "closed": False, "follows": ln["follows"], "points": jl[ln["id"]]})
            continue
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
        if b.get("tracer") == "snap":
            pts, closed = trace_snap(sm, b, lim(b["id"]))
        elif b.get("tracer") == "axis-snap":
            # axis seed -> prior polygon -> snapped to the cortex edge within `search` px (default a third of the shaft half-width)
            pts, closed = trace_snap(sm, {**b, "poly": prior_polygon(b), "search": b.get("search", max(5, int(0.35 * b["hs"])))}, lim(b["id"]))
        elif b.get("tracer") == "radial":
            pts, closed = trace_bone_radial(sm, b, lim(b["id"]))
        else:
            pts, closed = trace_bone(sm, b, h, lim(b["id"]))
        out.append({"id": b["id"], "group": b["group"], "closed": closed, "follows": b["follows"], **({"note": b["note"]} if "note" in b else {}), "points": pts})
    traced = {o["id"]: o for o in out}
    for b in blobs:
        limits, clips = lim(b["id"]), []
        if cfg.get("clips"):
            clips = cfg["clips"](b, traced, jl)
        item = {"id": b["id"], "group": b["group"], "closed": True, "follows": b["follows"]}
        if b.get("drawn") is False:
            # kept as traced, but the scene drawing leaves it out (owner review 2026-10-23)
            item["drawn"] = False
            item["note"] = "kept as traced; not drawn (identity not reviewed)"
        out.append({**item, "points": trace_blob(sm, b, limits, clips)})
    out += jout
    # prominences derived from the traced outlines
    by = {s["id"]: s for s in out}
    if cfg.get("extras"):
        out += cfg["extras"](kind, out)
    # soft tissue last (it is united with the grown bone outlines), stored first
    bones_px = [st["points"] if st["closed"] else st["points"] + [st["points"][0]]
                for st in out if st["group"] not in ("joints",) and len(st["points"]) > 2]
    softs = soft_tissue(img, thr, bone_guard(img.shape, bones_px, SOFT_MARGIN), cfg.get("soft_runs", 1))
    for i, soft in reversed(list(enumerate(softs))):
        out.insert(0, {"id": "soft-tissue" if i == 0 else f"soft-tissue-{i + 1}", "group": "soft", "closed": False, "follows": None,
                       "note": f"Otsu threshold {round(float(thr), 1)} of the smoothed image, united with the bone outlines grown by "
                               f"{SOFT_MARGIN} px; open where {cfg.get('soft_open', 'the forearm')} leaves the image", "points": soft})
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
    soft = [p for st in structures if st["group"] == "soft" for p in st["points"]]
    bones = [st for st in structures if st["group"] not in ("soft", "joints") and len(st["points"]) > 2]
    return [(p, b["id"]) for p in soft for b in bones if point_in_polygon(p[0], p[1], b["points"])]


def file_sha256(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def build(spec):
    """Trace every view of `spec` (see the exam scripts) and return (json text, doc, images)."""
    views, imgs = {}, {}
    cfg = spec["cfg"]
    for kind, (bones, blobs, joints, lines) in spec["views"].items():
        img = load(ROOT / spec["sources"][kind]["file"])
        imgs[kind] = img
        views[kind] = {"widthPx": img.shape[1], "heightPx": img.shape[0], "structures": view(kind, img, bones, blobs, joints, lines, cfg)}
    doc = {
        "format": "rad-lab-traced-outlines/1",
        "note": "illustrative, drawing-only; not a measurement",
        **spec["header"],
        "sources": {k: {**v, "sha256": file_sha256(ROOT / v["file"])} for k, v in spec["sources"].items()},
        "views": views,
    }
    text = json.dumps(doc, indent=1, ensure_ascii=False)
    # keep each point list on one line (readable diff, small file)
    text = re.sub(r"\[\n\s+(-?\d+),\n\s+(-?\d+)\n\s+\]", r"[\1, \2]", text)
    text = re.sub(r"\[\n\s+((?:\[-?\d+, -?\d+\],?\n\s+)+)\]", lambda m: "[" + " ".join(m.group(1).split()) + "]", text)
    return text + "\n", doc, imgs


# ───────────────────────────────────────────────────── review overlays ─────────────────────────────────────────────────────


def font(size):
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def overlay(img, structures, groups, box, scale, title, path, labels, colours):
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
        col = (150, 150, 150) if s.get("drawn") is False else colours.get(s["id"], colours[s["group"]])  # grey: kept in the data, not drawn
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


def main(spec):
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="fail unless the committed JSON is reproduced byte-identically")
    ap.add_argument("--overlays", action="store_true", help="also write the review PNGs")
    ap.add_argument("--check-overlays", action="store_true", help="fail unless every review PNG is reproduced byte-identically")
    args = ap.parse_args()
    text, doc, imgs = build(spec)
    out_json, out_review = ROOT / spec["out_json"], ROOT / spec["out_review"]
    if args.check or args.check_overlays:
        same = out_json.exists() and out_json.read_text(encoding="utf-8") == text
        print(f"{out_json.relative_to(ROOT)}: {'byte-identical' if same else 'DIFFERS'}")
        if args.check_overlays:
            import io
            for name, kind, groups, box, scale, title, labels in spec["review"]:
                img = imgs[kind]
                buf = io.BytesIO()
                tmp = out_review / ("_check_" + name)
                out_review.mkdir(parents=True, exist_ok=True)
                overlay(img, doc["views"][kind]["structures"], groups, box or (0, 0, img.shape[1], img.shape[0]), scale, title, tmp, labels, spec["colours"])
                ok = (out_review / name).exists() and (out_review / name).read_bytes() == tmp.read_bytes()
                tmp.unlink()
                print(f"{(out_review / name).relative_to(ROOT)}: {'byte-identical' if ok else 'DIFFERS'}")
                same = same and ok
        sys.exit(0 if same else 1)
    out_json.write_text(text, encoding="utf-8")
    print(f"wrote {out_json.relative_to(ROOT)} ({len(text.encode())} bytes, sha256 {hashlib.sha256(text.encode()).hexdigest()[:16]}…)")
    if args.overlays:
        out_review.mkdir(parents=True, exist_ok=True)
        for name, kind, groups, box, scale, title, labels in spec["review"]:
            img = imgs[kind]
            overlay(img, doc["views"][kind]["structures"], groups, box or (0, 0, img.shape[1], img.shape[0]), scale, title, out_review / name, labels, spec["colours"])
            print(f"wrote {(out_review / name).relative_to(ROOT)}")
