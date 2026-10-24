// Hand-built and project-geometry graphics of the exam library (RAD-069 B2b). Roles: "fill" (soft silhouette, no stroke),
// "bone" (closed outline), "line" (open stroke). Everything lives in the 240 x 168 viewBox; nothing is mirrored for RTL.
// Chest, regions, head and spine are drawn here; knee, ankle, elbow and pelvis reuse the project's own model geometry.
export function designs(h) {
  const { smoothPath, capsule, geometry, tsConst, traced } = h;
  const mir = (pts) => pts.map(([x, y]) => [240 - x, y]);
  const closed = (role, pts) => ({ role, d: smoothPath(pts, true) });
  /** Rounded polygon: every corner is cut at fraction k of its two edges, so straight sides stay straight. */
  const rounded = (pts, k = 0.25) => pts.flatMap((p, i) => {
    const a = pts[(i + pts.length - 1) % pts.length], b = pts[(i + 1) % pts.length];
    return [[p[0] + (a[0] - p[0]) * k, p[1] + (a[1] - p[1]) * k], [p[0] + (b[0] - p[0]) * k, p[1] + (b[1] - p[1]) * k]];
  });
  const open = (pts) => ({ role: "line", d: smoothPath(pts, false) });
  /** A silhouette: the fill plus an edge stroke along the visible sides only (the picture cut stays open). */
  const body = (fillPts, edgePts) => [closed("fill", fillPts), open(edgePts)];

  // ---- chest ---------------------------------------------------------------------------------------------------
  const thoraxFill = [[84, 12], [156, 12], [186, 26], [190, 60], [178, 112], [172, 152], [68, 152], [62, 112], [50, 60], [54, 26]];
  const thoraxEdge = [[68, 152], [62, 112], [50, 60], [54, 26], [84, 12], [156, 12], [186, 26], [190, 60], [178, 112], [172, 152]];
  const lungL = [[112, 36], [96, 30], [80, 40], [72, 70], [74, 108], [90, 126], [110, 122], [114, 90]];
  const lungR = [[128, 36], [144, 30], [160, 40], [168, 70], [166, 108], [150, 124], [138, 120], [136, 104], [128, 88], [124, 62]];
  const heart = [[122, 86], [138, 80], [150, 92], [148, 112], [134, 122], [122, 112]];
  const spine = [[116, 18], [124, 18], [124, 148], [116, 148]];
  const chestFront = (scapulaPts, clav) => [
    ...body(thoraxFill, thoraxEdge),
    closed("bone", lungL), closed("bone", lungR), closed("bone", heart), closed("bone", spine),
    open(clav), open(mir(clav)), ...scapulaPts,
  ];
  const chestPa = chestFront([open([[66, 34], [54, 46], [56, 76], [66, 86]]), open([[174, 34], [186, 46], [184, 76], [174, 86]])], [[114, 28], [94, 24], [68, 32]]);
  const chestAp = chestFront([open([[96, 38], [80, 46], [78, 76], [92, 90]]), open([[144, 38], [160, 46], [162, 76], [148, 90]])], [[114, 22], [94, 22], [64, 24]]);

  // lateral chest: anterior to the viewer's left, spine along the back, sternum at the front
  const lateralVertebrae = [0, 1, 2, 3, 4].map((i) => {
    const x = 148 + [0, 3, 5, 3, 0][i], y = 22 + i * 25;
    return closed("bone", rounded([[x, y], [x + 16, y], [x + 16, y + 18], [x, y + 18]]));
  });
  const chestLateral = [
    ...body([[98, 12], [156, 12], [172, 30], [178, 90], [170, 152], [102, 152], [92, 110], [86, 60], [88, 30]], [[102, 152], [92, 110], [86, 60], [88, 30], [98, 12], [156, 12], [172, 30], [178, 90], [170, 152]]),
    closed("bone", [[106, 34], [136, 28], [144, 58], [142, 108], [128, 130], [108, 126], [102, 80]]),
    open([[102, 22], [96, 104]]),
    ...lateralVertebrae,
  ];

  // ---- pelvis (the pelvis scene polygons of PelvisFigure.tsx, image px 2675 x 2084) -------------------------------
  const pm = (p) => p.map(([x, y]) => [2675 - x, y]);
  const wingR = [[1075, 720], [1030, 430], [990, 300], [770, 165], [500, 145], [340, 230], [215, 330], [260, 700], [410, 1075], [480, 1280], [640, 1450], [860, 1380], [840, 1100], [875, 950], [960, 830]];
  const wingL = [[1700, 700], [1690, 480], [1760, 330], [1980, 235], [2250, 215], [2470, 260], [2590, 420], [2420, 880], [2270, 1180], [2190, 1290], [2040, 1450], [1820, 1360], [1900, 1180], [1890, 1000], [1790, 830]];
  const ringR = [[640, 1450], [700, 1650], [780, 1880], [900, 1960], [1100, 1960], [1250, 1880], [1335, 1760], [1330, 1690], [1050, 1610], [880, 1500]];
  const sacrum = [[1150, 300], [1525, 300], [1590, 560], [1480, 900], [1380, 1140], [1295, 1140], [1195, 900], [1085, 560]];
  const femurR = [[470, 1500], [250, 1470], [100, 1490], [20, 1580], [50, 1800], [30, 2084], [540, 2084], [520, 1850], [560, 1720], [600, 1620]];
  const pelvisSoft = [[330, 0], [2345, 0], [2640, 340], [2640, 520], [2480, 900], [2400, 1150], [2560, 1380], [2675, 1480], [2675, 2084], [1960, 2084], [1945, 2000], [730, 2000], [715, 2084], [0, 2084], [0, 1480], [120, 1380], [270, 1150], [190, 900], [80, 520], [80, 340]];
  const pelvisAp = geometry({
    win: [0, 0, 2675, 2084], margin: 10, eps: 1.1,
    items: [
      { role: "soft", pts: pelvisSoft },
      { role: "bone", pts: wingR }, { role: "bone", pts: wingL }, { role: "bone", pts: sacrum },
      { role: "bone", pts: ringR }, { role: "bone", pts: pm(ringR) }, { role: "bone", pts: femurR }, { role: "bone", pts: pm(femurR) },
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
    items: [{ role: "soft", pts: knee.kneeLateral.soft }, { role: "bone", pts: knee.kneeLateral.femur }, { role: "bone", pts: knee.kneeLateral.patella }, { role: "bone", pts: knee.kneeLateral.tibia }, { role: "bone", pts: knee.kneeLateral.fibula }],
  });
  const ankle = tsConst("src/features/positioning/ankle-outlines.ts", "ANKLE_OUTLINES");
  const ankleAp = geometry({
    win: [0, 200, 720, 1700], margin: 10, eps: 1,
    items: [{ role: "soft", pts: ankle.ap.soft }, { role: "bone", pts: ankle.ap.tibia }, { role: "bone", pts: ankle.ap.fibula }, { role: "bone", pts: ankle.ap.talus }, { role: "bone", pts: ankle.ap.heel }],
  });
  const ankleLateral = geometry({
    win: [0, 200, 910, 1670], margin: 10, eps: 1,
    items: [{ role: "soft", pts: ankle.lateral.soft }, { role: "bone", pts: ankle.lateral.tibia }, { role: "bone", pts: ankle.lateral.fibula }, { role: "bone", pts: ankle.lateral.talus }, { role: "bone", pts: ankle.lateral.calcaneus }, { role: "bone", pts: ankle.lateral.foot }],
  });
  const apElbow = tsConst("src/features/positioning/elbow-visual.ts", "AP_OUTLINES");
  const latElbow = tsConst("src/features/positioning/elbow-visual.ts", "LATERAL_OUTLINES");
  const elbowAp = geometry({
    win: [30, -100, 830, 1250], margin: 10, eps: 1,
    items: [{ role: "soft", pts: apElbow.soft }, { role: "bone", pts: apElbow.humerus }, { role: "bone", pts: apElbow.ulna }, { role: "bone", pts: apElbow.radius }],
  });
  const elbowLateral = geometry({
    win: [-60, -150, 950, 1090], margin: 10, eps: 1,
    items: [{ role: "soft", pts: latElbow.soft }, { role: "bone", pts: latElbow.humerus }, { role: "bone", pts: latElbow.radius }, { role: "bone", pts: latElbow.ulna }, { role: "line", pts: latElbow.posteriorContour }],
  });

  // ---- regions, head, spine -------------------------------------------------------------------------------------
  const bar = (a, b, wa, wb = wa) => capsule(a, b, wa, wb);
  const solid = (role, pts) => [closed("fill", pts), closed(role, pts)];
  const off = (a, b, d) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / l * d, ny = (b[0] - a[0]) / l * d; return [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny]]; };
  // arm: shoulder at the top left, upper arm down, elbow flexed, forearm and open hand forward
  const S = [56, 38], E = [62, 108], W = [142, 110], T = [186, 110];
  const [u1a, u1b] = off(E, W, 7), [u2a, u2b] = off(E, W, -7);
  const fingers = [[198, 84], [208, 98], [210, 112], [204, 126]].map((tip, i) => [[176, 96 + i * 9], tip]);
  const upperLimb = [
    closed("fill", bar(S, E, 25, 21)), closed("fill", bar(E, W, 22, 17)), closed("fill", bar([136, 110], T, 19, 17)),
    ...fingers.map(([a, b]) => closed("fill", bar(a, b, 7, 6))),
    closed("bone", bar([56, 42], [62, 104], 8, 7.5)), closed("bone", bar(u1a, u1b, 4.5, 4)), closed("bone", bar(u2a, u2b, 4.5, 4)),
    closed("bone", rounded([[144, 98], [164, 96], [166, 124], [146, 126]])),
    ...fingers.map(([a, b]) => open([a, b])),
  ];
  // leg: hip at the top left, thigh forward, knee flexed, shin down, foot forward
  const H = [46, 42], K = [136, 46], A = [138, 124];
  const [t1a, t1b] = off(K, A, 6), [t2a, t2b] = off(K, A, -6);
  const lowerLimb = [
    closed("fill", bar(H, K, 25, 21)), closed("fill", bar(K, A, 21, 14)), closed("fill", bar([136, 142], [198, 144], 14, 9)),
    closed("bone", bar([50, 42], [134, 46], 8, 8.5)), closed("bone", bar(t1a, t1b, 5, 4)), closed("bone", bar(t2a, t2b, 3.5, 3.5)),
    closed("bone", rounded([[148, 30], [160, 34], [158, 58], [146, 60]])),
    closed("bone", bar([140, 142], [192, 144], 6, 4)),
  ];
  const body_ = [
    ...body([[88, 14], [152, 14], [176, 30], [176, 66], [160, 100], [168, 130], [172, 156], [68, 156], [72, 130], [80, 100], [64, 66], [64, 30]],
      [[68, 156], [72, 130], [80, 100], [64, 66], [64, 30], [88, 14], [152, 14], [176, 30], [176, 66], [160, 100], [168, 130], [172, 156]]),
    ...[30, 44, 58, 72].flatMap((y) => [open([[117, y], [98, y + 3], [84, y + 15]]), open([[123, y], [142, y + 3], [156, y + 15]])]),
    open([[120, 24], [120, 84]]),
    closed("bone", [[80, 114], [98, 106], [120, 114], [142, 106], [160, 114], [156, 136], [140, 148], [120, 140], [100, 148], [84, 136]]),
  ];
  const cranium = [[118, 16], [150, 18], [172, 36], [182, 64], [178, 92], [160, 108], [134, 112], [110, 104], [92, 88], [84, 62], [92, 36]];
  const head = [
    ...solid("bone", cranium),
    ...solid("bone", [[88, 86], [76, 94], [72, 108], [84, 116], [110, 118], [122, 108], [104, 94]]),
    closed("bone", [[88, 60], [104, 56], [106, 70], [92, 76]]),
    open([[88, 114], [102, 134], [136, 138], [152, 120], [150, 100]]),
    ...solid("bone", rounded([[146, 118], [166, 114], [170, 134], [150, 138]])),
    ...solid("bone", rounded([[150, 142], [170, 138], [174, 158], [154, 162]])),
  ];
  const curve = (t) => [118 + 9 * Math.sin((t * 1.2 + 0.1) * 2 * Math.PI), 20 + t * 118];
  const vertebrae = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8, c = curve(t), c2 = curve(Math.min(1, t + 0.01)), c1 = curve(Math.max(0, t - 0.01));
    const ang = Math.atan2(c2[1] - c1[1], c2[0] - c1[0]), d = 9 + t * 7, hgt = 5 + t * 1.2;
    const at = (u, v) => [c[0] + Math.cos(ang) * u - Math.sin(ang) * v, c[1] + Math.sin(ang) * u + Math.cos(ang) * v];
    return [...solid("bone", rounded([at(-hgt, -d), at(hgt, -d), at(hgt, d), at(-hgt, d)], 0.3)), open([at(0, d), at(0, d + 9 + t * 3)])];
  }).flat();
  const spineGraphic = [...vertebrae, ...solid("bone", rounded([[118, 140], [146, 138], [144, 154], [130, 164]], 0.3))];
  const generic = [closed("fill", [[64, 28], [176, 28], [176, 140], [64, 140]]), closed("bone", [[64, 28], [176, 28], [176, 140], [64, 140]]), open([[120, 46], [120, 122]]), open([[88, 84], [152, 84]])];

  return {
    "body": body_, "chest-pa": chestPa, "chest-ap": chestAp, "chest-lateral": chestLateral, "pelvis-ap": pelvisAp,
    "knee-ap": kneeAp, "knee-lateral": kneeLateral, "ankle-ap": ankleAp, "ankle-lateral": ankleLateral,
    "elbow-ap": elbowAp, "elbow-lateral": elbowLateral, "upper-limb": upperLimb, "lower-limb": lowerLimb,
    "head": head, "spine": spineGraphic, "generic": generic,
  };
}
