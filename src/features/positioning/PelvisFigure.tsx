"use client";
import { useTranslations } from "next-intl";
import type { FigureProps, OrientationProps, DetectorFigure } from "./detector-figures";
import { SceneLabel } from "./SceneParts";
import { SCENE, STROKE, LABEL_SIZE } from "./scene-style";
import { pelvisShift } from "@/features/pelvis-model/pelvis-model";
import { PELVIS_IMAGE } from "@/features/positioning/drawing-data";

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
  // Outlines traced by eye over the reference radiograph (full-image pixels, 2675 x 2084), one polygon per side so the
  // schematic follows the picture, not a symmetric ideal. They are drawing aids only: nothing is scored from them.
  const wingR = [[1075,720],[1030,430],[990,300],[770,165],[500,145],[340,230],[215,330],[260,700],[410,1075],[480,1280],[640,1450],[860,1380],[840,1100],[875,950],[960,830]];
  const wingL = [[1700,700],[1690,480],[1760,330],[1980,235],[2250,215],[2470,260],[2590,420],[2420,880],[2270,1180],[2190,1290],[2040,1450],[1820,1360],[1900,1180],[1890,1000],[1790,830]];
  const mirror = (p: number[][]) => p.map(([x,y]) => [2675-x!, y!]);
  const ringR = [[640,1450],[700,1650],[780,1880],[900,1960],[1100,1960],[1250,1880],[1335,1760],[1330,1690],[1050,1610],[880,1500]];
  // Body contour (soft tissue): narrower at the top, a notch between the thighs, so a dark surround shows around the body (as around the ankle).
  const softTissue = [[330,0],[2345,0],[2640,340],[2640,520],[2480,900],[2400,1150],[2560,1380],[2675,1480],[2675,2084],[1960,2084],[1945,2000],[730,2000],[715,2084],[0,2084],[0,1480],[120,1380],[270,1150],[190,900],[80,520],[80,340]];
  const sacrum = [[1150,300],[1525,300],[1590,560],[1480,900],[1380,1140],[1295,1140],[1195,900],[1085,560]];
  const lumbar = [[1190,10],[1490,10],[1500,260],[1180,260]];
  const sw = STROKE.thin * 1.4 * Math.max(1, W / 240);
  const arc = (cx: number, cy: number, r: number, from: number, to: number) => path(Array.from({ length: 24 }, (_, i) => { const q = (from + (to - from) * i / 23) * Math.PI / 180; return [cx + r * Math.cos(q), cy + r * Math.sin(q)]; })).replace(/ Z$/, "");
  const stance = settings.choices?.legPosition;
  const spread = stance === "external" ? 145 : stance === "neutral" ? 80 : 25;
  // Schematic stance cue only: a more externally rotated limb shows the trochanter profile further out.
  const femurR = (shift: number) => [[470,1500],[250,1470],[100,1490],[20,1580],[50,1800],[30,2084],[540,2084],[520,1850],[560,1720],[600,1620]]
    .map(([x,y],i) => [i >= 1 && i <= 5 ? x! - shift : x!, y!]);
  const shift = (spread - 25) * 0.5;
  return <>
    <defs><clipPath id="pelvis-detector-clip"><rect width={W} height={H} /></clipPath></defs>
    {/* Same look as the ankle scene (dark soft tissue, lighter bones, bright outlines); the soft tissue is the darkest anatomy token (`bezel`) so bones stay separate even on screens that brighten dark tones. The detector is drawn in mm, so the
        outline is scaled to keep the same on-screen weight as on the 24 cm detectors. */}
    <g clipPath="url(#pelvis-detector-clip)" stroke={SCENE.bone} strokeOpacity={0.95} strokeWidth={sw} strokeLinejoin="round">
      <path d={path(softTissue)} fill={SCENE.bezel} stroke="none" />
      <path d={path(wingR)} fill={SCENE.limb} /><path d={path(wingL)} fill={SCENE.limbFar} />
      <path d={path(sacrum)} fill={SCENE.head} />
      <path d={path(lumbar)} fill={SCENE.head} />
      <path d={path(ringR)} fill={SCENE.limb} /><path d={path(mirror(ringR))} fill={SCENE.limbFar} />
      <path d={ellipse(1100,1780,150,95)} fill={SCENE.bezel} /><path d={ellipse(1660,1825,140,85)} fill={SCENE.bezel} />
      <path d={path(femurR(shift))} fill={SCENE.limb} /><path d={path(mirror(femurR(shift)))} fill={SCENE.limbFar} />
      <path d={ellipse(600,1420,160,160)} fill={SCENE.head} /><path d={ellipse(2075,1400,160,160)} fill={SCENE.head} />
      {/* Acetabular roofs: thin arcs above each femoral head (detail line only). */}
      <path d={arc(600,1420,215,200,340)} fill="none" strokeWidth={sw * 1.4} /><path d={arc(2075,1400,215,200,340)} fill="none" strokeWidth={sw * 1.4} />
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
