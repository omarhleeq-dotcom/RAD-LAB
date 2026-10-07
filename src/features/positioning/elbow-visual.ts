/**
 * Geometry of the ELBOW scenes (S14.3; drawing units). Not to scale: a schematic, never a measurement. The outlines are READ BY EYE
 * from the two baseline images (A-019 AP, A-021 lateral; image px) and are ILLUSTRATIVE; the rotation drawing of the detector view comes from
 * the elbow model (`features/elbow-model`), which is also the source of the result image's displacements.
 */
export type Pt = [number, number];

/** AP baseline (849 × 1097 px): left elbow, supinated, ulna on the viewer's left. */
export const AP_OUTLINES = {
  /** Arm soft tissue (silhouette). */
  soft: [[225, -440], [210, 0], [180, 150], [110, 270], [80, 420], [60, 600], [55, 800], [50, 1500], [800, 1500], [785, 800], [790, 600], [795, 400], [790, 200], [780, 0], [790, -440]] as Pt[],
  /** Distal humerus with both epicondyles (medial epicondyle at the viewer's left). */
  humerus: [[440, -440], [405, 0], [385, 70], [330, 140], [270, 195], [215, 225], [150, 252], [128, 300], [130, 350], [160, 395], [215, 420], [232, 470], [290, 505], [350, 520], [440, 550], [520, 548], [570, 515], [598, 470], [590, 430], [560, 400], [560, 300], [570, 200], [590, 100], [598, 0], [620, -440]] as Pt[],
  ulna: [[250, 490], [205, 500], [200, 525], [222, 590], [258, 690], [272, 800], [262, 1500], [386, 1500], [388, 800], [400, 720], [388, 650], [375, 590], [345, 520], [300, 490]] as Pt[],
  radius: [[400, 570], [470, 578], [540, 592], [548, 615], [520, 645], [505, 700], [500, 800], [498, 1500], [388, 1500], [392, 820], [410, 700], [410, 640], [398, 600]] as Pt[],
  /** Epicondyle tips (the guide line joins them): medial, lateral. */
  epicondyles: [[128, 330], [598, 460]] as Pt[],
} as const;

/** Lateral baseline (1086 × 1103 px): left elbow flexed 90°, thumb side up, humerus vertical, forearm toward the viewer's left. */
export const LATERAL_OUTLINES = {
  soft: [[-60, 545], [300, 510], [420, 430], [430, -150], [930, -150], [940, 300], [925, 700], [900, 860], [870, 1000], [800, 1085], [-60, 1085]] as Pt[],
  humerus: [[722, -150], [725, 0], [735, 200], [745, 450], [752, 600], [735, 680], [700, 715], [680, 760], [890, 760], [902, 700], [895, 600], [893, 300], [890, 0], [890, -150]] as Pt[],
  /** The condyle outline shared by the lateral-side and medial-side structures: the circle and the posterior contour. */
  circle: { cx: 755, cy: 810, r: 78 },
  posteriorContour: [[830, 760], [880, 760], [902, 790], [895, 830], [870, 870], [835, 895]] as Pt[],
  radius: [[-60, 800], [0, 800], [150, 785], [300, 758], [420, 748], [520, 752], [590, 742], [640, 735], [660, 770], [640, 800], [590, 830], [500, 858], [300, 872], [100, 880], [0, 885], [-60, 885]] as Pt[],
  ulna: [[-60, 905], [0, 905], [200, 903], [400, 895], [560, 880], [690, 870], [720, 890], [760, 895], [800, 885], [830, 870], [845, 900], [848, 960], [830, 1000], [790, 1030], [740, 1032], [600, 1015], [400, 1005], [200, 1000], [0, 1000], [-60, 1000]] as Pt[],
  /** Radial head and the coronoid process: drawn together as the region the effect doubles. */
  radialHead: { cx: 615, cy: 765, rx: 45, ry: 30 },
  coronoid: [[640, 790], [665, 780], [690, 800], [690, 880], [660, 880], [645, 840]] as Pt[],
} as const;

/** Closed smooth path (Catmull-Rom → cubic Béziers) through the points. */
export function smoothClosedPath(pts: Pt[]): string {
  const n = pts.length;
  let d = `M ${pts[0]![0].toFixed(1)} ${pts[0]![1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]!, p1 = pts[i]!, p2 = pts[(i + 1) % n]!, p3 = pts[(i + 2) % n]!;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return `${d} Z`;
}

/** Open smooth path through the points. */
export function smoothOpenPath(pts: Pt[]): string {
  const n = pts.length;
  let d = `M ${pts[0]![0].toFixed(1)} ${pts[0]![1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!, p1 = pts[i]!, p2 = pts[i + 1]!, p3 = pts[Math.min(n - 1, i + 2)]!;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/**
 * Side view of the table set-up. The detector's long axis (AP: 30 cm, the arm's axis) or its width (lateral: 24 cm, the forearm's axis) lies
 * along the table: AP — the humerus end (detector y = 0) at the LEFT (the patient's side), the forearm to the right; lateral — the back of the
 * elbow (detector x = 24 cm) at the LEFT (the patient's side) and the forearm end (x = 0) at the RIGHT.
 */
export const ELBOW_SIDE = {
  slabRight: 396,
  pxPerCm: 7.2,
  surfaceY: 282,
  /** SID is drawn at this scale along the beam. */
  sidPxPerCm: 1,
} as const;

/** x of a detector position on the slab. AP: `cm` = detector y (cm from the top = the humerus end). */
export const apSlabX = (yCm: number, lengthCm = 30): number => ELBOW_SIDE.slabRight - (lengthCm - yCm) * ELBOW_SIDE.pxPerCm;
/** x of a detector position on the slab. Lateral: `cm` = detector x (cm from the left = the forearm end, drawn at the right). */
export const lateralSlabX = (xCm: number): number => ELBOW_SIDE.slabRight - xCm * ELBOW_SIDE.pxPerCm;
