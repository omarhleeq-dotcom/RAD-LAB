import { HAND_CM_PER_PX, handImage } from "@/data/exams/xray/hand-geometry";
import { handOutlineDrawing, type DrawnPart } from "./hand-outline-drawing";
import { LIMB, SCENE } from "./scene-style";
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
  const d = handOutlineDrawing(kind, settings.rotationDeg);
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      {handLayers(d).map(({ layer, part }) => (
        <path key={`${layer}|${part.id}|${part.copy}`} d={path(part, toSvg)} {...STYLE[layer](part)} />
      ))}
    </g>
  );
}

export type HandLayer = "soft" | "joint" | "boneFill" | "edgeUnder" | "edge";

/** The draw order: soft tissue, joint spaces, all bone fills, then all bone edges (under-strokes before lines). */
export function handLayers(d: ReturnType<typeof handOutlineDrawing>): { layer: HandLayer; part: DrawnPart }[] {
  return [
    { layer: "soft", part: d.soft },
    ...d.joints.map((part) => ({ layer: "joint" as const, part })),
    ...d.bones.map((part) => ({ layer: "boneFill" as const, part })),
    ...d.bones.map((part) => ({ layer: "edgeUnder" as const, part })),
    ...d.bones.map((part) => ({ layer: "edge" as const, part })),
  ];
}

/**
 * Fill opacity of one copy of a bone: the copies of a superimposed group (one per digit, or radius + ulna) coincide at the base
 * pose, so each copy gets the opacity whose n-fold overlap equals ONE bone's `LIMB.boneFillOpacity`.
 */
export const copyOpacity = (copies: number) => 1 - (1 - LIMB.boneFillOpacity) ** (1 / copies);

const STYLE: Record<HandLayer, (p: DrawnPart) => Record<string, string | number>> = {
  soft: () => ({ fill: SCENE.soft, stroke: SCENE.outline, strokeWidth: LIMB.softEdge }),
  joint: () => ({ fill: "none", stroke: SCENE.air, strokeWidth: LIMB.joint }),
  boneFill: (p) => ({ fill: SCENE.boneFill, fillOpacity: r(copyOpacity(p.copies), 3), stroke: "none" }),
  edgeUnder: () => ({ fill: "none", stroke: SCENE.underStroke, strokeWidth: LIMB.edgeUnder }),
  edge: () => ({ fill: "none", stroke: SCENE.boneLine, strokeWidth: LIMB.edge }),
};

const r = (v: number, n = 1) => Math.round(v * 10 ** n) / 10 ** n;

/** A smooth path through the traced control points (quadratic segments between the midpoints; corners slightly rounded). */
function path(p: DrawnPart, toSvg: (q: [number, number]) => string): string {
  const pts = p.points;
  const mid = (i: number): [number, number] => {
    const a = pts[i % pts.length]!, b = pts[(i + 1) % pts.length]!;
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  };
  if (pts.length < 3) return `M${pts.map(toSvg).join("L")}`;
  if (p.closed) {
    let s = `M${toSvg(mid(0))}`;
    for (let i = 1; i <= pts.length; i++) s += `Q${toSvg(pts[i % pts.length]!)} ${toSvg(mid(i))}`;
    return s + "Z";
  }
  let s = `M${toSvg(pts[0]!)}`;
  for (let i = 1; i < pts.length - 1; i++) s += `Q${toSvg(pts[i]!)} ${toSvg(mid(i))}`;
  return s + `L${toSvg(pts[pts.length - 1]!)}`;
}
