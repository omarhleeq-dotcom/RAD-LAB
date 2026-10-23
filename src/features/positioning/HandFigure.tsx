import { HAND_CM_PER_PX, handImage } from "@/data/exams/xray/hand-geometry";
import { handOutlineDrawing, type DrawnPart } from "./hand-outline-drawing";
import { copyOpacity, OutlineLayers, outlineLayers, r, type OutlineLayer } from "./outline-layers";
import type { FigureProps } from "./detector-figures";

/**
 * Schematic of the HAND in detector space (scenes "hand-pa" and "hand-lateral"). Since RAD-072 2a it is drawn from the outlines
 * TRACED from the project's own baselines (`hand-outlines.json`, A-015 / A-017; illustrative, drawing-only, not a measurement),
 * moved by the shared 2.5D hand model (`features/hand-model/hand-model.ts`, also the source of the result image's displacements)
 * through `handOutlineDrawing`, so the drawing turns in the SAME direction as the result image. At the base pose it is the traced
 * hand: PA palm down, digits slightly spread, thumb on the viewer's right; lateral (extension) thumb side up, digits superimposed,
 * thumb separated.
 *
 * Limb drawing style (`LIMB`): soft tissue → joint spaces → TRANSLUCENT bone fills → every bone's cortex edge last. Superimposed
 * bones therefore read lighter and keep their own edge, as in a radiograph; no bone is hidden by an opaque fill at any rotation
 * (open finding H1: before, the thumb of the lateral vanished under the digit column at −10°…−15°). The `layers` order below
 * is the contract the full-rotation test checks. The figure draws a LEFT hand (both hand exams are fixed-side L; a right-hand case
 * would pass `mirror: true`). Anatomy is an image convention and is never mirrored by RTL. The drawing follows the projection setting.
 */
export function HandDrawing({ radCase, settings }: FigureProps) {
  const kind = settings.projection === "hand-lateral" ? "lateral" : "pa";
  const im = handImage(kind);
  const a = radCase.requiredAnatomy;
  const U = 10; // SVG units per detector cm (`detector-figures.tsx` U)
  const k = HAND_CM_PER_PX * U; // SVG units per image pixel
  const x0 = im.box.u1 * im.widthPx;
  const y0 = im.box.v1 * im.heightPx;
  const toSvg = ([px, py]: [number, number]) => `${r(a.xCm * U + (px - x0) * k)},${r(a.yCm * U + (py - y0) * k)}`;
  return <OutlineLayers d={handOutlineDrawing(kind, settings.rotationDeg)} toSvg={toSvg} />;
}

export type HandLayer = OutlineLayer;

/** The draw order of the hand figure (the shared limb layers; the full-rotation test checks it). */
export const handLayers = (d: ReturnType<typeof handOutlineDrawing>): { layer: HandLayer; part: DrawnPart }[] => outlineLayers(d);
export { copyOpacity };
