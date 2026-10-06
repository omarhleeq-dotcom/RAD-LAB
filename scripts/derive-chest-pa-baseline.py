#!/usr/bin/env python3
"""Derive the RAD-LAB Chest PA educational baseline from the unmodified CC0 master.

Run:  python3 -I scripts/derive-chest-pa-baseline.py   (needs numpy + Pillow)

What it does (and nothing else — see docs/ASSET_PROVENANCE_AND_LICENSES.md):
  1. verifies the master's SHA-1 against the Wikimedia Commons value;
  2. neutralises the two embedded side annotations ("Dx" top-left, "Sin" top-right). Both lie over smooth
     background (air / soft-tissue gradient above the shoulders) — no bone, lung, vessel or other structure is
     under them. Text pixels are replaced by a harmonic (Laplace) interpolation of the surrounding pixels plus
     deterministic grain matched to the neighbouring noise level. Nothing outside the masked boxes is edited;
  3. re-encodes as JPEG (quality 92). The re-encode changes every pixel slightly; the script reports the change.
Deterministic: fixed seed, no timestamps.
"""
import hashlib
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/source/chest-pa/Normal_posteroanterior_(PA)_chest_radiograph_(X-ray).jpg"
DST = ROOT / "public/images/chest-pa/chest-pa-baseline.jpg"
COMMONS_SHA1 = "3124c4cf4c55eb3d2defa9b909f08f94e941ec43"

# Boxes (x0, y0, x1, y1) in master pixels that contain ONLY an annotation on smooth background.
BOXES = {"Dx": (60, 40, 300, 200), "Sin": (1450, 0, 1700, 200)}
TEXT_THRESHOLD = 150  # annotation glyphs are near-white; the surrounding background is < ~110
DILATE = 4  # px, covers anti-aliasing halo


def dilate(mask: np.ndarray, n: int) -> np.ndarray:
    out = mask.copy()
    for _ in range(n):
        p = np.pad(out, 1)
        out = (p[1:-1, 1:-1] | p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
               | p[:-2, :-2] | p[:-2, 2:] | p[2:, :-2] | p[2:, 2:])
    return out


def harmonic_fill(img: np.ndarray, mask: np.ndarray, iters: int = 4000) -> np.ndarray:
    """Fill masked pixels by solving Laplace's equation with the unmasked neighbours as boundary values."""
    out = img.astype(np.float64).copy()
    out[mask] = out[~mask].mean()
    for _ in range(iters):
        p = np.pad(out, 1, mode="edge")
        avg = (p[:-2, 1:-1] + p[2:, 1:-1] + p[1:-1, :-2] + p[1:-1, 2:]) / 4
        out[mask] = avg[mask]
    return out


def main() -> int:
    raw = SRC.read_bytes()
    sha1 = hashlib.sha1(raw).hexdigest()
    if sha1 != COMMONS_SHA1:
        print(f"SHA-1 mismatch: {sha1}", file=sys.stderr)
        return 1
    im = Image.open(SRC).convert("RGB")
    arr = np.array(im)  # the master is greyscale content stored as RGB
    assert np.abs(arr[..., 0].astype(int) - arr[..., 1]).max() <= 3, "unexpected colour content"
    g = arr.astype(np.float64).mean(axis=2)
    rng = np.random.default_rng(20261006)  # fixed seed: deterministic grain
    edited = g.copy()
    report = []
    for name, (x0, y0, x1, y1) in BOXES.items():
        box = g[y0:y1, x0:x1]
        mask = dilate(box > TEXT_THRESHOLD, DILATE)
        # Interpolate on a slightly larger window so the boundary values are real background pixels.
        filled = harmonic_fill(box, mask)
        # Local grain estimate from unmasked pixels' deviation from a 5x5 mean.
        p = np.pad(box, 2, mode="edge")
        local = sum(p[dy:dy + box.shape[0], dx:dx + box.shape[1]] for dy in range(5) for dx in range(5)) / 25
        sigma = float(np.std((box - local)[~dilate(mask, 6)]))
        filled[mask] += rng.normal(0, sigma, size=int(mask.sum()))
        edited[y0:y1, x0:x1] = np.where(mask, np.clip(filled, 0, 255), box)
        report.append((name, int(mask.sum()), round(sigma, 2), float(box[mask].max())))
    # Re-apply the edit to all three channels as an offset so any (tiny) channel differences are preserved.
    delta = (edited - g)[..., None]
    out = np.clip(np.rint(arr + delta), 0, 255).astype(np.uint8)
    DST.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(out).save(DST, "JPEG", quality=92, optimize=True, progressive=False)
    # Report: pixels edited, and mean re-encode change outside the masked boxes.
    back = np.array(Image.open(DST).convert("RGB")).astype(int)
    outside = np.ones(g.shape, bool)
    for (x0, y0, x1, y1) in BOXES.values():
        outside[y0:y1, x0:x1] = False
    print("master sha1 ok:", sha1)
    for r in report:
        print("annotation", r[0], "masked px:", r[1], "grain sigma:", r[2], "max glyph value:", r[3])
    print("mean |abs change| outside boxes after JPEG re-encode:", round(float(np.abs(back - arr.astype(int))[outside].mean()), 3))
    print("output:", DST.relative_to(ROOT), DST.stat().st_size, "bytes", "sha1", hashlib.sha1(DST.read_bytes()).hexdigest())
    return 0


if __name__ == "__main__":
    sys.exit(main())
