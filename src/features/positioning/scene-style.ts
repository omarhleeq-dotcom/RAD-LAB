/**
 * One visual language for every positioning scene (S13b-1, colour code revised in S13b-2). The scenes sit on the always-dark
 * console panel, so these are fixed colours (identical in light and dark UI themes). A scene never invents a hex value.
 *
 * COLOUR CODE
 *  - Anatomy: muted cool greys / blues only, no accent hue, and no large light fill: every anatomy fill is dark enough that
 *    each accent below keeps >= 3:1 against it (pinned by `scene-style.test.ts`). Anatomy detail lines (`edge`, `bone`) are thin.
 *  - Interactive elements (collimation field, crosshair, handles, marker) and the beam: ONE accent, `beam` (amber), always drawn
 *    on a dark under-stroke (`underStroke`) so it reads on any fill.
 *  - Guides (practice guides ON): at most TWO colours, told apart by shape and label as well as hue: `good` (green) = targets
 *    (centring zone, reference SID, "square" tick); `guide` (sky) = reference lines and the fault outline (midline, arms over the lungs).
 */
export const SCENE = {
  /** Drawing area and its bezel / detector surface. */
  bg: "#0b141b",
  bezel: "#1a2b38",
  detectorFill: "#13212b",
  detectorEdge: "#5f7b90",
  /** Anatomy fills (dark / muted): trunk, head and neck, near limb, far limb, lung field. */
  trunk: "#34495a",
  head: "#3f566a",
  limb: "#46607a",
  limbFar: "#3a5166",
  lung: "#1f3446",
  /** Anatomy lines: outline of silhouettes, and internal detail (ribs, spine, clavicles). */
  edge: "#a9bccb",
  bone: "#c3d2de",
  /** Equipment: detector slab / bar, bed, tube housing. */
  detector: "#6f8aa0",
  bed: "#2b4152",
  tube: "#c9d7e2",
  /** Accents. */
  beam: "#f2b134",
  good: "#4ade80",
  guide: "#7dd3fc",
  /** Under-stroke of every accent line, label pill and text. */
  underStroke: "#06101a",
  label: "#e6eef4",
} as const;

/** Anatomy fills the accents are checked against. */
export const ANATOMY_FILLS = ["bg", "bezel", "detectorFill", "trunk", "head", "limb", "limbFar", "lung"] as const;

/** Line weights (SVG units; the three views are scaled to a similar on-screen size). */
export const STROKE = { thin: 1.5, medium: 3, heavy: 5 } as const;

/** Extra width of the dark under-stroke beneath an accent line. */
export const UNDER = 3;

/** Label font sizes in viewBox units: the 450-wide side/plan views and the 410-wide detector view render at ~0.8 / ~0.9 px per unit on a phone. */
export const LABEL_SIZE = { view: 17, detector: 20 } as const;
