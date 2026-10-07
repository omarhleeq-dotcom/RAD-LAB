import type { ReactNode } from "react";
import type { ChinPositionId } from "@/domain/simulation";
import { SCENE, STROKE } from "./scene-style";

interface LabelProps {
  x: number;
  y: number;
  size: number;
  anchor?: "start" | "middle" | "end";
  fill?: string;
  children: ReactNode;
}

/** A scene label: fixed-direction (the SVG is `direction: ltr`), with a dark halo so it stays legible over any fill. */
export function SceneLabel({ x, y, size, anchor = "start", fill = SCENE.label, children }: LabelProps) {
  return (
    <text x={x} y={y} fontSize={size} textAnchor={anchor} fill={fill} stroke={SCENE.bg} strokeWidth={size / 5} paintOrder="stroke" strokeLinejoin="round">
      {children}
    </text>
  );
}

interface ArrowProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  width?: number;
  dashed?: boolean;
}

/** A line with a filled arrowhead at (x2, y2). Drawn with a polygon (no <marker> ids, no text glyph arrows: nothing to mirror in RTL). */
export function SceneArrow({ x1, y1, x2, y2, color = SCENE.label, width = STROKE.medium, dashed }: ArrowProps) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = width * 3.4;
  const bx = x2 - Math.cos(a) * h;
  const by = y2 - Math.sin(a) * h;
  const px = -Math.sin(a) * h * 0.55;
  const py = Math.cos(a) * h * 0.55;
  return (
    <g aria-hidden>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dashed ? "4 5" : undefined} />
      <polygon points={`${x2},${y2} ${bx + px},${by + py} ${bx - px},${by - py}`} fill={color} />
    </g>
  );
}

interface HeadProps {
  cx: number;
  cy: number;
  /** Scale (1 = skull about 60 units wide). */
  s: number;
  /** +1 = the face looks toward +x, −1 = toward −x (the drawing is mirrored; never by RTL). */
  facing: 1 | -1;
  /** Drawn when the chin cue is scored in this projection: tucked tilts the face down, elevated lifts it. */
  chin?: ChinPositionId;
}

/**
 * Side profile of the head with a chin cue: skull, ear, nose, jaw. The head tilts about the neck (chin tucked = the face
 * rotated down, elevated = up). Drawing only; never a measurement (the chin is a patient-cue choice).
 */
export function HeadProfile({ cx, cy, s, facing, chin }: HeadProps) {
  const tilt = chin === "tucked" ? 24 : chin === "elevated" ? -10 : 0;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${facing * s} ${s})`}>
      <g transform={`rotate(${tilt} -6 30)`}>
        <ellipse cx={0} cy={0} rx={30} ry={32} fill={SCENE.head} />
        {/* face profile: forehead, nose, lips, chin, underside of the jaw (same fill as the skull: one silhouette) */}
        <path d="M 22 -18 L 29 -4 L 42 9 L 30 13 L 33 21 L 27 31 Q 14 40 -4 35 L -14 20 Z" fill={SCENE.head} />
        <path d="M -8 26 Q 10 30 28 24" fill="none" stroke={SCENE.bone} strokeWidth={STROKE.thin / s} opacity={0.7} />
        <circle cx={-6} cy={4} r={5} fill="none" stroke={SCENE.bone} strokeWidth={STROKE.thin / s} />
      </g>
    </g>
  );
}
