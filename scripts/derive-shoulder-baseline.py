#!/usr/bin/env python3
"""Derive the served web copy of the Shoulder Grashey baseline (A-037 -> A-038).

Requires Pillow and numpy. Run from the repository root with `python3 -I scripts/derive-shoulder-baseline.py`.
The master is immutable and checked against the SHA-1 that Wikimedia Commons declares for it. The master has three equal
colour channels and no EXIF, so the web copy is the same decoded pixels as an 8-bit greyscale PNG: no resize, crop, retouch or
contrast change, no metadata. Output is verified by reading it back.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/source/shoulder/shoulder-grashey-original.jpg'
SOURCE_SHA1 = '74f436796ab839c9edd89ebbebfd08598c5e8337'  # declared by the Commons API (imageinfo) on 2026-10-15
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, default=ROOT / 'public/images/shoulder/shoulder-grashey-baseline.png')
args = parser.parse_args()
assert hashlib.sha1(SOURCE.read_bytes()).hexdigest() == SOURCE_SHA1
rgb = np.asarray(Image.open(SOURCE).convert('RGB'))
assert rgb.shape == (1800, 1193, 3)
assert np.array_equal(rgb[..., 0], rgb[..., 1]) and np.array_equal(rgb[..., 1], rgb[..., 2])
grey = rgb[..., 0]
args.output.parent.mkdir(parents=True, exist_ok=True)
Image.fromarray(grey, mode='L').save(args.output, format='PNG', optimize=True)
back = Image.open(args.output)
assert back.mode == 'L' and back.size == (1193, 1800)
assert np.array_equal(np.asarray(back), grey)
assert not back.getexif()
print(json.dumps({
    'output_sha256': hashlib.sha256(args.output.read_bytes()).hexdigest(),
    'output_bytes': args.output.stat().st_size,
    'size': [1193, 1800],
    'pixels_changed_vs_master_decode': 0,
}, indent=2))
