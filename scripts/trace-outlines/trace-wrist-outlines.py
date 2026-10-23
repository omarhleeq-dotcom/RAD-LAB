#!/usr/bin/env python3
"""Trace drawing outlines of the WRIST from the project's own two baselines (RAD-072 part 2b, wrist).

Run (offline, Pillow + NumPy only):
    python3 -I scripts/trace-outlines/trace-wrist-outlines.py              # write src/features/positioning/wrist-outlines.json
    python3 -I scripts/trace-outlines/trace-wrist-outlines.py --check      # regenerate in memory; fail unless byte-identical
    python3 -I scripts/trace-outlines/trace-wrist-outlines.py --overlays   # also write the review PNGs in docs/review/rad-072-wrist/

Sources (no other image is read): A-011 `public/images/wrist/wrist-pa-baseline.jpg` and A-013 `public/images/wrist/wrist-lateral-baseline.jpg`
(CC0, Commons-API verified; ASSET_PROVENANCE A-010 … A-013). Coordinates are image px of those web copies (origin top-left, x right,
y down): the space of `features/wrist-model/wrist-model.ts`. The output is ILLUSTRATIVE and DRAWING-ONLY, never a measurement.

The method lives in `trace_lib.py`. THIS file is the curated part. Bones here are traced with the SNAP tracer: a polygon read by eye at 3x
from the same image (`poly`) is moved onto the steepest cortex edge within `search` px. Where two bones overlap and the image does not
separate them, ONE combined outline is traced and named (PA: triquetrum + pisiform; lateral: see the notes); nothing is invented.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))  # `python3 -I` does not add the script directory
import trace_lib as T  # noqa: E402

DATE = "2026-10-23"

SOURCES = {
    "pa": {"asset": "A-011", "derivedFrom": "A-010", "file": "public/images/wrist/wrist-pa-baseline.jpg"},
    "lateral": {"asset": "A-013", "derivedFrom": "A-012", "file": "public/images/wrist/wrist-lateral-baseline.jpg"},
}

# follows (drawing link, Phase B): PA "anchors" = the metacarpal-column anchors that warp the whole image; "ulna" / "radius" = the two forearm layers
# of the model; lateral "metacarpals" = the proximal-metacarpal band's two copies, "head" = the ulnar-head / distal-radius band's two copies,
# "static" = not displaced by the wrist model (the carpal bones).
PA_BONES = [
    {"id": "mc5-base", "tracer": "snap", "group": "metacarpals", "follows": "anchors", "search": 12,
     "poly": [(78, 0), (96, 70), (115, 130), (135, 180), (160, 220), (205, 245), (225, 215), (235, 180), (225, 140), (215, 110), (190, 75), (165, 20), (160, 0)]},
    {"id": "mc4-base", "tracer": "snap", "group": "metacarpals", "follows": "anchors", "search": 10,
     "poly": [(232, 0), (238, 70), (228, 108), (230, 150), (245, 185), (300, 195), (335, 170), (338, 115), (318, 60), (300, 0)]},
    {"id": "mc3-base", "tracer": "snap", "group": "metacarpals", "follows": "anchors", "search": 10,
     "poly": [(340, 0), (338, 110), (340, 170), (380, 195), (440, 200), (458, 165), (445, 110), (420, 70), (400, 0)]},
    {"id": "mc2-base", "tracer": "snap", "group": "metacarpals", "follows": "anchors", "search": 10,
     "poly": [(485, 0), (470, 60), (440, 125), (430, 170), (445, 205), (470, 213), (520, 212), (560, 208), (592, 200), (598, 150), (590, 110), (575, 70), (572, 0)]},
    {"id": "mc1-base", "tracer": "snap", "group": "metacarpals", "follows": "anchors", "search": 10,
     "poly": [(689, 60), (640, 115), (600, 150), (575, 190), (580, 205), (620, 235), (660, 265), (689, 272)]},
    {"id": "hamate", "tracer": "snap", "group": "carpals", "follows": "anchors", "search": 10,
     "poly": [(190, 228), (215, 205), (260, 198), (300, 197), (322, 225), (328, 290), (320, 345), (302, 375), (285, 388), (262, 360), (235, 320), (205, 280), (190, 250)]},
    {"id": "capitate", "tracer": "snap", "group": "carpals", "follows": "anchors", "search": 10,
     "poly": [(335, 228), (362, 205), (400, 198), (432, 212), (445, 248), (437, 300), (434, 330), (430, 370), (422, 392), (410, 408), (388, 418), (362, 417), (340, 410), (322, 392), (318, 358), (322, 300), (325, 262)]},
    {"id": "trapezoid", "tracer": "snap", "group": "carpals", "follows": "anchors", "search": 9,
     "poly": [(447, 225), (470, 213), (505, 211), (525, 216), (535, 258), (540, 300), (528, 318), (512, 316), (496, 309), (473, 315), (455, 305), (446, 285), (443, 255)]},
    {"id": "trapezium", "tracer": "snap", "group": "carpals", "follows": "anchors", "search": 9,
     "poly": [(525, 216), (560, 226), (600, 236), (626, 257), (632, 287), (632, 312), (616, 336), (586, 346), (552, 342), (540, 302), (533, 260)]},
    {"id": "scaphoid", "tracer": "snap", "group": "carpals", "follows": "anchors", "search": 5,
     "poly": [(446, 345), (456, 329), (473, 319), (496, 313), (513, 322), (530, 340), (544, 364), (547, 386), (539, 401), (525, 424), (507, 453), (490, 476), (464, 493), (427, 507), (410, 512), (402, 490), (403, 459), (413, 430), (429, 410), (439, 386), (445, 366)]},
    {"id": "lunate", "tracer": "snap", "group": "carpals", "follows": "anchors", "search": 5,
     "poly": [(300, 430), (328, 421), (360, 420), (392, 424), (400, 445), (399, 490), (392, 518), (372, 530), (335, 527), (300, 520), (272, 505), (266, 485), (272, 465), (286, 448)]},
    {"id": "triquetrum-pisiform", "tracer": "snap", "group": "carpals", "follows": "anchors", "search": 9,
     "note": "triquetrum and pisiform superimposed (the pisiform is the denser oval over the ulnar-proximal part); one combined outline",
     "poly": [(158, 352), (170, 327), (196, 318), (226, 326), (255, 352), (280, 385), (300, 402), (298, 426), (270, 456), (242, 480), (212, 478), (182, 456), (162, 420), (156, 383)]},
    {"id": "radius", "tracer": "snap", "group": "forearm", "follows": "radius", "search": 5,
     "poly": [(386, 979), (385, 760), (372, 700), (350, 650), (325, 600), (316, 560), (314, 545), (330, 540), (400, 528), (470, 503), (530, 470), (570, 435), (588, 412), (598, 420), (600, 470), (597, 540), (590, 620), (572, 700), (556, 780), (548, 979)]},
    {"id": "ulna", "tracer": "snap", "group": "forearm", "follows": "ulna", "search": 5,
     "poly": [(140, 979), (138, 860), (130, 760), (121, 680), (118, 600), (122, 550), (138, 515), (152, 498), (172, 502), (178, 528), (190, 545), (230, 538), (262, 537), (290, 545), (305, 570), (300, 620), (288, 680), (268, 750), (255, 860), (252, 979)]},
]
PA_BLOBS = []
PA_JOINTS = []
PA_LINES = [
    {"id": "radiocarpal", "along": {"bone": "radius", "from": (322, 540), "to": (588, 413), "offset": 3}, "follows": "anchors"},
    {"id": "distal-radioulnar", "pts": [(308, 545), (312, 580), (320, 610)], "g": 8, "follows": "anchors"},
    {"id": "midcarpal", "pts": [(265, 365), (300, 392), (322, 404), (360, 417), (395, 418), (418, 402), (430, 375), (432, 335), (437, 305), (470, 296), (500, 306), (528, 332), (548, 350)], "g": 5, "follows": "anchors"},
    {"id": "carpometacarpal", "pts": [(215, 236), (260, 205), (330, 197), (400, 200), (450, 207), (520, 212), (595, 207)], "g": 10, "follows": "anchors"},
    {"id": "carpometacarpal-1", "pts": [(582, 205), (620, 235), (660, 266)], "g": 10, "follows": "anchors"},
]

LAT_BONES = [
    {"id": "mc1-base", "tracer": "snap", "group": "metacarpals", "follows": "metacarpals", "search": 10,
     "poly": [(178, 0), (150, 90), (120, 170), (100, 235), (98, 275), (110, 298), (150, 302), (200, 296), (245, 298), (256, 260), (255, 200), (262, 120), (268, 0)]},
    {"id": "mc2-5-bases", "tracer": "snap", "group": "metacarpals", "follows": "metacarpals", "search": 10,
     "note": "the bases of metacarpals 2-5 superimposed: one combined outline",
     "poly": [(450, 0), (559, 0), (559, 120), (545, 200), (535, 250), (540, 300), (500, 318), (440, 320), (380, 318), (330, 310), (318, 285), (322, 272), (335, 225), (360, 170), (395, 100), (430, 30)]},
    {"id": "scaphoid-trapezium", "tracer": "snap", "group": "carpals", "follows": "static", "search": 9,
     "note": "scaphoid (tubercle) and trapezium superimposed at the volar-distal corner; one combined outline",
     "poly": [(97, 330), (110, 300), (160, 290), (220, 305), (240, 340), (235, 380), (200, 405), (150, 410), (110, 400), (95, 370)]},
    {"id": "pisiform", "tracer": "snap", "group": "carpals", "follows": "static", "search": 8,
     "poly": [(92, 440), (110, 410), (140, 405), (165, 415), (170, 450), (160, 490), (130, 500), (100, 490), (88, 465)]},
    {"id": "capitate", "tracer": "snap", "group": "carpals", "follows": "static", "search": 9,
     "poly": [(272, 440), (300, 410), (345, 400), (375, 430), (380, 480), (372, 520), (350, 543), (320, 548), (290, 535), (272, 510), (268, 470)]},
    {"id": "lunate", "tracer": "snap", "group": "carpals", "follows": "static", "search": 9,
     "poly": [(205, 530), (240, 512), (285, 515), (330, 535), (345, 565), (335, 595), (320, 615), (290, 628), (250, 625), (215, 600), (200, 570)]},
    {"id": "dorsal-carpals", "tracer": "snap", "group": "carpals", "follows": "static", "search": 9,
     "note": "hamate, triquetrum and trapezoid superimposed on the dorsal-distal side; one combined outline (the image does not separate them)",
     "poly": [(385, 335), (430, 350), (448, 395), (435, 440), (400, 480), (380, 495), (380, 450), (385, 400)]},
    {"id": "radius-ulna", "tracer": "snap", "group": "forearm", "follows": "head", "search": 10,
     "note": "distal radius and ulna superimposed: one combined outline (the ulna lies behind the radius)",
     "poly": [(296, 1399), (292, 1250), (288, 1100), (285, 979), (280, 900), (250, 850), (210, 800), (183, 750), (182, 700), (190, 662), (215, 650), (260, 645), (300, 640), (335, 622), (352, 598), (380, 592), (405, 607), (430, 632), (440, 665), (442, 700), (432, 760), (416, 800), (406, 850), (398, 900), (394, 979), (398, 1100), (405, 1250), (412, 1399)]},
]
LAT_BLOBS = []
LAT_JOINTS = []
LAT_LINES = [
    {"id": "radiocarpal", "pts": [(205, 640), (260, 632), (310, 625), (335, 610)], "g": 8, "follows": "static"},
]

SOFT_TOWARD_BG = {"pa": 0.0, "lateral": 0.0}
# curated soft-tissue region (owner review 2026-10-23): the radial border of the wrist / thumb base is a faint mid-grey the threshold misses, so
# the outline ran horizontally across the thumb base to the image edge. Read at 2.3x: the skin edge runs (689, 300) -> (662, 400) -> (660, 480) -> (650, 700) -> (641, 979).
SOFT_HINT = {"pa": [[(689, 285), (640, 280), (636, 322), (600, 352), (590, 380), (606, 414), (612, 484), (598, 632), (570, 804), (566, 979), (641, 979), (650, 700), (656, 580), (660, 480), (663, 400), (672, 340), (689, 300)]]}
BRIGHT_FACTOR = {"pa": 0.6, "lateral": 0.6}


def extras(kind, out):
    """Prominences taken from the traced outlines: the radial and ulnar styloid tips (the extreme points of the distal ends)."""
    by = {s["id"]: s for s in out}
    res = []
    if kind == "pa":
        ul = by["ulna"]["points"]
        res.append({"id": "ulnar-styloid", "group": "prominences", "closed": False, "follows": "ulna", "points": [min(ul, key=lambda p: p[1])]})
        ra = by["radius"]["points"]
        res.append({"id": "radial-styloid", "group": "prominences", "closed": False, "follows": "radius", "points": [min(ra, key=lambda p: p[1] - p[0])]})
    return res


PALETTE = {"hamate": (255, 120, 120), "capitate": (255, 235, 0), "trapezoid": (120, 255, 120), "trapezium": (0, 255, 200),
           "scaphoid": (255, 140, 0), "lunate": (255, 60, 255), "triquetrum-pisiform": (150, 150, 255)}
SPEC = {
    "out_json": "src/features/positioning/wrist-outlines.json",
    "out_review": "docs/review/rad-072-wrist",
    "sources": SOURCES,
    "views": {"pa": (PA_BONES, PA_BLOBS, PA_JOINTS, PA_LINES), "lateral": (LAT_BONES, LAT_BLOBS, LAT_JOINTS, LAT_LINES)},
    "cfg": {"soft_toward_bg": SOFT_TOWARD_BG, "bright_factor": BRIGHT_FACTOR, "extras": extras, "soft_hint": SOFT_HINT, "soft_runs": 2, "soft_smooth": {"pa": 3, "lateral": 12}, "soft_open": "the silhouette"},
    "header": {
        "region": "wrist",
        "side": "LEFT (both images are a left wrist; a right-wrist case mirrors the drawing, never the RTL layout)",
        "date": DATE,
        "method": "semi-automatic: polygons read by eye at 3x from the same image, moved onto the steepest bright-to-dark step along their normals (snap tracer), "
                  "median-filtered and Ramer-Douglas-Peucker simplified; joint lines = darkest point of profiles along the local normal; soft tissue = Otsu "
                  "threshold boundary united with the grown bone outlines. Script: scripts/trace-outlines/trace-wrist-outlines.py",
        "coordinates": "image px of the web copy (origin top-left, x right, y down), the space of features/wrist-model/wrist-model.ts",
        "follows": "PA: anchors = the metacarpal-column anchors that warp the whole image, ulna / radius = the two forearm layers; lateral: metacarpals / head = the two copies of the proximal-metacarpal / ulnar-head bands, static = not displaced by the wrist model (drawing link only; the model is unchanged)",
        "drawn": "absent = drawn; false = kept in the data but not drawn",
    },
    "colours": {"soft": (0, 255, 255), "metacarpals": (255, 140, 0), "carpals": (255, 60, 255), "forearm": (80, 170, 255),
                "joints": (255, 40, 40), "prominences": (255, 255, 255), **PALETTE},
}
SPEC["review"] = [
    # (file, view, groups, box or None, scale, title, labels)
    ("pa-all.png", "pa", list(SPEC["colours"]), None, 1.0, "Wrist PA (A-011): all traced lines", False),
    ("pa-soft-tissue.png", "pa", ["soft"], None, 1.0, "Wrist PA: soft-tissue outline (cyan)", False),
    ("pa-carpals.png", "pa", ["carpals", "joints", "prominences"], (100, 150, 690, 620), 1.6, "Wrist PA: carpal bones (separate colours) and joint lines (red)", True),
    ("pa-forearm-metacarpals.png", "pa", ["forearm", "metacarpals", "joints", "prominences"], (0, 0, 690, 980), 1.0, "Wrist PA: radius, ulna, metacarpal bases, styloids", True),
    ("lateral-all.png", "lateral", list(SPEC["colours"]), None, 0.7, "Wrist lateral: all traced lines", False),
    ("lateral-carpals.png", "lateral", ["carpals", "metacarpals", "joints", "forearm"], (60, 0, 559, 700), 1.5, "Wrist lateral: carpals, metacarpal bases, radius+ulna", True),
    ("lateral-forearm.png", "lateral", ["soft", "forearm", "joints"], (60, 480, 559, 1400), 1.0, "Wrist lateral: radius+ulna (one outline), soft tissue", True),
]

if __name__ == "__main__":
    T.main(SPEC)
