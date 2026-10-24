// Hand-built and project-geometry graphics of the exam library (RAD-069 B2b). Roles: "fill" (soft silhouette, no stroke),
// "bone" (closed outline), "line" (open stroke). Everything lives in the 240 x 168 viewBox; nothing is mirrored for RTL.
// Knee, ankle, elbow and pelvis reuse the project's own model geometry. The chest projections, upper/lower limb, head and spine
// keep the geometry of the earlier hand-drawn ExamGraphic (LEGACY, converted to absolute paths, decorative extras dropped):
// the Phase A review judged those shapes better than the first redraws; the head was reverted to it in Phase B3 by owner decision.
// The body region and the spine are new.

const LEGACY = {
  "chest-pa": [
    ["line", "M116 36Q92 46 74 31Q59 53 76 60L108 69M124 36Q148 46 166 31Q181 53 164 60L132 69"],
    ["line", "M116 51Q92 61 74 46Q59 68 76 75L108 84M124 51Q148 61 166 46Q181 68 164 75L132 84"],
    ["line", "M116 66Q92 76 74 61Q59 83 76 90L108 99M124 66Q148 76 166 61Q181 83 164 90L132 99"],
    ["line", "M116 81Q92 91 74 76Q59 98 76 105L108 114M124 81Q148 91 166 76Q181 98 164 105L132 114"],
    ["line", "M116 96Q92 106 74 91Q59 113 76 120L108 129M124 96Q148 106 166 91Q181 113 164 120L132 129"],
    ["line", "M116 111Q92 121 74 106Q59 128 76 135L108 144M124 111Q148 121 166 106Q181 128 164 135L132 144"],
    ["line", "M116 22L116 140M124 22L124 140"],
    ["fill", "M86 38L69 49L76 92L99 67M154 38L171 49L164 92L141 67"],
    ["line", "M86 38L69 49L76 92L99 67M154 38L171 49L164 92L141 67"],
    ["line", "M114 32L126 32"],
    ["line", "M114 46L126 46"],
    ["line", "M114 60L126 60"],
    ["line", "M114 74L126 74"],
    ["line", "M114 88L126 88"],
    ["line", "M114 102L126 102"],
    ["line", "M114 116L126 116"],
  ],
  "chest-ap": [
    ["line", "M116 36Q92 46 74 31Q59 53 76 60L108 69M124 36Q148 46 166 31Q181 53 164 60L132 69"],
    ["line", "M116 51Q92 61 74 46Q59 68 76 75L108 84M124 51Q148 61 166 46Q181 68 164 75L132 84"],
    ["line", "M116 66Q92 76 74 61Q59 83 76 90L108 99M124 66Q148 76 166 61Q181 83 164 90L132 99"],
    ["line", "M116 81Q92 91 74 76Q59 98 76 105L108 114M124 81Q148 91 166 76Q181 98 164 105L132 114"],
    ["line", "M116 96Q92 106 74 91Q59 113 76 120L108 129M124 96Q148 106 166 91Q181 113 164 120L132 129"],
    ["line", "M116 111Q92 121 74 106Q59 128 76 135L108 144M124 111Q148 121 166 106Q181 128 164 135L132 144"],
    ["line", "M120 39L120 105"],
    ["line", "M120 36L94 24L65 32M120 36L146 24L175 32M120 107L111 123M120 107L129 123"],
    ["line", "M87 142L112 129L128 129L153 142"],
  ],
  "chest-lateral": [
    ["fill", "M117 24C99 36 83 61 83 91C83 118 93 136 112 143C141 126 156 98 151 68C148 46 136 33 117 24Z"],
    ["bone", "M117 24C99 36 83 61 83 91C83 118 93 136 112 143C141 126 156 98 151 68C148 46 136 33 117 24Z"],
    ["line", "M112 40Q107 63 84 65M113 40Q136 53 142 40"],
    ["line", "M113 54Q108 77 85 79M114 54Q137 67 143 54"],
    ["line", "M114 68Q109 91 86 93M115 68Q138 81 144 68"],
    ["line", "M115 82Q110 105 87 107M116 82Q139 95 145 82"],
    ["line", "M116 96Q111 119 88 121M117 96Q140 109 146 96"],
    ["line", "M117 110Q112 133 89 135M118 110Q141 123 147 110"],
    ["line", "M117 25Q142 75 112 143"],
  ],
  "upper-limb": [
    ["fill", "M91 22Q76 23 74 39L82 81L109 120L114 142Q116 151 123 150L126 148L133 153Q139 156 141 150L134 139L142 144Q149 146 149 140L134 126L121 113L100 75L96 40Q105 30 97 24Z"],
    ["bone", "M91 22Q76 23 74 39L82 81L109 120L114 142Q116 151 123 150L126 148L133 153Q139 156 141 150L134 139L142 144Q149 146 149 140L134 126L121 113L100 75L96 40Q105 30 97 24Z"],
    ["bone", "M96 36C96 40.4 92.4 44 88 44C83.6 44 80 40.4 80 36C80 31.6 83.6 28 88 28C92.4 28 96 31.6 96 36Z"],
    ["line", "M88 45L94 77L118 113M101 78L126 112M119 120L129 137M124 119L135 133"],
    ["line", "M68 26Q71 14 87 13L101 20M88 78L101 79"],
  ],
  "lower-limb": [
    ["fill", "M109 16Q92 16 92 35L98 76L95 95L100 138L91 149Q86 156 96 156L136 156Q148 155 141 148L121 134L123 92L131 74L137 36Q139 17 122 16Z"],
    ["bone", "M109 16Q92 16 92 35L98 76L95 95L100 138L91 149Q86 156 96 156L136 156Q148 155 141 148L121 134L123 92L131 74L137 36Q139 17 122 16Z"],
    ["line", "M113 31L110 70M109 88L111 132M119 89L117 131M111 140L125 148"],
    ["bone", "M120 78C120 83.5 116 88 111 88C106 88 102 83.5 102 78C102 72.5 106 68 111 68C116 68 120 72.5 120 78Z"],
    ["line", "M101 23L111 18L126 23M105 148L132 148"],
  ],
  "head": [
    ["fill", "M99 140L99 120Q72 110 72 72Q72 29 115 26Q155 22 159 65L172 89L158 92L158 113Q157 126 131 122L131 140"],
    ["line", "M99 140L99 120Q72 110 72 72Q72 29 115 26Q155 22 159 65L172 89L158 92L158 113Q157 126 131 122L131 140"],
    ["line", "M84 53Q117 26 143 53M89 61Q97 44 110 58Q122 40 133 57M111 59L111 88M150 76L155 76M142 105L155 105"],
  ],
};

const legacy = (kind) => LEGACY[kind].map(([role, d]) => ({ role, d }));

export function designs(h) {
  const { smoothPath, geometry, tsConst, traced } = h;
  const closed = (role, pts) => ({ role, d: smoothPath(pts, true) });
  const open = (pts) => ({ role: "line", d: smoothPath(pts, false) });
  /** A silhouette: the fill plus an edge stroke along the visible sides only (the picture cut stays open). */
  const body = (fillPts, edgePts) => [closed("fill", fillPts), open(edgePts)];

  // ---- pelvis (the pelvis scene polygons of PelvisFigure.tsx, image px 2675 x 2084) -------------------------------
  // Symmetric about the midline of the scene picture: the patient-right bones of the pelvis scene mirrored to the left.
  const pm = (p) => p.map(([x, y]) => [2675 - x, y]);
  const wingR = [[1075, 720], [1030, 430], [990, 300], [770, 165], [500, 145], [340, 230], [215, 330], [260, 700], [410, 1075], [480, 1280], [640, 1450], [860, 1380], [840, 1100], [875, 950], [960, 830]];
  const ringR = [[640, 1450], [700, 1650], [780, 1880], [900, 1960], [1100, 1960], [1250, 1880], [1337, 1760], [1337, 1690], [1050, 1610], [880, 1500]];
  const sacrum = [[1150, 300], [1525, 300], [1590, 560], [1480, 900], [1380, 1140], [1295, 1140], [1195, 900], [1085, 560]];
  // Proximal femur: head seated in the acetabulum, neck down-laterally to the greater trochanter, a short shaft down.
  const femurR = [[470, 1330], [330, 1390], [200, 1420], [100, 1470], [20, 1580], [50, 1800], [40, 2084], [330, 2084], [340, 1860], [420, 1740], [540, 1620]];
  const acetabulum = Array.from({ length: 13 }, (_, i) => { const q = (200 + 140 * i / 12) * Math.PI / 180; return [600 + 262 * Math.cos(q), 1420 + 262 * Math.sin(q)]; });
  const disc = (cx, cy, rx, ry, n = 20) => Array.from({ length: n }, (_, i) => [cx + rx * Math.cos(i * 2 * Math.PI / n), cy + ry * Math.sin(i * 2 * Math.PI / n)]);
  const pelvisAp = geometry({
    win: [0, 0, 2675, 2084], margin: 10, eps: 1.4,
    items: [
      { role: "bone", fill: true, pts: wingR }, { role: "bone", fill: true, pts: pm(wingR) }, { role: "bone", fill: true, pts: sacrum },
      { role: "bone", pts: ringR }, { role: "bone", pts: pm(ringR) },
      { role: "bone", pts: disc(1100, 1780, 150, 95) }, { role: "bone", pts: pm(disc(1100, 1780, 150, 95)) },
      { role: "bone", fill: true, eps: 2, pts: femurR }, { role: "bone", fill: true, eps: 2, pts: pm(femurR) },
      { role: "bone", fill: true, pts: disc(600, 1420, 220, 220, 28) }, { role: "bone", fill: true, pts: pm(disc(600, 1420, 220, 220, 28)) },
      { role: "line", pts: acetabulum }, { role: "line", pts: pm(acetabulum) },
      { role: "line", pts: [[1337, 1690], [1337, 1760]] },
    ],
  });

  // ---- knee / ankle / elbow: the project's own scene outlines -----------------------------------------------------
  const knee = traced("lower-limb");
  const kneeAp = geometry({
    win: [0, 100, 1080, 1700], margin: 10, eps: 1,
    items: [{ role: "soft", pts: knee.kneeAp.soft }, { role: "bone", pts: knee.kneeAp.femur }, { role: "bone", pts: knee.kneeAp.tibia }, { role: "bone", pts: knee.kneeAp.fibula }],
  });
  const kneeLateral = geometry({
    win: [40, 100, 1150, 1700], margin: 10, eps: 1,
    items: [{ role: "soft", pts: knee.kneeLateral.soft, keepRun: (run) => run.reduce((m, p) => m + p[0], 0) / run.length < 120 }, { role: "bone", pts: knee.kneeLateral.femur }, { role: "bone", pts: knee.kneeLateral.patella }, { role: "bone", pts: knee.kneeLateral.tibia }, { role: "bone", pts: knee.kneeLateral.fibula }],
  });
  const ankle = tsConst("src/features/positioning/ankle-outlines.ts", "ANKLE_OUTLINES");
  const ankleAp = geometry({
    win: [0, 200, 720, 1700], margin: 10, eps: 1,
    items: [{ role: "soft", pts: ankle.ap.soft }, { role: "bone", pts: ankle.ap.tibia }, { role: "bone", pts: ankle.ap.fibula }, { role: "bone", pts: ankle.ap.talus }, { role: "bone", pts: ankle.ap.heel }],
  });
  // The model's lateral ankle ends at the picture edge on the foot side; the soft outline is closed there with a rounded
  // forefoot cap (a drawing convention, not model geometry) so the foot direction reads and nothing is cut by the frame.
  const al = ankle.lateral;
  const cut = al.soft.findIndex((p) => p[0] === 0);
  const ankleSoft = [...al.soft.slice(0, cut), [10, 870], [-140, 960], [-290, 1120], [-420, 1320], [-470, 1480], [-440, 1600], [-330, 1655], [-120, 1662], ...al.soft.slice(cut + 2)];
  const ankleLateral = geometry({
    win: [-500, 200, 910, 1700], margin: 10, eps: 1,
    items: [
      { role: "soft", pts: ankleSoft }, { role: "bone", fill: true, pts: al.foot }, { role: "bone", fill: true, pts: al.calcaneus },
      { role: "bone", fill: true, pts: al.talus }, { role: "bone", fill: true, pts: al.tibia }, { role: "bone", fill: true, pts: al.fibula },
    ],
  });
  const apElbow = tsConst("src/features/positioning/elbow-visual.ts", "AP_OUTLINES");
  const latElbow = tsConst("src/features/positioning/elbow-visual.ts", "LATERAL_OUTLINES");
  const elbowAp = geometry({
    win: [30, -100, 830, 1250], margin: 10, eps: 1,
    items: [{ role: "soft", pts: apElbow.soft }, { role: "bone", pts: apElbow.humerus }, { role: "bone", pts: apElbow.ulna }, { role: "bone", pts: apElbow.radius }],
  });
  // Flexed about 90 degrees: humerus up, trochlea / capitulum circle, olecranon behind, radius and ulna forward.
  const el = latElbow, c = el.circle, crop = (pts) => pts.map(([x, y]) => [Math.max(0, x), Math.max(150, y)]);
  const elbowLateral = geometry({
    win: [0, 150, 950, 1090], margin: 10, eps: 1.2,
    items: [
      { role: "bone", fill: true, pts: crop(el.humerus) }, { role: "bone", fill: true, pts: crop(el.ulna) }, { role: "bone", fill: true, pts: crop(el.radius) },
      { role: "line", pts: el.posteriorContour },
      { role: "bone", pts: disc(c.cx, c.cy, c.r, c.r) },
    ],
  });

  // ---- regions, spine -------------------------------------------------------------------------------------
  const body_ = [
    ...body([[88, 14], [152, 14], [176, 30], [176, 66], [160, 100], [168, 130], [172, 156], [68, 156], [72, 130], [80, 100], [64, 66], [64, 30]],
      [[68, 156], [72, 130], [80, 100], [64, 66], [64, 30], [88, 14], [152, 14], [176, 30], [176, 66], [160, 100], [168, 130], [172, 156]]),
    ...[30, 44, 58, 72].flatMap((y) => [open([[117, y], [98, y + 3], [84, y + 15]]), open([[123, y], [142, y + 3], [156, y + 15]])]),
    open([[120, 24], [120, 84]]),
    closed("bone", [[80, 114], [98, 106], [120, 114], [142, 106], [160, 114], [156, 136], [140, 148], [120, 140], [100, 148], [84, 136]]),
  ];
  // ---- spine: a hand-drawn schematic icon (no project model) -------------------------------------------------------
  const rounded = (pts, k = 0.28) => pts.flatMap((p, i) => {
    const a = pts[(i + pts.length - 1) % pts.length], b = pts[(i + 1) % pts.length];
    return [[p[0] + (a[0] - p[0]) * k, p[1] + (a[1] - p[1]) * k], [p[0] + (b[0] - p[0]) * k, p[1] + (b[1] - p[1]) * k]];
  });
  const solid = (pts) => [closed("fill", pts), closed("bone", pts)];
  // Normal frontal spine: one straight midline column, vertebral bodies widening evenly downward, an even disc between each,
  // short transverse processes, and the sacrum at the foot. Nothing is shifted sideways.
  const pitch = 21, bodyH = 12, halfW = (i) => 13 + i * 2.6, top0 = 12;
  const bodies = Array.from({ length: 6 }, (_, i) => rounded([[120 - halfW(i), top0 + i * pitch], [120 + halfW(i), top0 + i * pitch], [120 + halfW(i), top0 + i * pitch + bodyH], [120 - halfW(i), top0 + i * pitch + bodyH]], 0.18));
  const discs = Array.from({ length: 5 }, (_, i) => {
    const w = halfW(i + 0.5) - 1.5, y = top0 + i * pitch + bodyH + 1;
    return closed("fill", [[120 - w, y], [120 + w, y], [120 + w, y + pitch - bodyH - 2], [120 - w, y + pitch - bodyH - 2]]);
  });
  const processes = Array.from({ length: 6 }, (_, i) => {
    const y = top0 + i * pitch + bodyH / 2, w = halfW(i);
    return [open([[120 - w - 1, y], [120 - w - 11, y - 2]]), open([[120 + w + 1, y], [120 + w + 11, y - 2]])];
  }).flat();
  const sacrumTop = top0 + 5 * pitch + bodyH + 8;
  const spineGraphic = [...discs, ...bodies.flatMap((b) => solid(b)), ...processes, ...solid(rounded([[120 - 30, sacrumTop], [120 + 30, sacrumTop], [120 + 10, 160], [120 - 10, 160]], 0.2))];
  const generic = [closed("fill", [[64, 28], [176, 28], [176, 140], [64, 140]]), closed("bone", [[64, 28], [176, 28], [176, 140], [64, 140]]), open([[120, 46], [120, 122]]), open([[88, 84], [152, 84]])];

  return {
    "body": body_, "chest-pa": legacy("chest-pa"), "chest-ap": legacy("chest-ap"), "chest-lateral": legacy("chest-lateral"), "pelvis-ap": pelvisAp,
    "knee-ap": kneeAp, "knee-lateral": kneeLateral, "ankle-ap": ankleAp, "ankle-lateral": ankleLateral,
    "elbow-ap": elbowAp, "elbow-lateral": elbowLateral, "upper-limb": legacy("upper-limb"), "lower-limb": legacy("lower-limb"),
    "head": legacy("head"), "spine": spineGraphic, "generic": generic,
  };
}
