"use client";

import { useTranslations } from "next-intl";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { collimatedField } from "@/features/simulation/geometry";
import { SceneLabel, UnderStroked } from "./SceneParts";
import { BODY, LABEL_SIZE, SCENE, STROKE } from "./scene-style";
import { planRotationDeg } from "./visual-model";

/** `pxPerCm` is the scale of the detector bar AND of the patient (RAD-072 1b: one `BODY` proportion set); the SID axis stays schematic (`sidPx`). */
const PV = { detX: 380, detW: 22, pxPerCm: 3.4, midY: 160, sidPx: 1.7, axisY: 314 };
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
  const { detX, detW, pxPerCm, midY, sidPx, axisY } = PV;
  const k = pxPerCm;
  const lateral = settings.projection === "lateral-left";
  const facesTube = settings.projection === "ap-erect";
  // Torso from above in drawing cm (BODY): the shoulder width across, the thorax depth front to back; the head on top of it.
  const rx = BODY.thorax.d / 2;
  const ry = BODY.shoulderW / 2;
  // RAD-072 1b (T2): the chosen side touches the detector. Seen from above, PA faces +x and anatomical left is local −y: a +90° turn
  // puts the LEFT side at the detector (+x, anterior toward the bottom of the view), −90° the RIGHT side (anterior toward the top).
  const side = settings.choices?.side === "R" ? "R" : "L";
  const baseAngle = lateral ? (side === "R" ? -90 : 90) : 0;
  const ptX = detX - (lateral ? ry : rx) * k - (lateral ? 0 : 2);
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
  // Rotation arc: from the reference axis (the shoulder axis at 0°) to the patient's shoulder axis, just outside the shoulders on the
  // tube side. Its readout sits beyond the arc's end on the patient's POSTERIOR side, away from the arms, which are anterior (T3).
  const arcR = (ry + 4) * k;
  const arcSide = lateral ? (side === "R" ? -1 : 1) : -1;
  const p0 = rot(0, arcSide * arcR, baseAngle);
  const p1 = rot(0, arcSide * arcR, baseAngle + plan);
  const ref = rot(0, arcSide * (arcR + 8), baseAngle);
  const back = rot(-24, 0, baseAngle + plan);
  const pm = lateral ? { x: p1.x + back.x, y: p1.y + back.y } : rot(0, arcSide * (arcR + 17), baseAngle + plan / 2);
  const front = rot(1, 0, baseAngle);
  const patientLabel = lateral ? { x: ptX - 30, y: midY + front.y * (rx + (armsRaised ? 16 : 7)) * k + 6 } : { x: ptX, y: midY + (ry + 9) * k };
  const ring = { stroke: SCENE.outline, strokeWidth: STROKE.thin / k };
  const fault = { stroke: faultOutline ? SCENE.guide : SCENE.outline, strokeWidth: (faultOutline ? STROKE.medium : STROKE.thin) / k };
  // Arms from above (cm): PA / AP hanging at the sides under the shoulders; lateral raised beyond the anterior edge (above-head arms
  // in this overhead projection), lateral lowered in front of the chest.
  const arms = lateral
    ? [-1, 1].map((s) => (armsRaised ? { cx: rx + 5, cy: s * 3.5, rx: 6, ry: 3.6 } : { cx: rx * 0.55, cy: s * ry * 0.45, rx: 5, ry: BODY.upperArm.w / 2 }))
    : [-1, 1].map((s) => ({ cx: 0, cy: s * (ry - BODY.upperArm.w / 2), rx: 5.5, ry: BODY.upperArm.w / 2 }));

  return (
    <svg viewBox="0 24 450 334" role="img" aria-label={lateral ? ts("altPlanLateral", { deg: settings.rotationDeg, arms: ts(armsRaised ? "armsRaised" : "armsLowered"), side: ts(side === "R" ? "sideRight" : "sideLeft"), front: ts(side === "R" ? "planTop" : "planBottom") }) : t("alt")} className="h-auto w-full" style={{ direction: "ltr" }}>
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
      {/* patient from above (drawing cm, scaled to the detector bar) */}
      <g transform={`translate(${ptX} ${midY}) rotate(${plan + baseAngle}) scale(${k})`}>
        {/* Local x = anterior–posterior; local y = right–left (anatomical left is −y). In a lateral the chosen side touches the detector. */}
        <ellipse data-anatomy="torso" cx={0} cy={0} rx={rx} ry={ry} fill={SCENE.soft} {...ring} />
        {lateral && <path data-anatomy={side === "R" ? "right-contact" : "left-contact"} d={`M -5 ${side === "R" ? ry : -ry} L 5 ${side === "R" ? ry : -ry}`} stroke={SCENE.boneLine} strokeWidth={STROKE.medium / k} />}
        <ellipse cx={1} cy={0} rx={BODY.head.d / 2} ry={BODY.head.w / 2} fill={SCENE.soft} {...ring} />
        <path d={`M ${noseDir * 9.2} -1.8 L ${noseDir * 11.8} 0 L ${noseDir * 9.2} 1.8 Z`} fill={SCENE.boneLine} />
        {arms.map((e, i) => (
          <ellipse key={i} data-anatomy={lateral ? (armsRaised ? "raised-arm" : "anterior-arm") : "arm"} {...e} fill={SCENE.soft} {...(lateral ? fault : ring)} />
        ))}
      </g>
      {/* labels, each in its own slot */}
      <SceneLabel x={8} y={46} size={LABEL_SIZE.view}>{ts("rotationReadout", { deg: settings.rotationDeg })}</SceneLabel>
      {showGuides && !lateral && <SceneLabel x={8} y={70} size={LABEL_SIZE.view - 2} fill={SCENE.guide}>{t("rotationGuide")}</SceneLabel>}
      <SceneLabel x={patientLabel.x} y={patientLabel.y} size={LABEL_SIZE.view} anchor="middle">{t("patient")}</SceneLabel>
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
