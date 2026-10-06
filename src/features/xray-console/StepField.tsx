"use client";

import { useEffect, useId, useRef } from "react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import type { NumericControlSpec } from "@/domain/case";
import { fromSliderPosition, stepControl, toSliderPosition } from "@/features/technique/stations";

interface Props {
  label: string;
  hint?: string;
  unit: string;
  value: number;
  spec: NumericControlSpec;
  onChange: (value: number) => void;
  disabled?: boolean;
  /** Replaces the numeric readout (e.g. "AUTO" while the AEC owns the value). The control is then disabled. */
  readout?: string;
  /** Extra help text shown under the control. */
  help?: string;
}

const REPEAT_DELAY_MS = 380;
const REPEAT_EVERY_MS = 90;

const BTN =
  "grid h-11 w-11 shrink-0 place-items-center rounded border border-console-line bg-console-raise text-xl font-bold text-white select-none hover:brightness-125 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40";

/**
 * − / + button. Tap = one step; press-and-hold repeats. `onStep` returns false when nothing changed (range end),
 * which also stops the repeat (a disabled button may never see pointerup).
 * Keyboard activation arrives as a click with detail 0; pointer clicks were already handled on pointerdown.
 */
function StepButton({
  label,
  dir,
  disabled,
  onStep,
  children,
}: {
  label: string;
  dir: 1 | -1;
  disabled: boolean;
  onStep: (dir: 1 | -1, big: boolean) => boolean;
  children: React.ReactNode;
}) {
  const timers = useRef<{ delay?: ReturnType<typeof setTimeout>; repeat?: ReturnType<typeof setInterval> }>({});
  useEffect(() => {
    const t = timers.current;
    return () => {
      clearTimeout(t.delay);
      clearInterval(t.repeat);
    };
  }, []);
  return (
    <button
      type="button"
      className={BTN}
      aria-label={label}
      disabled={disabled}
      onPointerDown={(e) => {
        if (disabled || e.button !== 0) return;
        onStep(dir, e.shiftKey);
        clearTimeout(timers.current.delay);
        clearInterval(timers.current.repeat);
        timers.current.delay = setTimeout(() => {
          timers.current.repeat = setInterval(() => {
            if (!onStep(dir, false)) clearInterval(timers.current.repeat);
          }, REPEAT_EVERY_MS);
        }, REPEAT_DELAY_MS);
      }}
      onPointerUp={() => {
        clearTimeout(timers.current.delay);
        clearInterval(timers.current.repeat);
      }}
      onPointerLeave={() => {
        clearTimeout(timers.current.delay);
        clearInterval(timers.current.repeat);
      }}
      onPointerCancel={() => {
        clearTimeout(timers.current.delay);
        clearInterval(timers.current.repeat);
      }}
      onClick={(e) => {
        if (e.detail === 0 && !disabled) onStep(dir, e.shiftKey);
      }}
    >
      {children}
    </button>
  );
}

/**
 * Console numeric field: a seven-segment-style readout with − / + buttons and a slider.
 * - Mouse/touch: tap = one step, press-and-hold repeats. Keyboard: Enter/Space on the buttons, native slider keys.
 * - 44 px touch targets. The control row is always LTR so − / + never swap sides in Arabic and numbers stay LTR.
 */
export function StepField({ label, hint, unit, value, spec, onChange, disabled, readout, help }: Props) {
  const t = useTranslations("console");
  const id = useId();
  const off = disabled || readout !== undefined;
  const latest = useRef({ value, spec, onChange });
  useEffect(() => {
    latest.current = { value, spec, onChange };
  });
  const step = (dir: 1 | -1, big: boolean) => {
    const { value: v, spec: s, onChange: set } = latest.current;
    const next = stepControl(s, v, dir * (big ? (s.stations ? 3 : 10) : 1));
    if (next === v) return false;
    set(next);
    return true;
  };

  const atMin = value <= spec.min;
  const atMax = value >= spec.max;
  const sliderMax = spec.stations?.length ? spec.stations.length - 1 : spec.max;
  const sliderMin = spec.stations?.length ? 0 : spec.min;
  const sliderStep = spec.stations?.length ? 1 : spec.step;

  return (
    <div className="space-y-1.5" role="group" aria-labelledby={`${id}-label`}>
      <div className="flex items-baseline justify-between gap-2">
        <span id={`${id}-label`} className="text-sm font-semibold text-white">
          {label}
        </span>
        {hint && <span className="text-xs text-console-text/70">{hint}</span>}
      </div>
      <div dir="ltr" className="flex items-stretch gap-2">
        <StepButton dir={-1} label={t("decrease", { name: label })} disabled={off || atMin} onStep={step}>
          −
        </StepButton>
        <output
          htmlFor={`${id}-slider`}
          aria-live="off"
          className={clsx(
            "flex min-w-0 flex-1 items-baseline justify-center gap-1.5 rounded border border-black bg-black/60 px-2 py-1.5 font-mono tabular-nums shadow-inner",
            off ? "text-signal/50" : "text-signal",
          )}
        >
          <span className={clsx("font-bold leading-none", readout === undefined ? "text-3xl tracking-wider" : "text-2xl")}>{readout ?? value}</span>
          {readout === undefined && <span className="text-xs text-console-text/70">{unit}</span>}
        </output>
        <StepButton dir={1} label={t("increase", { name: label })} disabled={off || atMax} onStep={step}>
          +
        </StepButton>
      </div>
      <input
        id={`${id}-slider`}
        type="range"
        // Numeric dial: always low → high from left to right (same as the − / + row), even in the RTL page.
        dir="ltr"
        aria-label={label}
        aria-valuetext={readout ?? `${value} ${unit}`}
        className="block h-6 w-full disabled:opacity-40"
        min={sliderMin}
        max={sliderMax}
        step={sliderStep}
        value={toSliderPosition(spec, value)}
        disabled={off}
        onChange={(e) => onChange(fromSliderPosition(spec, Number(e.target.value)))}
      />
      {help && <p className="text-xs text-console-text/70">{help}</p>}
    </div>
  );
}
