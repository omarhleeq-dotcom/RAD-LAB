#!/usr/bin/env python3
"""Trace drawing outlines of the HAND from the project's own two baselines (RAD-072 part 2a).

Run (offline, Pillow + NumPy only):
    python3 -I scripts/trace-outlines/trace-hand-outlines.py              # write src/features/positioning/hand-outlines.json
    python3 -I scripts/trace-outlines/trace-hand-outlines.py --check      # regenerate in memory; fail unless byte-identical
    python3 -I scripts/trace-outlines/trace-hand-outlines.py --overlays   # also write the review PNGs in docs/review/rad-072-hand/

Sources (no other image is read): A-015 `public/images/hand/hand-pa-baseline.jpg` and A-017 `public/images/hand/hand-lateral-baseline.jpg`
(CC0, owner-verified; ASSET_PROVENANCE A-014 … A-017). Coordinates are image px of those web copies (origin top-left, x right,
y down): the same space as `features/hand-model/hand-model.ts`. The output is ILLUSTRATIVE and DRAWING-ONLY, never a measurement.

The method lives in `trace_lib.py` (shared with the wrist and foot scripts; README.md). THIS file is the curated part: the seeds, the
sources and the hand-specific hooks. Structures the two images do not show clearly are simplified, not invented (the carpus is ONE
outline; no individual carpal bones; in the lateral the superimposed digits and metacarpals are one outline each).
"""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))  # `python3 -I` does not add the script directory
import trace_lib as T  # noqa: E402

DATE = "2026-10-23"

SOURCES = {
    "pa": {"asset": "A-015", "derivedFrom": "A-014", "file": "public/images/hand/hand-pa-baseline.jpg"},
    "lateral": {"asset": "A-017", "derivedFrom": "A-016", "file": "public/images/hand/hand-lateral-baseline.jpg"},
}

# ─────────────────────────────── curated seeds (image px, read by eye; search windows only) ───────────────────────────────
# bone: a = distal end centre, b = proximal end centre, he = half-width at the ends, hs = half-width of the shaft.
# mode "steepest" = single bone; "outer" = superimposed group (outermost strong edge). open = proximal end runs off the image.
# tracer "radial" = the smoothed radial tracer (bones the owner's Phase A review asked to re-trace); others use the ribbon tracer.
# follows = the hand-model tube whose rotation the drawing will follow in Phase B (drawing link only; the model is not changed).
PA_BONES = [
    # digit 5 (little finger, viewer's left)
    {"id": "d5-distal", "tracer": "radial", "group": "digits", "a": (104, 402), "b": (134, 548), "he": 36, "hs": 22, "follows": "p5-2"},
    {"id": "d5-middle", "group": "digits", "a": (140, 557), "b": (196, 708), "he": 40, "hs": 27, "follows": "p5-1"},
    {"id": "d5-proximal", "group": "digits", "a": (202, 716), "b": (290, 995), "he": 47, "hs": 30, "follows": "p5-0"},
    {"id": "mc5", "group": "metacarpals", "a": (305, 1008), "b": (382, 1495), "he": 50, "hs": 30, "follows": "m5", "limits": ["cmc"]},
    # digit 4
    {"id": "d4-distal", "tracer": "radial", "group": "digits", "a": (375, 127), "b": (382, 295), "he": 36, "hs": 22, "follows": "p4-2"},
    {"id": "d4-middle", "group": "digits", "a": (395, 306), "b": (416, 545), "he": 46, "hs": 30, "follows": "p4-1"},
    {"id": "d4-proximal", "group": "digits", "a": (422, 556), "b": (450, 935), "he": 56, "hs": 36, "follows": "p4-0"},
    {"id": "mc4", "group": "metacarpals", "a": (458, 950), "b": (455, 1495), "he": 50, "hs": 28, "follows": "m4", "limits": ["cmc"]},
    # digit 3
    {"id": "d3-distal", "tracer": "radial", "group": "digits", "a": (665, 52), "b": (665, 212), "he": 44, "hs": 24, "follows": "p3-2"},
    {"id": "d3-middle", "group": "digits", "a": (655, 223), "b": (650, 470), "he": 56, "hs": 34, "follows": "p3-1"},
    {"id": "d3-proximal", "group": "digits", "a": (650, 485), "b": (635, 888), "he": 66, "hs": 40, "follows": "p3-0"},
    {"id": "mc3", "tracer": "radial", "group": "metacarpals", "a": (625, 905), "b": (560, 1500), "he": 62, "hs": 30, "follows": "m3", "limits": ["cmc"]},
    # digit 2 (index)
    {"id": "d2-distal", "tracer": "radial", "group": "digits", "a": (1005, 198), "b": (995, 345), "he": 44, "hs": 26, "follows": "p2-2"},
    {"id": "d2-middle", "group": "digits", "a": (985, 355), "b": (950, 548), "he": 50, "hs": 32, "follows": "p2-1"},
    {"id": "d2-proximal", "group": "digits", "a": (940, 556), "b": (860, 915), "he": 62, "hs": 38, "follows": "p2-0"},
    {"id": "mc2", "tracer": "radial", "group": "metacarpals", "a": (822, 928), "b": (690, 1505), "he": 60, "hs": 30, "follows": "m2", "limits": ["cmc"]},
    # thumb (viewer's right)
    {"id": "thumb-distal", "tracer": "radial", "harmonics": 6, "group": "thumb", "a": (1400, 926), "b": (1272, 1060), "he": 50, "hs": 34, "follows": "t-dp"},
    # axis and widths from perpendicular profiles (centres (1102, 1289) … (1246, 1100), shaft ≈ 80 px; owner review 2026-10-23)
    {"id": "thumb-proximal", "tracer": "radial", "group": "thumb", "a": (1262, 1080), "b": (1092, 1306), "he": 66, "hs": 40, "follows": "t-pp"},
    # mc1 axis re-read from vertical profiles at x = 850…1000 (owner review 2026-10-23; the first axis ran ≈ 25 px ulnar)
    {"id": "mc1", "tracer": "radial", "group": "thumb", "a": (1108, 1328), "b": (800, 1628), "he": 62, "hs": 47, "follows": "t-mc", "limits": ["cmc1"]},
    # forearm (proximal ends run off the image)
    # ulna: the head; its styloid process is traced as its own small outline (a narrow process beside the head)
    {"id": "ulna", "group": "forearm", "a": (341, 1845), "b": (338, 2082), "he": 76, "hs": 66, "open": True, "follows": "ulna"},
    {"id": "ulnar-styloid-process", "tracer": "radial", "harmonics": 3, "openBelowY": 1842, "group": "prominences", "a": (322, 1793), "b": (323, 1850), "he": 24, "hs": 22, "follows": "ulna"},
    # radius: bounded by the radiocarpal joint line (its distal surface never crosses the joint space)
    {"id": "radius", "group": "forearm", "a": (590, 1812), "b": (585, 2082), "he": 150, "hs": 130, "open": True, "reach": 2.3, "rays": 21, "limits": ["radiocarpal"], "follows": "radius"},
]
PA_BLOBS = [
    # the carpus as ONE simplified outline (individual carpal bones are not separated: they overlap in this projection)
    {"id": "carpus", "group": "carpus", "c": (548, 1655), "rx": 245, "ry": 160, "mode": "outer", "limits": ["cmc", "cmc1", "radiocarpal"], "ulnarBound": True, "steepSector": (100, 175), "follows": "carpals"},
    # rounded density beside the thumb MCP joint (sesamoid appearance; identity not reviewed)
    {"id": "thumb-mcp-sesamoid", "group": "prominences", "c": (1010, 1286), "rx": 22, "ry": 20, "mode": "steepest", "drawn": False, "follows": "t-mc"},
]
# joint-space search centre where the midpoint of the two seed ends misses the gap (read at 3×, owner review 2026-10-23)
JOINT_CENTRE = {("pa", "thumb-mcp"): (1088, 1305)}
# joint-line half-length where the default (0.8 × the narrower end) stops short of a wide base
JOINT_HALF = {("pa", "thumb-mcp"): 64}
# joint spaces: (id, distal bone, proximal bone)
PA_JOINTS = [
    *[(f"d{n}-dip", f"d{n}-distal", f"d{n}-middle") for n in (5, 4, 3, 2)],
    *[(f"d{n}-pip", f"d{n}-middle", f"d{n}-proximal") for n in (5, 4, 3, 2)],
    *[(f"d{n}-mcp", f"d{n}-proximal", f"mc{n}") for n in (5, 4, 3, 2)],
    ("thumb-ip", "thumb-distal", "thumb-proximal"),
    ("thumb-mcp", "thumb-proximal", "mc1"),
]
# joint LINES of the carpus, curated end points + an axial search (the carpus has no single bone pair)
PA_LINES = [
    # carpometacarpal line of digits 2–5: the metacarpal bases overlap the distal carpal row, so this line is APPROXIMATE
    {"id": "cmc", "p": (335, 1472), "q": (725, 1512), "dir": (0, 1), "g": 28, "follows": "carpals"},
    {"id": "radiocarpal", "p": (445, 1842), "q": (708, 1742), "dir": (0, 1), "g": 26, "follows": "radius"},
    # CMC1 re-read at 2× (owner review 2026-10-23): a near-vertical curved gap between the trapezium and the mc1 base
    {"id": "cmc1", "p": (768, 1538), "q": (792, 1648), "dir": (1, -0.22), "g": 20, "follows": "t-mc"},
]

LAT_BONES = [
    # the digits 2–5 are superimposed: ONE outline of the group (tips to the MCP joints); the end half-width covers the spread
    # proximal-phalanx bases (x≈370–545; owner review 2026-10-23: the narrower seed cut one base off at the MCP)
    {"id": "digits-group", "group": "digits", "a": (405, 52), "b": (468, 905), "he": 88, "hs": 62, "mode": "outer", "limits": ["mcp-group"], "follows": "column"},
    # the metacarpals 2–5, superimposed: ONE outline (heads to bases)
    {"id": "metacarpal-stack", "group": "metacarpals", "a": (452, 925), "b": (488, 1560), "he": 100, "hs": 78, "mode": "outer", "limits": ["cmc"], "follows": "column"},
    # thumb, separated (viewer's left)
    # seeds re-read from an intensity profile along the thumb axis (owner review 2026-10-23): bone from y≈688, IP gap at y≈885,
    # MCP gap at y≈1205 (the first seeds put the IP joint ≈ 75 px too high, inside the distal phalanx)
    {"id": "thumb-distal", "tracer": "radial", "group": "thumb", "a": (114, 690), "b": (127, 878), "he": 62, "hs": 44, "follows": "t-dp"},
    {"id": "thumb-proximal", "tracer": "radial", "group": "thumb", "a": (132, 893), "b": (173, 1197), "he": 68, "hs": 42, "follows": "t-pp"},
    {"id": "mc1", "tracer": "radial", "group": "thumb", "a": (188, 1214), "b": (285, 1555), "he": 74, "hs": 46, "follows": "t-mc"},
    # radius and ulna superimposed (one outline), proximal end off the image
    {"id": "radius-ulna", "group": "forearm", "a": (500, 1893), "b": (500, 2123), "he": 118, "hs": 110, "mode": "outer", "open": True, "limits": ["radiocarpal"], "follows": "forearm"},
]
LAT_BLOBS = [
    {"id": "carpus", "group": "carpus", "c": (418, 1720), "rx": 165, "ry": 170, "mode": "outer", "limits": ["cmc", "radiocarpal"], "follows": "carpals"},
    {"id": "thumb-mcp-sesamoid", "group": "prominences", "c": (128, 1228), "rx": 22, "ry": 22, "mode": "steepest", "drawn": False, "follows": "t-mc"},
]
LAT_JOINTS = [
    ("thumb-ip", "thumb-distal", "thumb-proximal"),
    ("thumb-mcp", "thumb-proximal", "mc1"),
]
LAT_LINES = [
    {"id": "mcp-group", "p": (400, 912), "q": (540, 915), "dir": (0, 1), "g": 22, "follows": "column"},
    # carpometacarpal level of the superimposed metacarpal bases: overlapped, APPROXIMATE
    {"id": "cmc", "p": (385, 1578), "q": (585, 1572), "dir": (0, 1), "g": 30, "follows": "carpals"},
    {"id": "radiocarpal", "p": (395, 1888), "q": (600, 1885), "dir": (0, 1), "g": 24, "follows": "radius"},
]

SOFT_TOWARD_BG = {"pa": 0.0, "lateral": 0.5}  # curated: the lateral's finger soft tissue is very faint
BRIGHT_FACTOR = {"pa": 0.6, "lateral": 0.6}  # curated: fraction of the bone-brightness level a group outline must enclose


def clips(b, traced, jl):
    """PA carpus (owner review 2026-10-23): the carpal bones end above the line from the ulnar end of the radiocarpal
    joint line to the ulnar styloid tip (continued 80 px ulnarward), so the outline never dips into the space
    between the ulna and the radius. A drawing bound between two traced landmarks, not a traced joint."""
    if not b.get("ulnarBound"):
        return []
    tip = min(traced["ulnar-styloid-process"]["points"], key=lambda p: p[1])
    rc = jl["radiocarpal"][0]
    return [np.array([[tip[0] - 80, tip[1]], tip, rc], float)]


def extras(kind, out):
    """Prominences derived from the traced outlines."""
    by = {s["id"]: s for s in out}
    res = []
    if kind == "pa":
        ul = np.array(by["ulnar-styloid-process"]["points"])
        tip = ul[np.argmin(ul[:, 1])]
        res.append({"id": "ulnar-styloid", "group": "prominences", "closed": False, "follows": "ulna", "points": T.ints([tip])})
        ra = np.array(by["radius"]["points"])
        tip = ra[np.argmin(ra[:, 1] - ra[:, 0])]  # top-right extreme: the radial side is the viewer's right (left hand, PA)
        res.append({"id": "radial-styloid", "group": "prominences", "closed": False, "follows": "radius", "points": T.ints([tip])})
    return res


SPEC = {
    "out_json": "src/features/positioning/hand-outlines.json",
    "out_review": "docs/review/rad-072-hand",
    "sources": SOURCES,
    "views": {"pa": (PA_BONES, PA_BLOBS, PA_JOINTS, PA_LINES), "lateral": (LAT_BONES, LAT_BLOBS, LAT_JOINTS, LAT_LINES)},
    "cfg": {"soft_toward_bg": SOFT_TOWARD_BG, "bright_factor": BRIGHT_FACTOR, "joint_centre": JOINT_CENTRE, "joint_half": JOINT_HALF,
            "clips": clips, "extras": extras},
    "header": {
        "region": "hand",
        "side": "LEFT (both images are a left hand; a right-hand case mirrors the drawing, never the RTL layout)",
        "date": DATE,
        "method": "semi-automatic: curated axis seeds; edges from smoothed intensity profiles (steepest or outermost bright-to-dark step), "
                  "median-filtered and Ramer-Douglas-Peucker simplified; joint spaces = darkest point of axial profiles; soft tissue = Otsu "
                  "threshold boundary. Script: scripts/trace-outlines/trace-hand-outlines.py",
        "coordinates": "image px of the web copy (origin top-left, x right, y down), the space of features/hand-model/hand-model.ts",
        "follows": "hand-model tube id, or tube group (column = one copy per digit, forearm = radius and ulna copies, carpals), whose rotation the drawing follows (drawing link only; the model is unchanged)",
        "drawn": "absent = drawn; false = kept in the data but not drawn",
    },
    "colours": {"soft": (0, 255, 255), "digits": (255, 235, 0), "metacarpals": (255, 140, 0), "thumb": (0, 255, 90),
                "carpus": (255, 60, 255), "forearm": (80, 170, 255), "joints": (255, 40, 40), "prominences": (255, 255, 255)},
}
SPEC["review"] = [
    ("pa-all.png", "pa", list(SPEC["colours"]), None, 0.62, "Hand PA (A-015): all traced lines", False),
    ("pa-soft-tissue.png", "pa", ["soft"], None, 0.62, "Hand PA: soft-tissue outline (cyan)", False),
    ("pa-digits-joints.png", "pa", ["digits", "joints", "thumb"], (0, 0, 1466, 1400), 0.7, "Hand PA: phalanges, thumb, MCP/PIP/DIP/IP joint spaces (red)", True),
    ("pa-metacarpals-thumb.png", "pa", ["metacarpals", "thumb", "prominences"], (150, 850, 1466, 1700), 0.75, "Hand PA: metacarpals (orange), thumb (green)", True),
    ("pa-wrist.png", "pa", ["carpus", "forearm", "joints", "prominences"], (200, 1350, 950, 2082), 1.0, "Hand PA: carpus (one outline), radius, ulna, styloids", True),
    ("lateral-all.png", "lateral", list(SPEC["colours"]), None, 0.62, "Hand lateral (A-017): all traced lines", False),
    ("lateral-digits-thumb.png", "lateral", ["digits", "metacarpals", "thumb", "joints", "prominences"], (0, 0, 686, 1600), 0.8, "Hand lateral: digit group, metacarpal stack, thumb", True),
    ("lateral-wrist.png", "lateral", ["soft", "carpus", "forearm", "joints", "metacarpals"], (150, 1350, 686, 2123), 1.0, "Hand lateral: carpus, radius+ulna, joint lines", True),
]

if __name__ == "__main__":
    T.main(SPEC)
