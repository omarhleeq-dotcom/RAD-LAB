#!/usr/bin/env python3
"""Trace drawing outlines of the FOOT from the project's own two baselines (RAD-072 part 2b, foot).

Run (offline, Pillow + NumPy only):
    python3 -I scripts/trace-outlines/trace-foot-outlines.py              # write src/features/positioning/foot-outlines.json
    python3 -I scripts/trace-outlines/trace-foot-outlines.py --check      # regenerate in memory; fail unless byte-identical
    python3 -I scripts/trace-outlines/trace-foot-outlines.py --overlays   # also write the review PNGs in docs/review/rad-072-foot/

Sources (no other image is read): A-027 `public/images/foot/foot-ap-baseline.jpg` (DP/AP, right foot) and A-029
`public/images/foot/foot-oblique-baseline.jpg` (medial oblique, right foot) (CC0, owner-verified; ASSET_PROVENANCE A-026 … A-029).
Coordinates are image px of those web copies (origin top-left, x right, y down): the space of `features/lower-limb-model/lower-limb-model.ts`
(FOOT_MODEL). The output is ILLUSTRATIVE and DRAWING-ONLY, never a measurement. `lower-limb-outlines.json` (shared with the knee) is not touched.

The method lives in `trace_lib.py`. THIS file is the curated part. Phalanges and metatarsals use the radial tracer (axis + half-widths read by eye),
the tarsal bones the snap tracer (a polygon read by eye, moved onto the steepest cortex edge). Where two bones overlap and the image does not
separate them, ONE combined outline is traced and named; nothing is invented. The sesamoids are traced and kept with `drawn: false`.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))  # `python3 -I` does not add the script directory
import trace_lib as T  # noqa: E402

DATE = "2026-10-23"

SOURCES = {
    "ap": {"asset": "A-027", "derivedFrom": "A-026", "file": "public/images/foot/foot-ap-baseline.jpg"},
    "oblique": {"asset": "A-029", "derivedFrom": "A-028", "file": "public/images/foot/foot-oblique-baseline.jpg"},
}


def tube(id_, group, a, b, he, hs, follows, **kw):
    return {"id": id_, "tracer": "axis-snap", "group": group, "a": a, "b": b, "he": he, "hs": hs, "follows": follows, **kw}


def snap(id_, group, poly, follows, search=9, **kw):
    return {"id": id_, "tracer": "snap", "group": group, "poly": poly, "follows": follows, "search": search, **kw}


# follows (drawing link, Phase B): "toes" / "metatarsal" = the model's two band anchor lists (FOOT_MODEL toes / metatarsal; rows by band weight),
# "static" = not displaced by the model (tarsals, hindfoot).
AP_BONES = [
    # hallux (the foot is a RIGHT foot: the hallux is on the viewer's left)
    tube("t1-distal", "phalanges", (268, 105), (238, 284), 84, 62, "toes"),
    tube("t1-proximal", "phalanges", (228, 298), (222, 612), 96, 65, "toes"),
    tube("t2-distal", "phalanges", (477, 112), (466, 215), 47, 36, "toes"),
    tube("t2-middle", "phalanges", (452, 215), (443, 335), 55, 40, "toes"),
    tube("t2-proximal", "phalanges", (445, 340), (436, 578), 62, 36, "toes"),
    tube("t3-distal", "phalanges", (598, 205), (598, 292), 40, 30, "toes"),
    tube("t3-middle", "phalanges", (598, 310), (600, 410), 48, 42, "toes"),
    tube("t3-proximal", "phalanges", (600, 420), (585, 625), 60, 36, "toes"),
    tube("t4-distal", "phalanges", (697, 272), (695, 382), 50, 30, "toes"),
    tube("t4-middle", "phalanges", (710, 388), (715, 490), 58, 50, "toes"),
    tube("t4-proximal", "phalanges", (722, 505), (716, 690), 55, 33, "toes"),
    tube("t5-distal", "phalanges", (842, 462), (878, 548), 34, 26, "toes"),
    tube("t5-middle", "phalanges", (890, 552), (892, 598), 42, 38, "toes"),
    tube("t5-proximal", "phalanges", (895, 615), (880, 820), 52, 34, "toes"),
    tube("mt1", "metatarsals", (228, 618), (335, 1290), 102, 75, "metatarsal", search=6),
    tube("mt2", "metatarsals", (450, 592), (498, 1385), 62, 38, "metatarsal"),
    tube("mt3", "metatarsals", (585, 622), (625, 1410), 56, 37, "metatarsal"),
    tube("mt4", "metatarsals", (725, 690), (715, 1450), 62, 38, "metatarsal"),
    tube("mt5", "metatarsals", (880, 835), (805, 1530), 62, 40, "metatarsal", search=6),
    snap("medial-cuneiform", "tarsals", [(205, 1330), (225, 1305), (300, 1296), (395, 1310), (405, 1380), (398, 1450), (385, 1540), (300, 1553), (230, 1580), (215, 1560), (205, 1480)], "static"),
    snap("intermediate-cuneiform", "tarsals", [(408, 1392), (450, 1398), (500, 1402), (502, 1480), (498, 1560), (488, 1595), (440, 1578), (412, 1550), (406, 1470)], "static"),
    snap("lateral-cuneiform-cuboid", "tarsals", [(505, 1410), (580, 1430), (650, 1462), (705, 1495), (735, 1525), (738, 1600), (736, 1700), (725, 1790), (660, 1812), (580, 1795), (530, 1700), (505, 1560)], "static",
         note="lateral cuneiform and cuboid: the image does not separate them (no visible joint line between them); one combined outline"),
    snap("navicular", "tarsals", [(180, 1650), (205, 1610), (250, 1590), (330, 1585), (400, 1600), (480, 1640), (490, 1700), (450, 1750), (390, 1765), (310, 1755), (240, 1765), (190, 1795), (175, 1730)], "static"),
    snap("talus-calcaneus", "tarsals", [(235, 1900), (215, 1990), (210, 2040), (215, 2100), (222, 2200), (245, 2330), (260, 2404), (600, 2404), (640, 2330), (665, 2230), (690, 2150), (705, 2050), (690, 1950), (670, 1870), (600, 1830), (520, 1800), (450, 1770), (360, 1765), (290, 1790), (245, 1850)], "static",
         note="talus and calcaneus superimposed (hindfoot, partly outside the image): one combined outline, open at the bottom edge"),
]
AP_BLOBS = [
    {"id": "sesamoid-tibial", "group": "sesamoids", "c": (198, 712), "rx": 40, "ry": 52, "mode": "steepest", "drawn": False, "follows": "metatarsal"},
    {"id": "sesamoid-fibular", "group": "sesamoids", "c": (330, 708), "rx": 26, "ry": 44, "mode": "steepest", "drawn": False, "follows": "metatarsal"},
]
AP_JOINTS = [
    ("t1-ip", "t1-distal", "t1-proximal"),
    *[(f"t{n}-dip", f"t{n}-distal", f"t{n}-middle") for n in (2, 3, 4, 5)],
    *[(f"t{n}-pip", f"t{n}-middle", f"t{n}-proximal") for n in (2, 3, 4, 5)],
    ("t1-mtp", "t1-proximal", "mt1"),
    *[(f"t{n}-mtp", f"t{n}-proximal", f"mt{n}") for n in (2, 3, 4, 5)],
]
AP_LINES = [
    {"id": "tmt-1", "pts": [(250, 1318), (320, 1305), (400, 1300)], "g": 8, "follows": "metatarsal"},
    {"id": "tmt-2-5", "pts": [(450, 1375), (520, 1388), (600, 1415), (680, 1448), (735, 1475)], "g": 8, "follows": "metatarsal"},
    {"id": "intercuneiform-1-2", "pts": [(405, 1395), (405, 1470), (402, 1550)], "g": 6, "follows": "static"},
    {"id": "cuneonavicular", "pts": [(225, 1588), (300, 1585), (360, 1590), (410, 1605), (450, 1625)], "g": 8, "follows": "static"},
]

OB_BONES = [
    tube("t1-distal", "phalanges", (345, 115), (318, 300), 78, 56, "toes"),
    tube("t1-proximal", "phalanges", (292, 305), (272, 625), 92, 62, "toes"),
    tube("t2-distal", "phalanges", (573, 185), (538, 258), 48, 38, "toes"),
    tube("t2-middle", "phalanges", (527, 265), (497, 368), 55, 48, "toes"),
    tube("t2-proximal", "phalanges", (495, 378), (485, 625), 62, 38, "toes"),
    tube("t3-distal", "phalanges", (668, 280), (650, 372), 42, 32, "toes"),
    tube("t3-middle", "phalanges", (650, 385), (630, 470), 44, 40, "toes"),
    tube("t3-proximal", "phalanges", (635, 480), (620, 695), 58, 36, "toes"),
    tube("t4-distal", "phalanges", (765, 376), (762, 452), 48, 32, "toes"),
    tube("t4-middle", "phalanges", (766, 458), (760, 540), 54, 46, "toes"),
    tube("t4-proximal", "phalanges", (758, 555), (752, 785), 62, 42, "toes"),
    tube("t5-distal", "phalanges", (862, 598), (905, 665), 36, 28, "toes"),
    tube("t5-middle", "phalanges", (905, 662), (925, 718), 42, 38, "toes"),
    tube("t5-proximal", "phalanges", (912, 728), (912, 955), 56, 34, "toes"),
    tube("mt1", "metatarsals", (250, 632), (282, 1310), 100, 74, "metatarsal", search=6),
    tube("mt2", "metatarsals", (470, 646), (440, 1400), 60, 38, "metatarsal"),
    tube("mt3", "metatarsals", (615, 706), (555, 1390), 54, 36, "metatarsal"),
    tube("mt4", "metatarsals", (755, 782), (670, 1440), 60, 36, "metatarsal"),
    tube("mt5", "metatarsals", (925, 962), (815, 1650), 76, 50, "metatarsal", search=8),
    snap("medial-cuneiform", "tarsals", [(195, 1360), (230, 1350), (300, 1340), (365, 1330), (395, 1380), (385, 1450), (370, 1530), (330, 1580), (250, 1598), (190, 1590), (185, 1500), (190, 1420)], "static"),
    snap("navicular", "tarsals", [(158, 1650), (185, 1612), (240, 1600), (300, 1612), (350, 1650), (390, 1700), (395, 1760), (350, 1800), (290, 1810), (220, 1805), (165, 1790), (150, 1720)], "static"),
    snap("intermediate-lateral-cuneiform", "tarsals", [(402, 1400), (450, 1440), (520, 1470), (598, 1520), (552, 1565), (541, 1606), (543, 1660), (525, 1700), (470, 1740), (440, 1735), (412, 1700), (398, 1660), (402, 1540), (398, 1460)], "static",
         note="intermediate and lateral cuneiforms overlap in this oblique view: one combined outline; the proximal end is approximate"),
    snap("cuboid", "tarsals", [(595, 1525), (640, 1555), (700, 1590), (748, 1625), (758, 1660), (745, 1720), (725, 1790), (700, 1850), (640, 1880), (580, 1870), (548, 1800), (540, 1700), (542, 1640), (540, 1605), (550, 1565), (580, 1535)], "static",
         note="separated from the cuneiforms by the joint space seen at x about 540-583 for y 1520-1605 (intensity profiles, README); its proximal end is not seen separately from the talus and calcaneus"),
    snap("talus-calcaneus", "tarsals", [(150, 1815), (200, 1808), (300, 1815), (380, 1832), (470, 1872), (560, 1872), (620, 1852), (640, 1959), (130, 1959), (120, 1885)], "static",
         note="talus and calcaneus (hindfoot, mostly outside the image): one combined outline, open at the bottom edge"),
]
OB_BLOBS = [
    {"id": "sesamoid-tibial", "group": "sesamoids", "c": (288, 740), "rx": 40, "ry": 48, "mode": "steepest", "drawn": False, "follows": "metatarsal"},
    {"id": "sesamoid-fibular", "group": "sesamoids", "c": (378, 752), "rx": 36, "ry": 62, "mode": "steepest", "drawn": False, "follows": "metatarsal"},
]
OB_JOINTS = [
    ("t1-ip", "t1-distal", "t1-proximal"),
    *[(f"t{n}-dip", f"t{n}-distal", f"t{n}-middle") for n in (2, 3, 4, 5)],
    *[(f"t{n}-pip", f"t{n}-middle", f"t{n}-proximal") for n in (2, 3, 4, 5)],
    ("t1-mtp", "t1-proximal", "mt1"),
    *[(f"t{n}-mtp", f"t{n}-proximal", f"mt{n}") for n in (2, 3, 4, 5)],
]
OB_LINES = [
    {"id": "tmt-1", "pts": [(200, 1352), (260, 1332), (360, 1318)], "g": 8, "follows": "metatarsal"},
    {"id": "cuneonavicular", "pts": [(190, 1595), (250, 1602), (320, 1612)], "g": 8, "follows": "static"},
]

# MTP joint spaces of the DP/AP: the search centre at the joint (the midpoint of the seed ends fell inside the metatarsal head), half-length and a narrow axial search
JOINT_CENTRE = {("ap", "t1-mtp"): (222, 616), ("ap", "t2-mtp"): (440, 584), ("ap", "t3-mtp"): (590, 632), ("ap", "t4-mtp"): (718, 692), ("ap", "t5-mtp"): (885, 826)}
JOINT_HALF = {("ap", "t1-mtp"): 90, ("ap", "t2-mtp"): 55, ("ap", "t3-mtp"): 55, ("ap", "t4-mtp"): 60, ("ap", "t5-mtp"): 50}
JOINT_G = {key: 6 for key in JOINT_CENTRE}
SOFT_TOWARD_BG = {"ap": 0.6, "oblique": 0.85}  # curated: the toes' soft tissue is faint
BRIGHT_FACTOR = {"ap": 0.6, "oblique": 0.6}

SPEC = {
    "out_json": "src/features/positioning/foot-outlines.json",
    "out_review": "docs/review/rad-072-foot",
    "sources": SOURCES,
    "views": {"ap": (AP_BONES, AP_BLOBS, AP_JOINTS, AP_LINES), "oblique": (OB_BONES, OB_BLOBS, OB_JOINTS, OB_LINES)},
    "cfg": {"soft_toward_bg": SOFT_TOWARD_BG, "bright_factor": BRIGHT_FACTOR, "joint_centre": JOINT_CENTRE, "joint_half": JOINT_HALF, "joint_g": JOINT_G, "soft_runs": 3, "soft_open": "the silhouette"},
    "header": {
        "region": "foot",
        "side": "RIGHT (both images are a right foot; a left-foot case mirrors the drawing, never the RTL layout)",
        "date": DATE,
        "method": "semi-automatic: axis seeds (radial tracer) or polygons (snap tracer) read by eye at 1-3x from the same image, moved onto the steepest "
                  "bright-to-dark step, smoothed and Ramer-Douglas-Peucker simplified; joint spaces = darkest point of axial profiles; soft tissue = Otsu "
                  "threshold boundary united with the grown bone outlines. Script: scripts/trace-outlines/trace-foot-outlines.py",
        "coordinates": "image px of the web copy (origin top-left, x right, y down), the space of features/lower-limb-model/lower-limb-model.ts (FOOT_MODEL)",
        "follows": "toes / metatarsal = the model's band anchors of that name, static = not displaced by the model (drawing link only; the model is unchanged)",
        "drawn": "absent = drawn; false = kept in the data but not drawn",
    },
    "colours": {"soft": (0, 255, 255), "phalanges": (255, 235, 0), "metatarsals": (255, 140, 0), "tarsals": (255, 60, 255),
                "sesamoids": (0, 255, 90), "joints": (255, 40, 40), "prominences": (255, 255, 255)},
}
SPEC["review"] = [
    # (file, view, groups, box or None, scale, title, labels)
    ("ap-all.png", "ap", list(SPEC["colours"]), None, 0.5, "Foot DP/AP: all traced lines", False),
    ("ap-toes.png", "ap", ["phalanges", "joints", "sesamoids"], (40, 30, 1020, 820), 1.0, "Foot DP/AP: phalanges and IP/MTP joint spaces", True),
    ("ap-metatarsals.png", "ap", ["metatarsals", "joints", "sesamoids"], (40, 560, 1020, 1560), 0.95, "Foot DP/AP: metatarsals, MTP joints, sesamoids (grey = not drawn)", True),
    ("ap-tarsals.png", "ap", ["tarsals", "metatarsals", "joints"], (60, 1180, 920, 2404), 0.85, "Foot DP/AP: tarsal bones", True),
    ("oblique-all.png", "oblique", list(SPEC["colours"]), None, 0.5, "Foot medial oblique: all traced lines", False),
    ("oblique-toes.png", "oblique", ["phalanges", "joints", "sesamoids"], (130, 60, 1050, 1000), 1.0, "Foot oblique: phalanges and IP/MTP joint spaces", True),
    ("oblique-metatarsals.png", "oblique", ["metatarsals", "joints", "sesamoids"], (100, 600, 1050, 1720), 0.9, "Foot oblique: metatarsals, MTP joints, sesamoids (grey = not drawn)", True),
    ("oblique-tarsals.png", "oblique", ["tarsals", "metatarsals", "joints"], (100, 1250, 960, 1960), 0.95, "Foot oblique: tarsal bones", True),
    ("oblique-soft-tissue.png", "oblique", ["soft"], None, 0.5, "Foot oblique: soft-tissue outline (cyan)", False),
    ("ap-soft-tissue.png", "ap", ["soft"], None, 0.5, "Foot DP/AP: soft-tissue outline (cyan)", False),
]

if __name__ == "__main__":
    T.main(SPEC)
