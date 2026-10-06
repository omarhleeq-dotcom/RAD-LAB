import type {
  CenteringRule,
  CheckRule,
  CoverageRule,
  EqualsRule,
  MarkerRule,
  RadCase,
  RangeRule,
} from "@/domain/case";
import type { LocalizedText } from "@/domain/localized";
import type { SimulationSettings } from "@/domain/simulation";
import { computeScore } from "@/features/scoring/score";
import {
  clippedSides,
  collimatedField,
  coverageMargins,
  markerRect,
  rectInside,
  rectsOverlap,
  regionToRect,
} from "@/features/simulation/geometry";
import { centeringOnAxis } from "./centering";
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

const joinText = (parts: LocalizedText[]): LocalizedText => ({
  en: parts.map((p) => p.en).join(" "),
  ar: parts.map((p) => p.ar).join(" "),
});

function evalCoverage(rule: CoverageRule, s: SimulationSettings, c: RadCase): Partial<CheckResult> {
  const field = collimatedField(s, c.detector);
  const margins = coverageMargins(field, regionToRect(c.requiredAnatomy));
  const observed = `${fmt(field.x2 - field.x1)} × ${fmt(field.y2 - field.y1)} cm`;
  if (rule.check === "clipping") {
    const sides = clippedSides(margins);
    if (sides.length === 0) return { outcome: "pass", observed, feedback: rule.feedback.pass };
    const detail = sides.flatMap((side) => (rule.clippedSides?.[side] ? [rule.clippedSides[side]] : []));
    return {
      outcome: "fail",
      observed,
      feedback: joinText([...detail, rule.feedback.fail]),
      variant: rule.variantOnClipped,
    };
  }
  const excessive = Object.values(margins).some((v) => v > rule.maxMarginCm);
  return excessive
    ? { outcome: "partial", observed, feedback: rule.feedback.high ?? rule.feedback.fail }
    : { outcome: "pass", observed, feedback: rule.feedback.pass };
}

function evalCentering(rule: CenteringRule, s: SimulationSettings, c: RadCase): Partial<CheckResult> {
  const r = centeringOnAxis(s.centralRay, c.positioning.centering, rule.axis);
  const { widthCm, heightCm } = c.detector;
  // Display the offset in cm so it is meaningful to the student; scoring uses the normalized value.
  const cm = r.offset * ((rule.axis === "x" ? widthCm : heightCm) / 2);
  const observed = `${cm > 0 ? "+" : ""}${fmt(cm)} cm`;
  if (r.state === "ideal") return { outcome: "pass", observed, feedback: rule.feedback.pass };
  const feedback = (r.direction && rule.feedback[r.direction]) || rule.feedback.fail;
  return { outcome: r.state === "acceptable" ? "partial" : "fail", observed, feedback };
}

function evalMarker(rule: MarkerRule, s: SimulationSettings, c: RadCase): Partial<CheckResult> {
  if (!s.sideMarker) return { outcome: "fail", observed: "—", feedback: rule.feedback.fail };
  const rect = markerRect(s.markerPosition, c.positioning.markerSizeCm, c.detector);
  const observed = s.sideMarker;
  const detectorRect = { x1: 0, y1: 0, x2: c.detector.widthCm, y2: c.detector.heightCm };
  if (!rectInside(rect, detectorRect) || !rectInside(rect, collimatedField(s, c.detector))) {
    return { outcome: "partial", observed, feedback: rule.feedback.outsideField };
  }
  if (rectsOverlap(rect, regionToRect(c.requiredAnatomy))) {
    return { outcome: "partial", observed, feedback: rule.feedback.overlap };
  }
  return { outcome: "pass", observed, feedback: rule.feedback.pass };
}

function evalKind(rule: CheckRule, s: SimulationSettings, c: RadCase): Partial<CheckResult> {
  switch (rule.kind) {
    case "equals":
      return evalEquals(rule, s);
    case "range":
      return evalRange(rule, s);
    case "coverage":
      return evalCoverage(rule, s, c);
    case "centering":
      return evalCentering(rule, s, c);
    case "marker":
      return evalMarker(rule, s, c);
  }
}

function evalRule(rule: CheckRule, s: SimulationSettings, c: RadCase): CheckResult {
  const partial = evalKind(rule, s, c);
  const outcome = partial.outcome ?? "fail";
  return {
    ruleId: rule.id,
    category: rule.category,
    label: rule.label,
    weight: rule.weight ?? 1,
    scored: (rule.weight ?? 1) > 0,
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
