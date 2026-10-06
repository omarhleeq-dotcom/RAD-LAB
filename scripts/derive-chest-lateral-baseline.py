#!/usr/bin/env python3
"""Derive the RAD-LAB Chest Lateral educational baseline (web copy) from the owner-supplied master.

Run:  python3 -I scripts/derive-chest-lateral-baseline.py   (needs Pillow)

What it does (and nothing else — see docs/ASSET_PROVENANCE_AND_LICENSES.md, entries A-006 / A-007):
  1. verifies the master's SHA-1 (the owner-supplied file; Commons re-verification pending, see A-006);
  2. checks that the master carries no EXIF / ICC / XMP / comment / DICOM-style metadata (JFIF header only) and
     refuses to run otherwise, so the derived file can never inherit hidden identifiers;
  3. converts to 8-bit greyscale (the content is greyscale), downscales to 1000 px wide (Lanczos) and saves a
     JPEG (quality 88) WITHOUT any metadata (Pillow writes none unless asked).
No annotation is removed or painted over: the master has no burned-in text. Deterministic (no timestamps, no RNG).
"""
import hashlib
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/source/chest-lateral/Normal_lateral_chest_radiograph_(X-ray).jpg"
WEB = ROOT / "public/images/chest-lateral/chest-lateral-baseline-1000.jpg"
WEB_WIDTH = 1000
MASTER_SHA1 = "6a2ac62e9e0965ac0cc21110018ecf3c6fcd1ad5"  # owner-supplied original bytes


def main() -> int:
    raw = SRC.read_bytes()
    sha1 = hashlib.sha1(raw).hexdigest()
    if sha1 != MASTER_SHA1:
        print(f"master SHA-1 mismatch: {sha1}", file=sys.stderr)
        return 1
    im = Image.open(SRC)
    extra = {k for k in im.info if k not in ("jfif", "jfif_version", "dpi", "jfif_unit", "jfif_density")}
    if extra or len(im.getexif()) or im.info.get("icc_profile"):
        print(f"unexpected metadata in master: {sorted(extra)}", file=sys.stderr)
        return 1
    g = im.convert("L")
    h = round(g.height * WEB_WIDTH / g.width)
    out = g.resize((WEB_WIDTH, h), Image.LANCZOS)
    out.save(WEB, "JPEG", quality=88)
    chk = Image.open(WEB)
    assert not chk.getexif() and set(chk.info) <= {"jfif", "jfif_version", "dpi", "jfif_unit", "jfif_density"}
    print(f"wrote {WEB.relative_to(ROOT)}: {chk.size[0]}x{chk.size[1]}, {WEB.stat().st_size} bytes, "
          f"sha1 {hashlib.sha1(WEB.read_bytes()).hexdigest()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
