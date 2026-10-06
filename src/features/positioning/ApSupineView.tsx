"use client";

import { useTranslations } from "next-intl";
import type { SimulationSettings } from "@/domain/simulation";

/** Educational SID reference (S10b-23 / S10b-26: 183 cm; 180 cm is its rounding). Mirrors the SID rule target of the exam. */
const SID_REFERENCE_CM = 183;
const FLOOR_Y = 236;
const PX_PER_CM = 0.95;
const TARGET_X = 205;

const toRad = (deg: number) => (deg * Math.PI) / 180;

interface Props {
  settings: SimulationSettings;
  showGuides: boolean;
}

/**
 * Hand-drawn schematic SIDE view of the AP supine chest (S13 scene "chest-ap-supine"): the patient lies on the bed with the
 * detector under the back, the head end to the viewer's left, the tube above. It shows only what the learner controls — the
 * SID, the tube angle (+ = caudad, the beam tilted toward the feet) and whether the head end is raised — and nothing the
 * result will reveal. Drawing only: a minimal scene, no polish (S12-14 / O13).
 */
export function ApSupineView({ settings, showGuides }: Props) {
  const t = useTranslations("positioning");
  const ta = useTranslations("positioningAp");
  const angle = settings.tubeAngulationDeg ?? 0;
  const semi = settings.choices?.state === "semierect";
  const sidPx = settings.sidCm * PX_PER_CM;
  const tubeY = FLOOR_Y - sidPx;
  // Caudad = the beam leaves the tube toward the feet (the viewer's right), so the tube sits toward the head (left) of the target.
  const tubeX = TARGET_X - Math.tan(toRad(angle)) * sidPx;
  const refY = FLOOR_Y - SID_REFERENCE_CM * PX_PER_CM;
  return (
    <svg viewBox="0 0 450 300" role="img" aria-label={ta("sideAlt")} className="h-auto w-full" style={{ direction: "ltr" }}>
      {/* bed and the detector under the patient's back */}
      <rect x={40} y={FLOOR_Y + 8} width={370} height={10} rx={3} fill="#2b4152" />
      <rect x={110} y={FLOOR_Y} width={250} height={8} rx={2} fill="#7b93a5" />
      <text x={385} y={FLOOR_Y + 32} textAnchor="end" fontSize={12} fill="#d8e4ec">
        {t("detector")}
      </text>
      {/* patient: hips at the pivot; the head end is raised when semi-erect */}
      <g transform={semi ? `rotate(-28 270 ${FLOOR_Y - 4})` : undefined}>
        <rect x={100} y={FLOOR_Y - 34} width={170} height={30} rx={14} fill="#5d778a" stroke="#d8e4ec" strokeWidth={1.5} />
        <circle cx={82} cy={FLOOR_Y - 20} r={20} fill="#7b93a5" />
      </g>
      <rect x={268} y={FLOOR_Y - 26} width={92} height={22} rx={10} fill="#43607a" />
      <text x={70} y={FLOOR_Y - 52} textAnchor="middle" fontSize={12} fill="#d8e4ec">
        {ta("head")}
      </text>
      <text x={340} y={FLOOR_Y - 34} textAnchor="middle" fontSize={12} fill="#d8e4ec">
        {ta("feet")}
      </text>
      {/* beam: from the tube to the target on the chest; the dashed line is the perpendicular */}
      <polygon points={`${tubeX - 6},${tubeY + 22} ${tubeX + 6},${tubeY + 22} ${TARGET_X + 40},${FLOOR_Y} ${TARGET_X - 40},${FLOOR_Y}`} fill="#f2b134" opacity={0.16} />
      <line x1={TARGET_X} y1={tubeY + 22} x2={TARGET_X} y2={FLOOR_Y} stroke="#d8e4ec" strokeWidth={1} strokeDasharray="3 5" opacity={0.6} />
      <line x1={tubeX} y1={tubeY + 22} x2={TARGET_X} y2={FLOOR_Y - 6} stroke="#f2b134" strokeWidth={1.8} strokeDasharray="5 4" />
      <g transform={`rotate(${angle} ${tubeX} ${tubeY + 10})`}>
        <rect x={tubeX - 22} y={tubeY - 8} width={44} height={36} rx={4} fill="#d8e4ec" />
      </g>
      <text x={tubeX} y={tubeY - 14} textAnchor="middle" fontSize={12} fill="#d8e4ec">
        {t("tube")}
      </text>
      <text x={TARGET_X + 8} y={FLOOR_Y - 76} fontSize={12} fill="#f2b134">
        {ta("angleReadout", { angle })}
      </text>
      <line x1={420} y1={tubeY + 22} x2={420} y2={FLOOR_Y} stroke="#d8e4ec" strokeWidth={1} />
      <line x1={414} y1={tubeY + 22} x2={426} y2={tubeY + 22} stroke="#d8e4ec" />
      <line x1={414} y1={FLOOR_Y} x2={426} y2={FLOOR_Y} stroke="#d8e4ec" />
      <text x={414} y={tubeY + 16} textAnchor="end" fontSize={13} fill="#d8e4ec">
        {`${t("sid")} ${settings.sidCm} cm`}
      </text>
      {showGuides && (
        <g aria-hidden>
          <line x1={414} y1={refY} x2={444} y2={refY} stroke="#4ade80" strokeWidth={2} strokeDasharray="3 3" />
          <text x={444} y={refY - 5} textAnchor="end" fontSize={11} fill="#4ade80">
            {t("sidTarget", { sid: SID_REFERENCE_CM })}
          </text>
        </g>
      )}
    </svg>
  );
}
