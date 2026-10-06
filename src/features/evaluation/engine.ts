import type { CheckRule, CoverageRule, EqualsRule, RadCase, RangeRule } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { computeScore } from "@/features/scoring/score";
import { collimatedField, coverageMargins, regionToRect } from "@/features/simulation/geometry";
import type { CheckResult, EvaluationResult } from "./types";

const PARTIAL_CREDIT = 0.5;
const inside = (v: number, [min, max]: [number, number]) => v >= min && v <= max;
const fmt = (n: number) => String(Math.round(n * 100) / 100);

function evalEquals(rule: EqualsRule, s: SimulationSettings): Partial<CheckResult> {
  const value = s[rule.setting];
  const ok = value === rule.expected;
  return {
    outcome: ok ? "pass" : "fail",
    observed: String(value),
    observedKind: rule.setting,
    feedback: ok ? rule.feedback.pass : rule.feedback.fail,
    variant: ok ? undefined : rule.variantOnFail,
  };
}

function evalRange(rule: RangeRule, s: SimulationSettings): Partial<CheckResult> {
  const value = s[rule.setting];
  const observed = `${fmt(value)} ${rule.unit}`;
  if (inside(value, rule.ideal)) return { outcome: "pass", observed, feedback: rule.feedback.pass };
  const direction = value < rule.ideal[0] ? "low" : "high";
  const feedback = rule.feedback[direction] ?? rule.feedback.fail;
  const variant = direction === "low" ? rule.variantOnLow : rule.variantOnHigh;
  return {
    outcome: inside(value, rule.acceptable) ? "partial" : "fail",
    observed,
    feedback,
    variant,
  };
}

function evalCoverage(rule: CoverageRule, s: SimulationSettings, c: RadCase): Partial<CheckResult> {
  const field = collimatedField(s, c.detector);
  const m = coverageMargins(field, regionToRect(c.requiredAnatomy));
  const margins = Object.values(m);
  const observed = `${fmt(field.x2 - field.x1)} × ${fmt(field.y2 - field.y1)} cm`;
  if (margins.some((v) => v < 0)) {
    return { outcome: "fail", observed, feedback: rule.feedback.fail, variant: rule.variantOnClipped };
  }
  if (margins.some((v) => v > rule.maxMarginCm)) {
    return { outcome: "partial", observed, feedback: rule.feedback.high ?? rule.feedback.fail };
  }
  return { outcome: "pass", observed, feedback: rule.feedback.pass };
}

function evalRule(rule: CheckRule, s: SimulationSettings, c: RadCase): CheckResult {
  const partial =
    rule.kind === "equals" ? evalEquals(rule, s) : rule.kind === "range" ? evalRange(rule, s) : evalCoverage(rule, s, c);
  const outcome = partial.outcome ?? "fail";
  return {
    ruleId: rule.id,
    category: rule.category,
    label: rule.label,
    weight: rule.weight ?? 1,
    outcome,
    credit: outcome === "pass" ? 1 : outcome === "partial" ? PARTIAL_CREDIT : 0,
    observed: partial.observed ?? "",
    feedback: partial.feedback ?? rule.feedback.fail,
    variant: partial.variant,
  };
}

/** Pure, deterministic evaluation of a settings snapshot against a case. */
export function evaluate(c: RadCase, settings: SimulationSettings): EvaluationResult {
  const checks = c.rules.map((r) => evalRule(r, settings, c));
  const score = computeScore(checks, c.scoring);

  // Failed checks take precedence over partial ones when choosing the dominant variant.
  const ordered = [...checks.filter((k) => k.outcome === "fail"), ...checks.filter((k) => k.outcome === "partial")];
  let variants = [...new Set(ordered.flatMap((k) => (k.variant ? [k.variant] : [])))];
  // Under- and over-exposure are mutually exclusive on one image; keep the dominant (first) one.
  const exposureFault = variants.find((v) => v === "underexposed" || v === "overexposed");
  variants = variants.filter((v) => (v !== "underexposed" && v !== "overexposed") || v === exposureFault);
  return {
    checks,
    score,
    variants: variants.length ? variants : ["correct"],
    primaryVariant: variants[0] ?? "correct",
  };
}
