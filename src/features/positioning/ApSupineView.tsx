"use client";

import { useTranslations } from "next-intl";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { collimatedField } from "@/features/simulation/geometry";
import { SceneArrow, SceneLabel } from "./SceneParts";
import { LABEL_SIZE, SCENE, STROKE } from "./scene-style";
import { AP_SIDE, apSideLayout } from "./visual-model";

/** Educational SID reference (S10b-23 / S10b-26: 183 cm; 180 cm is its rounding). Mirrors the SID rule target of the exam. */
const SID_REFERENCE_CM = 183;
const SURFACE = AP_SIDE.surfaceY;
const SLAB_LEN = 43 * AP_SIDE.pxPerCm;

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
  showGuides: boolean;
}

/**
 * Hand-drawn schematic SIDE view of the AP chest (S13 scene "chest-ap-supine", redrawn in S13b-1): the patient lies on the
 * bed, head to the viewer's LEFT, with the detector under the back and the tube above. It draws what the learner controls and
 * what is scored: the position (supine, or the head end raised when semi-erect: patient and detector rise together), the
 * shoulders (rolled forward lifts the shoulder off the bed), the tube with its caudad angle and the central ray, the
 * collimated field on the detector and the SID. Nothing the result will reveal is shown. Drawing only, never a measurement.
 */
export function ApSupineView({ radCase, settings, showGuides }: Props) {
  const t = useTranslations("positioning");
  const ta = useTranslations("positioningAp");
  const ts = useTranslations("scene");
  const angle = settings.tubeAngulationDeg ?? 0;
  const semi = settings.choices?.state === "semierect";
  const rolled = settings.shoulderPosition === "rolled-forward";
  const { detector } = radCase;
  const field = collimatedField(settings, detector);
  const L = apSideLayout({
    tubeAngleDeg: angle,
    sidCm: settings.sidCm,
    semiErect: semi,
    detectorHeightCm: detector.heightCm,
    rayCm: ((settings.centralRay.y + 1) / 2) * detector.heightCm,
    fieldFromCm: field.y1,
    fieldToCm: field.y2,
  });
  const { target, tube } = L;
  const refPx = SID_REFERENCE_CM * AP_SIDE.sidPxPerCm;
  const sh = { x: 130, y: rolled ? 196 : 204 };
  return (
    <svg viewBox="0 -8 450 310" role="img" aria-label={ts("altSide", { state: ts(semi ? "stateSemierect" : "stateSupine"), angle, sid: settings.sidCm })} className="h-auto w-full" style={{ direction: "ltr" }}>
      {/* bed (fixed) */}
      <rect x={20} y={SURFACE + 30} width={410} height={12} rx={3} fill={SCENE.bed} />
      <rect x={90} y={SURFACE + 42} width={14} height={14} fill={SCENE.bed} />
      <rect x={346} y={SURFACE + 42} width={14} height={14} fill={SCENE.bed} />
      {/* legs (fixed) */}
      <rect x={AP_SIDE.pivot.x - 4} y={SURFACE - 28} width={118} height={40} rx={13} fill={SCENE.trunk} />
      {/* head end: the back rest, the detector under the back and the patient rise together */}
      <g transform={L.raiseDeg ? `rotate(${L.raiseDeg} ${AP_SIDE.pivot.x} ${AP_SIDE.pivot.y})` : undefined}>
        <rect x={AP_SIDE.slabX0 - 20} y={SURFACE} width={SLAB_LEN + 40} height={12} rx={3} fill={SCENE.bed} />
        <rect x={AP_SIDE.slabX0} y={SURFACE - 1} width={SLAB_LEN} height={9} rx={2} fill={SCENE.detector} />
        {/* patient: head (face up), neck, trunk with the chest rising, near arm along the side */}
        <ellipse cx={AP_SIDE.head.x} cy={AP_SIDE.head.y} rx={22} ry={22} fill={SCENE.head} />
        <path d={`M ${AP_SIDE.head.x - 6} ${AP_SIDE.head.y - 20} L ${AP_SIDE.head.x + 2} ${AP_SIDE.head.y - 30} L ${AP_SIDE.head.x + 10} ${AP_SIDE.head.y - 18} Z`} fill={SCENE.bone} />
        <rect x={96} y={SURFACE - 26} width={26} height={24} fill={SCENE.head} />
        <path d={`M 110 ${SURFACE} L 110 ${SURFACE - 22} Q 118 ${SURFACE - 46} 160 ${SURFACE - 48} L 250 ${SURFACE - 42} Q 306 ${SURFACE - 38} 306 ${SURFACE - 20} L 306 ${SURFACE} Z`} fill={SCENE.trunk} />
        <path d={`M ${sh.x} ${sh.y} L 196 ${SURFACE - 15} L 262 ${SURFACE - 13}`} fill="none" stroke={SCENE.limb} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={sh.x} cy={sh.y} r={14} fill={SCENE.limb} />
        {/* the collimated field on the detector (amber, as on the detector view) */}
        <line x1={AP_SIDE.slabX0 + field.y1 * AP_SIDE.pxPerCm} y1={SURFACE + 4} x2={AP_SIDE.slabX0 + field.y2 * AP_SIDE.pxPerCm} y2={SURFACE + 4} stroke={SCENE.beam} strokeWidth={STROKE.heavy} />
      </g>
      {/* beam: the cone to the field ends, the central ray, and the vertical reference */}
      <polygon points={`${tube.x},${tube.y} ${L.fieldA.x},${L.fieldA.y} ${L.fieldB.x},${L.fieldB.y}`} fill={SCENE.beam} opacity={0.14} />
      {angle !== 0 && <line x1={target.x} y1={target.y - L.sidPx} x2={target.x} y2={target.y} stroke={SCENE.label} strokeWidth={1} strokeDasharray="3 5" opacity={0.6} />}
      <line x1={tube.x} y1={tube.y} x2={target.x} y2={target.y} stroke={SCENE.beam} strokeWidth={STROKE.medium - 1} strokeDasharray="6 4" />
      <g transform={`rotate(${L.tubeRotDeg} ${tube.x} ${tube.y})`}>
        <rect x={tube.x - 24} y={tube.y - 30} width={48} height={26} rx={4} fill={SCENE.tube} />
        <rect x={tube.x - 14} y={tube.y - 4} width={28} height={9} rx={2} fill={SCENE.detector} />
      </g>
      <SceneLabel x={tube.x} y={tube.y - 38} size={LABEL_SIZE.view} anchor="middle">{ts("tube")}</SceneLabel>
      {/* SID, measured along the beam from the tube to the detector */}
      <g aria-hidden>
        <line x1={436} y1={target.y - L.sidPx} x2={436} y2={target.y} stroke={SCENE.label} strokeWidth={1} />
        <line x1={430} y1={target.y - L.sidPx} x2={442} y2={target.y - L.sidPx} stroke={SCENE.label} />
        <line x1={430} y1={target.y} x2={442} y2={target.y} stroke={SCENE.label} />
      </g>
      <SceneLabel x={430} y={target.y - L.sidPx / 2} size={LABEL_SIZE.view} anchor="end">{`${t("sid")} ${settings.sidCm} cm`}</SceneLabel>
      {showGuides && (
        <g aria-hidden>
          <line x1={430} y1={target.y - refPx} x2={444} y2={target.y - refPx} stroke={SCENE.good} strokeWidth={2} strokeDasharray="3 3" />
          <SceneLabel x={424} y={target.y - refPx + 5} size={LABEL_SIZE.view - 2} anchor="end" fill={SCENE.good}>{t("sidTarget", { sid: SID_REFERENCE_CM })}</SceneLabel>
        </g>
      )}
      {/* orientation: anterior up, posterior down (the bed), head left, feet right */}
      <SceneArrow x1={14} y1={SURFACE - 8} x2={14} y2={SURFACE - 66} />
      <SceneLabel x={26} y={SURFACE - 62} size={LABEL_SIZE.view}>{ts("anterior")}</SceneLabel>
      <SceneLabel x={20} y={SURFACE + 62} size={LABEL_SIZE.view}>{ts("posterior")}</SceneLabel>
      <SceneLabel x={L.head.x} y={L.head.y - 34} size={LABEL_SIZE.view} anchor="middle">{ts("head")}</SceneLabel>
      <SceneLabel x={392} y={SURFACE - 36} size={LABEL_SIZE.view} anchor="middle">{ts("feet")}</SceneLabel>
      <SceneLabel x={L.detectorLabel.x} y={L.detectorLabel.y} size={LABEL_SIZE.view} anchor="middle">{ts("detector")}</SceneLabel>
      <SceneLabel x={440} y={SURFACE + 62} size={LABEL_SIZE.view} anchor="end" fill={SCENE.beam}>{ta("angleReadout", { angle })}</SceneLabel>
    </svg>
  );
}
