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
