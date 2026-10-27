import type { ReactNode } from "react";
import { lowerLimbDrawingImage, type LowerLimbKind } from "@/features/positioning/drawing-data";
import { ankleApAnchors, ankleLateralCopies, ANKLE_AP_MODEL, ANKLE_LATERAL_WIDTH_PX, kneeApShifts, kneeLateralCopies, interpolateAnchors, KNEE_AP_MODEL, KNEE_LATERAL_COPY_WEIGHTS } from "@/features/lower-limb-model/lower-limb-model";
import { SCENE, STROKE } from "./scene-style";
import { smoothClosedPath, smoothOpenPath } from "./elbow-visual";
import { OUTLINES, type Pt } from "./lower-limb-visual";
import { footOutlineDrawing } from "./foot-outline-drawing";
import { OutlineLayers, r } from "./outline-layers";
import { ANKLE_OUTLINES } from "./ankle-outlines";
import type { FigureProps } from "./detector-figures";

/**
 * Hand-drawn schematic of the KNEE, the FOOT and (S14.5) the ANKLE in detector space (S14.4; scenes "knee-ap", "knee-lateral", "foot-ap", "foot-oblique", "ankle-ap" and "ankle-lateral", own work,
 * S13b visual language: dark muted anatomy, thin bone outlines, no accent hue, guides in the two guide colours). The rotation drawing is the PROJECTION
 * of the lower-limb model (`features/lower-limb-model`), the SAME functions that displace the result image, so the drawing and the picture turn in the
 * same direction:
 *  - knee AP: the whole leg is warped by the model's column anchors (the condyle edges and the intercondylar eminence move by depth); the fibula and the
 *    tibia move as two layers below the joint, so the fibular head is covered by the tibia more or less;
 *  - knee lateral: the femoral condyle outline and the fibular head are drawn twice, a far-side copy and a near-side copy (one outline at the base pose);
 *  - ankle AP (S14.5): the whole leg and ankle are warped by the model's column anchors (the malleoli and the plafond edges move by depth), the tibia, fibula,
 *    talus and heel outlines move together; the overlap of the distal fibula is not drawn;
 *  - ankle lateral (S14.5): the fibula outline and the talar-dome arc are drawn twice, a far-side copy and a near-side copy (one outline at the base pose);
 *  - foot AP / oblique (RAD-072 2b): drawn from the outlines TRACED from the baselines (`foot-outlines.json`, `foot-outline-drawing.ts`), every bone moved
 *    as a rigid piece by the model's band-weighted displacement at that bone (the toes and the metatarsals; the oblique's value is the deviation of the
 *    plantar angle from 40°), in the limb drawing style of the hand (`outline-layers.tsx`).
 * The knee and ankle outlines are illustrative (read by eye from the baselines). Anatomy is an image convention and is never mirrored by RTL.
 */
export function LowerLimbDrawing({ radCase, settings, showGuides, W, H }: FigureProps) {
  const kind = (["knee-ap", "knee-lateral", "foot-ap", "foot-oblique", "ankle-ap", "ankle-lateral"].includes(settings.projection) ? settings.projection : radCase.requiredProjection) as LowerLimbKind;
  const im = lowerLimbDrawingImage(kind);
  const a = radCase.requiredAnatomy;
  const U = 10; // SVG units per detector cm (`detector-figures.tsx` U)
  const k = im.cmPerPx * U; // SVG units per image pixel
  const x0 = im.box.u1 * im.widthPx;
  const y0 = im.box.v1 * im.heightPx;
  const X = (px: number) => a.xCm * U + (px - x0) * k;
  const Y = (py: number) => a.yCm * U + (py - y0) * k;
  const rot = settings.rotationDeg;
  // The limb continues beyond the detector (the outlines run past the image): clip the drawing to the detector.
  const clip = (node: ReactNode) => (
    <>
      <defs>
        <clipPath id="lower-limb-detector-clip">
          <rect x={0} y={0} width={W} height={H} />
        </clipPath>
      </defs>
      <g clipPath="url(#lower-limb-detector-clip)">{node}</g>
    </>
  );
  if (kind === "knee-ap") return clip(<KneeAp X={X} Y={Y} rotationDeg={rot} showGuides={showGuides} />);
  if (kind === "knee-lateral") return clip(<KneeLateral X={X} Y={Y} rotationDeg={rot} showGuides={showGuides} />);
  if (kind === "ankle-ap") return clip(<AnkleAp X={X} Y={Y} rotationDeg={rot} showGuides={showGuides} />);
  if (kind === "ankle-lateral") return clip(<AnkleLateral X={X} Y={Y} rotationDeg={rot} showGuides={showGuides} />);
  const toSvg = ([px, py]: [number, number]) => `${r(X(px))},${r(Y(py))}`;
  return clip(<OutlineLayers d={footOutlineDrawing(kind === "foot-ap" ? "ap" : "oblique", rot)} toSvg={toSvg} />);
}

type Map = (v: number) => number;
const softStyle = { fill: SCENE.lung, stroke: SCENE.edge, strokeWidth: STROKE.thin, strokeLinejoin: "round" } as const;
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

function AnkleAp({ X, Y, rotationDeg, showGuides }: { X: Map; Y: Map; rotationDeg: number; showGuides: boolean }): ReactNode {
  const W = ANKLE_AP_MODEL.widthPx;
  const anchors = ankleApAnchors(rotationDeg);
  const warp = (pts: readonly Pt[]): Pt[] => pts.map(([x, y]) => [X(x + interpolateAnchors(anchors, x / W) * W), Y(y)] as Pt);
  const O = ANKLE_OUTLINES.ap;
  const [mm, lm] = warp(O.malleoli);
  return (
    <>
      <path d={smoothClosedPath(warp(O.soft))} {...softStyle} />
      <path d={smoothClosedPath(warp(O.heel))} {...boneStyle} fillOpacity={0.8} />
      <path d={smoothClosedPath(warp(O.talus))} {...boneStyle} />
      <path d={smoothClosedPath(warp(O.tibia))} {...boneStyle} fillOpacity={0.9} />
      <path d={smoothClosedPath(warp(O.fibula))} {...boneStyle} fillOpacity={0.8} />
      {showGuides && (
        <g aria-hidden>
          {/* the line between the tips of the malleoli (a reference line: sky) — it moves as the leg rotates */}
          <line x1={mm![0]} y1={mm![1]} x2={lm![0]} y2={lm![1]} stroke={SCENE.underStroke} strokeWidth={2 + 3} strokeLinecap="round" />
          <line x1={mm![0]} y1={mm![1]} x2={lm![0]} y2={lm![1]} stroke={SCENE.guide} strokeWidth={2} strokeDasharray="3 5" strokeLinecap="round" />
        </g>
      )}
    </>
  );
}

function AnkleLateral({ X, Y, rotationDeg, showGuides }: { X: Map; Y: Map; rotationDeg: number; showGuides: boolean }): ReactNode {
  const c = ankleLateralCopies(rotationDeg);
  const O = ANKLE_OUTLINES.lateral;
  const W = ANKLE_LATERAL_WIDTH_PX;
  const pts = (arr: readonly Pt[], dx = 0): Pt[] => arr.map(([x, y]) => [X(x + dx), Y(y)] as Pt);
  const far = KNEE_LATERAL_COPY_WEIGHTS.far, near = KNEE_LATERAL_COPY_WEIGHTS.near;
  const arc = (du: number, opacity: number, key: string) => (
    <path key={key} d={smoothOpenPath(pts(O.domeArc, du * W))} fill="none" stroke={SCENE.bone} strokeWidth={STROKE.medium} strokeLinecap="round" opacity={opacity} />
  );
  const fibula = (du: number, opacity: number, key: string) => <path key={key} d={smoothClosedPath(pts(O.fibula, du * W))} {...boneStyle} opacity={opacity} />;
  return (
    <>
      <path d={smoothClosedPath(pts(O.soft))} {...softStyle} />
      <path d={smoothClosedPath(pts(O.foot))} {...boneStyle} fillOpacity={0.8} />
      <path d={smoothClosedPath(pts(O.calcaneus))} {...boneStyle} fillOpacity={0.85} />
      <path d={smoothClosedPath(pts(O.talus))} {...boneStyle} />
      <path d={smoothClosedPath(pts(O.tibia))} {...boneStyle} />
      {/* near-side copy (nearer the detector: stronger) and far-side copy (weaker); one outline when they coincide */}
      {fibula(c.malleolus[1]!.du, near + 0.25, "fn")}
      {fibula(c.malleolus[0]!.du, far + 0.15, "ff")}
      {arc(c.joint[1]!.du, near + 0.25, "an")}
      {arc(c.joint[0]!.du, far + 0.15, "af")}
      {showGuides && (
        <g aria-hidden>
          {/* the centre of the joint (a reference mark: sky) */}
          <circle cx={X(O.centre[0])} cy={Y(O.centre[1])} r={3} fill={SCENE.guide} stroke={SCENE.underStroke} strokeWidth={1.5} />
        </g>
      )}
    </>
  );
}
