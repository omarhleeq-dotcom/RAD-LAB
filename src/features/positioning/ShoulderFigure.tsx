"use client";
import { useTranslations } from "next-intl";
import type { FigureProps, OrientationProps, DetectorFigure } from "./detector-figures";
import { SceneLabel } from "./SceneParts";
import { LABEL_SIZE } from "./scene-style";
import { OutlineLayers, r } from "./outline-layers";
import { shoulderOutlineDrawing } from "./shoulder-outline-drawing";
import { SHOULDER_CM_PER_PX, SHOULDER_DRAWING } from "@/features/positioning/drawing-data";

/**
 * Setup anatomy of the right shoulder in the AP oblique glenoid (Grashey) view. Since RAD-072 2c it is drawn from the outlines TRACED from the baseline
 * (`shoulder-outlines.json`, A-038; illustrative, drawing-only, not a measurement) in the limb drawing style (soft tissue → joint spaces → translucent bone fills →
 * light lines → every bone's edge last; `outline-layers.tsx`), moved by `shoulderOutlineDrawing`: the SAME displacement field (`shoulder-model`) that closes the joint
 * space in the one-image result, so the drawing and the picture agree in direction and amount. Nothing moves inside the 35°–45° band. The scapular rims, the arm
 * posture and hidden surfaces are not drawn (S-SHOULDER-2-6). Right shoulder, fixed (the exam's marker rule is fixed R); anatomy is never mirrored by RTL.
 */
export function ShoulderDrawing({ radCase, settings, W, H }: FigureProps) {
  const a = radCase.requiredAnatomy, im = SHOULDER_DRAWING, k = SHOULDER_CM_PER_PX * 10;
  const left = im.anatomyBox.u1 * im.widthPx;
  const toSvg = ([x, y]: [number, number]) => `${r(a.xCm * 10 + (x - left) * k)},${r(a.yCm * 10 + y * k)}`;
  return <>
    <defs><clipPath id="shoulder-detector-clip"><rect width={W} height={H} /></clipPath></defs>
    <g clipPath="url(#shoulder-detector-clip)">
      <OutlineLayers d={shoulderOutlineDrawing(settings.rotationDeg)} toSvg={toSvg} />
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
