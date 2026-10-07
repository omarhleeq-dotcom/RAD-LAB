#!/usr/bin/env python3
"""Derive the RAD-LAB Wrist PA and Wrist Lateral educational baselines (web copies) from the two masters.

Run:  python3 -I scripts/derive-wrist-baselines.py   (needs Pillow)

What it does (and nothing else — docs/ASSET_PROVENANCE_AND_LICENSES.md, entries A-010 … A-013):
  1. verifies each master's SHA-1 against the value Wikimedia Commons reports for the file (checked 2026-10-07 through the
     Commons API, see the register) — the masters are byte-identical to the owner's downloads;
  2. refuses to run if a master carries EXIF / ICC / XMP / comment data (JFIF header only), so a derived file can never
     inherit hidden identifiers;
  3. PA: no crop (the Commons file is already a crop by its author), 8-bit greyscale, native 690 x 980 px, no resampling.
     LATERAL: CROPPED to the box (left 0, top 0, right 559, bottom 1400) to remove the burned-in side text
     ("Sin", bottom right, rows 1411-1492, columns 507-555 of the master), then 8-bit greyscale, native 559 px wide, no resampling;
  4. saves a JPEG (quality 88) WITHOUT any metadata (Pillow writes none unless asked).
Deterministic (no timestamps, no RNG).
"""
import hashlib
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
JFIF_ONLY = {"jfif", "jfif_version", "dpi", "jfif_unit", "jfif_density"}

ASSETS = [
    {
        "master": ROOT / "assets/source/wrist/X-ray_of_normal_wrist_by_dorsoplantar_projection_(crop).jpg",
        "sha1": "d58697fe9e74a208c00d1b92a61ab3d7dd0efd7a",
        "web": ROOT / "public/images/wrist/wrist-pa-baseline.jpg",
        "crop": None,
    },
    {
        "master": ROOT / "assets/source/wrist/X-ray_of_normal_wrist_by_lateral_projection.jpg",
        "sha1": "209c218e704562042150b2b58205564a0c327820",
        "web": ROOT / "public/images/wrist/wrist-lateral-baseline.jpg",
        "crop": (0, 0, 559, 1400),  # removes the burned-in "Sin" (rows 1411-1492)
    },
]


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
        g = im.convert("L")
        if a["crop"]:
            g = g.crop(a["crop"])
        g.save(a["web"], "JPEG", quality=88)
        chk = Image.open(a["web"])
        assert not chk.getexif() and set(chk.info) <= JFIF_ONLY
        print(f"wrote {a['web'].relative_to(ROOT)}: {chk.size[0]}x{chk.size[1]}, {a['web'].stat().st_size} bytes, "
              f"sha1 {hashlib.sha1(a['web'].read_bytes()).hexdigest()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
