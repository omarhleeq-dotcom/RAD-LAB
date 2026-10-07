"use client";

import { useTranslations } from "next-intl";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { collimatedField } from "@/features/simulation/geometry";
import { SceneLabel, UnderStroked } from "./SceneParts";
import { LABEL_SIZE, SCENE, STROKE } from "./scene-style";
import { planRotationDeg } from "./visual-model";

const PV = { detX: 380, detW: 22, pxPerCm: 4.5, midY: 160, sidPx: 1.7, scale: 1.25, arcR: 108, axisY: 314 };
/** Educational SID reference for the case (docs/RAD-LAB_Medical_Reference_Chest_PA.md §2). Mirrors the SID rule target (S10b-26: 183 cm; 180 cm is its rounding). */
const SID_REFERENCE_CM = 183;

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
  showGuides: boolean;
}

const rot = (x: number, y: number, deg: number) => {
  const r = (deg * Math.PI) / 180;
  return { x: x * Math.cos(r) - y * Math.sin(r), y: x * Math.sin(r) + y * Math.cos(r) };
};

/**
 * Plan view (S13b-2 redraw): the patient from above (head, shoulder / chest ellipse, arms as the exam needs), the detector as a
 * thick labelled bar, the tube and the beam, the rotation as an angle arc between the reference axis and the patient's shoulder
 * axis with its value OUTSIDE the body, and the SID on one axis with its reference tick. The turn's sign logic is `planRotationDeg`
 * (unchanged, O19).
 */
export function PlanView({ radCase, settings, showGuides }: Props) {
  const t = useTranslations("positioning");
  const ts = useTranslations("scene");
  const { detX, detW, pxPerCm, midY, sidPx, scale, arcR, axisY } = PV;
  const lateral = settings.projection === "lateral-left";
  const facesTube = settings.projection === "ap-erect";
  const depth = lateral ? 55 : 21;
  const ptX = detX - 4 - depth;
  // S12-2: left lateral = the patient's left side toward the detector (+x), which is a −90° turn from the PA drawing.
  const baseAngle = lateral ? -90 : 0;
  const plan = planRotationDeg(settings.projection, settings.rotationDeg);
  const tubeX = Math.max(30, detX - settings.sidCm * sidPx);
  const refX = detX - SID_REFERENCE_CM * sidPx;
  const { detector } = radCase;
  const lateralPx = settings.centralRay.x * (detector.widthCm / 2) * pxPerCm;
  const detHalf = (detector.widthCm * pxPerCm) / 2;
  const field = collimatedField(settings, detector);
  const fy1 = midY + (field.x1 - detector.widthCm / 2) * pxPerCm;
  const fy2 = midY + (field.x2 - detector.widthCm / 2) * pxPerCm;
  const noseDir = facesTube ? -1 : 1;
  const armsRaised = settings.choices?.arms === "raised";
  const faultOutline = showGuides && lateral && !armsRaised;
  // rotation arc: from the reference axis (the shoulder axis at 0°) to the patient's shoulder axis, at radius arcR, "up" in the patient's frame
  const p0 = rot(0, -arcR, baseAngle);
  const p1 = rot(0, -arcR, baseAngle + plan);
  const pm = rot(0, -(arcR + 17), baseAngle + plan / 2);
  const ref = rot(0, -(arcR + 8), baseAngle);
  const arm = (cy: number, key: string) => <ellipse key={key} cx={0} cy={cy} rx={9} ry={lateral && armsRaised ? 9 : 13} fill={SCENE.limb} stroke={faultOutline ? SCENE.guide : SCENE.edge} strokeWidth={faultOutline ? STROKE.medium : STROKE.thin} />;
  const armsY = lateral && armsRaised ? [-21, 21] : lateral ? [-66, 66] : [-67, 67];

  return (
    <svg viewBox="0 24 450 334" role="img" aria-label={t("alt")} className="h-auto w-full" style={{ direction: "ltr" }}>
      {/* beam: cone to the collimated field and the central ray */}
      <polygon points={`${tubeX + 28},${midY + lateralPx} ${detX},${fy1} ${detX},${fy2}`} fill={SCENE.beam} opacity={0.16} />
      <UnderStroked stroke={SCENE.beam} width={2} dash="5 4">
        {(p) => <line x1={tubeX + 28} y1={midY + lateralPx} x2={detX} y2={midY + lateralPx} {...p} />}
      </UnderStroked>
      {/* detector: a thick bar, labelled along its length */}
      <rect x={detX} y={midY - detHalf} width={detW} height={detHalf * 2} rx={3} fill={SCENE.detector} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
      <text x={detX + detW / 2 + 5} y={midY} fontSize={15} fontWeight={600} textAnchor="middle" fill={SCENE.underStroke} transform={`rotate(-90 ${detX + detW / 2 + 5} ${midY})`}>
        {ts("detector")}
      </text>
      {/* tube */}
      <rect x={tubeX} y={midY + lateralPx - 20} width={28} height={40} rx={4} fill={SCENE.tube} stroke={SCENE.underStroke} strokeWidth={1.5} />
      <rect x={tubeX + 26} y={midY + lateralPx - 11} width={7} height={22} rx={2} fill={SCENE.detector} />
      {/* reference axis (a shoulder line parallel to the detector in a PA / AP; along the beam in a lateral) and the rotation arc */}
      <UnderStroked stroke={SCENE.guide} width={1.5} dash="3 5">
        {(p) => <line x1={ptX - ref.x} y1={midY - ref.y} x2={ptX + ref.x} y2={midY + ref.y} {...p} />}
      </UnderStroked>
      {Math.abs(settings.rotationDeg) > 0.2 && (
        <UnderStroked stroke={SCENE.label} width={3}>
          {(p) => <path d={`M ${ptX + p0.x} ${midY + p0.y} A ${arcR} ${arcR} 0 0 ${plan > 0 ? 1 : 0} ${ptX + p1.x} ${midY + p1.y}`} fill="none" {...p} />}
        </UnderStroked>
      )}
      <SceneLabel x={ptX + pm.x} y={midY + pm.y + 5} size={LABEL_SIZE.view - 2} anchor="middle">{ts("rotationArc", { deg: settings.rotationDeg })}</SceneLabel>
      {/* patient from above */}
      <g transform={`translate(${ptX} ${midY}) rotate(${plan + baseAngle}) scale(${scale})`}>
        {armsY.map((cy, i) => arm(cy, `a${i}`))}
        <ellipse cx={0} cy={0} rx={16} ry={50} fill={SCENE.trunk} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
        <circle cx={0} cy={0} r={14} fill={SCENE.head} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
        <path d={`M ${noseDir * 13} -6 L ${noseDir * 25} 0 L ${noseDir * 13} 6 Z`} fill={SCENE.bone} />
      </g>
      {/* labels, each in its own slot */}
      <SceneLabel x={8} y={46} size={LABEL_SIZE.view}>{ts("rotationReadout", { deg: settings.rotationDeg })}</SceneLabel>
      {showGuides && !lateral && <SceneLabel x={8} y={70} size={LABEL_SIZE.view - 2} fill={SCENE.guide}>{t("rotationGuide")}</SceneLabel>}
      <SceneLabel x={ptX} y={lateral ? midY + 56 : midY + 122} size={LABEL_SIZE.view} anchor="middle">{t("patient")}</SceneLabel>
      <SceneLabel x={tubeX + 14} y={midY + lateralPx - 30} size={LABEL_SIZE.view} anchor="middle">{ts("tube")}</SceneLabel>
      {/* SID: one axis from the tube to the detector, its reference tick on the same axis */}
      <g aria-hidden>
        <UnderStroked stroke={SCENE.label} width={1.5}>
          {(p) => (
            <>
              <line x1={tubeX} y1={axisY} x2={detX} y2={axisY} {...p} />
              <line x1={tubeX} y1={axisY - 7} x2={tubeX} y2={axisY + 7} {...p} />
              <line x1={detX} y1={axisY - 7} x2={detX} y2={axisY + 7} {...p} />
            </>
          )}
        </UnderStroked>
        {showGuides && (
          <>
            {refX < tubeX && (
              <UnderStroked stroke={SCENE.good} width={2} dash="3 4">
                {(p) => <line x1={tubeX} y1={axisY} x2={refX} y2={axisY} {...p} />}
              </UnderStroked>
            )}
            <UnderStroked stroke={SCENE.good} width={3}>
              {(p) => <line x1={refX} y1={axisY - 10} x2={refX} y2={axisY + 10} {...p} />}
            </UnderStroked>
            <SceneLabel x={Math.min(Math.max(refX, 62), 330)} y={axisY - 16} size={LABEL_SIZE.view - 2} anchor="middle" fill={SCENE.good}>{t("sidTarget", { sid: SID_REFERENCE_CM })}</SceneLabel>
          </>
        )}
      </g>
      <SceneLabel x={(tubeX + detX) / 2} y={axisY + 28} size={LABEL_SIZE.view} anchor="middle">{ts("sidValue", { value: settings.sidCm })}</SceneLabel>
    </svg>
  );
}
