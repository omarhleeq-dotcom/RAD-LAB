import { PELVIS_IMAGE } from "@/features/positioning/drawing-data";
export { PELVIS_IMAGE };
/** S-PELVIS-1-4: by-eye teaching geometry, never measured patient dimensions. */
export const PELVIS_DETECTOR = { widthCm: 43, heightCm: 35 };

export const PELVIS_REGION = { xCm: 2.9375, yCm: 2.32, widthCm: 38.1, heightCm: 30.6 };
/**
 * Marker keep-out zones (S-PELVIS-3-1, detector cm): everything except the empty top-left corner above the iliac wing (x < 4.55, y < 6.5; default marker centre ≈ 3 cm, 4.5 cm, clear of the corner handle),
 * so a 2.8 cm marker can sit there inside the collimated field instead of on the detector edge. Traced by eye from the baseline, not measured.
 */
export const PELVIS_MARKER_KEEP_OUT = [
  { xCm: 0, yCm: 6.5, widthCm: 43, heightCm: 28.5 },
  { xCm: 4.55, yCm: 0, widthCm: 38.45, heightCm: 6.5 },
];
