"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { SimulationSettings } from "@/domain/simulation";
import { HeadProfile, SceneLabel, UnderStroked } from "./SceneParts";
import { LABEL_SIZE, SCENE, STROKE } from "./scene-style";

/** Educational reference SID (S14.1b-1, S14.2a, S14.2b phase 2: Bontrager's minimum 40 in = 102 cm). Mirrors the SID rule of the exams. */
const SID_REFERENCE_CM = 102;
const DIM_OFFSET = 34;

interface Props {
  settings: SimulationSettings;
  showGuides: boolean;
  /** The family's side-view constants: the detector surface line and the SID scale. */
  surfaceY: number;
  sidPxPerCm: number;
  /** Text alternative of the drawing (settings-derived, family wording). */
  ariaLabel: string;
  /** Horizontal positions on the slab: the central ray, the two ends of the collimated field, the detector slab and the target chevron. */
  rayX: number;
  fieldA: number;
  fieldB: number;
  slabX: number;
  slabWidth: number;
  targetX: number;
  /** The patient's limb as drawn by the family (on the slab, at the table level). */
  limb: ReactNode;
  /** Family-only guide shapes drawn between the target chevron and the target label (guides ON). */
  extraGuides?: ReactNode;
  /** Guide label of the centring target (guides ON) and the two always-shown labels: the seated patient and the far end of the limb. */
  targetLabel: string;
  seatedLabel: string;
  endLabel: { x: number; text: string };
}

/**
 * The common frame of the SEATED upper-limb side views (wrist S14.1c, hand S14.2b, elbow S14.3; CLN-028, RAD-068): the table and the detector
 * slab on it, the patient seated at the end of the table (trunk and head, left), the tube above with the central ray PERPENDICULAR to the
 * detector (no tube-angle control), the collimated field on the detector, the beam cone, the SID measured along the beam with its reference
 * tick (guides), the centring target chevron and the labels. Each family supplies only its limb drawing, its slab mapping and its words. It
 * draws the learner's own settings and nothing the result reveals. Drawing only, never a measurement. It is not the plan view (PlanView is
 * chest only).
 */
export function SeatedLimbSideView({ settings, showGuides, surfaceY: S, sidPxPerCm, ariaLabel, rayX, fieldA: fA, fieldB: fB, slabX, slabWidth, targetX, limb, extraGuides, targetLabel, seatedLabel, endLabel }: Props) {
  const t = useTranslations("positioning");
  const ts = useTranslations("scene");
  const sidPx = settings.sidCm * sidPxPerCm;
  const tubeY = S - sidPx;
  const refPx = SID_REFERENCE_CM * sidPxPerCm;
  // The dimension line sits on the side of the ray with room for the reference label (left when the ray is far right).
  const side = rayX > 250 ? -1 : 1;
  const dimX = rayX + side * DIM_OFFSET;
  const anchor = side > 0 ? "start" : "end";
  return (
    <svg viewBox="0 -8 450 346" role="img" aria-label={ariaLabel} className="h-auto w-full" style={{ direction: "ltr" }}>
      {/* table (fixed) and the detector on it */}
      <rect x={20} y={S + 10} width={410} height={12} rx={3} fill={SCENE.bed} stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeOpacity={0.5} />
      <rect x={slabX} y={S - 1} width={slabWidth} height={11} rx={2} fill={SCENE.detector} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
      {/* patient seated at the end of the table: trunk and head (left), then the family's limb */}
      <path d={`M 14 ${S + 60} L 14 ${S - 112} C 14 ${S - 124} 24 ${S - 130} 40 ${S - 130} L 70 ${S - 130} C 84 ${S - 130} 92 ${S - 120} 92 ${S - 104} L 92 ${S + 60} Z`} fill={SCENE.trunk} stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeLinejoin="round" />
      <HeadProfile cx={54} cy={S - 178} s={0.5} facing={1} />
      {limb}
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
          {/* the centring target of the exam on the drawn limb (green = target), then any family guide */}
          <UnderStroked stroke={SCENE.good} width={2.5}>
            {(p) => <path d={`M ${targetX - 7} ${S + 16} L ${targetX} ${S + 8} L ${targetX + 7} ${S + 16}`} {...p} fill="none" />}
          </UnderStroked>
          {extraGuides}
          <SceneLabel x={slabX} y={S + 46} size={LABEL_SIZE.view - 2} fill={SCENE.good}>{targetLabel}</SceneLabel>
        </g>
      )}
      <SceneLabel x={14} y={S + 46} size={LABEL_SIZE.view}>{seatedLabel}</SceneLabel>
      <SceneLabel x={endLabel.x} y={S - 36} size={LABEL_SIZE.view} anchor="end">{endLabel.text}</SceneLabel>
      <SceneLabel x={430} y={S + 46} size={LABEL_SIZE.view} anchor="end">{ts("detector")}</SceneLabel>
    </svg>
  );
}
