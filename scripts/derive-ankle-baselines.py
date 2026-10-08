#!/usr/bin/env python3
"""Derive the RAD-LAB ankle AP / ankle lateral educational baselines (web copies) from the two masters.

Run:  python3 -I scripts/derive-ankle-baselines.py   (needs Pillow and NumPy)

What it does (and nothing else; docs/ASSET_PROVENANCE_AND_LICENSES.md A-030 … A-033; DECISIONS S14.5-3, O79):
  1. verifies each master's SHA-1 against the value computed when the owner attached the files (the Commons API answered HTTP 429 on the request and
     its one retry, so the files are OWNER-VERIFIED and the Commons SHA-1 is NOT compared: open item O75);
  2. refuses to run if a master carries ICC / XMP / comment data or any EXIF block (both masters carry JFIF only);
  3. repairs the EDGE ARTEFACT of the AP master (a bright ringing strip along the left edge: 8 columns, overwritten by the nearest clean column; a bright
     last column at the right edge: overwritten by the column beside it), outside every required region (S14.4-17 precedent). The lateral master shows a
     smooth gradient at its left edge and no step (checked), so it is NOT edited;
  4. 8-bit greyscale, native size (no resampling, no crop), JPEG quality 88, no metadata.
No burned-in text, marker, ruler or device was found on either master (full images reviewed at high contrast), so no fill is made.
Deterministic (no timestamps, no randomness).
"""
import hashlib
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
JFIF_ONLY = {"jfif", "jfif_version", "dpi", "jfif_unit", "jfif_density"}

ASSETS = [
    {  # left ankle (inferred) AP: bright strip at the left edge (8 columns) and a bright last column
        "master": ROOT / "assets/source/ankle/ankle-ap-owner-attached.jpg",
        "sha1": "798b5775be4e6683a82617423f531d94197ce23f",
        "web": ROOT / "public/images/ankle/ankle-ap-baseline.jpg",
        "edge": {"left": 8, "right": 1},
    },
    {  # left ankle (inferred) lateral: unedited apart from the re-encode
        "master": ROOT / "assets/source/ankle/ankle-lateral-owner-attached.jpg",
        "sha1": "566abbd5601cdfd3ba5ce7816b8754a3fc3d268f",
        "web": ROOT / "public/images/ankle/ankle-lateral-baseline.jpg",
        "edge": None,
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
        extra = {key for key in im.info if key not in JFIF_ONLY}
        if extra or im.getexif() or im.info.get("icc_profile"):
            print(f"{a['master'].name}: unexpected metadata {sorted(extra)}", file=sys.stderr)
            return 1
        g = np.array(im.convert("L"))
        e = a["edge"]
        if e:
            if e.get("left"):
                g[:, : e["left"]] = g[:, e["left"] : e["left"] + 1]
            if e.get("right"):
                g[:, -e["right"] :] = g[:, -e["right"] - 1 : -e["right"]]
        a["web"].parent.mkdir(parents=True, exist_ok=True)
        Image.fromarray(np.ascontiguousarray(g), "L").save(a["web"], "JPEG", quality=88)
        chk = Image.open(a["web"])
        assert not chk.getexif() and set(chk.info) <= JFIF_ONLY
        print(f"wrote {a['web'].relative_to(ROOT)}: {chk.size[0]}x{chk.size[1]}, {a['web'].stat().st_size} bytes, "
              f"sha1 {hashlib.sha1(a['web'].read_bytes()).hexdigest()}, sha256 {hashlib.sha256(a['web'].read_bytes()).hexdigest()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
