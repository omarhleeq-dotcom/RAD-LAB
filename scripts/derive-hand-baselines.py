#!/usr/bin/env python3
"""Derive the RAD-LAB Hand PA and Hand Lateral educational baselines (web copies) from the two masters.

Run:  python3 -I scripts/derive-hand-baselines.py   (needs Pillow and NumPy)

What it does (and nothing else — docs/ASSET_PROVENANCE_AND_LICENSES.md, entries A-014 … A-017; DECISIONS S14.2-6 / S14.2b-*):
  1. verifies each master's SHA-1 against the value recorded when the owner attached the files (the Commons API was HTTP 429
     twice, so the files are OWNER-VERIFIED and the Commons SHA-1 is NOT compared: open item O39);
  2. refuses to run if a master carries EXIF / ICC / XMP / comment data (JFIF header only);
  3. removes the BURNED-IN TEXT by the least-invasive modification (no crop would avoid cutting anatomy / fingertips):
       PA      the mirrored "Sin" (top left, in the dark background above the little finger, on a slightly lighter label card):
               pixels brighter than 90 inside the box (left 56, top 70, right 160, bottom 166) are masked, the mask is grown by
               3 px and replaced by the least-squares PLANE fitted to the surrounding ring of non-text pixels (the card is flat grey);
       LATERAL "SIDA" (bottom right, over the soft-tissue edge and the black background; box left 596, top 2072, right 686,
               bottom 2123): pixels brighter than 100 inside the box are masked, grown by 3 px, and replaced by the mean of the 4
               clean rows just above the box, continued straight down the same columns (the soft-tissue edge is near vertical
               there), so no structure from elsewhere is copied;
  4. 8-bit greyscale, native size, no resampling, no crop (PA 1466 x 2082, lateral 686 x 2123), JPEG quality 88, no metadata.
Deterministic (no timestamps, no RNG).
"""
import hashlib
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
JFIF_ONLY = {"jfif", "jfif_version", "dpi", "jfif_unit", "jfif_density"}

ASSETS = [
    {
        "master": ROOT / "assets/source/hand/X-ray_of_normal_hand_by_dorsoplantar_projection.jpg",
        "sha1": "07af22bc384109454889ce1c52415922ddc8c0aa",
        "web": ROOT / "public/images/hand/hand-pa-baseline.jpg",
        "kind": "plane",
        "box": (56, 70, 160, 166),  # left, top, right, bottom
        "thr": 90,
    },
    {
        "master": ROOT / "assets/source/hand/X-ray_of_normal_hand_by_lateral_projection.jpg",
        "sha1": "b1708a29ae292ccff95a123087383af1f6d9a32f",
        "web": ROOT / "public/images/hand/hand-lateral-baseline.jpg",
        "kind": "extend",
        "box": (596, 2072, 686, 2123),
        "thr": 100,
    },
]


def grow(mask: np.ndarray, n: int) -> np.ndarray:
    out = mask.copy()
    for _ in range(n):
        p = np.pad(out, 1)
        out = (p[1:-1, 1:-1] | p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:] | p[:-2, :-2] | p[2:, 2:] | p[:-2, 2:] | p[2:, :-2])
    return out


def fill_plane(g: np.ndarray, box, thr: int) -> np.ndarray:
    l, t, r, b = box
    mask = np.zeros(g.shape, bool)
    mask[t:b, l:r] = g[t:b, l:r] > thr
    mask = grow(mask, 3)
    ring = np.zeros(g.shape, bool)
    ring[t - 14 : b + 14, l - 14 : r + 14] = True
    ring[t - 4 : b + 4, l - 4 : r + 4] = False
    ring &= ~mask
    ys, xs = np.nonzero(ring)
    A = np.stack([xs, ys, np.ones_like(xs)], 1).astype(float)
    coef, *_ = np.linalg.lstsq(A, g[ys, xs].astype(float), rcond=None)
    out = g.copy()
    my, mx = np.nonzero(mask)
    out[my, mx] = np.clip(np.rint(coef[0] * mx + coef[1] * my + coef[2]), 0, 255).astype(np.uint8)
    return out


def fill_extend(g: np.ndarray, box, thr: int) -> np.ndarray:
    l, t, r, b = box
    mask = np.zeros(g.shape, bool)
    mask[t:b, l:r] = g[t:b, l:r] > thr
    mask = grow(mask, 3)
    out = g.copy()
    # the soft-tissue edge is near vertical here: continue the mean of the 4 clean rows above the box straight down
    ref = np.rint(g[t - 4 : t, :].astype(float).mean(axis=0)).astype(np.uint8)
    my, mx = np.nonzero(mask)
    out[my, mx] = ref[mx]
    return out


def main() -> int:
    for a in ASSETS:
        raw = a["master"].read_bytes()
        sha1 = hashlib.sha1(raw).hexdigest()
        if sha1 != a["sha1"]:
            print(f"{a['master'].name}: SHA-1 mismatch {sha1}", file=sys.stderr)
            return 1
        im = Image.open(a["master"])
        extra = {k for k in im.info if k not in JFIF_ONLY}
        if extra or len(im.getexif()) or im.info.get("icc_profile"):
            print(f"{a['master'].name}: unexpected metadata {sorted(extra)}", file=sys.stderr)
            return 1
        g = np.array(im.convert("L"))
        g = fill_plane(g, a["box"], a["thr"]) if a["kind"] == "plane" else fill_extend(g, a["box"], a["thr"])
        Image.fromarray(g, "L").save(a["web"], "JPEG", quality=88)
        chk = Image.open(a["web"])
        assert not chk.getexif() and set(chk.info) <= JFIF_ONLY
        print(f"wrote {a['web'].relative_to(ROOT)}: {chk.size[0]}x{chk.size[1]}, {a['web'].stat().st_size} bytes, "
              f"sha1 {hashlib.sha1(a['web'].read_bytes()).hexdigest()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
