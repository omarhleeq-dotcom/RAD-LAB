import type { ReactNode } from "react";
import { ELBOW_CM_PER_PX, elbowDrawingImage } from "@/features/positioning/drawing-data";
import { ELBOW_MODEL, LATERAL_COPY_WEIGHTS, LATERAL_HALF_PX, elbowApShifts, elbowDrawnRad, interpolateAnchors } from "@/features/elbow-model/elbow-model";
import { SCENE, STROKE, UNDER } from "./scene-style";
import { AP_OUTLINES, LATERAL_OUTLINES, smoothClosedPath, smoothOpenPath, type Pt } from "./elbow-visual";
import type { FigureProps } from "./detector-figures";

/**
 * Hand-drawn schematic of the ELBOW in detector space (S14.3; scenes "elbow-ap" and "elbow-lateral", own work, S13b visual language: dark
 * muted anatomy, thin bone outlines, no accent hue, guides in the two guide colours). The rotation drawing is the PROJECTION of the elbow model
 * (`features/elbow-model`), the SAME functions that displace the result image, so the drawing and the picture turn in the same direction:
 *  - AP: the whole arm is warped by the model's column anchors (the epicondyles narrow for either sign), the ulna and the radius move as two
 *    layers (apart for a positive value; toward each other until the radius is drawn over the ulna for a negative one);
 *  - lateral: the condyle outline and the radial head / coronoid are drawn twice, a lateral-side copy (toward the viewer's right for a positive
 *    value, 40 %) and a medial-side copy (toward the left, 60 %); one outline at the base pose. The three concentric arcs of the trochlear
 *    sulcus are NOT drawn.
 * The outlines are illustrative (read by eye from the baselines). Anatomy is an image convention and is never mirrored by RTL.
 */
export function ElbowDrawing({ radCase, settings, showGuides }: FigureProps) {
  const lateral = settings.projection === "elbow-lateral";
  const im = elbowDrawingImage(lateral ? "lateral" : "ap");
  const a = radCase.requiredAnatomy;
  const U = 10; // SVG units per detector cm (`detector-figures.tsx` U)
  const k = ELBOW_CM_PER_PX * U; // SVG units per image pixel
  const x0 = im.box.u1 * im.widthPx;
  const y0 = im.box.v1 * im.heightPx;
  const X = (px: number) => a.xCm * U + (px - x0) * k;
  const Y = (py: number) => a.yCm * U + (py - y0) * k;
  return lateral ? <Lateral X={X} Y={Y} k={k} rotationDeg={settings.rotationDeg} showGuides={showGuides} /> : <Ap X={X} Y={Y} rotationDeg={settings.rotationDeg} showGuides={showGuides} />;
}

type Map = (v: number) => number;
const softStyle = { fill: SCENE.limbFar, stroke: SCENE.edge, strokeWidth: STROKE.thin, strokeLinejoin: "round" } as const;
const boneStyle = { fill: SCENE.trunk, stroke: SCENE.bone, strokeWidth: STROKE.thin, strokeOpacity: 0.85, strokeLinejoin: "round" } as const;

function Ap({ X, Y, rotationDeg, showGuides }: { X: Map; Y: Map; rotationDeg: number; showGuides: boolean }): ReactNode {
  const W = ELBOW_MODEL.ap.widthPx;
  const sh = elbowApShifts(rotationDeg);
  const through = (anchors: { u: number; du: number }[]) => (pts: readonly Pt[]): Pt[] => pts.map(([x, y]) => [X(x + interpolateAnchors(anchors, x / W) * W), Y(y)] as Pt);
  const warp = through(sh.anchors), ulna = through(sh.ulnaAnchors), radius = through(sh.radiusAnchors);
  const [me, le] = warp(AP_OUTLINES.epicondyles);
  return (
    <>
      <path d={smoothClosedPath(warp(AP_OUTLINES.soft))} {...softStyle} />
      <path d={smoothClosedPath(warp(AP_OUTLINES.humerus))} {...boneStyle} />
      <path d={smoothClosedPath(ulna(AP_OUTLINES.ulna))} {...boneStyle} fillOpacity={0.9} />
      <path d={smoothClosedPath(radius(AP_OUTLINES.radius))} {...boneStyle} fillOpacity={0.8} />
      {showGuides && (
        <g aria-hidden>
          {/* the interepicondylar line (a reference line: sky) — it narrows as the arm rotates */}
          <line x1={me![0]} y1={me![1]} x2={le![0]} y2={le![1]} stroke={SCENE.underStroke} strokeWidth={2 + UNDER} strokeLinecap="round" />
          <line x1={me![0]} y1={me![1]} x2={le![0]} y2={le![1]} stroke={SCENE.guide} strokeWidth={2} strokeDasharray="3 5" strokeLinecap="round" />
        </g>
      )}
    </>
  );
}

function Lateral({ X, Y, k, rotationDeg, showGuides }: { X: Map; Y: Map; k: number; rotationDeg: number; showGuides: boolean }): ReactNode {
  const th = elbowDrawnRad(rotationDeg);
  const sCond = LATERAL_HALF_PX.condyles * Math.sin(th);
  const sHead = LATERAL_HALF_PX.radialHeadCoronoid * Math.sin(th);
  const pts = (arr: readonly Pt[], dx = 0): Pt[] => arr.map(([x, y]) => [X(x + dx), Y(y)] as Pt);
  const O = LATERAL_OUTLINES;
  const condyle = (dx: number, opacity: number, key: string) => (
    <g key={key} opacity={opacity}>
      <circle cx={X(O.circle.cx + dx)} cy={Y(O.circle.cy)} r={O.circle.r * k} fill="none" stroke={SCENE.bone} strokeWidth={STROKE.medium} />
      <path d={smoothOpenPath(pts(O.posteriorContour, dx))} fill="none" stroke={SCENE.bone} strokeWidth={STROKE.thin * 1.4} strokeLinecap="round" />
    </g>
  );
  const head = (dx: number, opacity: number, key: string) => (
    <g key={key} opacity={opacity}>
      <ellipse cx={X(O.radialHead.cx + dx)} cy={Y(O.radialHead.cy)} rx={O.radialHead.rx * k} ry={O.radialHead.ry * k} {...boneStyle} />
      <path d={smoothClosedPath(pts(O.coronoid, dx))} {...boneStyle} />
    </g>
  );
  return (
    <>
      <path d={smoothClosedPath(pts(O.soft))} {...softStyle} />
      <path d={smoothClosedPath(pts(O.humerus))} {...boneStyle} />
      <path d={smoothClosedPath(pts(O.radius))} {...boneStyle} />
      <path d={smoothClosedPath(pts(O.ulna))} {...boneStyle} />
      {/* medial-side copy (nearer the detector: stronger) and lateral-side copy (farther: weaker); one outline when they coincide */}
      {condyle(-sCond, LATERAL_COPY_WEIGHTS.medial + 0.25, "m")}
      {condyle(sCond, LATERAL_COPY_WEIGHTS.lateral + 0.15, "l")}
      {head(-sHead, LATERAL_COPY_WEIGHTS.medial + 0.25, "hm")}
      {head(sHead, LATERAL_COPY_WEIGHTS.lateral + 0.15, "hl")}
      {showGuides && (
        <g aria-hidden>
          {/* the centre of the condyle outline (a reference mark: sky) */}
          <circle cx={X(O.circle.cx)} cy={Y(O.circle.cy)} r={3} fill={SCENE.guide} stroke={SCENE.underStroke} strokeWidth={1.5} />
        </g>
      )}
    </>
  );
}
