"use client";

import { useTranslations } from "next-intl";
import { RangeField } from "@/components/RangeField";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { collimatedField } from "@/features/simulation/geometry";

const U = 10; // front-view SVG units per cm

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
  onChange: <K extends keyof SimulationSettings>(key: K, value: SimulationSettings[K]) => void;
  disabled: boolean;
}

/** Front view: patient in front of the detector with the light field and central-ray crosshair. */
function FrontView({ radCase, settings }: Pick<Props, "radCase" | "settings">) {
  const t = useTranslations("positioning");
  const { detector, requiredAnatomy: a } = radCase;
  const W = detector.widthCm * U;
  const H = detector.heightCm * U;
  const lateral = settings.projection === "lateral-left";
  const rad = (settings.rotationDeg * Math.PI) / 180;
  const widthScale = lateral ? 0.45 : Math.max(0.55, Math.cos(rad));
  const field = collimatedField(settings, detector);
  const fx = field.x1 * U, fy = field.y1 * U, fw = (field.x2 - field.x1) * U, fh = (field.y2 - field.y1) * U;
  const rx = (W / 2 + settings.centerXCm * U), ry = settings.centerYCm * U;
  const spineX = W / 2 + Math.sin(rad) * 55;
  const lungY = a.yCm * U, lungH = a.heightCm * U, lungW = (a.widthCm * U) / 2 - 8;

  return (
    <svg viewBox={`-30 -90 ${W + 60} ${H + 120}`} role="img" aria-label={t("alt")} className="h-auto w-full" style={{ direction: "ltr" }}>
      <rect x={-6} y={-6} width={W + 12} height={H + 12} rx={6} fill="#1a2b38" />
      <rect x={0} y={0} width={W} height={H} fill="#0b141b" />
      <g transform={`translate(${W / 2} 0) scale(${widthScale} 1) translate(${-W / 2} 0)`}>
        <circle cx={W / 2} cy={-35} r={34} fill="#7b93a5" />
        <rect x={W / 2 - 14} y={-6} width={28} height={30} fill="#7b93a5" />
        <path d={`M 20 28 Q ${W / 2} -8 ${W - 20} 28 L ${W - 36} ${H - 90} Q ${W / 2} ${H - 70} 36 ${H - 90} Z`} fill="#5d778a" />
        <rect x={W / 2 - lungW - 8} y={lungY} width={lungW} height={lungH} rx={50} fill="#33516a" />
        <rect x={W / 2 + 8} y={lungY} width={lungW} height={lungH} rx={50} fill="#33516a" />
      </g>
      <line x1={spineX} y1={20} x2={spineX} y2={H - 100} stroke="#d8e4ec" strokeWidth={2} strokeDasharray="6 6" opacity={0.6} />
      <path
        fillRule="evenodd"
        fill="#000"
        opacity={0.62}
        d={`M0 0H${W}V${H}H0Z M${fx} ${fy}h${fw}v${fh}h${-fw}Z`}
      />
      <rect x={fx} y={fy} width={fw} height={fh} fill="none" stroke="#f2b134" strokeWidth={3} strokeDasharray="14 8" />
      <g stroke="#f2b134" strokeWidth={2.5}>
        <line x1={rx - 22} y1={ry} x2={rx + 22} y2={ry} />
        <line x1={rx} y1={ry - 22} x2={rx} y2={ry + 22} />
        <circle cx={rx} cy={ry} r={9} fill="none" />
      </g>
      <text x={W / 2} y={H + 24} textAnchor="middle" fontSize={22} fill="#d8e4ec">
        {t("detector")}
      </text>
    </svg>
  );
}

const PV = { detX: 380, pxPerCm: 4.5, midY: 140 };

/** Plan view: shows rotation, SID and the beam footprint. */
function TopView({ radCase, settings }: Pick<Props, "radCase" | "settings">) {
  const t = useTranslations("positioning");
  const { detX, pxPerCm, midY } = PV;
  const lateral = settings.projection === "lateral-left";
  const facesTube = settings.projection === "ap-erect";
  const depth = lateral ? 55 : 16;
  const ptX = detX - 4 - depth;
  const baseAngle = lateral ? 90 : 0;
  const tubeX = Math.max(30, detX - settings.sidCm * 1.7);
  const lateralPx = settings.centerXCm * pxPerCm;
  const detHalf = (radCase.detector.widthCm * pxPerCm) / 2;
  const field = collimatedField(settings, radCase.detector);
  const fy1 = midY + (field.x1 - radCase.detector.widthCm / 2) * pxPerCm;
  const fy2 = midY + (field.x2 - radCase.detector.widthCm / 2) * pxPerCm;
  const noseDir = facesTube ? -1 : 1;

  return (
    <svg viewBox="0 0 450 270" role="img" aria-label={t("alt")} className="h-auto w-full" style={{ direction: "ltr" }}>
      <polygon points={`${tubeX + 28},${midY + lateralPx} ${detX},${fy1} ${detX},${fy2}`} fill="#f2b134" opacity={0.18} />
      <line x1={tubeX + 28} y1={midY + lateralPx} x2={detX} y2={midY + lateralPx} stroke="#f2b134" strokeWidth={1.5} strokeDasharray="5 4" />
      <rect x={detX} y={midY - detHalf} width={8} height={detHalf * 2} rx={2} fill="#7b93a5" />
      <rect x={tubeX} y={midY + lateralPx - 20} width={28} height={40} rx={4} fill="#d8e4ec" />
      <g transform={`rotate(${settings.rotationDeg + baseAngle} ${ptX} ${midY})`}>
        <ellipse cx={ptX} cy={midY} rx={16} ry={55} fill="#5d778a" stroke="#d8e4ec" strokeWidth={1.5} />
        <path d={`M ${ptX + noseDir * 16} ${midY - 7} L ${ptX + noseDir * 30} ${midY} L ${ptX + noseDir * 16} ${midY + 7} Z`} fill="#d8e4ec" />
      </g>
      <line x1={tubeX} y1={236} x2={detX} y2={236} stroke="#d8e4ec" strokeWidth={1} />
      <line x1={tubeX} y1={230} x2={tubeX} y2={242} stroke="#d8e4ec" />
      <line x1={detX} y1={230} x2={detX} y2={242} stroke="#d8e4ec" />
      <text x={(tubeX + detX) / 2} y={256} textAnchor="middle" fontSize={13} fill="#d8e4ec">
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

export function PositioningView({ radCase, settings, onChange, disabled }: Props) {
  const t = useTranslations("positioning");
  const c = radCase.controls;
  return (
    <section aria-labelledby="pos-heading" className="rounded-lg border border-line bg-panel">
      <div className="border-b border-line px-4 py-3">
        <h2 id="pos-heading" className="font-semibold">
          {t("title")}
        </h2>
      </div>
      <div className="grid gap-4 bg-console p-4 md:grid-cols-[3fr_2fr]">
        <figure className="m-0">
          <FrontView radCase={radCase} settings={settings} />
          <figcaption className="mt-1 text-center text-xs text-console-text/80">{t("frontView")}</figcaption>
        </figure>
        <figure className="m-0 self-center">
          <TopView radCase={radCase} settings={settings} />
          <figcaption className="mt-1 text-center text-xs text-console-text/80">{t("topView")}</figcaption>
        </figure>
      </div>
      <p className="px-4 pt-2 text-xs text-muted">{t("schematicNote")}</p>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <RangeField label={t("rotation")} unit="°" {...c.rotationDeg} value={settings.rotationDeg} disabled={disabled} onChange={(v) => onChange("rotationDeg", v)} />
        <RangeField label={t("centerX")} unit="cm" {...c.centerXCm} value={settings.centerXCm} disabled={disabled} onChange={(v) => onChange("centerXCm", v)} />
        <RangeField label={t("centerY")} unit="cm" {...c.centerYCm} value={settings.centerYCm} disabled={disabled} onChange={(v) => onChange("centerYCm", v)} />
        <RangeField label={t("collWidth")} unit="cm" {...c.collimationWidthCm} value={settings.collimationWidthCm} disabled={disabled} onChange={(v) => onChange("collimationWidthCm", v)} />
        <RangeField label={t("collHeight")} unit="cm" {...c.collimationHeightCm} value={settings.collimationHeightCm} disabled={disabled} onChange={(v) => onChange("collimationHeightCm", v)} />
      </div>
    </section>
  );
}
