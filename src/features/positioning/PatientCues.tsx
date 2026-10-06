"use client";

import { useTranslations } from "next-intl";
import clsx from "clsx";
import type { ChinPositionId, ShoulderPositionId } from "@/domain/simulation";

interface Props {
  chin: ChinPositionId;
  shoulders: ShoulderPositionId;
  onChin: (v: ChinPositionId) => void;
  onShoulders: (v: ShoulderPositionId) => void;
  disabled: boolean;
  showGuides: boolean;
}

/** Side-view diagram of the erect patient facing the detector; shows the current chin/shoulder choice. */
function SideDiagram({ chin, shoulders }: Pick<Props, "chin" | "shoulders">) {
  const t = useTranslations("positioning");
  const tucked = chin === "tucked";
  const rolled = shoulders === "rolled-forward";
  const shoulderX = rolled ? 152 : 134;
  return (
    <svg viewBox="0 0 260 300" role="img" aria-label={t("cueSideAlt")} className="h-auto w-full max-w-[16rem]" style={{ direction: "ltr" }}>
      {/* floor + detector (patient faces right, toward the detector) */}
      <line x1={20} y1={282} x2={240} y2={282} stroke="#2b4152" strokeWidth={3} />
      <rect x={214} y={34} width={10} height={228} rx={3} fill="#7b93a5" />
      <text x={219} y={26} textAnchor="middle" fontSize={11} fill="#d8e4ec">
        {t("cueDetector")}
      </text>
      {/* legs + torso */}
      <rect x={118} y={200} width={36} height={82} rx={8} fill="#43607a" />
      <rect x={108} y={98} width={54} height={112} rx={20} fill="#5d778a" />
      {/* anterior chest arrow toward detector */}
      <path d="M 168 150 H 204" stroke="#f2b134" strokeWidth={3} markerEnd="url(#arrow)" />
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={7} markerHeight={7} orient="auto">
          <path d="M0 0 L10 5 L0 10 Z" fill="#f2b134" />
        </marker>
      </defs>
      {/* neck + head, chin tucked or lifted */}
      <rect x={128} y={78} width={14} height={24} fill="#7b93a5" />
      <circle cx={135} cy={60} r={22} fill="#7b93a5" />
      <path
        d={tucked ? "M 146 70 L 160 90 L 144 84 Z" : "M 154 58 L 170 50 L 154 70 Z"}
        fill="#d8e4ec"
        stroke="#0b141b"
        strokeWidth={1}
      />
      {/* shoulder (rolled forward moves toward the detector) and scapula behind it */}
      <circle cx={shoulderX} cy={112} r={13} fill="#9db6c6" stroke="#d8e4ec" strokeWidth={1.5} />
      <path d={`M ${rolled ? 106 : 112} 104 q -10 24 0 48`} fill="none" stroke="#d8e4ec" strokeWidth={3} strokeLinecap="round" />
      <text x={100} y={176} textAnchor="end" fontSize={11} fill="#d8e4ec">
        {t("scapula")}
      </text>
      {/* erect arrow */}
      <path d="M 52 270 V 40" stroke="#4ade80" strokeWidth={2} strokeDasharray="4 5" markerEnd="url(#arrow-green)" />
      <defs>
        <marker id="arrow-green" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={7} markerHeight={7} orient="auto">
          <path d="M0 0 L10 5 L0 10 Z" fill="#4ade80" />
        </marker>
      </defs>
      <text x={46} y={160} textAnchor="end" fontSize={11} fill="#4ade80">
        {t("cueErect")}
      </text>
    </svg>
  );
}

function Choice<T extends string>({
  legend,
  options,
  value,
  onSelect,
  disabled,
  label,
}: {
  legend: string;
  options: readonly T[];
  value: T;
  onSelect: (v: T) => void;
  disabled: boolean;
  label: (v: T) => string;
}) {
  return (
    <fieldset disabled={disabled} className="space-y-1">
      <legend className="text-sm font-medium text-console-text">{legend}</legend>
      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {options.map((o) => (
          <label
            key={o}
            className={clsx(
              "flex cursor-pointer items-center gap-2 rounded border px-2 py-1.5 text-sm has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-signal",
              o === value ? "border-signal bg-signal/10 text-white" : "border-console-line text-console-text hover:bg-console-raise",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <input type="radio" className="accent-signal" name={legend} checked={o === value} onChange={() => onSelect(o)} />
            {label(o)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function PatientCues({ chin, shoulders, onChin, onShoulders, disabled, showGuides }: Props) {
  const t = useTranslations("positioning");
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white">{t("cuesTitle")}</h3>
      <div className="flex justify-center">
        <SideDiagram chin={chin} shoulders={shoulders} />
      </div>
      {showGuides && (
        <div className="rounded border border-console-line p-2 text-xs text-console-text">
          <p className="mb-1 font-medium text-white">{t("cuesLegendHelp")}</p>
          <ul className="list-disc space-y-0.5 ps-5">
            <li>{t("cueErect")}</li>
            <li>{t("cueAnterior")}</li>
            <li>{t("cueChin")}</li>
            <li>{t("cueShoulders")}</li>
          </ul>
        </div>
      )}
      <Choice legend={t("chinLegend")} options={["tucked", "elevated"] as const} value={chin} onSelect={onChin} disabled={disabled} label={(v) => t(`chinOptions.${v}`)} />
      <Choice legend={t("shoulderLegend")} options={["relaxed", "rolled-forward"] as const} value={shoulders} onSelect={onShoulders} disabled={disabled} label={(v) => t(`shoulderOptions.${v}`)} />
    </div>
  );
}
