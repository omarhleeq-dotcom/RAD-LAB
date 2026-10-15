"use client";
import { useTranslations } from "next-intl";
import type { FigureProps, OrientationProps, DetectorFigure } from "./detector-figures";
import { SceneLabel } from "./SceneParts";
import { SCENE, STROKE, LABEL_SIZE } from "./scene-style";
import { shoulderShift, shoulderValue } from "@/features/shoulder-model/shoulder-model";
import { bandWeight } from "@/features/radiograph/pipeline";
import { SHOULDER_CM_PER_PX, SHOULDER_IMAGE } from "@/data/exams/xray/shoulder-geometry";

/**
 * Hand-authored setup anatomy of the right shoulder in the AP oblique glenoid (Grashey) view, traced by eye from the baseline (A-038); NOT the result
 * image. The same horizontal displacement field (`shoulder-model`) that closes the joint space in the one-image result warp moves the humeral head here,
 * inside the same band of rows. The scapular rims, the arm posture and hidden surfaces are not drawn (S-SHOULDER-2-6).
 */
export function ShoulderDrawing({ radCase, settings, W, H, showGuides }: FigureProps) {
  const a = radCase.requiredAnatomy, im = SHOULDER_IMAGE, k = SHOULDER_CM_PER_PX * 10;
  const value = shoulderValue(settings.rotationDeg);
  const left = im.anatomyBox.u1 * im.widthPx;
  const X = (x: number, y: number) => a.xCm * 10 + (x + shoulderShift(x / im.widthPx, value) * im.widthPx * bandWeight({ v1: 0.12, v2: 0.46 }, y / im.heightPx) - left) * k;
  const Y = (y: number) => a.yCm * 10 + y * k;
  const path = (points: number[][], close = true) => points.map(([x, y], i) => `${i ? "L" : "M"}${X(x!, y!)} ${Y(y!)}`).join(" ") + (close ? " Z" : "");
  const circle = (cx: number, cy: number, r: number) => path(Array.from({ length: 56 }, (_, i) => { const q = i * Math.PI / 28; return [cx + r * Math.cos(q), cy + r * Math.sin(q)]; }));
  const soft = [[560, 0], [1193, 0], [1193, 1450], [150, 1450], [140, 900], [210, 560], [310, 300], [430, 120]];
  const acromion = [[450, 240], [470, 210], [560, 190], [720, 160], [860, 130], [930, 110], [960, 150], [900, 200], [800, 230], [650, 240], [520, 255], [460, 262]];
  const clavicle = [[900, 90], [1193, 60], [1193, 200], [960, 170], [900, 150]];
  const coracoid = [[820, 240], [900, 230], [950, 280], [900, 330], [840, 330]];
  const neck = [[820, 330], [1000, 330], [1000, 700], [860, 700], [850, 620], [830, 520], [810, 420]];
  const shaft = [[320, 500], [325, 600], [340, 700], [380, 800], [400, 900], [400, 1000], [395, 1450], [580, 1450], [585, 1100], [600, 1000], [640, 900], [700, 800], [760, 730], [700, 640]];
  const tuberosity = [[330, 420], [310, 470], [300, 500], [325, 520]];
  const glenoid = [[820, 330], [810, 420], [830, 520], [850, 620], [860, 700]];
  return <>
    <defs><clipPath id="shoulder-detector-clip"><rect width={W} height={H} /></clipPath></defs>
    <g clipPath="url(#shoulder-detector-clip)" stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeLinejoin="round">
      <path d={path(soft)} fill={SCENE.trunk} stroke="none" />
      <path d={path(clavicle)} fill={SCENE.limbFar} /><path d={path(acromion)} fill={SCENE.limbFar} /><path d={path(coracoid)} fill={SCENE.limbFar} /><path d={path(neck)} fill={SCENE.limbFar} />
      <path d={path(shaft)} fill={SCENE.limb} /><path d={path(tuberosity)} fill={SCENE.limb} /><path d={circle(590, 560, 215)} fill={SCENE.limb} />
      <path d={path(glenoid, false)} fill="none" stroke={SCENE.bone} strokeWidth={STROKE.medium} strokeLinecap="round" />
      {showGuides && <path d={path([[830, 330], [810, 420], [830, 520], [850, 620]], false)} fill="none" stroke={SCENE.guide} strokeWidth={STROKE.thin} strokeDasharray="4 4" transform="translate(-22 0)" />}
    </g>
  </>;
}
function ShoulderOrientation({ W, showGuides }: OrientationProps) {
  const t = useTranslations("scene");
  return showGuides && <><SceneLabel x={-24} y={-22} size={LABEL_SIZE.detector}>{t("patientRight")}</SceneLabel><SceneLabel x={W + 24} y={-22} anchor="end" size={LABEL_SIZE.detector}>{t("patientLeft")}</SceneLabel></>;
}
export const SHOULDER_FIGURE: DetectorFigure = {
  altKey: "positioningShoulder.alt", midlineKey: "positioningShoulder.midline", Drawing: ShoulderDrawing, Orientation: ShoulderOrientation,
  alt: (t, s) => t("altShoulder", { deg: String(s.rotationDeg), arm: t("shoulderArm_" + s.choices?.armPosition), respiration: t("shoulderResp_" + s.choices?.respiration) }),
  axis: { top: "scene.head", bottom: "scene.feet" },
  marginGuideLabels: true, crispMarker: true,
};
