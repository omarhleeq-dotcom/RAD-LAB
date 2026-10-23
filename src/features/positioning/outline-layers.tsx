import { LIMB, SCENE } from "./scene-style";
import type { DrawnPart } from "./outline-geometry";

/**
 * The limb drawing style of the traced-outline figures (hand 2a, wrist and foot 2b; `LIMB` in `scene-style.ts`, ENGINE_GUIDE "Limb drawing
 * style"): soft tissue → joint spaces → TRANSLUCENT bone fills → every bone's cortex edge last. Superimposed bones therefore read lighter and
 * keep their own edge, as in a radiograph; no bone is hidden by an opaque fill at any rotation (open finding H1). `outlineLayers` is the draw
 * order the full-rotation tests check.
 */
export type OutlineLayer = "softFill" | "soft" | "joint" | "boneFill" | "line" | "edgeUnder" | "edge";

interface Drawing<P extends DrawnPart = DrawnPart> {
  /** The soft-tissue silhouette edge (one open outline, or several where the image edge cuts the silhouette). */
  soft: P | P[];
  bones: P[];
  joints: P[];
  /** Optional light interior / neighbouring lines (shoulder 2c: the greater-tuberosity line and the scapular border lines), drawn over the bone fills and under the edges. */
  lines?: P[];
}

/** The draw order: soft tissue, joint spaces, all bone fills, then all bone edges (under-strokes before lines). */
export function outlineLayers<P extends DrawnPart>(d: Drawing<P>): { layer: OutlineLayer; part: P }[] {
  return [
    // an open silhouette that carries its own fill polygon (wrist, foot): the fill first, then every run as a line only
    ...(Array.isArray(d.soft) ? d.soft : [d.soft]).filter((part) => part.fillPoints?.length).map((part) => ({ layer: "softFill" as const, part })),
    ...(Array.isArray(d.soft) ? d.soft : [d.soft]).map((part) => ({ layer: "soft" as const, part })),
    ...d.joints.map((part) => ({ layer: "joint" as const, part })),
    ...d.bones.map((part) => ({ layer: "boneFill" as const, part })),
    ...(d.lines ?? []).map((part) => ({ layer: "line" as const, part })),
    ...d.bones.map((part) => ({ layer: "edgeUnder" as const, part })),
    ...d.bones.map((part) => ({ layer: "edge" as const, part })),
  ];
}

/**
 * Fill opacity of one copy of a bone: the copies of a superimposed group (one per digit, or radius + ulna) coincide at the base
 * pose, so each copy gets the opacity whose n-fold overlap equals ONE bone's `LIMB.boneFillOpacity`.
 */
export const copyOpacity = (copies: number) => 1 - (1 - LIMB.boneFillOpacity) ** (1 / copies);

export const r = (v: number, n = 1) => Math.round(v * 10 ** n) / 10 ** n;

const STYLE: Record<OutlineLayer, (p: DrawnPart) => Record<string, string | number>> = {
  softFill: () => ({ fill: SCENE.soft, stroke: "none" }),
  soft: (p) => ({ fill: p.fillPoints ? "none" : SCENE.soft, stroke: SCENE.outline, strokeWidth: LIMB.softEdge }),
  joint: () => ({ fill: "none", stroke: SCENE.air, strokeWidth: LIMB.joint }),
  boneFill: (p) => ({ fill: SCENE.boneFill, fillOpacity: r(copyOpacity(p.copies), 3), stroke: "none" }),
  line: () => ({ fill: "none", stroke: SCENE.boneLine, strokeOpacity: 0.42, strokeWidth: LIMB.joint }),
  edgeUnder: () => ({ fill: "none", stroke: SCENE.underStroke, strokeWidth: LIMB.edgeUnder }),
  edge: () => ({ fill: "none", stroke: SCENE.boneLine, strokeWidth: LIMB.edge }),
};

/** A smooth path through the traced control points (quadratic segments between the midpoints; corners slightly rounded). */
export function outlinePath(p: DrawnPart, toSvg: (q: [number, number]) => string): string {
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

/** The layers as SVG paths; `toSvg` maps an image px point to "x,y" in the figure's units. */
export function OutlineLayers<P extends DrawnPart>({ d, toSvg }: { d: Drawing<P>; toSvg: (q: [number, number]) => string }) {
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      {outlineLayers(d).map(({ layer, part }) => (
        <path key={`${layer}|${part.id}|${part.copy}`} d={outlinePath(layer === "softFill" || layer === "boneFill" ? { ...part, points: part.fillPoints?.length ? part.fillPoints : part.points, closed: part.fillPoints?.length ? true : part.closed } : part, toSvg)} {...STYLE[layer](part)} />
      ))}
    </g>
  );
}
