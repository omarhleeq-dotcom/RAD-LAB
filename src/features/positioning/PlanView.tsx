"use client";

import { useTranslations } from "next-intl";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { collimatedField } from "@/features/simulation/geometry";
import { SceneLabel } from "./SceneParts";
import { LABEL_SIZE, SCENE } from "./scene-style";
import { planRotationDeg } from "./visual-model";

const PV = { detX: 380, pxPerCm: 4.5, midY: 140, sidPx: 1.7 };
/** Educational SID reference for the case (docs/RAD-LAB_Medical_Reference_Chest_PA.md §2). Mirrors the SID rule target (S10b-26: 183 cm; 180 cm is its rounding). */
const SID_REFERENCE_CM = 183;

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
  showGuides: boolean;
}

/** Plan view: patient rotation relative to the detector, SID, and the beam footprint. */
export function PlanView({ radCase, settings, showGuides }: Props) {
  const t = useTranslations("positioning");
  const ts = useTranslations("scene");
  const { detX, pxPerCm, midY, sidPx } = PV;
  const lateral = settings.projection === "lateral-left";
  const facesTube = settings.projection === "ap-erect";
  const depth = lateral ? 55 : 16;
  const ptX = detX - 4 - depth;
  // S12-2: left lateral = the patient's left side toward the detector (+x), which is a −90° turn from the PA drawing.
  const baseAngle = lateral ? -90 : 0;
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
  const guideRaised = lateral && !armsRaised;
  return (
    <svg viewBox="0 32 450 270" role="img" aria-label={t("alt")} className="h-auto w-full" style={{ direction: "ltr" }}>
      <polygon points={`${tubeX + 28},${midY + lateralPx} ${detX},${fy1} ${detX},${fy2}`} fill={SCENE.beam} opacity={0.18} />
      <line x1={tubeX + 28} y1={midY + lateralPx} x2={detX} y2={midY + lateralPx} stroke={SCENE.beam} strokeWidth={1.5} strokeDasharray="5 4" />
      <rect x={detX} y={midY - detHalf} width={8} height={detHalf * 2} rx={2} fill={SCENE.detector} />
      <rect x={tubeX} y={midY + lateralPx - 20} width={28} height={40} rx={4} fill={SCENE.tube} />
      {/* reference line parallel to the detector: the patient is "square" when the shoulders line up with it */}
      {!lateral && (
        <g aria-hidden>
          <line x1={ptX} y1={midY - 72} x2={ptX} y2={midY + 72} stroke={SCENE.good} strokeWidth={1.5} strokeDasharray="3 5" opacity={0.8} />
        </g>
      )}
      {/* patient from above: shoulders / chest (ellipse), arms, head with the nose toward the front */}
      <g transform={`rotate(${planRotationDeg(settings.projection, settings.rotationDeg) + baseAngle} ${ptX} ${midY})`}>
        <ellipse cx={ptX} cy={midY} rx={16} ry={55} fill={SCENE.trunk} stroke={SCENE.bone} strokeWidth={1.5} />
        {lateral ? (
          armsRaised ? (
            <g fill={SCENE.limb} stroke={SCENE.bone} strokeWidth={1.5}>
              <ellipse cx={ptX} cy={midY - 20} rx={9} ry={9} />
              <ellipse cx={ptX} cy={midY + 20} rx={9} ry={9} />
            </g>
          ) : (
            <g fill={SCENE.limb} stroke={guideRaised && showGuides ? SCENE.beam : SCENE.bone} strokeWidth={1.5} strokeDasharray={guideRaised && showGuides ? "3 3" : undefined}>
              <ellipse cx={ptX} cy={midY - 52} rx={10} ry={11} />
              <ellipse cx={ptX} cy={midY + 52} rx={10} ry={11} />
            </g>
          )
        ) : (
          <g fill={SCENE.limb} stroke={SCENE.bone} strokeWidth={1.5}>
            <ellipse cx={ptX} cy={midY - 62} rx={9} ry={11} />
            <ellipse cx={ptX} cy={midY + 62} rx={9} ry={11} />
          </g>
        )}
        <circle cx={ptX} cy={midY} r={13} fill={SCENE.head} stroke={SCENE.bone} strokeWidth={1.5} />
        <path d={`M ${ptX + noseDir * 12} ${midY - 6} L ${ptX + noseDir * 25} ${midY} L ${ptX + noseDir * 12} ${midY + 6} Z`} fill={SCENE.bone} />
      </g>
      <SceneLabel x={ptX - 20} y={midY + 90} size={LABEL_SIZE.view} anchor="middle" fill={SCENE.good}>{`${t("rotation")}: ${settings.rotationDeg}°`}</SceneLabel>
      {showGuides && !lateral && (
        <SceneLabel x={ptX - 20} y={midY + 107} size={LABEL_SIZE.view - 2} anchor="middle" fill={SCENE.good}>{t("rotationGuide")}</SceneLabel>
      )}
      <line x1={tubeX} y1={268} x2={detX} y2={268} stroke={SCENE.label} strokeWidth={1} />
      <line x1={tubeX} y1={262} x2={tubeX} y2={274} stroke={SCENE.label} />
      <line x1={detX} y1={262} x2={detX} y2={274} stroke={SCENE.label} />
      {showGuides && (
        <g aria-hidden>
          <line x1={refX} y1={256} x2={refX} y2={280} stroke={SCENE.good} strokeWidth={2} strokeDasharray="3 3" />
          <SceneLabel x={refX} y={252} size={LABEL_SIZE.view - 2} anchor="middle" fill={SCENE.good}>{t("sidTarget", { sid: SID_REFERENCE_CM })}</SceneLabel>
        </g>
      )}
      <SceneLabel x={(tubeX + detX) / 2} y={294} size={LABEL_SIZE.view} anchor="middle">{`${t("sid")} ${settings.sidCm} cm`}</SceneLabel>
      <SceneLabel x={tubeX + 14} y={midY + lateralPx - 28} size={LABEL_SIZE.view} anchor="middle">{ts("tube")}</SceneLabel>
      <SceneLabel x={detX + 8} y={midY - detHalf - 8} size={LABEL_SIZE.view} anchor="end">{ts("detector")}</SceneLabel>
      <SceneLabel x={ptX - 36} y={midY - 66} size={LABEL_SIZE.view} anchor="end">{t("patient")}</SceneLabel>
    </svg>
  );
}
