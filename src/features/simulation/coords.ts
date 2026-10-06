/**
 * Pure coordinate helpers for the positioning workspace. No DOM, no React.
 *
 * Coordinate spaces:
 *  - client : pointer position in CSS pixels (MouseEvent.clientX/Y)
 *  - view   : SVG user units inside the workspace viewBox
 *  - norm   : detector-normalized, x/y in [-1, +1] (see NormPoint). This is the stored simulation state.
 *  - cm     : centimetres from the detector's top-left corner
 *
 * Normalized x = -1 is always the left edge of the detector *as drawn*. UI direction (LTR/RTL) never
 * enters these functions, so Arabic RTL cannot mirror anatomy.
 */
import type { DetectorSpec } from "@/domain/case";
import type { CollimationSize, NormPoint } from "@/domain/simulation";

export interface Point {
  x: number;
  y: number;
}
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}
/** Where the detector is drawn inside the SVG viewBox. */
export type DetectorFrame = Box;
/** An element's on-screen box (from getBoundingClientRect). */
export interface ScreenBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
export const clampNorm = (v: number) => clamp(v, -1, 1);
export const clampPoint = (p: NormPoint): NormPoint => ({ x: clampNorm(p.x), y: clampNorm(p.y) });

/**
 * Pointer (client px) → SVG viewBox units, for an SVG sized with `preserveAspectRatio="xMidYMid meet"`.
 * Handles letterboxing, so it stays correct when the workspace is resized or its aspect ratio differs.
 */
export function clientToView(client: Point, screen: ScreenBox, viewBox: Box): Point {
  if (screen.width <= 0 || screen.height <= 0) return { x: viewBox.x, y: viewBox.y };
  const scale = Math.min(screen.width / viewBox.width, screen.height / viewBox.height);
  const offsetX = (screen.width - viewBox.width * scale) / 2;
  const offsetY = (screen.height - viewBox.height * scale) / 2;
  return {
    x: viewBox.x + (client.x - screen.left - offsetX) / scale,
    y: viewBox.y + (client.y - screen.top - offsetY) / scale,
  };
}

/** SVG viewBox units → detector-normalized (unclamped). */
export function viewToNorm(p: Point, frame: DetectorFrame): NormPoint {
  return {
    x: ((p.x - frame.x) / frame.width) * 2 - 1,
    y: ((p.y - frame.y) / frame.height) * 2 - 1,
  };
}

/** Detector-normalized → SVG viewBox units. */
export function normToView(n: NormPoint, frame: DetectorFrame): Point {
  return {
    x: frame.x + ((n.x + 1) / 2) * frame.width,
    y: frame.y + ((n.y + 1) / 2) * frame.height,
  };
}

/** Detector-normalized → cm from the detector's top-left corner. */
export function normToCm(n: NormPoint, detector: DetectorSpec): Point {
  return { x: ((n.x + 1) / 2) * detector.widthCm, y: ((n.y + 1) / 2) * detector.heightCm };
}

/** cm from the detector's top-left corner → detector-normalized. */
export function cmToNorm(p: Point, detector: DetectorSpec): NormPoint {
  return { x: (p.x / detector.widthCm) * 2 - 1, y: (p.y / detector.heightCm) * 2 - 1 };
}

/** Pointer (client px) → clamped detector-normalized, in one step. */
export function clientToNorm(client: Point, screen: ScreenBox, viewBox: Box, frame: DetectorFrame): NormPoint {
  return clampPoint(viewToNorm(clientToView(client, screen, viewBox), frame));
}

export type FieldEdge = "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

/**
 * Drag a collimator edge/corner to a pointer position (normalized). The field stays centred on the
 * central ray, so the dragged edge sets the half-extent on that axis. Result is clamped to
 * [minSize, 1] (1 = full detector).
 */
export function collimationFromEdgeDrag(
  pointer: NormPoint,
  ray: NormPoint,
  edge: FieldEdge,
  current: CollimationSize,
  minSize: number,
): CollimationSize {
  const changesWidth = edge !== "top" && edge !== "bottom";
  const changesHeight = edge !== "left" && edge !== "right";
  return {
    width: changesWidth ? clamp(Math.abs(pointer.x - ray.x), minSize, 1) : current.width,
    height: changesHeight ? clamp(Math.abs(pointer.y - ray.y), minSize, 1) : current.height,
  };
}

/** Keyboard/nudge helper: move a normalized point by a delta and clamp to the detector. */
export function nudge(p: NormPoint, dx: number, dy: number): NormPoint {
  return clampPoint({ x: p.x + dx, y: p.y + dy });
}

/** Round to a fixed number of decimals (state hygiene after pointer maths). */
export const roundTo = (v: number, decimals = 3) => {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
};
