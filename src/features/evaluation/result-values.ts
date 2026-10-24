// Pure display formatting. The offsets and protocol bands come from the existing case, never from control bounds.
import type { CheckRule, RadCase } from "@/domain/case";
import { ruleTarget } from "./result-presentation";

export function formatResultNumber(value: number, unit: string, signed = false): string {
  const rounded = Math.round(value * 100) / 100;
  const sign = rounded < 0 ? "−" : signed && rounded > 0 ? "+" : "";
  return `${sign}${Math.abs(rounded)}${unit === "°" ? "" : " "}${unit}`;
}

/** Isolate each numeric bound in Arabic so a minus/plus cannot migrate across the RTL words. */
export function formatResultRange(range: readonly [number, number], unit: string, locale: string): string {
  const signed = range[0] < 0;
  const low = formatResultNumber(range[0], unit, signed);
  const high = formatResultNumber(range[1], unit, signed);
  return locale === "ar" ? `بين \u2066${low}\u2069 و\u2066${high}\u2069` : `${low} to ${high}`;
}

/** Keep the engine's already formatted observation; change typography only. */
export function formatResultObserved(value: string): string {
  return value.replace(/(^|\s|\()-([0-9])/g, "$1−$2").replace(/([0-9])\s+°/g, "$1°");
}

export function displayTarget(rule: CheckRule | undefined, c: RadCase, locale: string): string | undefined {
  if (rule?.kind === "equals") return ruleTarget(rule);
  if (rule?.kind === "range") return formatResultRange(rule.ideal, rule.unit, locale);
  if (rule?.kind === "technique" && rule.check === "kvp-band") {
    const band = c.technique?.kvp?.targetBand;
    return band?.every(Number.isFinite) ? formatResultRange(band, "kVp", locale) : undefined;
  }
  if (rule?.kind === "centering") {
    // evalCentering displays the offset FROM positioning.centering.target, not an absolute detector coordinate.
    // Thus its target is zero offset; use the same normalized-to-cm conversion as the existing observation.
    const tolerance = c.positioning?.centering?.idealTolerance?.[rule.axis];
    const dimension = rule.axis === "x" ? c.detector?.widthCm : c.detector?.heightCm;
    if (!Number.isFinite(tolerance) || !Number.isFinite(dimension)) return undefined;
    const cm = tolerance * dimension / 2;
    return `${formatResultNumber(0, "cm")} (±${formatResultNumber(cm, "cm")})`;
  }
  return undefined;
}
