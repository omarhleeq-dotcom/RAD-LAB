import { useTranslations } from "next-intl";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { collimatedField } from "@/features/simulation/geometry";
import { Limb, SceneLabel, UnderStroked } from "./SceneParts";
import { LABEL_SIZE, SCENE, STROKE } from "./scene-style";
import { LOWER_LIMB_SIDE, slabX } from "./lower-limb-visual";
import { footSideProportions } from "./foot-side-proportions";

/** Educational reference SID (Bontrager's minimum 40 in = 102 cm, p.224-225). The tick remains an illustrative point within the owner-approved provisional 100–110 cm full-credit band. */
const SID_REFERENCE_CM = 102;
const S = LOWER_LIMB_SIDE.surfaceY;
const DIM_OFFSET = 34;

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
  showGuides: boolean;
}

type Part = "knee" | "foot" | "ankle";

/**
 * Hand-drawn schematic SIDE view of the knee / foot set-up (S14.4, own work, S13b language; the elbow's `ElbowSideView` pattern): the patient lying
 * on the table (head at the viewer's left, feet at the right), the limb on the detector, the tube above with the central ray TILTED by the tube-angle
 * control (+ = toward the feet), the collimated field on the detector and the SID measured along the beam. Knee AP: the leg lies extended; knee lateral:
 * the patient lies on the side with the knee flexed; foot: the knee is bent and the sole rests on the detector. A small END VIEW (from the toes /
 * the foot of the table) shows the rotation value as a tilt. It draws the learner's own settings and nothing the result reveals. Drawing only, never a
 * measurement. It is not the plan view (PlanView is chest only).
 */
export function LowerLimbSideView({ radCase, settings, showGuides }: Props) {
  const t = useTranslations("positioning");
  const ts = useTranslations("scene");
  const kind = (["knee-ap", "knee-lateral", "foot-ap", "foot-oblique", "ankle-ap", "ankle-lateral"].includes(settings.projection) ? settings.projection : radCase.requiredProjection) as "knee-ap" | "knee-lateral" | "foot-ap" | "foot-oblique" | "ankle-ap" | "ankle-lateral";
  const part: Part = kind.startsWith("knee") ? "knee" : kind.startsWith("ankle") ? "ankle" : "foot";
  const tp = useTranslations(part === "knee" ? "sceneKnee" : part === "ankle" ? "sceneAnkle" : "sceneFoot");
  const { detector } = radCase;
  const field = collimatedField(settings, detector);
  const toesAtTop = part === "foot";
  const toX = (yCm: number) => slabX(yCm, toesAtTop, detector.heightCm);
  const rayCm = ((settings.centralRay.y + 1) / 2) * detector.heightCm;
  const rayX = toX(rayCm);
  const angle = settings.tubeAngulationDeg ?? 0;
  const rad = (angle * Math.PI) / 180;
  // + = caudad (toward the feet, the viewer's right): the beam runs toward the right as it goes down, so the tube is on the head (left) side.
  const sidPx = settings.sidCm * LOWER_LIMB_SIDE.sidPxPerCm;
  const dir = { x: Math.sin(rad), y: Math.cos(rad) }; // from the tube toward the detector
  const tubePos = { x: rayX - dir.x * sidPx, y: S - dir.y * sidPx };
  const refPx = SID_REFERENCE_CM * LOWER_LIMB_SIDE.sidPxPerCm;
  const nrm = { x: dir.y, y: -dir.x }; // perpendicular to the beam (dimension offset)
  const side = rayX > 250 ? -1 : 1;
  const alongBeam = (tpx: number, off = 0) => ({ x: rayX - dir.x * tpx + nrm.x * off * side, y: S - dir.y * tpx + nrm.y * off * side });
  const [fa, fb] = [toX(field.y1), toX(field.y2)];
  const fA = Math.min(fa, fb);
  const fB = Math.max(fa, fb);
  const slabL = toX(toesAtTop ? detector.heightCm : 0);
  const slabR = toX(toesAtTop ? 0 : detector.heightCm);
  const slabA = Math.min(slabL, slabR);
  const slabB = Math.max(slabL, slabR);
  // The target of the exam (fixed anatomy; the learner moves the ray).
  const tg = radCase.positioning.centering.target;
  const targetX = toX(((tg.y + 1) / 2) * detector.heightCm);
  const footProp = part === "foot" ? footSideProportions(kind as "foot-ap" | "foot-oblique") : null;
  const d0 = alongBeam(sidPx, DIM_OFFSET), d1 = alongBeam(0, DIM_OFFSET);
  const dr = alongBeam(refPx, DIM_OFFSET);
  const tick = (p: { x: number; y: number }, len = 8) => ({ x1: p.x - nrm.x * len, y1: p.y - nrm.y * len, x2: p.x + nrm.x * len, y2: p.y + nrm.y * len });
  return (
    <svg viewBox="0 -8 450 368" role="img" aria-label={ts(part === "knee" ? "altKneeSide" : part === "ankle" ? "altAnkleSide" : "altFootSide", { projection: tp(kind === "knee-ap" || kind === "ankle-ap" || kind === "foot-ap" ? "apName" : kind === "knee-lateral" || kind === "ankle-lateral" ? "lateralName" : "obliqueName"), sid: settings.sidCm, angle })} className="h-auto w-full" style={{ direction: "ltr" }}>
      {/* table (fixed) and the detector on it */}
      <rect x={20} y={S + 10} width={410} height={12} rx={3} fill={SCENE.bed} stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeOpacity={0.5} />
      <rect x={slabA} y={S - 1} width={slabB - slabA} height={11} rx={2} fill={SCENE.detector} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
      {/* patient: pelvis and trunk (left), lying on the table */}
      <path d={`M 14 ${S + 6} L 14 ${S - 30} C 14 ${S - 44} 26 ${S - 50} 44 ${S - 50} L 120 ${S - 46} C 134 ${S - 44} 140 ${S - 30} 140 ${S - 10} L 140 ${S + 6} Z`} fill={SCENE.trunk} stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeLinejoin="round" />
      {kind === "knee-ap" && (
        <Limb pts={[{ x: 120, y: S - 22, w: 38 }, { x: targetX, y: S - 17, w: 32 }, { x: slabB + 14, y: S - 13, w: 24 }]} />
      )}
      {kind === "knee-lateral" && (
        <Limb pts={[{ x: 120, y: S - 22, w: 38 }, { x: targetX, y: S - 19, w: 32 }, { x: targetX + 80, y: S - 56, w: 25 }]} />
      )}
      {kind === "ankle-ap" && (
        <>
          {/* the leg lies extended on the table; the foot stands up at the ankle (dorsiflexed, not forced), the sole facing the feet end */}
          <Limb pts={[{ x: 120, y: S - 22, w: 38 }, { x: targetX, y: S - 17, w: 24 }]} />
          <path d={`M ${targetX + 4} ${S - 5} L ${targetX + 10} ${S - 54} L ${targetX + 28} ${S - 56} L ${targetX + 34} ${S - 5} Z`} fill={SCENE.limb} stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeLinejoin="round" />
        </>
      )}
      {kind === "ankle-lateral" && (
        <>
          {/* lateral recumbent: the knee flexed (about 45°), the lower leg running down to the ankle on the detector, the foot at a right angle to the leg */}
          <Limb pts={[{ x: 120, y: S - 22, w: 38 }, { x: targetX - 96, y: S - 62, w: 30 }, { x: targetX, y: S - 17, w: 22 }]} />
          <path d={`M ${targetX - 8} ${S - 8} L ${targetX + 8} ${S - 14} L ${targetX + 48} ${S - 62} L ${targetX + 30} ${S - 74} Z`} fill={SCENE.limb} stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeLinejoin="round" />
        </>
      )}
      {(kind === "foot-ap" || kind === "foot-oblique") && (
        <>
          {/* thigh up to the bent knee, shank down to the ankle, the foot flat on the detector (toes toward the feet side, the right) */}
          <Limb pts={[{ x: 120, y: S - 22, w: 38 }, { x: targetX - 120, y: S - 96, w: 32 }, { x: targetX - 48, y: S - 38, w: 22 }]} />
          {/* the toes' reach beyond the target comes from the traced foot (RAD-072 2b, proportions only): the forefoot part of the profile is scaled to it */}
          <path d={`M ${targetX - 70} ${S - 3} L ${targetX - 70} ${S - 38} L ${targetX - 20} ${S - 32} L ${targetX + 56 * footProp!.toeReach / 96} ${S - 14} L ${targetX + footProp!.toeReach} ${S - 6} L ${targetX + footProp!.toeReach} ${S - 3} Z`} fill={SCENE.limb} stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeLinejoin="round" />
        </>
      )}
      {/* the collimated field on the detector (amber, as on the detector view) */}
      <UnderStroked stroke={SCENE.beam} width={4}>
        {(p) => <line x1={fA} y1={S + 4.5} x2={fB} y2={S + 4.5} {...p} fill="none" />}
      </UnderStroked>
      {/* beam: the cone to the field ends, the central ray (tilted by the tube-angle control) and the perpendicular reference */}
      <polygon points={`${tubePos.x},${tubePos.y} ${fA},${S + 4.5} ${fB},${S + 4.5}`} fill={SCENE.beam} opacity={0.14} />
      <UnderStroked stroke={SCENE.beam} width={2} dash="6 4">
        {(p) => <line x1={tubePos.x} y1={tubePos.y} x2={rayX} y2={S} {...p} />}
      </UnderStroked>
      {showGuides && (
        <g aria-hidden>
          <UnderStroked stroke={SCENE.guide} width={1.5} dash="2 5">
            {(p) => <line x1={rayX} y1={S} x2={rayX} y2={S - 70} {...p} />}
          </UnderStroked>
        </g>
      )}
      {Math.abs(angle) < 0.5 && (
        <UnderStroked stroke={SCENE.beam} width={2}>
          {(p) => <path d={`M ${rayX - 9} ${S - 1} L ${rayX - 9} ${S - 10} L ${rayX} ${S - 10}`} {...p} fill="none" />}
        </UnderStroked>
      )}
      <g transform={`translate(${tubePos.x} ${tubePos.y}) rotate(${-angle})`}>
        <rect x={-26} y={-30} width={52} height={26} rx={4} fill={SCENE.tube} stroke={SCENE.underStroke} strokeWidth={1.5} />
        <rect x={-15} y={-4} width={30} height={9} rx={2} fill={SCENE.detector} stroke={SCENE.underStroke} strokeWidth={1} />
      </g>
      <SceneLabel x={tubePos.x} y={tubePos.y - 42} size={LABEL_SIZE.view} anchor="middle">{ts("tube")}</SceneLabel>
      {/* SID: a dimension line parallel to the central ray; the reference tick on the same line (guides) */}
      <g aria-hidden>
        <UnderStroked stroke={SCENE.label} width={1.5}>
          {(p) => <line x1={d0.x} y1={d0.y} x2={d1.x} y2={d1.y} {...p} />}
        </UnderStroked>
        {[d0, d1].map((q, i) => (
          <UnderStroked key={i} stroke={SCENE.label} width={1.5}>
            {(p) => <line {...tick(q)} {...p} />}
          </UnderStroked>
        ))}
        {showGuides && (
          <>
            {SID_REFERENCE_CM > settings.sidCm && (
              <UnderStroked stroke={SCENE.good} width={2} dash="3 4">
                {(p) => <line x1={d0.x} y1={d0.y} x2={dr.x} y2={dr.y} {...p} />}
              </UnderStroked>
            )}
            <UnderStroked stroke={SCENE.good} width={3}>
              {(p) => <line {...tick(dr)} {...p} />}
            </UnderStroked>
            <SceneLabel x={dr.x + side * 14} y={dr.y + 5} size={LABEL_SIZE.view - 2} anchor={side > 0 ? "start" : "end"} fill={SCENE.good}>{t("extremitySidTarget")}</SceneLabel>
          </>
        )}
      </g>
      <SceneLabel x={tubePos.x} y={tubePos.y - 68} size={LABEL_SIZE.view} anchor="middle">{ts("sidValue", { value: settings.sidCm })}</SceneLabel>
      <SceneLabel x={436} y={12} size={LABEL_SIZE.view} anchor="end" fill={SCENE.beam}>{ts("tubeAngle", { angle })}</SceneLabel>
      {showGuides && (
        <g aria-hidden>
          {/* the centring target of the drawn limb (green = target) */}
          <UnderStroked stroke={SCENE.good} width={2.5}>
            {(p) => <path d={`M ${targetX - 7} ${S + 16} L ${targetX} ${S + 8} L ${targetX + 7} ${S + 16}`} {...p} fill="none" />}
          </UnderStroked>
          <SceneLabel x={slabA} y={S + 66} size={LABEL_SIZE.view - 2} fill={SCENE.good}>{tp("target")}</SceneLabel>
        </g>
      )}
      <SceneLabel x={14} y={S + 46} size={LABEL_SIZE.view}>{ts("head")}</SceneLabel>
      <SceneLabel x={430} y={S + 46} size={LABEL_SIZE.view} anchor="end">{ts("feet")}</SceneLabel>
      <SceneLabel x={(slabA + slabB) / 2} y={S + 46} size={LABEL_SIZE.view} anchor="middle">{ts("detector")}</SceneLabel>
      <EndView part={part} kind={kind} rotationDeg={settings.rotationDeg} label={tp} footWidth={footProp?.forefootWidth} />
    </svg>
  );
}

/** A small end-on gauge of the rotation value: a detector line and the limb's cross-section / sole tilted by the value (+ = right side up in this view). */
function EndView({ part, kind, rotationDeg, label, footWidth }: { part: Part; kind: string; rotationDeg: number; label: (k: string, v?: Record<string, string | number>) => string; footWidth?: number }) {
  const cx = 78, base = 84;
  // the foot cross-section is as wide as the traced forefoot (RAD-072 2b, proportions only); the knee / ankle gauges are unchanged
  const hw = footWidth ? footWidth / 2 : 44;
  // foot oblique: the console value is the plantar angle to the detector, the lateral side raised (the lateral side is at the viewer's LEFT looking from the toes); the others: the value as a tilt
  const tilt = kind === "foot-oblique" ? rotationDeg : -rotationDeg;
  const deg = Math.round(rotationDeg);
  return (
    <g aria-hidden>
      <rect x={6} y={8} width={144} height={96} rx={6} fill={SCENE.bg} opacity={0.55} />
      <line x1={14} y1={base} x2={142} y2={base} stroke={SCENE.detector} strokeWidth={4} strokeLinecap="round" />
      <g transform={`rotate(${tilt} ${cx} ${base})`}>
        {part === "foot" ? (
          <path d={`M ${cx - hw} ${base - 2} C ${cx - hw} ${base - 24} ${cx - hw * 0.45} ${base - 36} ${cx} ${base - 36} C ${cx + hw * 0.5} ${base - 36} ${cx + hw} ${base - 24} ${cx + hw} ${base - 2} Z`} fill={SCENE.limb} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
        ) : (
          <>
            <ellipse cx={cx} cy={base - 30} rx={36} ry={28} fill={SCENE.limb} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
            <line x1={cx - 36} y1={base - 30} x2={cx + 36} y2={base - 30} stroke={SCENE.guide} strokeWidth={2} strokeDasharray="3 4" />
          </>
        )}
      </g>
      <SceneLabel x={cx} y={26} size={LABEL_SIZE.view - 3} anchor="middle">{label("endView")}</SceneLabel>
      <SceneLabel x={cx} y={100} size={LABEL_SIZE.view - 3} anchor="middle" fill={SCENE.beam}>{label(kind === "foot-oblique" ? "endAngleSole" : part === "foot" ? "endAngleTurn" : "endAngleTurn", { deg })}</SceneLabel>
    </g>
  );
}
