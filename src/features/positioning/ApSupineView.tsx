"use client";

import { useTranslations } from "next-intl";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { collimatedField } from "@/features/simulation/geometry";
import { HEAD_SIDE_CM, limbPath } from "./LateralFigure";
import { SceneArrow, SceneLabel, UnderStroked } from "./SceneParts";
import { BODY, LABEL_SIZE, SCENE, STROKE } from "./scene-style";
import { AP_SIDE, apSideLayout } from "./visual-model";

/** Educational SID reference (S10b-23 / S10b-26: 183 cm; 180 cm is its rounding). Mirrors the SID rule target of the exam. */
const SID_REFERENCE_CM = 183;
const S = AP_SIDE.surfaceY;
const SLAB_LEN = 43 * AP_SIDE.pxPerCm;
/** Patient drawing scale: the detector's (one proportion set, RAD-072 1b). */
const K = AP_SIDE.pxPerCm;
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
 * RAD-072 1b: the patient from the shared `BODY` proportions at the detector's scale — head joined to the trunk by the neck, the near
 * arm along the side with the forearm on the abdomen, legs of natural thickness with a foot, one silhouette through the hip when the
 * head end is raised — and the tube angle drawn from the perpendicular to the detector (owner decision S5; supine unchanged).
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
  // Beam direction from the screen vertical (the tube angle from the detector perpendicular, minus the raise).
  const rad = (-L.tubeRotDeg * Math.PI) / 180;
  const u = { x: Math.sin(rad), y: Math.cos(rad) }; // tube -> target
  const n = { x: Math.cos(rad), y: -Math.sin(rad) }; // perpendicular, to the right
  const raise = (L.raiseDeg * Math.PI) / 180;
  const normal = { x: Math.sin(raise), y: -Math.cos(raise) }; // detector perpendicular, toward the tube
  const off = (p: { x: number; y: number }, d: number) => ({ x: p.x + n.x * d, y: p.y + n.y * d });
  const dimA = off(tube, DIM_OFFSET);
  const dimB = off(target, DIM_OFFSET);
  const refPx = SID_REFERENCE_CM * AP_SIDE.sidPxPerCm;
  const refPt = off({ x: target.x - u.x * refPx, y: target.y - u.y * refPx }, DIM_OFFSET);
  const dimMid = off({ x: (tube.x + target.x) / 2, y: (tube.y + target.y) / 2 }, DIM_OFFSET + 10);
  const px = AP_SIDE.pivot.x;
  const tick = (p: { x: number; y: number }, color: string, w = 1.5) => (
    <UnderStroked stroke={color} width={w}>
      {(q) => <line x1={p.x - n.x * 8} y1={p.y - n.y * 8} x2={p.x + n.x * 8} y2={p.y + n.y * 8} {...q} />}
    </UnderStroked>
  );
  // Patient (BODY at K px per cm), back on the detector surface S, head to the left. Shoulder 5 cm below the slab's head end.
  const shX = AP_SIDE.slabX0 + 5 * K;
  const neckX = shX - BODY.neck.h * K;
  const chest = BODY.thorax.d * K, belly = BODY.trunk.abdomenD * K, neckD = BODY.neck.d * K;
  const trunk =
    `M ${neckX - 4} ${S} L ${neckX - 4} ${S - neckD} C ${neckX + 8} ${S - neckD - 2} ${shX - 4} ${S - chest + 10} ${shX + 12} ${S - chest + 3} ` +
    `C ${shX + 26} ${S - chest - 2} ${shX + 52} ${S - chest - 1} ${shX + 66} ${S - chest + 6} C ${shX + 80} ${S - belly - 2} ${px - 16} ${S - belly + 2} ${px} ${S - BODY.thigh.w * K} L ${px} ${S} Z`;
  // The head profile (drawing cm) turned face-up: local +y (down the neck) → toward the feet, the face → up, the occiput on the bed.
  const headT = `translate(${neckX} ${S - 8.6 * K}) rotate(-90) scale(${-K} ${K})`;
  const hip = { cx: px, cy: S - (BODY.thigh.w * K) / 2, r: (BODY.thigh.w * K) / 2 };
  const knee = px + BODY.thigh.l * K, ankle = knee + BODY.shank.l * K;
  const leg = limbPath([
    { x: px, y: S - (BODY.thigh.w * K) / 2, w: BODY.thigh.w * K },
    { x: knee, y: S - BODY.shank.w * K * 0.55, w: BODY.shank.w * K * 1.1 },
    { x: ankle, y: S - BODY.shank.w * K * 0.35, w: BODY.shank.w * K * 0.7 },
  ]);
  const footL = BODY.foot.l * K, footH = BODY.foot.h * K;
  const foot = `M ${ankle - 6} ${S - 12} C ${ankle - 3} ${S - footL * 0.5} ${ankle} ${S - footL * 0.85} ${ankle + 2} ${S - footL - 4} Q ${ankle + 8} ${S - footL - 8} ${ankle + footH - 2} ${S - footL - 1} L ${ankle + footH + 2} ${S - 14} Q ${ankle + footH + 2} ${S} ${ankle + 4} ${S} L ${ankle - 6} ${S} Z`;
  // Near arm along the side: shoulder (lifted when rolled forward) → elbow beside the trunk → forearm and hand on the abdomen.
  const shY = S - (rolled ? 40 : 30);
  const arm = limbPath([
    { x: shX + 4, y: shY, w: BODY.upperArm.w * K },
    { x: shX + 56, y: S - 15, w: BODY.forearm.w * K },
    { x: shX + 82, y: S - 34, w: BODY.forearm.w * K * 0.85 },
    { x: shX + 96, y: S - 40, w: BODY.hand.w * K * 0.7 },
  ]);
  const rotated = L.raiseDeg ? `rotate(${L.raiseDeg} ${px} ${AP_SIDE.pivot.y})` : undefined;
  return (
    <svg viewBox="0 -8 450 346" role="img" aria-label={ts("altSide", { state: ts(semi ? "stateSemierect" : "stateSupine"), angle, sid: settings.sidCm })} className="h-auto w-full" style={{ direction: "ltr" }}>
      {/* bed (fixed frame and leg rest) */}
      <rect x={20} y={S + 42} width={410} height={12} rx={3} fill={SCENE.bed} stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeOpacity={0.5} />
      <rect x={px - 6} y={S} width={436 - px} height={12} rx={3} fill={SCENE.bed} stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeOpacity={0.5} />
      {/* head end: the back rest and the detector under the back rise with the patient about the hips */}
      <g transform={rotated}>
        <rect x={40} y={S} width={px - 40} height={12} rx={3} fill={SCENE.bed} stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeOpacity={0.5} />
        <rect x={AP_SIDE.slabX0} y={S - 1} width={SLAB_LEN} height={9} rx={2} fill={SCENE.detector} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
      </g>
      {/* patient: outline pass, then fill pass, so the head, neck, trunk, hip and legs read as ONE silhouette in every position */}
      {[true, false].map((outlinePass) => (
        <g key={String(outlinePass)} fill={outlinePass ? SCENE.outline : SCENE.soft} stroke={outlinePass ? SCENE.outline : "none"} strokeWidth={STROKE.thin * 2} strokeLinejoin="round">
          <g transform={rotated}>
            <path data-anatomy={outlinePass ? undefined : "trunk"} d={trunk} />
            <g transform={headT}>
              <path data-anatomy={outlinePass ? undefined : "head"} d={HEAD_SIDE_CM} strokeWidth={(STROKE.thin * 2) / K} />
            </g>
          </g>
          <circle data-anatomy={outlinePass ? undefined : "hip"} {...hip} />
          <path data-anatomy={outlinePass ? undefined : "leg"} d={leg} />
          <path data-anatomy={outlinePass ? undefined : "foot"} d={foot} />
        </g>
      ))}
      <g transform={rotated}>
        <path data-anatomy="arm" d={arm} fill={SCENE.soft} stroke={SCENE.outline} strokeWidth={STROKE.thin} strokeLinejoin="round" />
        {/* the collimated field on the detector (amber, as on the detector view) */}
        <UnderStroked stroke={SCENE.beam} width={4}>
          {(p) => <line x1={AP_SIDE.slabX0 + field.y1 * AP_SIDE.pxPerCm} y1={S + 3.5} x2={AP_SIDE.slabX0 + field.y2 * AP_SIDE.pxPerCm} y2={S + 3.5} {...p} fill="none" />}
        </UnderStroked>
      </g>
      {/* beam: the cone to the field ends, the central ray and the detector-perpendicular reference */}
      <polygon points={`${tube.x},${tube.y} ${L.fieldA.x},${L.fieldA.y} ${L.fieldB.x},${L.fieldB.y}`} fill={SCENE.beam} opacity={0.14} />
      {angle !== 0 && <line data-anatomy="detector-perpendicular" x1={target.x + normal.x * L.sidPx} y1={target.y + normal.y * L.sidPx} x2={target.x} y2={target.y} stroke={SCENE.label} strokeWidth={1} strokeDasharray="2 5" opacity={0.6} />}
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
      <SceneLabel x={ankle - 12} y={S - BODY.foot.l * K - 18} size={LABEL_SIZE.view} anchor="middle">{ts("feet")}</SceneLabel>
      <SceneLabel x={L.detectorLabel.x} y={L.detectorLabel.y} size={LABEL_SIZE.view} anchor="middle">{ts("detector")}</SceneLabel>
      <SceneLabel x={440} y={S + 80} size={LABEL_SIZE.view} anchor="end" fill={SCENE.beam}>{ts("tubeAngle", { angle })}</SceneLabel>
      <SceneLabel x={440} y={S + 100} size={LABEL_SIZE.view - 2} anchor="end" fill={SCENE.beam}>{ts("tubeAngleRef")}</SceneLabel>
    </svg>
  );
}
