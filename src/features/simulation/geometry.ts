import type { DetectorRegion, DetectorSpec } from "@/domain/case";
import type { SimulationSettings, ViewerSide } from "@/domain/simulation";
import type { RadiographAssetSpec } from "@/domain/radiograph";

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

/**
 * Where the baseline image and its anatomy landmark box lie on the detector (cm). ONE uniform "contain" scale fits the
 * landmark box inside the required-anatomy region, centred on it, so a region larger than the box leaves anatomy-free strips
 * on its limiting-axis neighbours. The picture (`buildRenderPlan`) and the coverage score (S2) both read this single fit.
 */
export function fitAnatomyBox(
  spec: Pick<RadiographAssetSpec, "widthPx" | "heightPx" | "anatomyBox">,
  req: DetectorRegion,
): { image: { x1: number; y1: number; widthCm: number; heightCm: number }; landmarkCm: Rect } {
  const box = spec.anatomyBox;
  const boxWpx = (box.u2 - box.u1) * spec.widthPx;
  const boxHpx = (box.v2 - box.v1) * spec.heightPx;
  const cmPerPx = Math.min(req.widthCm / boxWpx, req.heightCm / boxHpx);
  const widthCm = spec.widthPx * cmPerPx;
  const heightCm = spec.heightPx * cmPerPx;
  const boxLeft = req.xCm + (req.widthCm - boxWpx * cmPerPx) / 2;
  const boxTop = req.yCm + (req.heightCm - boxHpx * cmPerPx) / 2;
  const image = { x1: boxLeft - box.u1 * widthCm, y1: boxTop - box.v1 * heightCm, widthCm, heightCm };
  const landmarkCm = {
    x1: image.x1 + box.u1 * widthCm,
    x2: image.x1 + box.u2 * widthCm,
    y1: image.y1 + box.v1 * heightCm,
    y2: image.y1 + box.v2 * heightCm,
  };
  return { image, landmarkCm };
}

/** Tolerance 1e-6 cm: the box is fitted flush to the region on the limiting axis (floating-point noise only). */
const LANDMARK_EPS = 1e-6;

/** True when the field edge on this side reaches into the landmark box (the anatomy drawn in the baseline), not just the spare margin. */
export function fieldCutsLandmarkBox(side: Side, field: Rect, landmark: Rect): boolean {
  return side === "left" ? field.x1 > landmark.x1 + LANDMARK_EPS
    : side === "right" ? field.x2 < landmark.x2 - LANDMARK_EPS
    : side === "top" ? field.y1 > landmark.y1 + LANDMARK_EPS
    : field.y2 < landmark.y2 - LANDMARK_EPS;
}

/**
 * The smallest field that can cover `target` when it must stay centred on the central ray (a real collimator opens
 * symmetrically about the ray in this simulator), clamped to the detector. How far a field is opened beyond it is the part of
 * the enlargement the learner could have avoided with the ray where it is (S2): what the geometry or the marker forces is not.
 */
export function minimalFieldAround(
  s: Pick<SimulationSettings, "centralRay">,
  target: Rect,
  detector: DetectorSpec,
): Rect {
  const cx = ((s.centralRay.x + 1) / 2) * detector.widthCm;
  const cy = ((s.centralRay.y + 1) / 2) * detector.heightCm;
  const halfW = Math.max(cx - target.x1, target.x2 - cx, 0);
  const halfH = Math.max(cy - target.y1, target.y2 - cy, 0);
  return {
    x1: Math.max(0, cx - halfW),
    x2: Math.min(detector.widthCm, cx + halfW),
    y1: Math.max(0, cy - halfH),
    y2: Math.min(detector.heightCm, cy + halfH),
  };
}

/** Bounding box of two rects. */
export const unionRect = (a: Rect, b: Rect): Rect => ({
  x1: Math.min(a.x1, b.x1),
  y1: Math.min(a.y1, b.y1),
  x2: Math.max(a.x2, b.x2),
  y2: Math.max(a.y2, b.y2),
});
