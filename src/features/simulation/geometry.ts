import type { DetectorRegion, DetectorSpec } from "@/domain/case";
import type { SimulationSettings, ViewerSide } from "@/domain/simulation";

export interface Rect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Collimated field on the detector (cm from top-left), centred on the central ray and clamped to the
 * detector. Inputs are normalized (see NormPoint / CollimationSize); output is physical cm.
 */
export function collimatedField(
  s: Pick<SimulationSettings, "centralRay" | "collimation">,
  detector: DetectorSpec,
): Rect {
  const cx = ((s.centralRay.x + 1) / 2) * detector.widthCm;
  const cy = ((s.centralRay.y + 1) / 2) * detector.heightCm;
  const halfW = (s.collimation.width * detector.widthCm) / 2;
  const halfH = (s.collimation.height * detector.heightCm) / 2;
  return {
    x1: Math.max(0, cx - halfW),
    x2: Math.min(detector.widthCm, cx + halfW),
    y1: Math.max(0, cy - halfH),
    y2: Math.min(detector.heightCm, cy + halfH),
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

/** Sides on which the region is clipped by the field. */
export function clippedSides(margins: Record<Side, number>): Side[] {
  return (Object.keys(margins) as Side[]).filter((side) => margins[side] < 0);
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
}

/** Square marker of `sizeCm` centred on a normalized position, in detector cm. */
export function markerRect(center: SimulationSettings["markerPosition"], sizeCm: number, detector: DetectorSpec): Rect {
  const cx = ((center.x + 1) / 2) * detector.widthCm;
  const cy = ((center.y + 1) / 2) * detector.heightCm;
  return { x1: cx - sizeCm / 2, x2: cx + sizeCm / 2, y1: cy - sizeCm / 2, y2: cy + sizeCm / 2 };
}

/**
 * Which half of the displayed detector a marker centre lies on (viewer's view; x < 0 left, x > 0 right).
 * A centre exactly on the midline belongs to neither side.
 */
export function viewerSideOf(position: SimulationSettings["markerPosition"]): ViewerSide | null {
  return position.x < 0 ? "viewer-left" : position.x > 0 ? "viewer-right" : null;
}

export function rectInside(inner: Rect, outer: Rect): boolean {
  return inner.x1 >= outer.x1 && inner.x2 <= outer.x2 && inner.y1 >= outer.y1 && inner.y2 <= outer.y2;
}
