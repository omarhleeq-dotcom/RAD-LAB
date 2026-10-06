"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
  onChange: <K extends keyof SimulationSettings>(key: K, value: SimulationSettings[K]) => void;
  disabled: boolean;
}

function Choices<T extends string>({
  legend,
  name,
  options,
  value,
  onSelect,
  label,
  disabled,
}: {
  legend: string;
  name: string;
  options: readonly T[];
  value: T;
  onSelect: (v: T) => void;
  label: (v: T) => string;
  disabled: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-2">
      <legend className="mb-1 text-sm font-semibold">{legend}</legend>
      {options.map((o) => (
        <label
          key={o}
          className={clsx(
            "flex min-h-11 cursor-pointer items-center gap-3 rounded border px-3 py-2 text-sm has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-signal",
            o === value ? "border-brand bg-brand/10 text-brand-strong" : "border-line hover:bg-paper",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <input type="radio" className="h-4 w-4 shrink-0 accent-brand" name={name} checked={o === value} onChange={() => onSelect(o)} />
          <span>{label(o)}</span>
        </label>
      ))}
    </fieldset>
  );
}

/**
 * Session 4 — the learner acts as the radiographer and speaks to the patient. The learner chooses the INSTRUCTION,
 * never the image defect; the simulated response (`features/patient/response.ts`) is derived at exposure time.
 * Nothing here marks an option as right or wrong, so Practice Mode does not leak the answer before exposure.
 */
export function PatientInstructionsPanel({ radCase, settings, onChange, disabled }: Props) {
  const t = useTranslations("patient");
  return (
    <section aria-labelledby="patient-heading" className="rounded-lg border border-line bg-panel">
      <div className="border-b border-line px-4 py-3">
        <h2 id="patient-heading" className="font-semibold">
          {t("title")}
        </h2>
        <p className="mt-1 text-xs text-muted">{t("intro")}</p>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <Choices
          legend={t("breathingLegend")}
          name="breathing-instruction"
          options={radCase.availableBreathing}
          value={settings.breathing}
          disabled={disabled}
          onSelect={(v) => onChange("breathing", v)}
          label={(v) => t(`breathingOptions.${v}`, { sex: radCase.patient.sex })}
        />
        <Choices
          legend={t("motionLegend")}
          name="motion-instruction"
          options={radCase.availableMotionInstructions}
          value={settings.motionInstruction}
          disabled={disabled}
          onSelect={(v) => onChange("motionInstruction", v)}
          label={(v) => t(`motionOptions.${v}`, { sex: radCase.patient.sex })}
        />
      </div>
      <p className="px-4 pb-3 text-xs text-muted">{t("note")}</p>
    </section>
  );
}
