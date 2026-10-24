#!/usr/bin/env python3
"""Trace drawing outlines of the SHOULDER (Grashey) from the project's own baseline (RAD-072 part 2c, Phase A).

Run (offline, Pillow + NumPy only):
    python3 -I scripts/trace-outlines/trace-shoulder-outlines.py              # write src/features/positioning/shoulder-outlines.json
    python3 -I scripts/trace-outlines/trace-shoulder-outlines.py --check      # regenerate in memory; fail unless byte-identical
    python3 -I scripts/trace-outlines/trace-shoulder-outlines.py --overlays   # also write the review PNGs in docs/review/rad-072-shoulder/

Source (no other image is read): A-038 `public/images/shoulder/shoulder-grashey-baseline.png`, the served lossless copy of A-037 (CC0 1.0, M. Haggstrom;
ASSET_PROVENANCE A-037/A-038). Coordinates are image px of that file (1193 x 1800; origin top-left, x right, y down): the space of
`features/shoulder-model/shoulder-model.ts` and of `data/exams/xray/shoulder-geometry.ts`. The output is ILLUSTRATIVE and DRAWING-ONLY, never a measurement.

What the frame limits: it is a rotated / cropped copy (the right margin is a straight edge about 12 degrees from vertical, outside it the frame is black), it ends
in mid-humerus (the shaft is open at the bottom edge), the medial clavicle, the scapular body and the rest of the thorax are not in it, and parts of the
source look image-processed (a uniform rectangle below the glenoid, a straight-edged wedge at the upper-medial head): those are NOT traced as anatomy.
Bones here are traced with the SNAP tracer (a polygon read by eye at 2-3x, moved onto the steepest bright-to-dark step) and bright / dark ridge lines with the
joint-path tracer. Where structures superimpose and the image does not separate them ONE combined outline is traced and named (`note`); nothing is invented.
Identities are visual readings of one image, not reviewed medically (O91 / O5).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))  # `python3 -I` does not add the script directory
import trace_lib as T  # noqa: E402

DATE = "2026-10-24"

SOURCES = {"grashey": {"asset": "A-038", "derivedFrom": "A-037", "file": "public/images/shoulder/shoulder-grashey-baseline.png"}}

# follows (drawing link, decided in Phase B): every structure carries the position-based closing field of shoulder-model.ts (columns `u`, rows 0.12-0.46 of the
# height); "static" = outside the field's rows / columns in the model, listed for Phase B to confirm.
F = "closure-field"

BONES = [
    # --- humerus: head, neck and shaft are ONE continuous outline (the image shows no edge between them); open at the bottom edge of the frame
    {"id": "humerus-proximal", "tracer": "snap", "group": "humerus", "follows": F, "search": 14, "smoothPasses": 4, "eps": 2.5,
     "note": "humeral head, anatomical neck, greater tuberosity and proximal shaft as ONE outline (no edge separates them in the image); open at the bottom of the frame (mid-humerus)",
     "poly": [(325, 1799), (335, 1700), (345, 1560), (362, 1430), (385, 1300), (396, 1180), (398, 1000), (388, 880), (365, 780), (340, 700), (327, 610),
              (322, 517), (337, 493), (380, 463), (402, 442), (423, 399), (447, 377), (500, 355), (560, 350), (627, 363), (700, 393), (747, 423),
              (787, 463), (811, 530), (818, 597), (812, 645), (803, 690), (770, 704), (722, 722), (690, 752), (656, 802), (636, 852), (624, 905),
              (616, 1000), (606, 1100), (596, 1200), (580, 1300), (566, 1400), (552, 1500), (540, 1600), (530, 1700), (524, 1799)]},
    # --- acromion and distal clavicle
    {"id": "acromion", "tracer": "snap", "group": "scapula", "follows": F, "search": 12,
     "poly": [(445, 270), (450, 247), (480, 222), (530, 195), (590, 160), (660, 128), (740, 103), (810, 90), (870, 92), (905, 112), (912, 160),
              (905, 210), (890, 250), (860, 275), (800, 292), (720, 297), (640, 292), (560, 288), (500, 282)]},
    {"id": "clavicle-distal", "tracer": "snap", "group": "clavicle", "follows": F, "search": 12,
     "note": "the distal clavicle as far as the frame shows it; open at the right edge of the frame",
     "poly": [(925, 165), (990, 165), (1100, 175), (1192, 185), (1192, 430), (1100, 395), (1010, 360), (960, 320), (935, 260), (925, 210)]},
    # --- coracoid (ring-shaped density above the glenoid, with the line running medially from it)
    {"id": "coracoid", "tracer": "snap", "group": "scapula", "follows": F, "search": 8,
     "note": "the ring-shaped density above the glenoid and the line running medially from its lower margin, read visually as the coracoid process; identity not reviewed",
     "poly": [(775, 365), (790, 335), (830, 312), (870, 318), (895, 345), (900, 385), (950, 405), (1005, 408), (1000, 425), (940, 432), (878, 448), (845, 440), (815, 410)]},
    # --- glenoid face and the scapular neck: superimposed in this frame, one band
    {"id": "glenoid-neck", "tracer": "snap", "group": "scapula", "follows": F, "search": 8,
     "note": "glenoid face and scapular neck seen on edge as ONE bright band (they cannot be separated in this frame); the band ends at the uniform rectangle (not anatomy)",
     "poly": [(803, 362), (820, 412), (836, 452), (848, 500), (852, 560), (861, 620), (864, 690), (884, 690), (885, 620), (878, 560), (872, 500),
              (866, 452), (850, 405), (826, 360), (812, 345)]},
]
BLOBS = []
JOINTS = []
LINES = [
    # glenohumeral joint space: the dark crescent between the medial arc of the head and the glenoid band
    {"id": "glenohumeral-joint-space", "pts": [(783, 470), (803, 530), (812, 600), (810, 660), (803, 695)], "g": 14, "smooth": 2, "follows": F},
    # AC joint: the dark gap between the acromion and the distal clavicle
    {"id": "ac-joint", "pts": [(918, 125), (926, 170), (924, 220), (910, 262)], "g": 12, "smooth": 1, "follows": F},
    # the faint bright line between the greater tuberosity and the humeral head (the physeal scar): ridge, not a gap
    {"id": "greater-tuberosity-line", "bright": True, "pts": [(425, 405), (470, 450), (495, 500), (498, 560), (497, 620), (500, 690)], "g": 10, "smooth": 2, "follows": F},
    # the visible scapular border: two bright ridge lines running down-laterally on the medial side of the frame
    {"id": "scapular-border-inner", "bright": True, "pts": [(1085, 450), (1065, 530), (1030, 680), (1000, 800), (955, 920), (925, 1020), (900, 1140), (880, 1250), (850, 1380)], "g": 10, "smooth": 6, "follows": F},
    {"id": "scapular-border-outer", "bright": True, "pts": [(1130, 520), (1120, 560), (1085, 710), (1050, 830), (1010, 950), (970, 1080), (930, 1180)], "g": 10, "smooth": 6, "follows": F},
]

# curated soft-tissue region: the black wedge right of the frame's straight margin is NOT a body boundary; uniting it with the soft tissue (it reaches the image
# border) leaves the soft-tissue outline open there. The margin points were measured on the image (first column from the right brighter than the black).
SOFT_HINT = {"grashey": [[(1195, 440), (1184, 500), (1161, 600), (1138, 700), (1115, 800), (1092, 900), (1069, 1000), (1046, 1100), (1022, 1200), (999, 1300),
                          (976, 1400), (953, 1500), (930, 1600), (907, 1700), (884, 1800), (1195, 1800)]]}


def extras(kind, out):
    """The articular arc of the humeral head, taken from the traced humerus outline (the part of its contour above the neck between the tuberosity notch and
    the medial neck); an open line, so the drawing can stroke the head."""
    by = {s["id"]: s for s in out}
    pts = by["humerus-proximal"]["points"]
    arc = [p for p in pts if p[0] >= 415 and p[1] <= 705 and not (p[0] <= 440 and p[1] > 410)]
    return [{"id": "humeral-head-arc", "group": "humerus", "closed": False, "follows": F, "note": "the articular margin of the head from the tuberosity notch to the medial neck, taken from the humerus outline", "points": arc}]


SPEC = {
    "out_json": "src/features/positioning/shoulder-outlines.json",
    "out_review": "docs/review/rad-072-shoulder",
    "sources": SOURCES,
    "views": {"grashey": (BONES, BLOBS, JOINTS, LINES)},
    "cfg": {"soft_toward_bg": {"grashey": 0.6}, "bright_factor": {"grashey": 0.6}, "extras": extras, "soft_hint": SOFT_HINT, "soft_runs": 2, "soft_smooth": {"grashey": 6},
            "soft_open": "the silhouette (frame edge)"},
    "header": {
        "region": "shoulder",
        "side": "RIGHT (the image is a right shoulder, Grashey / AP glenoid, rotated and cropped; a left case mirrors the drawing, never the RTL layout)",
        "date": DATE,
        "method": "semi-automatic: polygons read by eye at 2-3x from the same image, moved onto the steepest bright-to-dark step along their normals (snap tracer), "
                  "median-filtered and Ramer-Douglas-Peucker simplified; ridge / gap lines = brightest / darkest point of profiles along the local normal; soft tissue = Otsu "
                  "threshold boundary united with the grown bone outlines and the frame-margin wedge. Script: scripts/trace-outlines/trace-shoulder-outlines.py",
        "coordinates": "image px of the web copy A-038 (origin top-left, x right, y down), the space of features/shoulder-model/shoulder-model.ts",
        "follows": "closure-field = the position-based closing field of shoulder-model.ts; the per-structure choice (moving or static) is made in Phase B (drawing link only; the model is unchanged)",
        "drawn": "absent = drawn; false = kept in the data but not drawn",
    },
    "colours": {"soft": (0, 255, 255), "humerus": (255, 140, 0), "scapula": (255, 60, 255), "clavicle": (80, 170, 255), "joints": (255, 40, 40),
                "humerus-proximal": (255, 140, 0), "humeral-head-arc": (255, 235, 0), "acromion": (255, 60, 255), "coracoid": (120, 255, 120),
                "glenoid-neck": (0, 255, 200), "clavicle-distal": (80, 170, 255)},
}
SPEC["review"] = [
    # (file, view, groups, box or None, scale, title, labels)
    ("all.png", "grashey", list(SPEC["colours"]), None, 0.7, "Shoulder Grashey (A-038): all traced lines", False),
    ("soft-tissue.png", "grashey", ["soft"], None, 0.7, "Shoulder: soft-tissue outline (cyan; open where the frame edge cuts it)", False),
    ("humerus.png", "grashey", ["humerus", "joints"], (250, 300, 1000, 1000), 1.2, "Shoulder: humerus (head, neck, shaft), head arc, tuberosity line, joint space", True),
    ("scapula-acromion-clavicle.png", "grashey", ["scapula", "clavicle", "joints", "humerus"], (400, 40, 1193, 760), 1.4, "Shoulder: acromion, clavicle, coracoid, glenoid band, AC joint", True),
    ("scapular-border.png", "grashey", ["joints", "scapula"], (700, 380, 1193, 1500), 1.0, "Shoulder: visible scapular border lines (medial side of the frame)", True),
]
if __name__ == "__main__":
    T.main(SPEC)
