import type { DetectorRegion, DetectorSpec } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";

export interface Rect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Collimated field on the detector (cm from top-left), centred on the central ray, clamped to the detector. */
export function collimatedField(
  s: Pick<SimulationSettings, "centerXCm" | "centerYCm" | "collimationWidthCm" | "collimationHeightCm">,
  detector: DetectorSpec,
): Rect {
  const cx = detector.widthCm / 2 + s.centerXCm;
  const cy = s.centerYCm;
  return {
    x1: Math.max(0, cx - s.collimationWidthCm / 2),
    x2: Math.min(detector.widthCm, cx + s.collimationWidthCm / 2),
    y1: Math.max(0, cy - s.collimationHeightCm / 2),
    y2: Math.min(detector.heightCm, cy + s.collimationHeightCm / 2),
  };
}

export function regionToRect(r: DetectorRegion): Rect {
  return { x1: r.xCm, y1: r.yCm, x2: r.xCm + r.widthCm, y2: r.yCm + r.heightCm };
}

export type Side = "left" | "right" | "top" | "bottom";

/** Positive margin = field extends beyond the region; negative = region is clipped on that side. */
export function coverageMargins(field: Rect, region: Rect): Record<Side, number> {
  return {
    left: region.x1 - field.x1,
    right: field.x2 - region.x2,
    top: region.y1 - field.y1,
    bottom: field.y2 - region.y2,
  };
}
