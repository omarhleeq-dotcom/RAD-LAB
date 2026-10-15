#!/usr/bin/env python3
"""Owner-requested pixel cleanup of the external AP-pelvis marker (review only).

Requires Pillow and numpy. No generative filling, resizing, cropping or anatomy
editing. Input stays immutable; lossless PNG preserves decoded pixels elsewhere.
Run from the repository root; optional --output supports reproducibility checks.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/source/pelvis/pelvis-ap-original.jpg'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, default=ROOT / 'assets/source/pelvis/pelvis-ap-marker-removed.png')
args = parser.parse_args()
assert hashlib.sha1(SOURCE.read_bytes()).hexdigest() == '0f895d77d5aef214ad0caaee13fbf0dafb11b5a0'
original = np.asarray(Image.open(SOURCE).convert('RGB')).copy()
assert original.shape == (2084, 2675, 3)
clean = original.copy()
# Pixel coordinates in the full-size original; this is external dark background.
x0, x1, y0, y1 = 0, 96, 850, 1300
upper = np.median(original[y0 - 12:y0], axis=0)
lower = np.median(original[y1:y1 + 12], axis=0)
t = np.linspace(0, 1, y1 - y0)[:, None, None]
background = (1 - t) * upper[None, x0:x1] + t * lower[None, x0:x1]
alpha = np.ones((y1 - y0, x1 - x0))
alpha[:24] *= np.linspace(0, 1, 24)[:, None]
alpha[-24:] *= np.linspace(1, 0, 24)[:, None]
alpha[:, -20:] *= np.linspace(1, 0, 20)[None, :]
old = original[y0:y1, x0:x1].astype(float)
clean[y0:y1, x0:x1] = np.rint(old * (1 - alpha[:, :, None]) + background * alpha[:, :, None]).astype('uint8')
allowed = np.zeros(original.shape[:2], dtype=bool)
allowed[y0:y1, x0:x1] = True
assert np.array_equal(clean[~allowed], original[~allowed])
args.output.parent.mkdir(parents=True, exist_ok=True)
Image.fromarray(clean).save(args.output, format='PNG')
readback = Image.open(args.output)
assert np.array_equal(np.asarray(readback), clean)
assert not readback.getexif()
print(json.dumps({
    'output_sha256': hashlib.sha256(args.output.read_bytes()).hexdigest(),
    'changed_pixels': int(np.any(original != clean, axis=2).sum()),
    'outside_rectangle_changed_pixels': 0,
    'rectangle_xyxy': [x0, y0, x1, y1],
    'size': [2675, 2084],
}, indent=2))
