// Presentation only. Never feeds evaluation, saved results, render plans or pixels.
import type { CheckRule, RadCase } from "@/domain/case";
import { effectsOfVariant, RULE_EFFECTS } from "@/features/radiograph/consistency";
import type { RenderPlan } from "@/features/radiograph/plan";
import type { CheckResult, CriticalFinding, EvaluationResult } from "./types";

// Critical mechanisms, not exams. New critical detectors must declare their presentation link too.
export const CRITICAL_RULE_LINKS: Record<string, (r: CheckRule) => boolean> = {
  "wrong-projection": (r) => r.kind === "equals" && r.setting === "projection",
  "patient-motion": (r) => r.kind === "equals" && r.setting === "motionInstruction",
  "missing-marker": (r) => r.kind === "marker",
  "wrong-side-marker": (r) => r.kind === "marker",
  "arms-over-lungs": (r) => r.kind === "equals" && r.setting === "choices.arms",
};

export function criticalForCheck(check: CheckResult, c: RadCase, findings: readonly CriticalFinding[]) {
  const rule = c.rules.find((r) => r.id === check.ruleId);
  return rule ? findings.filter((f) => CRITICAL_RULE_LINKS[f.id]?.(rule)) : [];
}

/** Lost points in the category-weighted rubric, before rounding. Caps lose their share of the category ceiling.
 * This is a display priority, not a simulation of rescoring one corrected answer (two errors can share a cap).
 */
export function pointsLost(check: CheckResult, checks: readonly CheckResult[], c: RadCase): number {
  if (!check.scored) return 0;
  const categoryWeight = c.scoring.categoryWeights[check.category] ?? 0;
  const weight = checks.filter((x) => x.category === check.category && !x.capsCategory).reduce((n, x) => n + x.weight, 0);
  return categoryWeight * (1 - check.credit) * (check.capsCategory ? 1 : weight === 0 ? 0 : check.weight / weight);
}

/** Stable ties retain the rule declaration order; input arrays are never mutated. */
export function orderFixes(c: RadCase, result: EvaluationResult): CheckResult[] {
  return result.checks.filter((x) => x.outcome !== "pass").sort((a, b) =>
    Number(criticalForCheck(b, c, result.criticalFindings).length > 0) - Number(criticalForCheck(a, c, result.criticalFindings).length > 0)
    || pointsLost(b, result.checks, c) - pointsLost(a, result.checks, c));
}

/** Only explicit ideal/expected rule values. No inferred clinical target for coverage, marker or centering. */
export function ruleTarget(rule: CheckRule | undefined): string | undefined {
  if (rule?.kind === "equals") return rule.expected;
  if (rule?.kind === "range") return `${rule.ideal[0]}–${rule.ideal[1]} ${rule.unit}`;
  return undefined;
}

/** Partition all existing notes/effects exactly once. Variant link first, existing rule-effect registry second.
 * Unmatched effects/notes remain reachable in image information, including baseline and invisible effects.
 */
export function resultContent(c: RadCase, result: EvaluationResult, plan: RenderPlan) {
  const fixes = orderFixes(c, result);
  const effectOwner = (id: string) => fixes.find((k) =>
    (k.variant ? effectsOfVariant(k.variant) : []).includes(id) || RULE_EFFECTS[k.ruleId]?.effects.includes(id));
  const variantOwner = (id: string) => fixes.find((k) => k.variant === id);
  return {
    fixes,
    correct: result.checks.filter((k) => k.outcome === "pass"),
    effects: (ruleId?: string) => plan.effects.filter((e) => effectOwner(e.id)?.ruleId === ruleId),
    variants: (ruleId?: string) => result.variants.filter((v) => variantOwner(v)?.ruleId === ruleId),
  };
}
