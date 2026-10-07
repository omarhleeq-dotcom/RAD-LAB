"use client";

import { useTranslations } from "next-intl";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { collimatedField } from "@/features/simulation/geometry";
import { HeadProfile, Limb, SceneLabel, UnderStroked } from "./SceneParts";
import { LABEL_SIZE, SCENE, STROKE } from "./scene-style";
import { slabX, WRIST_SIDE } from "./wrist-visual";

/** Educational reference SID (S14.1b-1 / reference §3: Bontrager's minimum 40 in = 102 cm). Mirrors the SID rule of the exam. */
const SID_REFERENCE_CM = 102;
const S = WRIST_SIDE.surfaceY;
const DIM_OFFSET = 34;

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
  showGuides: boolean;
}

/**
 * Hand-drawn schematic SIDE view of the wrist set-up (S14.1c, own work, S13b language): the patient seated at the end of the table,
 * the shoulder, elbow and wrist drawn on one level (context only: not scored in v1), the forearm and hand on the detector (the
 * detector's long axis laid along the table, fingers to the right), the tube above with the central ray PERPENDICULAR to the
 * detector (no tube-angle control for the wrist), the collimated field on the detector and the SID measured along the beam. In
 * the lateral the hand is drawn standing on its ulnar edge (thumb up), in the PA flat (palm down). It draws the learner's own
 * settings and nothing the result reveals. Drawing only, never a measurement. It is not the plan view (PlanView is chest only).
 */
export function WristSideView({ radCase, settings, showGuides }: Props) {
  const t = useTranslations("positioning");
  const ts = useTranslations("scene");
  const tw = useTranslations("sceneWrist");
  const lateral = settings.projection === "wrist-lateral";
  const { detector } = radCase;
  const field = collimatedField(settings, detector);
  const rayCm = ((settings.centralRay.y + 1) / 2) * detector.heightCm;
  const rayX = slabX(rayCm);
  const sidPx = settings.sidCm * WRIST_SIDE.sidPxPerCm;
  const tubeY = S - sidPx;
  const refPx = SID_REFERENCE_CM * WRIST_SIDE.sidPxPerCm;
  // The dimension line sits on the side of the ray with room for the reference label (left when the ray is far right).
  const side = rayX > 250 ? -1 : 1;
  const dimX = rayX + side * DIM_OFFSET;
  const anchor = side > 0 ? "start" : "end";
  const fA = slabX(field.y2); // forearm end of the field (left)
  const fB = slabX(field.y1); // fingers end of the field (right)
  const slabL = slabX(detector.heightCm);
  // The wrist as drawn: the midcarpal area of the baseline, where the exam's centring rule aims (fixed anatomy, the learner moves the ray).
  const wristCm = ((radCase.positioning.centering.target.y + 1) / 2) * detector.heightCm;
  const wristX = slabX(wristCm);
  const handH = lateral ? 34 : 15;
  const armH = 22;
  const level = S - 12 - armH / 2;
  return (
    <svg viewBox="0 -8 450 346" role="img" aria-label={ts("altWristSide", { projection: tw(lateral ? "lateralName" : "paName"), sid: settings.sidCm })} className="h-auto w-full" style={{ direction: "ltr" }}>
      {/* table (fixed) and the detector on it */}
      <rect x={20} y={S + 10} width={410} height={12} rx={3} fill={SCENE.bed} stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeOpacity={0.5} />
      <rect x={slabL} y={S - 1} width={slabX(0) - slabL} height={11} rx={2} fill={SCENE.detector} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
      {/* patient seated at the end of the table: trunk and head (left), the arm out along the table at the table level */}
      <path d={`M 14 ${S + 60} L 14 ${S - 112} C 14 ${S - 124} 24 ${S - 130} 40 ${S - 130} L 70 ${S - 130} C 84 ${S - 130} 92 ${S - 120} 92 ${S - 104} L 92 ${S + 60} Z`} fill={SCENE.trunk} stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeLinejoin="round" />
      <HeadProfile cx={54} cy={S - 178} s={0.5} facing={1} />
      <Limb
        pts={[
          { x: 70, y: level, w: 30 },
          { x: 140, y: level + 1, w: 24 },
          { x: wristX - 22, y: level + 2, w: armH },
          { x: wristX, y: S - 3 - handH / 2 + 1, w: handH + 4 },
          { x: slabX(0) - 36, y: S - 3 - handH / 2 + 1, w: handH },
        ]}
      />
      {/* the collimated field on the detector (amber, as on the detector view) */}
      <UnderStroked stroke={SCENE.beam} width={4}>
        {(p) => <line x1={fA} y1={S + 4.5} x2={fB} y2={S + 4.5} {...p} fill="none" />}
      </UnderStroked>
      {/* beam: the cone to the field ends, the perpendicular central ray with a right-angle mark on the detector */}
      <polygon points={`${rayX},${tubeY} ${fA},${S + 4.5} ${fB},${S + 4.5}`} fill={SCENE.beam} opacity={0.14} />
      <UnderStroked stroke={SCENE.beam} width={2} dash="6 4">
        {(p) => <line x1={rayX} y1={tubeY} x2={rayX} y2={S} {...p} />}
      </UnderStroked>
      <UnderStroked stroke={SCENE.beam} width={2}>
        {(p) => <path d={`M ${rayX - 9} ${S - 1} L ${rayX - 9} ${S - 10} L ${rayX} ${S - 10}`} {...p} fill="none" />}
      </UnderStroked>
      <g>
        <rect x={rayX - 26} y={tubeY - 30} width={52} height={26} rx={4} fill={SCENE.tube} stroke={SCENE.underStroke} strokeWidth={1.5} />
        <rect x={rayX - 15} y={tubeY - 4} width={30} height={9} rx={2} fill={SCENE.detector} stroke={SCENE.underStroke} strokeWidth={1} />
      </g>
      <SceneLabel x={rayX} y={tubeY - 40} size={LABEL_SIZE.view} anchor="middle">{ts("tube")}</SceneLabel>
      {/* SID: a dimension line parallel to the central ray; the reference tick on the same line (guides) */}
      <g aria-hidden>
        <UnderStroked stroke={SCENE.label} width={1.5}>
          {(p) => <line x1={dimX} y1={tubeY} x2={dimX} y2={S} {...p} />}
        </UnderStroked>
        {[tubeY, S].map((y) => (
          <UnderStroked key={y} stroke={SCENE.label} width={1.5}>
            {(p) => <line x1={dimX - 8} y1={y} x2={dimX + 8} y2={y} {...p} />}
          </UnderStroked>
        ))}
        {showGuides && (
          <>
            {SID_REFERENCE_CM > settings.sidCm && (
              <UnderStroked stroke={SCENE.good} width={2} dash="3 4">
                {(p) => <line x1={dimX} y1={tubeY} x2={dimX} y2={S - refPx} {...p} />}
              </UnderStroked>
            )}
            <UnderStroked stroke={SCENE.good} width={3}>
              {(p) => <line x1={dimX - 8} y1={S - refPx} x2={dimX + 8} y2={S - refPx} {...p} />}
            </UnderStroked>
            <SceneLabel x={dimX + side * 14} y={S - refPx + 5} size={LABEL_SIZE.view - 2} anchor={anchor} fill={SCENE.good}>{t("sidTarget", { sid: SID_REFERENCE_CM })}</SceneLabel>
          </>
        )}
      </g>
      <SceneLabel x={rayX} y={tubeY - 68} size={LABEL_SIZE.view} anchor="middle">{ts("sidValue", { value: settings.sidCm })}</SceneLabel>
      {showGuides && (
        <g aria-hidden>
          {/* the centring target: the midcarpal area of the drawn wrist (green = target) and the "same level" reference (sky, context only) */}
          <UnderStroked stroke={SCENE.good} width={2.5}>
            {(p) => <path d={`M ${wristX - 7} ${S + 16} L ${wristX} ${S + 8} L ${wristX + 7} ${S + 16}`} {...p} fill="none" />}
          </UnderStroked>
          <UnderStroked stroke={SCENE.guide} width={1.5} dash="3 5">
            {(p) => <line x1={70} y1={level} x2={wristX} y2={level} {...p} />}
          </UnderStroked>
          <SceneLabel x={104} y={level - 30} size={LABEL_SIZE.view - 2} fill={SCENE.guide}>{tw("sameLevel")}</SceneLabel>
          <SceneLabel x={slabL} y={S + 46} size={LABEL_SIZE.view - 2} fill={SCENE.good}>{tw("midcarpal")}</SceneLabel>
        </g>
      )}
      <SceneLabel x={14} y={S + 46} size={LABEL_SIZE.view}>{tw("seated")}</SceneLabel>
      <SceneLabel x={slabX(0) - 4} y={S - 36} size={LABEL_SIZE.view} anchor="end">{tw("fingers")}</SceneLabel>
      <SceneLabel x={430} y={S + 46} size={LABEL_SIZE.view} anchor="end">{ts("detector")}</SceneLabel>
    </svg>
  );
}
