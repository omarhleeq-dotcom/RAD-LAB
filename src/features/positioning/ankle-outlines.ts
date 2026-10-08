/**
 * Outlines of the two ANKLE scenes (S14.5; drawing in image px of the baselines A-031 AP 728 × 1631 and A-033 lateral 932 × 1678). READ BY EYE from the baselines on a
 * 100 px grid and ILLUSTRATIVE only (O80): a schematic of the structures the rotation drawing moves, never a measurement and never a tracing of the image. The limb
 * continues beyond the top of the image (y < 0), the drawing is clipped to the detector. Anatomy is an image convention and is never mirrored by RTL.
 */
export type Pt = [number, number];

export const ANKLE_OUTLINES = {
  ap: {
    // skin outline of the leg and the ankle (the heel / hindfoot continues below the image)
    soft: [[110, -300], [108, 300], [100, 700], [72, 1000], [46, 1100], [40, 1250], [30, 1400], [18, 1700], [700, 1700], [660, 1500], [690, 1330], [696, 1250], [662, 1100], [622, 900], [600, 500], [598, -300]] as Pt[],
    // the tibia with the medial malleolus (its lower edge is the plafond)
    tibia: [[215, -300], [205, 0], [205, 400], [195, 700], [170, 850], [130, 950], [95, 1020], [80, 1100], [85, 1160], [110, 1200], [150, 1195], [200, 1160], [205, 1100], [250, 1092], [350, 1088], [465, 1100], [470, 1000], [460, 700], [455, 400], [458, 0], [460, -300]] as Pt[],
    // the fibula with the lateral malleolus
    fibula: [[482, -300], [480, 700], [478, 950], [470, 1100], [470, 1180], [495, 1235], [540, 1270], [595, 1285], [625, 1250], [645, 1190], [650, 1130], [625, 1050], [590, 960], [565, 800], [560, -300]] as Pt[],
    // the talus under the plafond
    talus: [[210, 1112], [300, 1104], [400, 1104], [462, 1112], [480, 1180], [470, 1260], [430, 1330], [330, 1370], [240, 1340], [190, 1260], [180, 1180]] as Pt[],
    // the heel bone and the hindfoot, schematic
    heel: [[150, 1345], [250, 1405], [350, 1455], [470, 1405], [560, 1365], [585, 1450], [545, 1560], [420, 1700], [250, 1700], [130, 1580], [100, 1450]] as Pt[],
    // the tips of the medial and lateral malleoli (the line between them is the guide)
    malleoli: [[120, 1195], [610, 1283]] as [Pt, Pt],
  },
  lateral: {
    soft: [[150, -300], [130, 500], [60, 780], [0, 900], [0, 1660], [300, 1650], [600, 1650], [800, 1590], [900, 1400], [905, 1250], [850, 1100], [835, 800], [830, -300]] as Pt[],
    tibia: [[262, -300], [264, 500], [250, 640], [225, 740], [218, 800], [235, 835], [290, 852], [400, 850], [500, 846], [555, 832], [560, 780], [535, 700], [515, 500], [510, -300]] as Pt[],
    // the distal fibula, behind the tibia (drawn twice by the rotation)
    fibula: [[430, -300], [432, 300], [445, 600], [480, 760], [520, 830], [532, 880], [505, 892], [470, 850], [430, 760], [400, 500], [395, 300], [395, -300]] as Pt[],
    // the talar dome (an open arc drawn twice by the rotation) and the talus body
    domeArc: [[215, 940], [250, 888], [330, 866], [420, 870], [500, 892], [560, 938]] as Pt[],
    talus: [[215, 940], [250, 888], [330, 866], [420, 870], [500, 892], [560, 938], [592, 1000], [572, 1060], [482, 1086], [382, 1112], [300, 1122], [250, 1092], [215, 1012]] as Pt[],
    calcaneus: [[290, 1122], [380, 1082], [500, 1032], [600, 1092], [760, 1112], [830, 1172], [850, 1262], [830, 1372], [790, 1442], [700, 1482], [610, 1472], [500, 1422], [380, 1382], [280, 1322], [222, 1242]] as Pt[],
    // the navicular / cuboid region at the left edge (only partly in the image)
    foot: [[0, 982], [110, 962], [200, 1012], [232, 1102], [212, 1252], [150, 1332], [50, 1362], [0, 1352]] as Pt[],
    centre: [380, 895] as Pt,
  },
} as const;
