"use client";

import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import type { AecChamberId } from "@/domain/technique";
import { collimatedField } from "@/features/simulation/geometry";
import { evaluateAec, toggleChamber } from "@/features/technique/aec";
import { localize } from "@/lib/localized";

const U = 10; // drawing units per detector cm (drawing only; state is normalized)

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
  onChange: (chambers: AecChamberId[]) => void;
  disabled: boolean;
}

/**
 * Vendor-neutral AEC chamber selector: a schematic detector (patient lung fields + the current light field)
 * with three sensing fields, plus an equivalent checkbox list for keyboard / screen-reader / touch use.
 * Chamber and field geometry come from the case's TechniqueProfile; left/right follow the detector view and are
 * never mirrored by RTL (the SVG is forced `direction: ltr`).
 */
export function AecPanel({ radCase, settings, onChange, disabled }: Props) {
  const t = useTranslations("console.aec");
  const locale = useLocale();
  const { detector, requiredAnatomy: a, technique } = radCase;
  const W = detector.widthCm * U;
  const H = detector.heightCm * U;
  const field = collimatedField(settings, detector);
  const aec = evaluateAec(technique, settings.aecChambers, field, detector);
  const toggle = (id: AecChamberId) => !disabled && onChange(toggleChamber(settings.aecChambers, id));

  const lungY = a.yCm * U;
  const lungH = a.heightCm * U;
  const lungW = (a.widthCm * U) / 2 - 8;
  const mid = W / 2;
  const px = (n: number, size: number) => ((n + 1) / 2) * size;

  return (
    <div className="space-y-3 rounded border border-console-line bg-black/20 p-3">
      <div>
        <h3 className="text-sm font-semibold text-white">{t("title")}</h3>
        <p className="mt-1 text-xs text-console-text/80">{t("purpose")}</p>
      </div>

      <svg
        viewBox={`-8 -8 ${W + 16} ${H + 16}`}
        role="img"
        aria-label={t("diagramAlt")}
        className="mx-auto block h-auto max-h-80 w-full max-w-56 select-none"
        style={{ direction: "ltr" }}
      >
        <rect x={0} y={0} width={W} height={H} rx={4} fill="#0b141b" stroke="#2b4152" strokeWidth={2} />
        <rect x={mid - 8 - lungW} y={lungY} width={lungW} height={lungH} rx={50} fill="#33516a" opacity={0.85} />
        <rect x={mid + 8} y={lungY} width={lungW} height={lungH} rx={50} fill="#33516a" opacity={0.85} />
        <line x1={mid} y1={0} x2={mid} y2={H} stroke="#7dd3fc" strokeWidth={1.5} strokeDasharray="3 7" opacity={0.5} />
        {aec.chambers.map((o) => {
          const spec = technique.aec.chambers.find((c) => c.id === o.id)!;
          const x = px(spec.region.x1, W), y = px(spec.region.y1, H);
          const w = px(spec.region.x2, W) - x, h = px(spec.region.y2, H) - y;
          const label = localize(spec.label, locale);
          return (
            <g
              key={o.id}
              aria-hidden
              onPointerDown={(e) => {
                if (disabled) return;
                e.preventDefault();
                toggle(o.id);
              }}
              style={{ cursor: disabled ? "default" : "pointer" }}
            >
              <rect x={x - 12} y={y - 12} width={w + 24} height={h + 24} fill="transparent" />
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={6}
                fill={o.selected ? (o.active ? "#f2b134" : "#b3261e") : "transparent"}
                fillOpacity={o.selected ? 0.4 : 0}
                stroke={o.selected ? (o.active ? "#f2b134" : "#ff6b61") : "#d8e4ec"}
                strokeWidth={o.selected ? 4 : 2}
                strokeDasharray={o.selected ? undefined : "8 6"}
              />
              <title>{label}</title>
            </g>
          );
        })}
        <path
          fillRule="evenodd"
          fill="#000"
          opacity={0.55}
          d={`M0 0H${W}V${H}H0Z M${field.x1 * U} ${field.y1 * U}h${(field.x2 - field.x1) * U}v${(field.y2 - field.y1) * U}h${-(field.x2 - field.x1) * U}Z`}
          style={{ pointerEvents: "none" }}
        />
        <rect
          x={field.x1 * U}
          y={field.y1 * U}
          width={(field.x2 - field.x1) * U}
          height={(field.y2 - field.y1) * U}
          fill="none"
          stroke="#f2b134"
          strokeWidth={3}
          strokeDasharray="14 8"
          style={{ pointerEvents: "none" }}
        />
      </svg>

      <fieldset disabled={disabled} className="space-y-2">
        <legend className="mb-1 text-xs font-medium text-console-text">{t("legend")}</legend>
        {technique.aec.chambers.map((spec) => {
          const o = aec.chambers.find((c) => c.id === spec.id)!;
          const coverage = o.fieldCoverage >= 0.999 ? t("inField") : o.fieldCoverage <= 0.001 ? t("outsideField") : t("partialField");
          return (
            <label
              key={spec.id}
              className={clsx(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded border px-3 py-2 text-sm has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-signal",
                o.selected ? "border-signal bg-signal/10 text-white" : "border-console-line text-console-text hover:bg-console-raise",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="checkbox"
                className="h-5 w-5 shrink-0 accent-signal"
                checked={o.selected}
                onChange={() => toggle(spec.id)}
              />
              <span className="flex-1">
                {localize(spec.label, locale)}
                <span className={clsx("block text-xs", o.selected && !o.active ? "text-[#ff8a80]" : "text-console-text/70")}>
                  {coverage}
                </span>
              </span>
            </label>
          );
        })}
        {settings.aecChambers.length === 0 && <p className="text-xs text-signal">{t("none")}</p>}
      </fieldset>
      <p className="text-xs text-console-text/70">{t("hint")}</p>
      <p className="text-xs font-medium text-signal/90">{t("disclaimer")}</p>
    </div>
  );
}
