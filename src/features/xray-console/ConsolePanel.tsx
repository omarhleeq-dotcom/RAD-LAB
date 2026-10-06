"use client";

import { useTranslations } from "next-intl";
import clsx from "clsx";
import { RangeField } from "@/components/RangeField";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
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
}: {
  legend: string;
  options: readonly T[];
  value: T;
  onSelect: (v: T) => void;
  disabled: boolean;
  label: (v: T) => string;
}) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="mb-1 text-sm font-medium text-console-text">{legend}</legend>
      <div className="grid gap-2">
        {options.map((o) => (
          <label
            key={o}
            className={clsx(
              "flex cursor-pointer items-center gap-3 rounded border px-3 py-2 text-sm has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-signal",
              o === value
                ? "border-signal bg-signal/10 text-white"
                : "border-console-line text-console-text hover:bg-console-raise",
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

export function ConsolePanel({ radCase, settings, onChange, onExpose, locked }: Props) {
  const t = useTranslations("console");
  const c = radCase.controls;
  return (
    <section aria-labelledby="console-heading" className="rounded-lg border border-console-line bg-console p-4 text-console-text">
      <h2 id="console-heading" className="mb-4 border-b border-console-line pb-3 font-semibold text-white">
        {t("title")}
      </h2>
      <div className="space-y-5">
        <Segmented
          legend={t("projection")}
          options={radCase.availableProjections}
          value={settings.projection}
          disabled={locked}
          onSelect={(v) => onChange("projection", v)}
          label={(v) => t(`projections.${v}`)}
        />
        <RangeField tone="dark" label={t("kvp")} unit="kVp" {...c.kvp} value={settings.kvp} disabled={locked} onChange={(v) => onChange("kvp", v)} />
        <RangeField tone="dark" label={t("mas")} unit="mAs" {...c.mas} value={settings.mas} disabled={locked} onChange={(v) => onChange("mas", v)} />
        <RangeField tone="dark" label={t("sid")} unit="cm" {...c.sidCm} value={settings.sidCm} disabled={locked} onChange={(v) => onChange("sidCm", v)} />
        <Segmented
          legend={t("breathing")}
          options={radCase.availableBreathing}
          value={settings.breathing}
          disabled={locked}
          onSelect={(v) => onChange("breathing", v)}
          label={(v) => t(`breathingOptions.${v}`)}
        />
        <button
          type="button"
          onClick={onExpose}
          disabled={locked}
          className="w-full rounded-md bg-signal px-4 py-3 text-lg font-bold tracking-widest text-ink hover:brightness-110 disabled:cursor-not-allowed disabled:bg-console-line disabled:text-console-text"
        >
          {locked ? t("locked") : t("expose")}
        </button>
      </div>
    </section>
  );
}
