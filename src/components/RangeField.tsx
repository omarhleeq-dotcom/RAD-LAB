"use client";

import { useId } from "react";
import clsx from "clsx";

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
  tone?: "light" | "dark";
}

/** Labelled slider with a numeric readout. Numbers are always rendered LTR, even in Arabic. */
export function RangeField({ label, value, min, max, step, unit, onChange, disabled, tone = "light" }: Props) {
  const id = useId();
  const dark = tone === "dark";
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={clsx("text-sm font-medium", dark ? "text-console-text" : "text-ink")}>
          {label}
        </label>
        <output
          htmlFor={id}
          dir="ltr"
          className={clsx(
            "rounded px-2 py-0.5 font-mono text-sm tabular-nums",
            dark ? "bg-black/40 text-signal" : "bg-paper text-brand-strong",
          )}
        >
          {value}
          {unit ? ` ${unit}` : ""}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="block w-full disabled:opacity-50"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
