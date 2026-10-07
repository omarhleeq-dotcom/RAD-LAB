#!/usr/bin/env python3
"""Derive the RAD-LAB knee AP / knee lateral / foot AP (DP) / foot oblique educational baselines (web copies) from the four masters.

Run:  python3 -I scripts/derive-knee-foot-baselines.py   (needs Pillow and NumPy)

What it does (and nothing else; docs/ASSET_PROVENANCE_AND_LICENSES.md A-022 … A-029; DECISIONS S14.4-6, S14.4-7):
  1. verifies each master's SHA-1 against the value computed when the owner attached the files (the Commons imageinfo request was HTTP 429
     twice, so the files are OWNER-VERIFIED and the Commons SHA-1 is NOT compared: open item O56);
  2. refuses to run if a master carries ICC / XMP / comment data or an EXIF block other than the GDI+ pixel-density tags the two foot
     files carry (0x0301, 0x0303, 0x5110, 0x5111, 0x5112; no camera, date, GPS or identity field);
  3. removes the BURNED-IN TEXT by the least-invasive modification (S14.2-7 policy): pixels inside the box that differ from the local
     median (31 x 31 px) by more than the threshold (the "Dx" side text with its dark / bright edge halo; the foot oblique's small mark is pure white, so it is masked by an absolute threshold),
     grown by a few px, are replaced by the least-squares PLANE fitted to the clean pixels of the same box plus residuals resampled (fixed
     seed) from those clean pixels (the air background is nearly flat, sigma 1-2 grey levels), so no smooth patch is left. The foot oblique additionally has a slanted bright frame line along the bottom edge (white below it):
     the bottom rows from FOOT_OBLIQUE_BOTTOM down are CROPPED (a straight crop; the line slants from row ~1975 at the left to ~2025 at the right);
  4. 8-bit greyscale, native size otherwise (no resampling), JPEG quality 88, no metadata.
Deterministic (no timestamps; the RNG is seeded).
"""
import hashlib
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
JFIF_ONLY = {"jfif", "jfif_version", "dpi", "jfif_unit", "jfif_density"}
GDI_EXIF_TAGS = {0x0301, 0x0303, 0x5110, 0x5111, 0x5112}

ASSETS = [
    {  # right knee AP: "Dx" in the dark background at the left edge
        "master": ROOT / "assets/source/knee/knee-ap-owner-attached.jpg",
        "sha1": "14c693482a6a103d5e47b6924536da6104be995c",
        "web": ROOT / "public/images/knee/knee-ap-baseline.jpg",
        "fills": [{"box": (45, 855, 112, 937), "thr": 6, "grow": 4}],
        "crop": None,
    },
    {  # right knee lateral: "Dx" in the dark background left of the knee
        "master": ROOT / "assets/source/knee/knee-lateral-owner-attached.jpg",
        "sha1": "9351b3c446919ce164ba85cc32595aa7a43f24a2",
        "web": ROOT / "public/images/knee/knee-lateral-baseline.jpg",
        "fills": [{"box": (145, 1170, 235, 1245), "thr": 6, "grow": 4}],
        "crop": None,
    },
    {  # right foot DP: "Dx" in an angled label card at the top right (the card's own lighter edge is an edge, not text, and is left)
        "master": ROOT / "assets/source/foot/foot-ap-owner-attached.jpg",
        "sha1": "ab0e4059fa4f264461c397cba90f5429b9a90ce5",
        "web": ROOT / "public/images/foot/foot-ap-baseline.jpg",
        "fills": [{"box": (815, 78, 915, 168), "thr": 8, "grow": 4}],
        "crop": None,
    },
    {  # right foot oblique: "Dx" (top right card), a small mark in the forefoot background, a slanted bright frame line along the bottom
        "master": ROOT / "assets/source/foot/foot-oblique-owner-attached.jpg",
        "sha1": "100926d407da2b21953d91a7a4d0e203d825a376",
        "web": ROOT / "public/images/foot/foot-oblique-baseline.jpg",
        "fills": [
            {"box": (802, 60, 902, 152), "thr": 8, "grow": 4},
            {"box": (642, 912, 660, 930), "abs": 120, "grow": 3},
        ],
        "crop": (0, 0, 1077, 1960),  # left, top, right, bottom (exclusive): FOOT_OBLIQUE_BOTTOM = 1960
    },
]


def grow(mask: np.ndarray, n: int) -> np.ndarray:
    out = mask.copy()
    for _ in range(n):
        p = np.pad(out, 1)
        out = p[1:-1, 1:-1] | p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:] | p[:-2, :-2] | p[2:, 2:] | p[:-2, 2:] | p[2:, :-2]
    return out


def plane_fill(g: np.ndarray, box, thr, n: int, seed: int, absolute: bool = False) -> np.ndarray:
    l, t, r, b = box
    sub = g[t:b, l:r].astype(float)
    pad = 20  # median over a window larger than the box margin so a text-free neighbourhood decides
    big = Image.fromarray(g[max(0, t - pad) : b + pad, max(0, l - pad) : r + pad]).filter(ImageFilter.MedianFilter(31))
    big = np.array(big).astype(float)
    med = big[t - max(0, t - pad) : t - max(0, t - pad) + (b - t), l - max(0, l - pad) : l - max(0, l - pad) + (r - l)]
    mask = grow((sub > thr) if absolute else (np.abs(sub - med) > thr), n)
    ys, xs = np.mgrid[0 : b - t, 0 : r - l]
    clean = ~mask
    A = np.stack([np.ones(clean.sum()), xs[clean], ys[clean]], axis=1)
    coef, *_ = np.linalg.lstsq(A, sub[clean], rcond=None)
    plane = coef[0] + coef[1] * xs + coef[2] * ys
    resid = (sub - plane)[clean]
    rng = np.random.default_rng(seed)
    fill = plane + rng.choice(resid, size=mask.shape)
    out = g.copy()
    region = out[t:b, l:r].astype(float)
    region[mask] = fill[mask]
    out[t:b, l:r] = np.clip(np.rint(region), 0, 255).astype(np.uint8)
    return out


def main() -> int:
    for k, a in enumerate(ASSETS):
        raw = a["master"].read_bytes()
        sha1 = hashlib.sha1(raw).hexdigest()
        if sha1 != a["sha1"]:
            print(f"{a['master'].name}: SHA-1 mismatch {sha1}", file=sys.stderr)
            return 1
        im = Image.open(a["master"])
        extra = {key for key in im.info if key not in JFIF_ONLY | {"exif"}}
        bad_exif = set(im.getexif().keys()) - GDI_EXIF_TAGS
        if extra or bad_exif or im.info.get("icc_profile"):
            print(f"{a['master'].name}: unexpected metadata {sorted(extra)} {sorted(bad_exif)}", file=sys.stderr)
            return 1
        g = np.array(im.convert("L"))
        for j, f in enumerate(a["fills"]):
            g = plane_fill(g, f["box"], f.get("abs", f.get("thr")), f["grow"], seed=10 * k + j, absolute="abs" in f)
        if a["crop"]:
            l, t, r, b = a["crop"]
            g = g[t:b, l:r]
        a["web"].parent.mkdir(parents=True, exist_ok=True)
        Image.fromarray(np.ascontiguousarray(g), "L").save(a["web"], "JPEG", quality=88)
        chk = Image.open(a["web"])
        assert not chk.getexif() and set(chk.info) <= JFIF_ONLY
        print(f"wrote {a['web'].relative_to(ROOT)}: {chk.size[0]}x{chk.size[1]}, {a['web'].stat().st_size} bytes, "
              f"sha1 {hashlib.sha1(a['web'].read_bytes()).hexdigest()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
