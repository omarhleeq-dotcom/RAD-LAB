"use client";
import { useTranslations } from "next-intl";
import type { FigureProps, OrientationProps, DetectorFigure } from "./detector-figures";
import { SceneLabel } from "./SceneParts";
import { SCENE, STROKE, LABEL_SIZE } from "./scene-style";
import { pelvisShift } from "@/features/pelvis-model/pelvis-model";
import { PELVIS_IMAGE } from "@/data/exams/xray/pelvis-geometry";

/** Hand-authored setup anatomy, not the result image. The same horizontal
 * displacement field drives the pelvis here and the one-image result warp.
 * Femoral stance is a schematic cue; hidden trochanters are not reconstructed.
 */
export function PelvisDrawing({ radCase, settings, W, H }: FigureProps) {
  const a = radCase.requiredAnatomy, im = PELVIS_IMAGE;
  const X = (x: number) => a.xCm * 10 + (x + pelvisShift(x / im.widthPx, settings.rotationDeg) * im.widthPx - 100) * im.cmPerPx * 10;
  const Y = (y: number) => a.yCm * 10 + (y - 30) * im.cmPerPx * 10;
  const path = (points: number[][]) => points.map(([x, y], i) => `${i ? "L" : "M"}${X(x!)} ${Y(y!)}`).join(" ") + " Z";
  const ellipse = (cx: number, cy: number, rx: number, ry: number) => path(Array.from({ length: 48 }, (_, i) => { const q = i * Math.PI / 24; return [cx + rx * Math.cos(q), cy + ry * Math.sin(q)]; }));
  const wing = [[245,250],[400,150],[710,180],[970,360],[1110,660],[1090,1050],[1180,1390],[1290,1830],[1140,1990],[820,1930],[670,1750],[620,1430],[510,1190],[400,930],[270,630]];
  const mirror = (p: number[][]) => p.map(([x,y]) => [2675-x!, y!]);
  const hole = [[870,1510],[1080,1570],[1155,1780],[1050,1880],[850,1810],[790,1660]];
  const stance = settings.choices?.legPosition;
  const spread = stance === "external" ? 145 : stance === "neutral" ? 80 : 25;
  return <>
    <defs><clipPath id="pelvis-detector-clip"><rect width={W} height={H} /></clipPath></defs>
    <g clipPath="url(#pelvis-detector-clip)" stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeLinejoin="round">
      <path d={path([[110,0],[2520,0],[2675,2084],[0,2084]])} fill={SCENE.trunk} stroke="none" />
      <path d={path(wing)} fill={SCENE.limb} /><path d={path(mirror(wing))} fill={SCENE.limbFar} />
      <path d={path([[1100,400],[1575,400],[1510,960],[1340,1390],[1160,960]])} fill={SCENE.head} />
      <path d={ellipse(1325,1270,42,180)} fill={SCENE.limbFar} />
      <path d={path(hole)} fill={SCENE.trunk} /><path d={path(mirror(hole))} fill={SCENE.trunk} />
      {[0,1,2].map(i=><path key={i} d={path([[1200,80+i*145],[1475,80+i*145],[1475,195+i*145],[1200,195+i*145]])} fill={SCENE.head} />)}
      {[false,true].map(right=>{
        const headX = right ? 2045 : 630, sign=right?1:-1;
        const points=[[headX,1490],[headX+sign*(200+spread/2),1550],[headX+sign*(300+spread),1750],[headX+sign*(280+spread),2180],[headX+sign*80,2180],[headX+sign*65,1730],[headX-sign*60,1630]];
        return <g key={String(right)}><path d={path(points)} fill={right?SCENE.limbFar:SCENE.limb} /><path d={ellipse(headX,1450,165,170)} fill={SCENE.head} /></g>;
      })}
    </g>
  </>;
}
function PelvisOrientation({ W, showGuides }: OrientationProps) {
  const t=useTranslations("scene");
  return showGuides && <><SceneLabel x={-24} y={-22} size={LABEL_SIZE.detector}>{t("patientRight")}</SceneLabel><SceneLabel x={W+24} y={-22} anchor="end" size={LABEL_SIZE.detector}>{t("patientLeft")}</SceneLabel></>;
}
export const PELVIS_FIGURE: DetectorFigure = {
  altKey: "positioningPelvis.alt", midlineKey: "positioningPelvis.midline", Drawing: PelvisDrawing, Orientation: PelvisOrientation,
  alt: (t,s) => t("altPelvis", { deg:String(s.rotationDeg), legs:t("pelvisLeg_"+s.choices?.legPosition), respiration:t("pelvisResp_"+s.choices?.respiration) }),
  axis: { top: "scene.head", bottom: "scene.feet" },
  marginGuideLabels: true, crispMarker: true,
};
