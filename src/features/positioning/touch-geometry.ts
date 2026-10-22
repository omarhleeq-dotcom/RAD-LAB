/**
 * Phone touch geometry of the detector scene (UI-3, owner phone check 2). The scene is scaled to the screen width, so
 * hit areas and the marker are sized in scene units from the measured CSS px per scene unit. Pure and React-free.
 * Without a measured scale (desktop, or before the first measurement) every value is the unchanged default.
 */
export const HIT = 44; // default touch-friendly hit target, scene units
export const HANDLE = 14; // default visible field-handle size, scene units
export const PHONE_HIT_PX = 44; // minimum hit area on a phone, CSS px
const PHONE_HANDLE_PX = 12;
const PHONE_MARKER_LETTER_PX = 22;
const MARKER_LETTER_UNITS = 28;
const MARKER_SCALE_MAX = 2;

export interface TouchGeometry {
  hit: number;
  handle: number;
  rayHit: number;
  /** Factor applied to the marker box and letter around the same centre. */
  markerScale: number;
}

export function touchGeometry(scale: number | null): TouchGeometry {
  if (!scale || !(scale > 0)) return { hit: HIT, handle: HANDLE, rayHit: HIT / 2 + 6, markerScale: 1 };
  const px = 1 / scale;
  return {
    hit: Math.max(HIT, PHONE_HIT_PX * px),
    handle: Math.max(HANDLE, PHONE_HANDLE_PX * px),
    rayHit: Math.max(HIT / 2 + 6, (PHONE_HIT_PX / 2) * px),
    markerScale: Math.min(MARKER_SCALE_MAX, Math.max(1, (PHONE_MARKER_LETTER_PX * px) / MARKER_LETTER_UNITS)),
  };
}

/** The marker box, always centred on the marker's own position (its scored centre), whatever the enlargement. */
export function markerBox(centre: { x: number; y: number }, sizeUnits: number, markerScale: number) {
  const size = sizeUnits * markerScale;
  return { x: centre.x - size / 2, y: centre.y - size / 2, size };
}

/** A touchable control of the scene: its visible centre and its hit area (a square of side `size`, or a circle of `radius`), in scene units. */
export interface TouchCandidate<T> {
  target: T;
  x: number;
  y: number;
  size?: number;
  radius?: number;
}

/**
 * The control a touch at `p` is meant for (RAD-068): among the controls whose hit area contains the point, the one whose VISIBLE centre is
 * nearest. On a phone the hit areas are >= 44 CSS px, so at a small on-screen scale (the whole-detector view) they overlap; without this the
 * control drawn last (the crosshair) took a touch aimed at the marker or a field handle. Null when no hit area contains the point.
 */
export function nearestTouchTarget<T>(p: { x: number; y: number }, candidates: readonly TouchCandidate<T>[]): T | null {
  let best: T | null = null;
  let bestD = Infinity;
  for (const c of candidates) {
    const dx = p.x - c.x, dy = p.y - c.y;
    const inside = c.radius !== undefined ? Math.hypot(dx, dy) <= c.radius : c.size !== undefined && Math.abs(dx) <= c.size / 2 && Math.abs(dy) <= c.size / 2;
    const d = Math.hypot(dx, dy);
    if (inside && d < bestD) {
      best = c.target;
      bestD = d;
    }
  }
  return best;
}
