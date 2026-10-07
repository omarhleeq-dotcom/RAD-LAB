import type { ReactNode } from "react";
import { HAND_CM_PER_PX, handImage } from "@/data/exams/xray/hand-geometry";
import { projectHand, type Projected } from "@/features/hand-model/hand-model";
import { SCENE, STROKE } from "./scene-style";
import type { FigureProps } from "./detector-figures";

/**
 * Hand-drawn schematic of the HAND in detector space (S14.2b; scenes "hand-pa" and "hand-lateral", own work, S13b visual language:
 * dark muted anatomy, thin bone outlines, no accent hue). Since S14.2b-FIX it is the PROJECTION of ONE parametric 2.5D hand model
 * (`features/hand-model/hand-model.ts`, also the source of the result image's displacements): every part is a tube with an elliptical
 * cross-section that turns about the forearm long axis, so the drawing changes continuously with the rotation value and turns in the
 * SAME direction as the result image (positive = the ulnar-side structures toward the viewer's right). At the base pose it is the
 * approved silhouette: PA palm down, digits slightly spread, thumb on the viewer's right; lateral (extension) thumb side up, digits
 * superimposed, thumb separated. Soft tissue is drawn first, then the bones from far to near with a subtle depth shading.
 * The model is ILLUSTRATIVE (an engine / teaching choice, never a measurement). Anatomy is an image convention and is never
 * mirrored by RTL. The drawing follows the learner's projection setting.
 */
export function HandDrawing({ radCase, settings }: FigureProps) {
  const lateral = settings.projection === "hand-lateral";
  const kind = lateral ? "lateral" : "pa";
  const im = handImage(kind);
  const a = radCase.requiredAnatomy;
  const U = 10; // SVG units per detector cm (`detector-figures.tsx` U)
  const k = HAND_CM_PER_PX * U; // SVG units per image pixel
  const x0 = im.box.u1 * im.widthPx;
  const y0 = im.box.v1 * im.heightPx;
  const X = (px: number) => a.xCm * U + (px - x0) * k;
  const Y = (py: number) => a.yCm * U + (py - y0) * k;
  const parts = projectHand(kind, settings.rotationDeg);
  const bones = parts.filter((p) => p.tube.layer === "bone");
  const dMin = Math.min(...bones.map((p) => p.depth)), dMax = Math.max(...bones.map((p) => p.depth));
  return (
    <>
      {parts.map((p) => (
        <Part key={p.tube.id} p={p} X={X} Y={Y} k={k} near={p.tube.layer === "bone" && dMax > dMin ? (p.depth - dMin) / (dMax - dMin) : 0.5} />
      ))}
    </>
  );
}

const softStyle = { fill: SCENE.limbFar, stroke: SCENE.edge, strokeWidth: STROKE.thin, strokeLinejoin: "round" } as const;
const boneStyle = { fill: SCENE.trunk, stroke: SCENE.bone, strokeWidth: STROKE.thin, strokeOpacity: 0.85, strokeLinejoin: "round" } as const;

function Part({ p, X, Y, k, near }: { p: Projected; X: (px: number) => number; Y: (py: number) => number; k: number; near: number }): ReactNode {
  const soft = p.tube.layer === "soft";
  const s = soft ? softStyle : boneStyle;
  // Depth shading of the bones only: a nearer bone is slightly more opaque (same tokens, no new colour).
  const opacity = soft ? 1 : 0.7 + 0.3 * near;
  if (p.tube.shape === "blob") {
    return <ellipse cx={X(p.x1)} cy={Y(p.y1)} rx={(p.w1 / 2) * k} ry={(p.tube.wa[0] / 2) * 0.85 * k} {...s} opacity={opacity} />;
  }
  if (p.tube.shape === "poly") {
    const pts = [[p.x1 - p.w1 / 2, p.y1], [p.x1 + p.w1 / 2, p.y1], [p.x2 + p.w2 / 2, p.y2], [p.x2 - p.w2 / 2, p.y2]];
    // rounded ends: an ellipse cap at each end (the polygon alone reads as a rectangle)
    const cap = (x: number, y: number, w: number) => <ellipse cx={X(x)} cy={Y(y)} rx={(w / 2) * k} ry={Math.min(w / 2, 110) * k} {...s} />;
    return (
      <g opacity={opacity}>
        {cap(p.x1, p.y1, p.w1)}
        {cap(p.x2, p.y2, p.w2)}
        <polygon points={pts.map(([x, y]) => `${X(x!)},${Y(y!)}`).join(" ")} {...s} stroke="none" />
        <line x1={X(p.x1 - p.w1 / 2)} y1={Y(p.y1)} x2={X(p.x2 - p.w2 / 2)} y2={Y(p.y2)} stroke={s.stroke} strokeWidth={s.strokeWidth} />
        <line x1={X(p.x1 + p.w1 / 2)} y1={Y(p.y1)} x2={X(p.x2 + p.w2 / 2)} y2={Y(p.y2)} stroke={s.stroke} strokeWidth={s.strokeWidth} />
      </g>
    );
  }
  const w = ((p.w1 + p.w2) / 2) * k;
  const line = { x1: X(p.x1), y1: Y(p.y1), x2: X(p.x2), y2: Y(p.y2), strokeLinecap: "round" as const };
  return (
    <g opacity={opacity}>
      <line {...line} stroke={s.stroke} strokeOpacity={soft ? 1 : 0.85} strokeWidth={w + 2 * s.strokeWidth} />
      <line {...line} stroke={s.fill} strokeWidth={w} />
    </g>
  );
}
