"use client";

import { useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import type { RadCase } from "@/domain/case";
import type { ExposureMode, SimulationMode, SimulationSettings } from "@/domain/simulation";
import { localize } from "@/lib/localized";
import { projectionLabelOf } from "@/features/simulation/projection-label";
import { assessReadiness } from "@/features/technique/readiness";
import { AecPanel } from "./AecPanel";
import { ReadinessPanel } from "./ReadinessPanel";
import { StepField } from "./StepField";

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
  mode: SimulationMode;
  onChange: <K extends keyof SimulationSettings>(key: K, value: SimulationSettings[K]) => void;
  onExpose: () => void;
  locked: boolean;
}

function Segmented<T extends string>({
  legend,
  options,
  value,
  onSelect,
  disabled,
  label,
  columns,
  help,
}: {
  legend: string;
  options: readonly T[];
  value: T;
  onSelect: (v: T) => void;
  disabled: boolean;
  label: (v: T) => string;
  columns?: boolean;
  help?: string;
}) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="mb-1 text-sm font-semibold text-white">{legend}</legend>
      <div className={clsx("grid gap-2", columns && "grid-cols-2")}>
        {options.map((o) => (
          <label
            key={o}
            className={clsx(
              "flex min-h-11 cursor-pointer items-center gap-3 rounded border px-3 py-2 text-sm has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-signal",
              o === value
                ? "border-signal bg-signal/10 text-white"
                : "border-console-line text-console-text hover:bg-console-raise",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <input type="radio" className="h-4 w-4 accent-signal" name={legend} checked={o === value} onChange={() => onSelect(o)} />
            {label(o)}
          </label>
        ))}
      </div>
      {help && <p className="text-xs text-console-text/70">{help}</p>}
    </fieldset>
  );
}

/**
 * Educational, vendor-neutral X-ray console. It only collects settings and shows workflow status;
 * every exposure calculation lives in `features/technique` (pure) and is evaluated on Expose.
 * No live DI / "correct value" is shown before the exposure, so Practice Mode guides without solving.
 */
export function ConsolePanel({ radCase, settings, mode, onChange, onExpose, locked }: Props) {
  const t = useTranslations("console");
  const locale = useLocale();
  const c = radCase.controls;
  const readinessId = useId();
  const readiness = assessReadiness(radCase, settings, locked ? "result" : "setup");
  const aec = settings.exposureMode === "aec";
  const canExpose = readiness.canExpose;

  return (
    <section aria-labelledby="console-heading" className="rounded-lg border border-console-line bg-console p-4 text-console-text">
      <div className="mb-4 border-b border-console-line pb-3">
        <h2 id="console-heading" className="font-semibold text-white">
          {t("title")}
        </h2>
        <p className="text-xs uppercase tracking-wider text-signal/80">{t("subtitle")}</p>
        {mode === "practice" && (
          <>
            <p className="mt-2 text-xs text-console-text/80">{t("vendorNeutral")}</p>
            <p className="mt-1 text-xs text-console-text/80">{t("digitalHint")}</p>
          </>
        )}
      </div>

      <div className="space-y-5">
        <Segmented
          legend={t("projection")}
          options={radCase.availableProjections}
          value={settings.projection}
          disabled={locked}
          onSelect={(v) => onChange("projection", v)}
          label={(v) => {
            const own = projectionLabelOf(radCase.choiceControls, settings.choices, v);
            return own ? localize(own, locale) : t(`projections.${v}`);
          }}
        />
        {/* Optional controls an exam declares (S11): absent for Chest PA, so its console is unchanged. */}
        {radCase.choiceControls?.map((cc) => (
          <Segmented
            key={cc.id}
            legend={localize(cc.label, locale)}
            options={cc.options.map((o) => o.id)}
            value={settings.choices?.[cc.id] ?? ""}
            disabled={locked}
            onSelect={(v) => onChange("choices", { ...settings.choices, [cc.id]: v })}
            label={(v) => localize(cc.options.find((o) => o.id === v)!.label, locale)}
            help={cc.hint ? localize(cc.hint, locale) : undefined}
          />
        ))}
        {c.tubeAngulationDeg && (
          <StepField
            label={t("tubeAngulation")}
            hint={t("tubeAngulationHint")}
            unit="°"
            spec={c.tubeAngulationDeg}
            value={settings.tubeAngulationDeg ?? 0}
            disabled={locked}
            onChange={(v) => onChange("tubeAngulationDeg", v)}
          />
        )}
        <StepField
          label={t("sid")}
          hint={t("sidHint")}
          unit="cm"
          spec={c.sidCm}
          value={settings.sidCm}
          disabled={locked}
          onChange={(v) => onChange("sidCm", v)}
        />
        <StepField
          label={t("kvp")}
          hint={t("kvpHint")}
          unit="kVp"
          spec={c.kvp}
          value={settings.kvp}
          disabled={locked}
          onChange={(v) => onChange("kvp", v)}
        />

        <Segmented<ExposureMode>
          legend={t("modeLegend")}
          options={radCase.technique.aec ? ["manual", "aec"] : ["manual"]}
          value={settings.exposureMode}
          disabled={locked}
          columns
          onSelect={(v) => onChange("exposureMode", v)}
          label={(v) => (v === "manual" ? t("modeManual") : t("modeAec"))}
          help={aec ? t("modeAecHelp") : t("modeManualHelp")}
        />

        <StepField
          label={t("mas")}
          hint={t("masHint")}
          unit="mAs"
          spec={c.mas}
          value={settings.mas}
          disabled={locked}
          readout={aec ? t("masAuto") : undefined}
          help={aec ? t("masAutoHelp") : undefined}
          onChange={(v) => onChange("mas", v)}
        />

        {aec && (
          <AecPanel radCase={radCase} settings={settings} disabled={locked} onChange={(ch) => onChange("aecChambers", ch)} />
        )}

        <p className="text-xs text-console-text/60">{t("adjustHint")}</p>

        {/* After the exposure the readiness box only repeats "not ready"; the result panel offers Retry / Restart (S-VIS-1-3). */}
        {!locked && <ReadinessPanel readiness={readiness} id={readinessId} />}

        <button
          type="button"
          onClick={onExpose}
          disabled={!canExpose}
          aria-describedby={locked ? undefined : readinessId}
          className="min-h-12 w-full rounded-md bg-signal px-4 py-3 text-lg font-bold tracking-widest text-ink hover:brightness-110 disabled:cursor-not-allowed disabled:bg-console-line disabled:text-console-text"
        >
          {locked ? t("locked") : t("expose")}
        </button>
      </div>
    </section>
  );
}
