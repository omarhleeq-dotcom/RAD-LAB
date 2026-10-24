"use client";

import { useContext, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { ChinPositionId } from "@/domain/simulation";
import { SCENE, STROKE, UNDER } from "./scene-style";
import { PhoneFrameLabelContext, frameLabelKey } from "./PhoneFrameLabels";

interface LabelProps {
  x: number;
  y: number;
  size: number;
  anchor?: "start" | "middle" | "end";
  fill?: string;
  children: string;
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A scene label: fixed-direction (the SVG is `direction: ltr`) on a semi-opaque dark pill measured from the rendered text, so it
 * stays legible over any fill without a stroke halo (a halo smears Arabic letter joins). Before the first measurement (server
 * render) the text is drawn without the pill. Decorative to assistive tech: the drawing's text alternative carries the meaning
 * (callers wrap labels in an `aria-hidden` group where the label is not itself the accessible name).
 */
export function SceneLabel({ x, y, size, anchor = "start", fill = SCENE.label, children }: LabelProps) {
  const rows = useContext(PhoneFrameLabelContext);
  const key = frameLabelKey(x, y, size, children);
  if (rows) {
    const position = rows.positions[key];
    x = position?.x ?? 0; y = position?.y ?? 0; anchor = "start";
  }
  const ref = useRef<SVGTextElement>(null);
  const [box, setBox] = useState<Box | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const b = ref.current?.getBBox();
      if (b && b.width > 0) setBox((o) => (o && o.x === b.x && o.y === b.y && o.width === b.width && o.height === b.height ? o : { x: b.x, y: b.y, width: b.width, height: b.height }));
    };
    measure();
    void document.fonts?.ready.then(measure);
  }, [x, y, size, anchor, children]);
  return (
    <g style={{ pointerEvents: "none" }}>
      {box && <rect x={box.x - 5} y={box.y - 1} width={box.width + 10} height={box.height + 2} rx={5} fill={SCENE.underStroke} opacity={0.82} />}
      <text ref={ref} data-phone-frame-label={rows ? key : undefined} x={x} y={y} fontSize={size} textAnchor={anchor} fill={fill}>
        {children}
      </text>
    </g>
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

/** A line with a filled arrowhead at (x2, y2), on a dark under-stroke. Drawn with a polygon (no <marker> ids, no text glyph arrows: nothing to mirror in RTL). */
export function SceneArrow({ x1, y1, x2, y2, color = SCENE.label, width = STROKE.medium, dashed }: ArrowProps) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = width * 3.4;
  const bx = x2 - Math.cos(a) * h;
  const by = y2 - Math.sin(a) * h;
  const px = -Math.sin(a) * h * 0.55;
  const py = Math.cos(a) * h * 0.55;
  const head = `${x2},${y2} ${bx + px},${by + py} ${bx - px},${by - py}`;
  return (
    <g aria-hidden>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={SCENE.underStroke} strokeWidth={width + UNDER} strokeLinecap="round" />
      <polygon points={head} fill={SCENE.underStroke} stroke={SCENE.underStroke} strokeWidth={UNDER} strokeLinejoin="round" />
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dashed ? "4 5" : undefined} />
      <polygon points={head} fill={color} />
    </g>
  );
}

interface UnderProps {
  stroke: string;
  width: number;
  dash?: string;
  opacity?: number;
  children: (p: { stroke: string; strokeWidth: number; strokeDasharray?: string; opacity?: number; fill?: string; strokeLinecap?: "round" }) => ReactNode;
}

/**
 * An accent stroke drawn twice: first the dark under-stroke (solid, wider), then the accent itself, so a dashed or thin
 * interactive / guide line reads on ANY fill. `children` receives the SVG stroke props for each pass and returns the element.
 */
export function UnderStroked({ stroke, width, dash, opacity, children }: UnderProps) {
  return (
    <>
      {children({ stroke: SCENE.underStroke, strokeWidth: width + UNDER * 2, opacity: 0.85, fill: "none", strokeLinecap: "round" })}
      {children({ stroke, strokeWidth: width, strokeDasharray: dash, opacity })}
    </>
  );
}

interface LimbPoint {
  x: number;
  y: number;
  /** Width of the limb at this joint. */
  w: number;
}

/**
 * A tapered, outlined limb through the given joints (shoulder → elbow → wrist → hand): a quad per segment plus a round joint,
 * drawn twice (outline pass, then the fill pass) so the outline is only the outer contour. Not a constant-width tube.
 */
export function Limb({ pts, fill = SCENE.limb, outline = SCENE.edge, outlineWidth = STROKE.thin * 2, opacity = 1 }: { pts: LimbPoint[]; fill?: string; outline?: string; outlineWidth?: number; opacity?: number }) {
  const shapes = pts.slice(0, -1).map((p, i) => {
    const q = pts[i + 1]!;
    const a = Math.atan2(q.y - p.y, q.x - p.x) + Math.PI / 2;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    return `M ${p.x + (dx * p.w) / 2} ${p.y + (dy * p.w) / 2} L ${q.x + (dx * q.w) / 2} ${q.y + (dy * q.w) / 2} L ${q.x - (dx * q.w) / 2} ${q.y - (dy * q.w) / 2} L ${p.x - (dx * p.w) / 2} ${p.y - (dy * p.w) / 2} Z`;
  });
  const parts = (
    <>
      {shapes.map((d, i) => (
        <path key={i} d={d} />
      ))}
      {pts.map((p, i) => (
        <circle key={`c${i}`} cx={p.x} cy={p.y} r={p.w / 2} />
      ))}
    </>
  );
  return (
    <g opacity={opacity}>
      <g fill={outline} stroke={outline} strokeWidth={outlineWidth} strokeLinejoin="round">
        {parts}
      </g>
      <g fill={fill} stroke={fill} strokeWidth={0.5}>
        {parts}
      </g>
    </g>
  );
}

interface HeadProps {
  cx: number;
  cy: number;
  /** Scale (1 = skull about 76 units deep, 86 tall). */
  s: number;
  /** +1 = the face looks toward +x, −1 = toward −x (the drawing is mirrored; never by RTL). */
  facing: 1 | -1;
  /** Drawn when the chin cue is scored in this projection: tucked tilts the face down, elevated lifts it. */
  chin?: ChinPositionId;
  /** Extra rotation (SVG degrees, applied about the head centre before mirroring): −90 turns a face looking +x to look up (supine). */
  turn?: number;
}

/**
 * Profile of the head and the start of the neck: skull, forehead, nose, lips, chin and the under-jaw in ONE silhouette (no ear
 * or eye: nothing the drawing does not need). The head tilts about the neck (chin tucked = the face down, elevated = up).
 * Drawing only; never a measurement (the chin is a patient-cue choice).
 */
export function HeadProfile({ cx, cy, s, facing, chin, turn = 0 }: HeadProps) {
  const tilt = chin === "tucked" ? 20 : chin === "elevated" ? -9 : 0;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${facing * s} ${s}) rotate(${turn})`}>
      <g transform={`rotate(${tilt} 0 44)`}>
        <path
          d="M 0 -42 C 22 -42 36 -30 35 -12 L 37 -4 L 48 10 L 36 14 L 38 20 L 36 26 L 34 38 C 30 40 22 42 12 44 L -12 44 C -26 34 -38 20 -38 -2 C -38 -28 -22 -42 0 -42 Z"
          fill={SCENE.head}
          stroke={SCENE.edge}
          strokeWidth={STROKE.thin / s}
          strokeLinejoin="round"
        />
      </g>
    </g>
  );
}
