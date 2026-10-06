#!/usr/bin/env python3
"""Derive the RAD-LAB Chest AP educational baseline (web copy) from the NIH ChestX-ray14 master image.

Run:  python3 -I scripts/derive-chest-ap-baseline.py   (needs Pillow)

What it does (and nothing else — see docs/ASSET_PROVENANCE_AND_LICENSES.md, entries A-008 / A-009):
  1. verifies the master's SHA-256 (the bytes fetched through the Hugging Face transport route, see A-008);
  2. re-encodes the 8-bit greyscale pixels as a PNG WITHOUT any ancillary chunk (the master carries one `tIME` chunk).
No pixel is changed (lossless, the script asserts pixel equality), no crop, no resize (1024 x 1024 stays), no tone change,
nothing painted over: the image has no burned-in text, lines or devices (visually checked). Deterministic.
"""
import hashlib
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/source/chest-ap/NIH-ChestXray14_00023616_000.png"
WEB = ROOT / "public/images/chest-ap/chest-ap-baseline-1024.png"
MASTER_SHA256 = "c85b227f5154d8f5248551b8f93e6ee43803652027167c969c6c5f31eea1f3b5"


def main() -> int:
    raw = SRC.read_bytes()
    sha = hashlib.sha256(raw).hexdigest()
    if sha != MASTER_SHA256:
        print(f"master SHA-256 mismatch: {sha}", file=sys.stderr)
        return 1
    im = Image.open(SRC)
    if im.mode != "L" or im.size != (1024, 1024):
        print(f"unexpected master format: {im.mode} {im.size}", file=sys.stderr)
        return 1
    im.load()
    im.save(WEB, "PNG", optimize=True)  # Pillow writes no ancillary chunk unless asked
    chk = Image.open(WEB)
    chk.load()
    assert chk.mode == "L" and chk.size == im.size and chk.tobytes() == im.tobytes(), "pixels changed"
    assert not chk.info, f"metadata present: {chk.info}"
    print(f"wrote {WEB.relative_to(ROOT)}: {chk.size[0]}x{chk.size[1]}, {WEB.stat().st_size} bytes, "
          f"sha256 {hashlib.sha256(WEB.read_bytes()).hexdigest()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
