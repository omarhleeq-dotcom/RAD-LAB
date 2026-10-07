#!/usr/bin/env python3
"""Derive the RAD-LAB Elbow AP and Elbow Lateral educational baselines (web copies) from the two masters.

Run:  python3 -I scripts/derive-elbow-baselines.py   (needs Pillow and NumPy)

What it does (and nothing else — docs/ASSET_PROVENANCE_AND_LICENSES.md, entries A-018 … A-021; DECISIONS S14.3-5…):
  1. verifies each master's SHA-1 against the value recorded when the owner attached the files (the Commons API was HTTP 429 twice, so
     the files are OWNER-VERIFIED and the Commons SHA-1 is NOT compared: open item O47);
  2. refuses to run if a master carries EXIF / ICC / XMP / comment data (JFIF header only);
  3. removes the BURNED-IN TEXT of the AP by the least-invasive modification (S14.2-7 policy):
       AP  "F" (bottom centre, over the forearm shaft, rows >= 1105): CROP of the lowest 38 rows (rows >= 1100), which carry only the
           forearm shaft (no joint anatomy): a fill over bone texture would leave a visible patch. The crop also removes the 3 top rows
           (a 1-px frame line of the screenshot: row 0 coloured, row 1 bright), which are not anatomy.
       AP  mirrored "Sin" (mid-right, in the dark background beside the forearm): pixels brighter than 40 inside the box (left 685,
           top 965, right 775, bottom 1032), grown by 9 px (the letters carry a blurred halo), replaced, row by row, by the straight line
           between the mean of the 3 clean pixels on each side of the masked run, then smoothed vertically (13 rows) inside the mask (the background is near-black and flat apart from the soft-tissue edge at the left);
       LATERAL no text found (verified on a contrast-stretched view): unchanged apart from the re-encode.
  4. 8-bit greyscale, native size otherwise (no resampling), JPEG quality 88, no metadata.
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
        "master": ROOT / "assets/source/elbow/elbow-ap-extended-owner-attached.jpg",
        "sha1": "2d2a1e9d6e051df58f9b05d1dca717f2b71867cf",
        "web": ROOT / "public/images/elbow/elbow-ap-baseline.jpg",
        "crop": (0, 3, 849, 1100),  # left, top, right, bottom (exclusive)
        "plane": {"box": (685, 965, 775, 1032), "thr": 40, "grow": 9},
    },
    {
        "master": ROOT / "assets/source/elbow/elbow-lateral-flexed-owner-attached.jpg",
        "sha1": "0beb1fc74b207e8617d52b906087e921567f9da1",
        "web": ROOT / "public/images/elbow/elbow-lateral-baseline.jpg",
        "crop": None,
        "plane": None,
    },
]


def grow(mask: np.ndarray, n: int) -> np.ndarray:
    out = mask.copy()
    for _ in range(n):
        p = np.pad(out, 1)
        out = (p[1:-1, 1:-1] | p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:] | p[:-2, :-2] | p[2:, 2:] | p[:-2, 2:] | p[2:, :-2])
    return out


def fill_rows(g: np.ndarray, box, thr: int, n: int) -> np.ndarray:
    """Replace each masked run of a row by the straight line between the mean of the 3 clean pixels on each side of the run."""
    l, t, r, b = box
    mask = np.zeros(g.shape, bool)
    mask[t:b, l:r] = g[t:b, l:r] > thr
    mask = grow(mask, n)
    out = g.copy()
    for y in range(g.shape[0]):
        xs = np.nonzero(mask[y])[0]
        if xs.size == 0:
            continue
        runs = np.split(xs, np.nonzero(np.diff(xs) > 1)[0] + 1)
        for run in runs:
            x0, x1 = run[0], run[-1]
            left = g[y, max(0, x0 - 3) : x0].astype(float).mean()
            right = g[y, x1 + 1 : x1 + 4].astype(float).mean()
            t_ = (np.arange(x0, x1 + 1) - (x0 - 1)) / (x1 - x0 + 2)
            out[y, x0 : x1 + 1] = np.clip(np.rint(left + t_ * (right - left)), 0, 255).astype(np.uint8)
    # smooth the filled pixels vertically (mean of 13 rows) so the row-wise lines leave no horizontal banding
    f = out.astype(float)
    sm = f.copy()
    for y in range(g.shape[0]):
        lo, hi = max(0, y - 6), min(g.shape[0], y + 7)
        sm[y] = f[lo:hi].mean(axis=0)
    out[mask] = np.clip(np.rint(sm[mask]), 0, 255).astype(np.uint8)
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
        if a["plane"]:
            g = fill_rows(g, a["plane"]["box"], a["plane"]["thr"], a["plane"]["grow"])  # in master coordinates, before the crop
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
