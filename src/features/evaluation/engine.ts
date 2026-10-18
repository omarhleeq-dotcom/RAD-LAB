import type {
  CenteringRule,
  CheckRule,
  CoverageRule,
  EqualsRule,
  MarkerRule,
  RadCase,
  RangeRule,
  TechniqueRule,
} from "@/domain/case";
import type { LocalizedText } from "@/domain/localized";
import { enumSetting, numericSetting, type EnumSettingKey, type SimulationSettings } from "@/domain/simulation";
import type { DetectorExposureResult } from "@/domain/technique";
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
import { isMarkerWrongSide } from "@/features/simulation/marker-rule";
import { derivePatientResponse } from "@/features/patient/response";
import { computeDetectorExposure } from "@/features/technique/model";
import { centeringOnAxis } from "./centering";
import { detectCriticalFindings } from "./critical";
import { buildResultState } from "./result-state";
import type { CheckResult, EvaluationResult } from "./types";
import { identifyEvaluation } from "./version";

const PARTIAL_CREDIT = 0.5;
const inside = (v: number, [min, max]: [number, number]) => v >= min && v <= max;
const fmt = (n: number) => String(Math.round(n * 100) / 100);

function evalEquals(rule: EqualsRule, s: SimulationSettings): Partial<CheckResult> {
  const value = enumSetting(s, rule.setting);
  const ok = value === rule.expected;
  const isChoice = rule.setting.startsWith("choices.");
  return {
    outcome: ok ? "pass" : "fail",
    observed: String(value),
    // Built-in enums are translated by the UI from their message keys; an exam-declared choice is shown as its raw id
    // (its bilingual label lives in `choiceControls`, resolved by the UI).
    observedKind: isChoice ? undefined : (rule.setting as EnumSettingKey),
    observedChoice: isChoice ? rule.setting.slice("choices.".length) : undefined,
    feedback: ok ? rule.feedback.pass : rule.feedback.fail,
    variant: ok ? undefined : rule.variantOnFail,
  };
}

function evalRange(rule: RangeRule, s: SimulationSettings): Partial<CheckResult> {
  const value = numericSetting(s, rule.setting);
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

/**
 * Marker placement + laterality. The side convention comes from case data (`positioning.markerSide`) and is the
 * same one the renderer draws with (PA display: patient left = viewer right); the rule KIND is exam data (S11-1). Unscored (weight 0) like the rest of
 * this rule; the issues found are reported together so a wrong-side marker is never hidden by another remark.
 */
function evalMarker(rule: MarkerRule, s: SimulationSettings, c: RadCase): Partial<CheckResult> {
  if (!s.sideMarker) return { outcome: "fail", observed: "—", feedback: rule.feedback.fail };
  const rect = markerRect(s.markerPosition, c.positioning.markerSizeCm, c.detector);
  const observed = s.sideMarker;
  const detectorRect = { x1: 0, y1: 0, x2: c.detector.widthCm, y2: c.detector.heightCm };
  const issues: LocalizedText[] = [];
  if (isMarkerWrongSide(c.positioning, { side: s.sideMarker, position: s.markerPosition }, s.choices)) issues.push(rule.feedback.wrongSide);
  if (!rectInside(rect, detectorRect) || !rectInside(rect, collimatedField(s, c.detector))) {
    issues.push(rule.feedback.outsideField);
  } else if ((c.positioning.markerKeepOut ?? [c.requiredAnatomy]).some((zone) => rectsOverlap(rect, regionToRect(zone)))) {
    issues.push(rule.feedback.overlap);
  }
  if (issues.length === 0) return { outcome: "pass", observed, feedback: rule.feedback.pass };
  return { outcome: "partial", observed, feedback: issues.length === 1 ? issues[0]! : joinText(issues) };
}

const fmtDI = (di: number) => `${di > 0 ? "+" : ""}${fmt(di)} DI`;
const fmtRatio = (r: number) => `×${fmt(r)}`;

/**
 * Technique subchecks. All numbers come from the case's TechniqueProfile; this function only compares the
 * deterministic exposure result to those tolerances (see TechniqueRule for the semantics of each check).
 * Returns null when the check does not apply (AEC chamber check in manual mode).
 */
function evalTechnique(
  rule: TechniqueRule,
  s: SimulationSettings,
  c: RadCase,
  x: DetectorExposureResult,
): Partial<CheckResult> | null {
  const p = c.technique;
  const { ideal, acceptable } = p.deviation;
  const eps = 1e-9;
  switch (rule.check) {
    case "kvp-band": {
      const observed = `${fmt(s.kvp)} kVp`;
      if (inside(s.kvp, p.kvp.targetBand)) return { outcome: "pass", observed, feedback: rule.feedback.pass };
      const direction = s.kvp < p.kvp.targetBand[0] ? "low" : "high";
      const feedback = rule.feedback[direction] ?? rule.feedback.fail;
      const outcome = inside(s.kvp, p.kvp.referenceRange) ? "partial" : "fail";
      const variant = direction === "low" && outcome === "fail" ? rule.variantOnLow : rule.variantOnHigh;
      return { outcome, observed, feedback, variant: outcome === "fail" ? variant : undefined };
    }
    case "exposure-adequacy": {
      const observed = `${fmtDI(x.deviationIndex)} · ${fmtRatio(x.exposureRatio)}`;
      const di = x.deviationIndex;
      if (di >= ideal[0] - eps) {
        // Adequate signal. Above-target exposure is still adequate here; dose-optimization handles that.
        return { outcome: "pass", observed, feedback: di > ideal[1] + eps ? (rule.feedback.high ?? rule.feedback.pass) : rule.feedback.pass };
      }
      return {
        outcome: di >= acceptable[0] - eps ? "partial" : "fail",
        observed,
        feedback: rule.feedback.low ?? rule.feedback.fail,
        variant: rule.variantOnLow,
      };
    }
    case "dose-optimization": {
      const observed = `${fmtDI(x.deviationIndex)} · ${fmtRatio(x.exposureRatio)}`;
      const di = x.deviationIndex;
      if (di <= ideal[1] + eps) {
        // Within or below the target band: nothing to optimise on the dose side (low exposure is the adequacy check's concern).
        return { outcome: "pass", observed, feedback: rule.feedback.pass };
      }
      return {
        outcome: di <= acceptable[1] + eps ? "partial" : "fail",
        observed,
        feedback: rule.feedback.high ?? rule.feedback.fail,
        variant: rule.variantOnHigh,
      };
    }
    case "aec-chambers": {
      if (s.exposureMode !== "aec" || !x.aec) return null;
      const observed = s.aecChambers.length ? s.aecChambers.join(" + ") : "—";
      if (!x.aec.terminatedOnChambers) return { outcome: "fail", observed, feedback: rule.feedback.fail };
      const r = x.aec.chamberRelativeExposure as number;
      const di = Math.abs(10 * Math.log10(r));
      if (di <= ideal[1] + eps) return { outcome: "pass", observed, feedback: rule.feedback.pass };
      const feedback = (r > 1 ? rule.feedback.high : rule.feedback.low) ?? rule.feedback.fail;
      return { outcome: di <= acceptable[1] + eps ? "partial" : "fail", observed, feedback };
    }
  }
}

function evalKind(
  rule: CheckRule,
  s: SimulationSettings,
  c: RadCase,
  x: DetectorExposureResult,
): Partial<CheckResult> | null {
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
    case "technique":
      return evalTechnique(rule, s, c, x);
  }
}

function evalRule(rule: CheckRule, s: SimulationSettings, c: RadCase, x: DetectorExposureResult): CheckResult | null {
  const partial = evalKind(rule, s, c, x);
  if (!partial) return null;
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
    observedKind: partial.observedKind,
    ...(partial.observedChoice ? { observedChoice: partial.observedChoice } : {}),
    feedback: partial.feedback ?? rule.feedback.fail,
    variant: partial.variant,
    evidence: rule.evidence,
  };
}

/** Pure, deterministic evaluation of a settings snapshot against a case. */
export function evaluate(c: RadCase, settings: SimulationSettings): EvaluationResult {
  const exposure = computeDetectorExposure(c.technique, settings, c.detector);
  const checks = c.rules.flatMap((r) => evalRule(r, settings, c, exposure) ?? []);
  const patientResponse = derivePatientResponse(c.patientCooperation, settings);
  const baseScore = computeScore(checks, c.scoring);
  // Critical findings gate the pass mark only: total, credits and category weights are untouched.
  const criticalFindings = detectCriticalFindings(c, settings, patientResponse);
  const score = { ...baseScore, passed: baseScore.thresholdMet && criticalFindings.length === 0 };

  // Failed checks take precedence over partial ones when choosing the dominant variant.
  const ordered = [...checks.filter((k) => k.outcome === "fail"), ...checks.filter((k) => k.outcome === "partial")];
  let variants = [...new Set(ordered.flatMap((k) => (k.variant ? [k.variant] : [])))];
  // Low and excess detector exposure are mutually exclusive on one image; keep the dominant (first) one.
  const isExposureFault = (v: string) => v === "low-exposure" || v === "excess-exposure";
  const exposureFault = variants.find(isExposureFault);
  variants = variants.filter((v) => !isExposureFault(v) || v === exposureFault);
  const finalVariants = variants.length ? variants : (["correct"] as const);
  return identifyEvaluation({
    checks,
    score,
    variants: [...finalVariants],
    primaryVariant: variants[0] ?? "correct",
    criticalFindings,
    exposure,
    resultState: buildResultState(c, settings, exposure, patientResponse, checks, [...finalVariants]),
  });
}
