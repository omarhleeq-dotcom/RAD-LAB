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
  /**
   * Chest tonal layers (RAD-072 1b, ENGINE_GUIDE "Chest drawing style"), back to front: detector background (`detectorFill`) →
   * `soft` tissue (mid tone) → `air` (lung fields, darkest) → `heart` (filled, muted warm) → bones (`boneFill` / `boneLine`,
   * lighter and stronger) → guides (accents above, dashed, on `underStroke`) → fault overlays (outline / hatch, never a solid
   * dark fill) → labels. `outline` is the silhouette and heart edge. Used by the chest figures only; the other scenes keep the
   * dark muted fills above. Ratios are pinned by `scene-style.test.ts`.
   */
  soft: "#5d7489",
  air: "#0a1620",
  heart: "#7a5f6c",
  outline: "#c6d4df",
  boneFill: "#c4d2dd",
  boneLine: "#eef3f7",
} as const;

/**
 * Limb tonal layers (RAD-072 2a, ENGINE_GUIDE "Limb drawing style"), the chest layers applied to a limb drawn from traced outlines
 * (the hand first): soft tissue `soft` (mid tone) with the `outline` silhouette → joint spaces (`air`, dark, thin) → bone fills
 * (`boneFill`, TRANSLUCENT so superimposed bones read lighter and stay visible, radiograph-style) → every bone's cortex edge drawn
 * last, over all fills: a `boneLine` line on an `underStroke` line, so an edge reads on soft tissue, on one bone and on two
 * superimposed bones alike (one luminance axis cannot keep both the fill and a light edge at 3:1). Widths in SVG units; pinned by
 * `scene-style.test.ts`. No new colour: the chest tokens are reused.
 */
export const LIMB = {
  boneFillOpacity: 0.5,
  edge: 0.9,
  edgeUnder: 2.1,
  joint: 1.3,
  softEdge: 1.2,
} as const;

/** Anatomy fills the accents are checked against. */
export const ANATOMY_FILLS = ["bg", "bezel", "detectorFill", "trunk", "head", "limb", "limbFar", "lung"] as const;

/** Chest tonal fills (RAD-072 1b) checked by the chest contrast test. */
export const CHEST_FILLS = ["soft", "air", "heart", "boneFill"] as const;

/** Line weights (SVG units; the three views are scaled to a similar on-screen size). `guide`: a chest guide line, thinner than the bones it crosses. */
export const STROKE = { thin: 1.5, medium: 3, heavy: 5, guide: 1.5 } as const;

/**
 * ONE body proportion set for every chest figure (RAD-072 1b): frontal and lateral detector views, plan (top) view and AP side view.
 * DRAWING PROPORTIONS of one schematic adult in drawing centimetres: NOT medical facts, measurements or scored values. Each view
 * multiplies them by its own drawing scale (detector view: `U` = 10 units per cm; plan view and AP side view: their own px per cm).
 * The thorax width / depth are the EXISTING fitted lung landmark boxes plus a soft-tissue margin, so the lungs keep the scored
 * geometry; every other part is drawn relative to them. `l` = length, `w` = frontal width, `d` = front-to-back depth, `h` = height.
 */
export const BODY = {
  head: { h: 23, w: 15, d: 19 },
  neck: { h: 9, w: 11, d: 11 },
  shoulderW: 39,
  thorax: { w: 31, d: 28 },
  /** Shoulder (acromion) to hip joint along the trunk; width at the waist; depth of the abdomen. */
  trunk: { l: 52, waistW: 27, abdomenD: 22 },
  upperArm: { l: 31, w: 9 },
  forearm: { l: 26, w: 7 },
  hand: { l: 18, w: 8 },
  thigh: { l: 45, w: 15 },
  shank: { l: 42, w: 10 },
  foot: { l: 25, h: 8 },
} as const;

/** Extra width of the dark under-stroke beneath an accent line. */
export const UNDER = 3;

/** Label font sizes in viewBox units: the 450-wide side/plan views and the 410-wide detector view render at ~0.8 / ~0.9 px per unit on a phone. */
export const LABEL_SIZE = { view: 17, detector: 20 } as const;
