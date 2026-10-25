import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { collimatedField, markerRect, rectInside, rectsOverlap, regionToRect, type Side } from "@/features/simulation/geometry";
import { isMarkerWrongSide } from "@/features/simulation/marker-rule";

/** A direction is offered only when a whole square fits the CURRENT field and all existing exclusion/side rules. */
export function markerRoomSide(c: RadCase, s: SimulationSettings): Side | null {
  if (!s.sideMarker) return null;
  const f = collimatedField(s, c.detector), h = c.positioning.markerSizeCm / 2;
  const zones = (c.positioning.markerKeepOut ?? [c.requiredAnatomy]).map(regionToRect);
  const current = { x: (s.markerPosition.x + 1) * c.detector.widthCm / 2, y: (s.markerPosition.y + 1) * c.detector.heightCm / 2 };
  const axis = (values: number[], low: number, high: number) => {
    const sorted = [...new Set(values.filter(v => v >= low && v <= high))].sort((a, b) => a - b);
    return [...sorted, ...sorted.slice(1).map((v, i) => (v + sorted[i]!) / 2)];
  };
  const xs = axis([f.x1 + h, f.x2 - h, current.x, ...zones.flatMap(z => [z.x1 - h, z.x2 + h])], f.x1 + h, f.x2 - h);
  const ys = axis([f.y1 + h, f.y2 - h, current.y, ...zones.flatMap(z => [z.y1 - h, z.y2 + h])], f.y1 + h, f.y2 - h);
  let best: { distance: number; side: Side } | null = null;
  for (const x of xs) for (const y of ys) {
    const position = { x: 2 * x / c.detector.widthCm - 1, y: 2 * y / c.detector.heightCm - 1 };
    const square = markerRect(position, c.positioning.markerSizeCm, c.detector);
    if (!rectInside(square, f) || zones.some(z => rectsOverlap(square, z)) || isMarkerWrongSide(c.positioning, { side: s.sideMarker, position }, s.choices)) continue;
    const dx = x - current.x, dy = y - current.y, distance = dx * dx + dy * dy;
    const side: Side = Math.abs(dx) >= Math.abs(dy) ? dx < 0 ? "left" : "right" : dy < 0 ? "top" : "bottom";
    if (!best || distance < best.distance) best = { distance, side };
  }
  return best?.side ?? null;
}
