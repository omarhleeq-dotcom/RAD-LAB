/**
 * One visual language for every positioning scene (S13b-1). The scenes are drawn on the always-dark console panel, so these
 * tokens are fixed colours chosen for contrast on #0b141b (text tokens ≥ 7:1, strokes ≥ 3:1) in both light and dark UI themes.
 * A new exam's scene reuses them (see docs/session-13b-scene-design.md); it never introduces its own hex values.
 */
export const SCENE = {
  /** Backgrounds of the drawing area and its bezel. */
  bg: "#0b141b",
  bezel: "#1a2b38",
  /** Patient: trunk, head/neck, limbs, lung field, bone/lines. Near limbs are lighter than far limbs. */
  trunk: "#5d778a",
  head: "#7b93a5",
  limb: "#9db6c6",
  limbFar: "#7b93a5",
  lung: "#33516a",
  bone: "#d8e4ec",
  /** Equipment: detector / bed / tube housing. */
  detector: "#7b93a5",
  bed: "#2b4152",
  tube: "#d8e4ec",
  /** Semantic strokes: the beam and the learner's controls (amber), "correct" guides (green), plain guides (sky). */
  beam: "#f2b134",
  good: "#4ade80",
  guide: "#7dd3fc",
  /** Text. */
  label: "#d8e4ec",
} as const;

/** Line weights (SVG units; the three views are scaled to a similar on-screen size). */
export const STROKE = { thin: 1.5, medium: 3, heavy: 5 } as const;

/** Label font sizes in viewBox units: the 450-wide side/plan views and the 410-wide detector view render at ~0.8 / ~0.9 px per unit on a phone. */
export const LABEL_SIZE = { view: 17, detector: 20 } as const;
