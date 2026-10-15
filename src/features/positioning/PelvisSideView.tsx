"use client";
import { useTranslations } from "next-intl";
import type { SecondViewProps } from "./scene-layouts";
import { SceneLabel } from "./SceneParts";
import { SCENE, STROKE, LABEL_SIZE, UNDER } from "./scene-style";
/** Supine setup; independent leg-position gauge. Dimensions are illustrative. */
export function PelvisSideView({ settings, showGuides }: SecondViewProps) {
  const t=useTranslations("scenePelvis");
  const rayX=230+settings.centralRay.y*60;
  const rayY=260;
  const tubeY=rayY-settings.sidCm*0.85;
  const tilt=(settings.tubeAngulationDeg ?? 0)*Math.PI/180;
  const tubeX=rayX-Math.tan(tilt)*(rayY-tubeY);
  const leg=settings.choices?.legPosition ?? "neutral";
  const turn=leg==="internal"?25:leg==="external"?-25:0;
  return <svg viewBox="0 0 450 340" role="img" aria-label={t("alt",{sid:settings.sidCm,angle:settings.tubeAngulationDeg ?? 0,legs:t(leg)})} className="h-auto w-full" style={{direction:"ltr"}}>
    <rect x={15} y={277} width={420} height={14} rx={3} fill={SCENE.bed} stroke={SCENE.edge} strokeWidth={STROKE.thin}/>
    <rect x={145} y={267} width={170} height={9} fill={SCENE.detector} />
    <ellipse cx={53} cy={241} rx={25} ry={24} fill={SCENE.head} stroke={SCENE.edge} strokeWidth={STROKE.thin}/>
    <path d="M78 251 Q130 217 194 226 Q222 208 258 232 L294 247 L416 252 L418 265 L294 267 L248 257 Q211 264 180 256 L82 266 Z" fill={SCENE.trunk} stroke={SCENE.edge} strokeWidth={STROKE.thin}/>
    <line x1={tubeX} y1={tubeY} x2={rayX} y2={rayY} stroke={SCENE.underStroke} strokeWidth={STROKE.medium+UNDER}/>
    <line x1={tubeX} y1={tubeY} x2={rayX} y2={rayY} stroke={SCENE.beam} strokeWidth={STROKE.medium}/>
    <g transform={`translate(${tubeX} ${tubeY}) rotate(${settings.tubeAngulationDeg ?? 0})`}><rect x={-23} y={-14} width={46} height={25} rx={4} fill={SCENE.tube} stroke={SCENE.edge} strokeWidth={STROKE.thin}/></g>
    <g transform="translate(365 105)">
      {[-1,1].map(side=><ellipse key={side} cx={side*24} cy={0} rx={10} ry={35} transform={`rotate(${side*turn} ${side*24} 0)`} fill={SCENE.limb} stroke={SCENE.edge} strokeWidth={STROKE.thin}/>)}
    </g>
    {showGuides && <>
      <line x1={105} x2={105} y1={tubeY} y2={rayY} stroke={SCENE.guide} strokeWidth={STROKE.thin} strokeDasharray="5 5"/>
      <SceneLabel x={15} y={155} size={LABEL_SIZE.view}>{t("sid",{sid:settings.sidCm})}</SceneLabel>
      <SceneLabel x={365} y={40} anchor="middle" size={LABEL_SIZE.view}>{t("legs")}</SceneLabel>
      <SceneLabel x={365} y={165} anchor="middle" size={LABEL_SIZE.view}>{t(leg)}</SceneLabel>
      <SceneLabel x={20} y={326} size={LABEL_SIZE.view}>{t("head")}</SceneLabel>
      <SceneLabel x={430} y={326} anchor="end" size={LABEL_SIZE.view}>{t("feet")}</SceneLabel>
    </>}
  </svg>;
}
