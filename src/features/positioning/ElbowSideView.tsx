"use client";

import { useTranslations } from "next-intl";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { collimatedField } from "@/features/simulation/geometry";
import { HeadProfile, Limb, SceneLabel, UnderStroked } from "./SceneParts";
import { ELBOW_SIDE, apSlabX, lateralSlabX } from "./elbow-visual";
import { LABEL_SIZE, SCENE, STROKE } from "./scene-style";

/** Educational reference SID (S14.2b phase 2: Bontrager's minimum 40 in = 102 cm). Mirrors the SID rule of the exam. */
const SID_REFERENCE_CM = 102;
const S = ELBOW_SIDE.surfaceY;
const DIM_OFFSET = 34;

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
  showGuides: boolean;
}

/**
 * Hand-drawn schematic SIDE view of the elbow set-up (S14.3, own work, S13b language; the hand's `HandSideView` pattern): the patient seated at
 * the end of the table, the arm on the detector, the tube above with the central ray PERPENDICULAR to the detector (no tube-angle control), the
 * collimated field on the detector and the SID measured along the beam. AP: the arm is fully extended along the table (the humerus end of the
 * detector at the patient's side, the forearm to the right, palm up). Lateral: the elbow is flexed 90° in the horizontal plane: the forearm lies on
 * the detector on its ulnar edge (thumb side up) and the upper arm points toward the viewer (drawn end-on, a circle at the elbow). It draws the
 * learner's own settings and nothing the result reveals. Drawing only, never a measurement. It is not the plan view (PlanView is chest only).
 */
export function ElbowSideView({ radCase, settings, showGuides }: Props) {
  const t = useTranslations("positioning");
  const ts = useTranslations("scene");
  const te = useTranslations("sceneElbow");
  const lateral = settings.projection === "elbow-lateral";
  const { detector } = radCase;
  const field = collimatedField(settings, detector);
  // The slab axis: AP = the detector's long axis (y), lateral = the detector's width (x, the forearm's axis).
  const lengthCm = lateral ? detector.widthCm : detector.heightCm;
  const toX = (cm: number) => (lateral ? lateralSlabX(cm) : apSlabX(cm, lengthCm));
  const rayCm = lateral ? ((settings.centralRay.x + 1) / 2) * detector.widthCm : ((settings.centralRay.y + 1) / 2) * detector.heightCm;
  const rayX = toX(rayCm);
  const sidPx = settings.sidCm * ELBOW_SIDE.sidPxPerCm;
  const tubeY = S - sidPx;
  const refPx = SID_REFERENCE_CM * ELBOW_SIDE.sidPxPerCm;
  // The dimension line sits on the side of the ray with room for the reference label (left when the ray is far right).
  const side = rayX > 250 ? -1 : 1;
  const dimX = rayX + side * DIM_OFFSET;
  const anchor = side > 0 ? "start" : "end";
  const [fa, fb] = lateral ? [toX(field.x1), toX(field.x2)] : [toX(field.y1), toX(field.y2)];
  const fA = Math.min(fa, fb);
  const fB = Math.max(fa, fb);
  const slabL = toX(lateral ? detector.widthCm : 0);
  const slabR = toX(lateral ? 0 : lengthCm);
  const slabA = Math.min(slabL, slabR);
  const slabB = Math.max(slabL, slabR);
  // The mid-elbow target of the exam (fixed anatomy; the learner moves the ray).
  const tg = radCase.positioning.centering.target;
  const targetCm = lateral ? ((tg.x + 1) / 2) * detector.widthCm : ((tg.y + 1) / 2) * detector.heightCm;
  const targetX = toX(targetCm);
  const armH = 22;
  const level = S - 12 - armH / 2;
  const forearmH = lateral ? 34 : 15;
  return (
    <svg viewBox="0 -8 450 346" role="img" aria-label={ts("altElbowSide", { projection: te(lateral ? "lateralName" : "apName"), sid: settings.sidCm })} className="h-auto w-full" style={{ direction: "ltr" }}>
      {/* table (fixed) and the detector on it */}
      <rect x={20} y={S + 10} width={410} height={12} rx={3} fill={SCENE.bed} stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeOpacity={0.5} />
      <rect x={slabA} y={S - 1} width={slabB - slabA} height={11} rx={2} fill={SCENE.detector} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
      {/* patient seated at the end of the table: trunk and head (left) */}
      <path d={`M 14 ${S + 60} L 14 ${S - 112} C 14 ${S - 124} 24 ${S - 130} 40 ${S - 130} L 70 ${S - 130} C 84 ${S - 130} 92 ${S - 120} 92 ${S - 104} L 92 ${S + 60} Z`} fill={SCENE.trunk} stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeLinejoin="round" />
      <HeadProfile cx={54} cy={S - 178} s={0.5} facing={1} />
      {lateral ? (
        <>
          {/* the upper arm comes toward the viewer from the shoulder (end-on circle at the elbow); the forearm lies on the detector on its ulnar edge, thumb side up */}
          <Limb
            pts={[
              { x: targetX - 4, y: S - 3 - forearmH / 2 + 1, w: forearmH + 4 },
              { x: targetX + 60, y: S - 3 - forearmH / 2 + 1, w: forearmH },
              { x: 420, y: S - 3 - forearmH / 2 + 1, w: forearmH - 6 },
            ]}
          />
          <circle cx={targetX - 4} cy={S - 3 - forearmH / 2 + 1} r={(forearmH + 4) / 2 + 3} fill={SCENE.limb} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
        </>
      ) : (
        <Limb
          pts={[
            { x: 70, y: level, w: 30 },
            { x: 140, y: level + 1, w: 26 },
            { x: slabA + 20, y: level + 2, w: armH },
            { x: targetX, y: S - 3 - forearmH / 2 + 1, w: forearmH + 6 },
            { x: 420, y: S - 3 - forearmH / 2 + 1, w: forearmH - 2 },
          ]}
        />
      )}
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
          {/* the centring target: the mid-elbow joint of the drawn arm (green = target) */}
          <UnderStroked stroke={SCENE.good} width={2.5}>
            {(p) => <path d={`M ${targetX - 7} ${S + 16} L ${targetX} ${S + 8} L ${targetX + 7} ${S + 16}`} {...p} fill="none" />}
          </UnderStroked>
          <SceneLabel x={slabA} y={S + 46} size={LABEL_SIZE.view - 2} fill={SCENE.good}>{te("midElbow")}</SceneLabel>
        </g>
      )}
      <SceneLabel x={14} y={S + 46} size={LABEL_SIZE.view}>{te("seated")}</SceneLabel>
      <SceneLabel x={slabB - 4} y={S - 36} size={LABEL_SIZE.view} anchor="end">{te(lateral ? "upperArmTowardViewer" : "forearm")}</SceneLabel>
      <SceneLabel x={430} y={S + 46} size={LABEL_SIZE.view} anchor="end">{ts("detector")}</SceneLabel>
    </svg>
  );
}
