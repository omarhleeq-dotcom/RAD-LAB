"use client";

import { useTranslations } from "next-intl";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { collimatedField } from "@/features/simulation/geometry";
import { HeadProfile, Limb, SceneArrow, SceneLabel, UnderStroked } from "./SceneParts";
import { LABEL_SIZE, SCENE, STROKE } from "./scene-style";
import { AP_SIDE, apSideLayout } from "./visual-model";

/** Educational SID reference (S10b-23 / S10b-26: 183 cm; 180 cm is its rounding). Mirrors the SID rule target of the exam. */
const SID_REFERENCE_CM = 183;
const S = AP_SIDE.surfaceY;
const SLAB_LEN = 43 * AP_SIDE.pxPerCm;
/** Distance of the SID dimension line from the central ray, perpendicular to it. */
const DIM_OFFSET = 30;

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
  showGuides: boolean;
}

/**
 * Hand-drawn schematic SIDE view of the AP chest (S13 scene "chest-ap-supine"; redrawn in S13b-1 / -2): the patient in profile
 * on the bed, head to the viewer's LEFT (face up), the detector under the back and the tube above. It draws what the learner
 * controls and what is scored: the position (supine, or the head end raised when semi-erect: patient and detector rise together
 * about the hips), the shoulders (rolled forward lifts the shoulder off the bed), the tube with its caudad angle and the central
 * ray, the collimated field on the detector, and the SID measured along the beam (dimension line with its reference tick).
 * Nothing the result will reveal is shown. Drawing only, never a measurement.
 */
export function ApSupineView({ radCase, settings, showGuides }: Props) {
  const t = useTranslations("positioning");
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
  const rad = (angle * Math.PI) / 180;
  const u = { x: Math.sin(rad), y: Math.cos(rad) }; // tube -> target
  const n = { x: Math.cos(rad), y: -Math.sin(rad) }; // perpendicular, to the right
  const off = (p: { x: number; y: number }, d: number) => ({ x: p.x + n.x * d, y: p.y + n.y * d });
  const dimA = off(tube, DIM_OFFSET);
  const dimB = off(target, DIM_OFFSET);
  const refPx = SID_REFERENCE_CM * AP_SIDE.sidPxPerCm;
  const refPt = off({ x: target.x - u.x * refPx, y: target.y - u.y * refPx }, DIM_OFFSET);
  const dimMid = off({ x: (tube.x + target.x) / 2, y: (tube.y + target.y) / 2 }, DIM_OFFSET + 10);
  const sh = { x: 132, y: rolled ? S - 52 : S - 42 };
  const px = AP_SIDE.pivot.x;
  const tick = (p: { x: number; y: number }, color: string, w = 1.5) => (
    <UnderStroked stroke={color} width={w}>
      {(q) => <line x1={p.x - n.x * 8} y1={p.y - n.y * 8} x2={p.x + n.x * 8} y2={p.y + n.y * 8} {...q} />}
    </UnderStroked>
  );
  return (
    <svg viewBox="0 -8 450 346" role="img" aria-label={ts("altSide", { state: ts(semi ? "stateSemierect" : "stateSupine"), angle, sid: settings.sidCm })} className="h-auto w-full" style={{ direction: "ltr" }}>
      {/* bed (fixed) */}
      <rect x={20} y={S + 42} width={410} height={12} rx={3} fill={SCENE.bed} stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeOpacity={0.5} />
      {/* legs and feet (fixed): thigh, lower leg, foot */}
      <path d={`M ${px - 2} ${S} L ${px - 2} ${S - 30} C ${px + 32} ${S - 34} ${px + 64} ${S - 28} ${px + 94} ${S - 24} L ${px + 102} ${S - 24} L ${px + 108} ${S - 48} L ${px + 124} ${S - 42} L ${px + 124} ${S} Z`} fill={SCENE.limbFar} stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeLinejoin="round" />
      {/* head end: the back rest, the detector under the back and the patient rise together about the hips */}
      <g transform={L.raiseDeg ? `rotate(${L.raiseDeg} ${px} ${AP_SIDE.pivot.y})` : undefined}>
        <rect x={AP_SIDE.slabX0 - 24} y={S + 8} width={SLAB_LEN + 48} height={14} rx={3} fill={SCENE.bed} stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeOpacity={0.5} />
        <rect x={AP_SIDE.slabX0} y={S - 1} width={SLAB_LEN} height={9} rx={2} fill={SCENE.detector} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
        {/* patient: head (face up), trunk with the chest rising, the near arm along the side with its shoulder */}
        <path d={`M 100 ${S} L 100 ${S - 18} C 112 ${S - 22} 118 ${S - 36} 136 ${S - 44} C 164 ${S - 56} 214 ${S - 54} 250 ${S - 42} C 278 ${S - 36} 292 ${S - 34} ${px} ${S - 32} L ${px} ${S} Z`} fill={SCENE.trunk} stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeLinejoin="round" />
        <HeadProfile cx={80} cy={AP_SIDE.head.y - 1} s={0.6} facing={1} turn={-90} />
        <Limb
          opacity={0.92}
          pts={[
            { x: sh.x, y: sh.y, w: 26 },
            { x: 196, y: S - 26, w: 19 },
            { x: 252, y: S - 22, w: 14 },
            { x: 272, y: S - 20, w: 17 },
          ]}
        />
        {/* the collimated field on the detector (amber, as on the detector view) */}
        <UnderStroked stroke={SCENE.beam} width={4}>
          {(p) => <line x1={AP_SIDE.slabX0 + field.y1 * AP_SIDE.pxPerCm} y1={S + 3.5} x2={AP_SIDE.slabX0 + field.y2 * AP_SIDE.pxPerCm} y2={S + 3.5} {...p} fill="none" />}
        </UnderStroked>
      </g>
      {/* beam: the cone to the field ends, the central ray and the vertical reference */}
      <polygon points={`${tube.x},${tube.y} ${L.fieldA.x},${L.fieldA.y} ${L.fieldB.x},${L.fieldB.y}`} fill={SCENE.beam} opacity={0.14} />
      {angle !== 0 && <line x1={target.x} y1={target.y - L.sidPx} x2={target.x} y2={target.y} stroke={SCENE.label} strokeWidth={1} strokeDasharray="2 5" opacity={0.6} />}
      <UnderStroked stroke={SCENE.beam} width={2} dash="6 4">
        {(p) => <line x1={tube.x} y1={tube.y} x2={target.x} y2={target.y} {...p} />}
      </UnderStroked>
      <g transform={`rotate(${L.tubeRotDeg} ${tube.x} ${tube.y})`}>
        <rect x={tube.x - 24} y={tube.y - 30} width={48} height={26} rx={4} fill={SCENE.tube} stroke={SCENE.underStroke} strokeWidth={1.5} />
        <rect x={tube.x - 14} y={tube.y - 4} width={28} height={9} rx={2} fill={SCENE.detector} stroke={SCENE.underStroke} strokeWidth={1} />
      </g>
      <SceneLabel x={tube.x} y={tube.y - 40} size={LABEL_SIZE.view} anchor="middle">{ts("tube")}</SceneLabel>
      {/* SID: a dimension line parallel to the central ray from the tube to the detector, ticks across it; the reference tick on the same line */}
      <g aria-hidden>
        <UnderStroked stroke={SCENE.label} width={1.5}>
          {(p) => <line x1={dimA.x} y1={dimA.y} x2={dimB.x} y2={dimB.y} {...p} />}
        </UnderStroked>
        {tick(dimA, SCENE.label)}
        {tick(dimB, SCENE.label)}
        {showGuides && (
          <>
            {SID_REFERENCE_CM > settings.sidCm && (
              <UnderStroked stroke={SCENE.good} width={2} dash="3 4">
                {(p) => <line x1={dimA.x} y1={dimA.y} x2={refPt.x} y2={refPt.y} {...p} />}
              </UnderStroked>
            )}
            {tick(refPt, SCENE.good, 3)}
            <SceneLabel x={refPt.x + 14} y={refPt.y + 5} size={LABEL_SIZE.view - 2} fill={SCENE.good}>{t("sidTarget", { sid: SID_REFERENCE_CM })}</SceneLabel>
          </>
        )}
      </g>
      <SceneLabel x={dimMid.x} y={dimMid.y + 5} size={LABEL_SIZE.view}>{ts("sidValue", { value: settings.sidCm })}</SceneLabel>
      {/* orientation, each label in its own slot: anterior up, posterior down (the bed), head left, feet right */}
      <SceneArrow x1={14} y1={S - 6} x2={14} y2={S - 92} />
      <SceneLabel x={26} y={S - 98} size={LABEL_SIZE.view}>{ts("anterior")}</SceneLabel>
      <SceneArrow x1={14} y1={S + 40} x2={14} y2={S + 74} />
      <SceneLabel x={26} y={S + 76} size={LABEL_SIZE.view}>{ts("posterior")}</SceneLabel>
      <SceneLabel x={L.head.x} y={L.head.y - 42} size={LABEL_SIZE.view} anchor="middle">{ts("head")}</SceneLabel>
      <SceneLabel x={px + 114} y={S - 58} size={LABEL_SIZE.view} anchor="middle">{ts("feet")}</SceneLabel>
      <SceneLabel x={L.detectorLabel.x} y={L.detectorLabel.y} size={LABEL_SIZE.view} anchor="middle">{ts("detector")}</SceneLabel>
      <SceneLabel x={440} y={S + 94} size={LABEL_SIZE.view} anchor="end" fill={SCENE.beam}>{ts("tubeAngle", { angle })}</SceneLabel>
    </svg>
  );
}
