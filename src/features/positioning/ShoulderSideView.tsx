"use client";
import { useTranslations } from "next-intl";
import type { SecondViewProps } from "./scene-layouts";
import { SceneLabel } from "./SceneParts";
import { SCENE, STROKE, LABEL_SIZE, UNDER } from "./scene-style";
import { SHOULDER_BAND_DEG } from "@/data/exams/xray/shoulder-geometry";

/**
 * Plan view from above of the erect set-up: the patient stands with the back to the detector, the body turned toward the right (affected) shoulder by the
 * ABSOLUTE console angle; the source band 35°–45° is drawn as a target arc with the guides ON (no single ideal angle). The upper arm hangs at the side (the circle
 * is seen end-on from above); the short stub is the forearm of the bent elbow, pointing anterior-medial (internal), anterior (neutral) or anterior-lateral (external,
 * kept within 30° of anterior so even at the 60° turn it runs parallel to the detector and never toward it). Setup only. Illustrative, not to scale. Never mirrored by RTL.
 * RAD-072 2c (owner D1): always visible, with or without the guides: the angle readout, a reference line through the shoulder parallel to the detector, an arc / wedge
 * between that line and the torso's frontal plane (the turn), and an arrow marking the chest (anterior) side; so the turn reads without the guides.
 */
export function ShoulderSideView({ settings, showGuides }: SecondViewProps) {
  const t = useTranslations("sceneShoulder");
  const ts = useTranslations("scene");
  const deg = settings.rotationDeg, rad = deg * Math.PI / 180;
  const cx = 225, cy = 175, R = 98;
  const jx = cx + R * Math.cos(rad), jy = cy + R * Math.sin(rad);
  const tilt = (settings.tubeAngulationDeg ?? 0) * Math.PI / 180;
  const tubeY = 28, tubeX = jx - Math.tan(tilt) * (jy - tubeY);
  const arm = settings.choices?.armPosition ?? "internal";
  const FOREARM_LEN = 36, FOREARM_FROM_ANTERIOR_DEG = { internal: -50, neutral: 0, external: 30 } as const;
  const fa = FOREARM_FROM_ANTERIOR_DEG[arm as keyof typeof FOREARM_FROM_ANTERIOR_DEG] ?? 0;
  const forearm = `M0 0 L${(FOREARM_LEN * Math.sin(fa * Math.PI / 180)).toFixed(1)} ${(-FOREARM_LEN * Math.cos(fa * Math.PI / 180)).toFixed(1)}`;
  const [lo, hi] = SHOULDER_BAND_DEG;
  // the turn at the shoulder: the angle between the detector-parallel line through the shoulder (pointing medially, to the left) and the torso's frontal plane (toward the torso centre)
  const arcR = 52, ex = jx - arcR, eyy = jy, fx = jx - arcR * Math.cos(rad), fy = jy - arcR * Math.sin(rad);
  // the label sits beside the arrow tip: the preferred placement (middle below 20°, left to 34°, right from 35°), else the first fall-back that keeps a clear margin from the beam at every angle and tube tilt
  const chestTip = { x: cx + 86 * Math.sin(rad), y: cy - 86 * Math.cos(rad) };
  const labelY = chestTip.y - 4, labelW = LABEL_SIZE.view * 0.62 * ts("anterior").length;
  const beamAt = (y: number) => tubeX + (jx - tubeX) * (y - tubeY) / (jy - tubeY);
  const placements = [
    { dx: 0, anchor: "middle" as const, x0: -labelW / 2, x1: labelW / 2 },
    { dx: -8, anchor: "end" as const, x0: -8 - labelW, x1: -8 },
    { dx: 16, anchor: "start" as const, x0: 16, x1: 16 + labelW },
  ];
  const preferred = deg >= 35 ? 2 : deg >= 20 ? 1 : 0;
  const clear = (q: (typeof placements)[number]) => {
    const bx = [beamAt(labelY - LABEL_SIZE.view), beamAt(labelY + 4)], lo = Math.min(...bx) - 10, hi = Math.max(...bx) + 10;
    return chestTip.x + q.x1 < lo || chestTip.x + q.x0 > hi;
  };
  const place = [placements[preferred]!, ...placements.filter((_, i) => i !== preferred)].find(clear) ?? placements[preferred]!;
  const pt = (d: number, r: number) => `${cx + r * Math.cos(d * Math.PI / 180)} ${cy + r * Math.sin(d * Math.PI / 180)}`;
  return <svg viewBox="0 0 450 340" role="img" aria-label={t("alt", { deg, angle: settings.tubeAngulationDeg ?? 0, arm: t(arm), sid: settings.sidCm })} className="h-auto w-full" style={{ direction: "ltr" }}>
    <rect x={40} y={297} width={370} height={12} rx={3} fill={SCENE.detector} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
    <g transform={`translate(${cx} ${cy}) rotate(${deg})`}>
      <ellipse cx={0} cy={0} rx={R} ry={36} fill={SCENE.trunk} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
      <circle cx={0} cy={-6} r={21} fill={SCENE.head} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
      <g transform={`translate(${R - 8} 0)`}>
        <circle cx={0} cy={0} r={14} fill={SCENE.limb} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
        <path d={forearm} fill="none" stroke={SCENE.limb} strokeWidth={9} strokeLinecap="round" />
        <path d={forearm} fill="none" stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeLinecap="round" strokeDasharray="1 7" />
      </g>
    </g>
    <line x1={jx - 120} y1={jy} x2={jx + 14} y2={jy} stroke={SCENE.underStroke} strokeWidth={STROKE.thin + UNDER} />
    <line x1={jx - 120} y1={jy} x2={jx + 14} y2={jy} stroke={SCENE.guide} strokeWidth={STROKE.thin} strokeDasharray="6 5" />
    {deg > 0.5 && <>
      <path d={`M${jx} ${jy} L${ex} ${eyy} A${arcR} ${arcR} 0 0 1 ${fx} ${fy} Z`} fill={SCENE.guide} fillOpacity={0.28} stroke="none" />
      <path d={`M${ex} ${eyy} A${arcR} ${arcR} 0 0 1 ${fx} ${fy}`} fill="none" stroke={SCENE.underStroke} strokeWidth={STROKE.medium + UNDER} />
      <path d={`M${ex} ${eyy} A${arcR} ${arcR} 0 0 1 ${fx} ${fy}`} fill="none" stroke={SCENE.label} strokeWidth={STROKE.medium} />
    </>}
    <g transform={`translate(${cx} ${cy}) rotate(${deg})`}>
      <line x1={0} y1={-40} x2={0} y2={-66} stroke={SCENE.underStroke} strokeWidth={STROKE.medium + UNDER} strokeLinecap="round" />
      <line x1={0} y1={-40} x2={0} y2={-66} stroke={SCENE.label} strokeWidth={STROKE.medium} strokeLinecap="round" />
      <path d="M-7 -60 L0 -72 L7 -60 Z" fill={SCENE.label} stroke={SCENE.underStroke} strokeWidth={STROKE.thin} strokeLinejoin="round" />
    </g>
    <SceneLabel x={chestTip.x + place.dx} y={labelY} anchor={place.anchor} size={LABEL_SIZE.view}>{ts("anterior")}</SceneLabel>
    <SceneLabel x={20} y={52} size={LABEL_SIZE.view}>{t("turn", { deg })}</SceneLabel>
    <line x1={tubeX} y1={tubeY} x2={jx} y2={jy} stroke={SCENE.underStroke} strokeWidth={STROKE.medium + UNDER} />
    <line x1={tubeX} y1={tubeY} x2={jx} y2={jy} stroke={SCENE.beam} strokeWidth={STROKE.medium} />
    <g transform={`translate(${tubeX} ${tubeY}) rotate(${settings.tubeAngulationDeg ?? 0})`}><rect x={-23} y={-14} width={46} height={25} rx={4} fill={SCENE.tube} stroke={SCENE.edge} strokeWidth={STROKE.thin} /></g>
    {showGuides && <>
      <path d={`M${pt(lo, 134)} A134 134 0 0 1 ${pt(hi, 134)}`} fill="none" stroke={SCENE.underStroke} strokeWidth={STROKE.heavy + UNDER} strokeLinecap="round" />
      <path d={`M${pt(lo, 134)} A134 134 0 0 1 ${pt(hi, 134)}`} fill="none" stroke={SCENE.good} strokeWidth={STROKE.heavy} strokeLinecap="round" />
      <SceneLabel x={20} y={24} size={LABEL_SIZE.view}>{t("band", { lo, hi })}</SceneLabel>
      <SceneLabel x={20} y={80} size={LABEL_SIZE.view}>{t("sid", { sid: settings.sidCm })}</SceneLabel>
      <SceneLabel x={430} y={326} anchor="end" size={LABEL_SIZE.view}>{t("detector")}</SceneLabel>
      <SceneLabel x={20} y={326} size={LABEL_SIZE.view}>{t("rightShoulder")}</SceneLabel>
    </>}
  </svg>;
}
