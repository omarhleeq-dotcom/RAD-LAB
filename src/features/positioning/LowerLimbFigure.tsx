import type { ReactNode } from "react";
import { lowerLimbImage, type LowerLimbKind } from "@/data/exams/xray/lower-limb-geometry";
import { footAnchors, kneeApShifts, kneeLateralCopies, interpolateAnchors, KNEE_AP_MODEL, KNEE_LATERAL_COPY_WEIGHTS, footValue, FOOT_MODEL } from "@/features/lower-limb-model/lower-limb-model";
import { SCENE, STROKE } from "./scene-style";
import { smoothClosedPath, smoothOpenPath } from "./elbow-visual";
import { footShiftPx, OUTLINES, type FootOutline, type Pt } from "./lower-limb-visual";
import type { FigureProps } from "./detector-figures";

/**
 * Hand-drawn schematic of the KNEE and the FOOT in detector space (S14.4; scenes "knee-ap", "knee-lateral", "foot-ap" and "foot-oblique", own work,
 * S13b visual language: dark muted anatomy, thin bone outlines, no accent hue, guides in the two guide colours). The rotation drawing is the PROJECTION
 * of the lower-limb model (`features/lower-limb-model`), the SAME functions that displace the result image, so the drawing and the picture turn in the
 * same direction:
 *  - knee AP: the whole leg is warped by the model's column anchors (the condyle edges and the intercondylar eminence move by depth); the fibula and the
 *    tibia move as two layers below the joint, so the fibular head is covered by the tibia more or less;
 *  - knee lateral: the femoral condyle outline and the fibular head are drawn twice, a far-side copy and a near-side copy (one outline at the base pose);
 *  - foot AP / oblique: the toes and the metatarsals are displaced column by column (band-weighted, as the result image); the oblique's value is the
 *    deviation of the plantar angle from 40°.
 * The outlines are illustrative (read by eye from the baselines). Anatomy is an image convention and is never mirrored by RTL.
 */
export function LowerLimbDrawing({ radCase, settings, showGuides }: FigureProps) {
  const kind = (["knee-ap", "knee-lateral", "foot-ap", "foot-oblique"].includes(settings.projection) ? settings.projection : radCase.requiredProjection) as LowerLimbKind;
  const im = lowerLimbImage(kind);
  const a = radCase.requiredAnatomy;
  const U = 10; // SVG units per detector cm (`detector-figures.tsx` U)
  const k = im.cmPerPx * U; // SVG units per image pixel
  const x0 = im.box.u1 * im.widthPx;
  const y0 = im.box.v1 * im.heightPx;
  const X = (px: number) => a.xCm * U + (px - x0) * k;
  const Y = (py: number) => a.yCm * U + (py - y0) * k;
  const rot = settings.rotationDeg;
  if (kind === "knee-ap") return <KneeAp X={X} Y={Y} rotationDeg={rot} showGuides={showGuides} />;
  if (kind === "knee-lateral") return <KneeLateral X={X} Y={Y} rotationDeg={rot} showGuides={showGuides} />;
  return <Foot kind={kind === "foot-ap" ? "ap" : "oblique"} X={X} Y={Y} k={k} rotationDeg={rot} showGuides={showGuides} bands={radCase.radiograph.limbRotation && "bands" in radCase.radiograph.limbRotation ? radCase.radiograph.limbRotation.bands : []} />;
}

type Map = (v: number) => number;
const softStyle = { fill: SCENE.limbFar, stroke: SCENE.edge, strokeWidth: STROKE.thin, strokeLinejoin: "round" } as const;
const boneStyle = { fill: SCENE.trunk, stroke: SCENE.bone, strokeWidth: STROKE.thin, strokeOpacity: 0.85, strokeLinejoin: "round" } as const;

function KneeAp({ X, Y, rotationDeg, showGuides }: { X: Map; Y: Map; rotationDeg: number; showGuides: boolean }): ReactNode {
  const W = KNEE_AP_MODEL.widthPx;
  const sh = kneeApShifts(rotationDeg);
  const through = (anchors: { u: number; du: number }[]) => (pts: readonly Pt[]): Pt[] => pts.map(([x, y]) => [X(x + interpolateAnchors(anchors, x / W) * W), Y(y)] as Pt);
  const warp = through(sh.anchors), fibula = through(sh.fibulaAnchors), tibia = through(sh.tibiaAnchors);
  const O = OUTLINES.kneeAp;
  const [le, me] = warp(O.epicondyles);
  return (
    <>
      <path d={smoothClosedPath(warp(O.soft))} {...softStyle} />
      <path d={smoothClosedPath(warp(O.femur))} {...boneStyle} />
      <path d={smoothClosedPath(tibia(O.tibia))} {...boneStyle} fillOpacity={0.9} />
      <path d={smoothClosedPath(fibula(O.fibula))} {...boneStyle} fillOpacity={0.8} />
      {showGuides && (
        <g aria-hidden>
          {/* the interepicondylar line (a reference line: sky) — it narrows as the leg rotates */}
          <line x1={le![0]} y1={le![1]} x2={me![0]} y2={me![1]} stroke={SCENE.underStroke} strokeWidth={2 + 3} strokeLinecap="round" />
          <line x1={le![0]} y1={le![1]} x2={me![0]} y2={me![1]} stroke={SCENE.guide} strokeWidth={2} strokeDasharray="3 5" strokeLinecap="round" />
        </g>
      )}
    </>
  );
}

function KneeLateral({ X, Y, rotationDeg, showGuides }: { X: Map; Y: Map; rotationDeg: number; showGuides: boolean }): ReactNode {
  const c = kneeLateralCopies(rotationDeg);
  const O = OUTLINES.kneeLateral;
  const W = 1133;
  const pts = (arr: readonly Pt[], dx = 0): Pt[] => arr.map(([x, y]) => [X(x + dx), Y(y)] as Pt);
  const condyle = (du: number, opacity: number, key: string) => (
    <path key={key} d={smoothOpenPath(pts(O.condyleArc, du * W))} fill="none" stroke={SCENE.bone} strokeWidth={STROKE.medium} strokeLinecap="round" opacity={opacity} />
  );
  const head = (du: number, opacity: number, key: string) => <path key={key} d={smoothClosedPath(pts(O.fibularHead, du * W))} {...boneStyle} opacity={opacity} />;
  const far = KNEE_LATERAL_COPY_WEIGHTS.far, near = KNEE_LATERAL_COPY_WEIGHTS.near;
  return (
    <>
      <path d={smoothClosedPath(pts(O.soft))} {...softStyle} />
      <path d={smoothClosedPath(pts(O.femur))} {...boneStyle} />
      <path d={smoothClosedPath(pts(O.patella))} {...boneStyle} />
      <path d={smoothClosedPath(pts(O.tibia))} {...boneStyle} />
      <path d={smoothClosedPath(pts(O.fibula))} {...boneStyle} fillOpacity={0.85} />
      {/* near-side copy (nearer the detector: stronger) and far-side copy (weaker); one outline when they coincide */}
      {condyle(c.condyles[1]!.du, near + 0.25, "n")}
      {condyle(c.condyles[0]!.du, far + 0.15, "f")}
      {head(c.head[1]!.du, near + 0.25, "hn")}
      {head(c.head[0]!.du, far + 0.15, "hf")}
      {showGuides && (
        <g aria-hidden>
          {/* the centre of the joint (a reference mark: sky) */}
          <circle cx={X(O.centre[0])} cy={Y(O.centre[1])} r={3} fill={SCENE.guide} stroke={SCENE.underStroke} strokeWidth={1.5} />
        </g>
      )}
    </>
  );
}

function Foot({ kind, X, Y, k, rotationDeg, showGuides, bands }: { kind: "ap" | "oblique"; X: Map; Y: Map; k: number; rotationDeg: number; showGuides: boolean; bands: { v1: number; v2: number }[] }): ReactNode {
  const O: FootOutline = kind === "ap" ? OUTLINES.footAp : OUTLINES.footOblique;
  const M = FOOT_MODEL[kind];
  const anchors = footAnchors(kind, footValue(kind, rotationDeg));
  const lists = [anchors.toes, anchors.metatarsal];
  const dx = (x: number, y: number) => footShiftPx(x, y, M.widthPx, M.heightPx, bands, lists);
  const P = (x: number, y: number): Pt => [X(x + dx(x, y)), Y(y)];
  const rayLine = (r: FootOutline["rays"][number]) => {
    const [a, b] = [P(r.pts[0][0], r.pts[0][1]), P(r.pts[1][0], r.pts[1][1])];
    const w = r.w * k;
    return (
      <g key={r.id}>
        <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={SCENE.bone} strokeOpacity={0.85} strokeWidth={w + 2 * STROKE.thin} strokeLinecap="round" />
        <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={SCENE.trunk} strokeWidth={w} strokeLinecap="round" />
      </g>
    );
  };
  const blob = (b: FootOutline["blobs"][number]) => {
    const c = P(b.cx, b.cy);
    return <ellipse key={b.id} cx={c[0]} cy={c[1]} rx={b.rx * k} ry={b.ry * k} {...boneStyle} />;
  };
  const soft = O.soft.map(([x, y]) => P(x, y));
  // the five metatarsal axes (guides ON): they show the spacing the rotation cue is about (a reference line: sky)
  const axes = O.rays.filter((r) => r.band === "metatarsal");
  return (
    <>
      <path d={smoothClosedPath(soft)} {...softStyle} />
      {O.blobs.filter((b) => b.band === "tarsal").map(blob)}
      {O.rays.filter((r) => r.band === "metatarsal").map(rayLine)}
      {O.blobs.filter((b) => b.band === "metatarsal").map(blob)}
      {O.rays.filter((r) => r.band === "toes").map(rayLine)}
      {showGuides && (
        <g aria-hidden>
          {axes.map((r) => {
            const a = P(r.pts[0][0], r.pts[0][1]);
            const b = P(r.pts[1][0], r.pts[1][1]);
            return (
              <g key={`g-${r.id}`}>
                <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={SCENE.underStroke} strokeWidth={2 + 3} strokeLinecap="round" />
                <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={SCENE.guide} strokeWidth={2} strokeDasharray="3 5" strokeLinecap="round" />
              </g>
            );
          })}
        </g>
      )}
    </>
  );
}
