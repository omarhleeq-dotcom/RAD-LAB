/**
 * Console stepping. A control with `stations` (e.g. a preferred-number mAs series) moves between those
 * values, as real consoles do; otherwise it moves by `step`. Pure helpers shared by the UI and tests.
 */
import type { NumericControlSpec } from "@/domain/case";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const roundStep = (v: number) => Math.round(v * 1e6) / 1e6;

/** Nearest allowed value for `value` (clamped to the control's range; snapped to a station / step). */
export function snapToControl(spec: NumericControlSpec, value: number): number {
  if (!Number.isFinite(value)) return spec.min;
  const v = clamp(value, spec.min, spec.max);
  if (spec.stations?.length) {
    return spec.stations.reduce((best, s) => (Math.abs(s - v) < Math.abs(best - v) ? s : best));
  }
  return roundStep(clamp(spec.min + Math.round((v - spec.min) / spec.step) * spec.step, spec.min, spec.max));
}

/**
 * Move `count` stations/steps from `value` (negative = down). Stays inside the control's range.
 * From a value that is not itself a station (e.g. a starting mAs of 12 between 10 and 12.5), the first step
 * lands on the adjacent station in that direction rather than skipping past it.
 */
export function stepControl(spec: NumericControlSpec, value: number, count: number): number {
  const st = spec.stations;
  if (st?.length) {
    const v = clamp(Number.isFinite(value) ? value : spec.min, spec.min, spec.max);
    const exact = st.indexOf(v);
    let i: number;
    if (exact >= 0) i = exact + count;
    else if (count > 0) i = st.findIndex((s) => s > v) + count - 1;
    else i = (st.findLastIndex((s) => s < v) as number) + count + 1;
    if (count > 0 && st.findIndex((s) => s > v) < 0 && exact < 0) i = st.length - 1;
    if (count < 0 && st.findLastIndex((s) => s < v) < 0 && exact < 0) i = 0;
    return st[clamp(i, 0, st.length - 1)] as number;
  }
  return snapToControl(spec, value + count * spec.step);
}

/** Slider position for a value: station index, or the value itself for continuous controls. */
export function toSliderPosition(spec: NumericControlSpec, value: number): number {
  return spec.stations?.length ? spec.stations.indexOf(snapToControl(spec, value)) : value;
}

export function fromSliderPosition(spec: NumericControlSpec, pos: number): number {
  return spec.stations?.length ? ((spec.stations[clamp(Math.round(pos), 0, spec.stations.length - 1)] as number)) : snapToControl(spec, pos);
}
