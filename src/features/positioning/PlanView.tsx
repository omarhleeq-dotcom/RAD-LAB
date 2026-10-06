"use client";

import { useTranslations } from "next-intl";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { collimatedField } from "@/features/simulation/geometry";

const PV = { detX: 380, pxPerCm: 4.5, midY: 140, sidPx: 1.7 };
/** Educational SID reference for the case (docs/RAD-LAB_Medical_Reference_Chest_PA.md §2). Mirrors the SID rule target. */
const SID_REFERENCE_CM = 180;

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
  showGuides: boolean;
}

/** Plan view: patient rotation relative to the detector, SID, and the beam footprint. */
export function PlanView({ radCase, settings, showGuides }: Props) {
  const t = useTranslations("positioning");
  const { detX, pxPerCm, midY, sidPx } = PV;
  const lateral = settings.projection === "lateral-left";
  const facesTube = settings.projection === "ap-erect";
  const depth = lateral ? 55 : 16;
  const ptX = detX - 4 - depth;
  const baseAngle = lateral ? 90 : 0;
  const tubeX = Math.max(30, detX - settings.sidCm * sidPx);
  const refX = detX - SID_REFERENCE_CM * sidPx;
  const { detector } = radCase;
  const lateralPx = settings.centralRay.x * (detector.widthCm / 2) * pxPerCm;
  const detHalf = (detector.widthCm * pxPerCm) / 2;
  const field = collimatedField(settings, detector);
  const fy1 = midY + (field.x1 - detector.widthCm / 2) * pxPerCm;
  const fy2 = midY + (field.x2 - detector.widthCm / 2) * pxPerCm;
  const noseDir = facesTube ? -1 : 1;

  return (
    <svg viewBox="0 0 450 300" role="img" aria-label={t("alt")} className="h-auto w-full" style={{ direction: "ltr" }}>
      <polygon points={`${tubeX + 28},${midY + lateralPx} ${detX},${fy1} ${detX},${fy2}`} fill="#f2b134" opacity={0.18} />
      <line x1={tubeX + 28} y1={midY + lateralPx} x2={detX} y2={midY + lateralPx} stroke="#f2b134" strokeWidth={1.5} strokeDasharray="5 4" />
      <rect x={detX} y={midY - detHalf} width={8} height={detHalf * 2} rx={2} fill="#7b93a5" />
      <rect x={tubeX} y={midY + lateralPx - 20} width={28} height={40} rx={4} fill="#d8e4ec" />
      {/* reference line parallel to the detector: the patient is "square" when the ellipse lines up with it */}
      {!lateral && (
        <g aria-hidden>
          <line x1={ptX} y1={midY - 72} x2={ptX} y2={midY + 72} stroke="#4ade80" strokeWidth={1.5} strokeDasharray="3 5" opacity={0.8} />
        </g>
      )}
      <g transform={`rotate(${settings.rotationDeg + baseAngle} ${ptX} ${midY})`}>
        <ellipse cx={ptX} cy={midY} rx={16} ry={55} fill="#5d778a" stroke="#d8e4ec" strokeWidth={1.5} />
        <path d={`M ${ptX + noseDir * 16} ${midY - 7} L ${ptX + noseDir * 30} ${midY} L ${ptX + noseDir * 16} ${midY + 7} Z`} fill="#d8e4ec" />
      </g>
      <text x={ptX - 20} y={midY + 94} textAnchor="middle" fontSize={12} fill="#4ade80">
        {`${t("rotation")}: ${settings.rotationDeg}°`}
      </text>
      {showGuides && !lateral && (
        <text x={ptX - 20} y={midY + 108} textAnchor="middle" fontSize={11} fill="#4ade80" opacity={0.85}>
          {t("rotationGuide")}
        </text>
      )}
      <line x1={tubeX} y1={268} x2={detX} y2={268} stroke="#d8e4ec" strokeWidth={1} />
      <line x1={tubeX} y1={262} x2={tubeX} y2={274} stroke="#d8e4ec" />
      <line x1={detX} y1={262} x2={detX} y2={274} stroke="#d8e4ec" />
      {showGuides && (
        <g aria-hidden>
          <line x1={refX} y1={256} x2={refX} y2={280} stroke="#4ade80" strokeWidth={2} strokeDasharray="3 3" />
          <text x={refX} y={252} textAnchor="middle" fontSize={11} fill="#4ade80">
            {t("sidTarget", { sid: SID_REFERENCE_CM })}
          </text>
        </g>
      )}
      <text x={(tubeX + detX) / 2} y={292} textAnchor="middle" fontSize={13} fill="#d8e4ec">
        {`${t("sid")} ${settings.sidCm} cm`}
      </text>
      <text x={tubeX + 14} y={midY + lateralPx - 28} textAnchor="middle" fontSize={12} fill="#d8e4ec">
        {t("tube")}
      </text>
      <text x={detX + 8} y={midY - detHalf - 8} textAnchor="end" fontSize={12} fill="#d8e4ec">
        {t("detector")}
      </text>
      <text x={ptX - 20} y={midY + 78} textAnchor="middle" fontSize={12} fill="#d8e4ec">
        {t("patient")}
      </text>
    </svg>
  );
}
