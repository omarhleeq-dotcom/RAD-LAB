import { CATEGORIES, type CategoryId } from "@/domain/simulation";
import type { ScoringRules } from "@/domain/case";
import type { CheckResult } from "@/features/evaluation/types";

export interface CategoryScore {
  category: CategoryId;
  /** Configured weight for the category. */
  weight: number;
  /** Points earned out of `weight`. */
  earned: number;
  /** 0–1 share of available credit earned. */
  ratio: number;
}

export interface ScoreSummary {
  /** 0–100, rounded to one decimal. */
  total: number;
  passed: boolean;
  categories: CategoryScore[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Aggregates check credits into category and total scores.
 * Categories that have no rules in the case are excluded and the remaining
 * weights are renormalised, so a case can omit a category without capping its score.
 */
export function computeScore(checks: CheckResult[], rules: ScoringRules): ScoreSummary {
  const categories: CategoryScore[] = [];
  for (const category of CATEGORIES) {
    const inCat = checks.filter((c) => c.category === category);
    if (inCat.length === 0) continue;
    const totalWeight = inCat.reduce((sum, c) => sum + c.weight, 0);
    const ratio = totalWeight === 0 ? 0 : inCat.reduce((sum, c) => sum + c.credit * c.weight, 0) / totalWeight;
    const weight = rules.categoryWeights[category];
    categories.push({ category, weight, earned: weight * ratio, ratio });
  }
  const available = categories.reduce((sum, c) => sum + c.weight, 0);
  const earned = categories.reduce((sum, c) => sum + c.earned, 0);
  const total = available === 0 ? 0 : round1((earned / available) * 100);
  return {
    total,
    passed: total >= rules.passThreshold,
    categories: categories.map((c) => ({ ...c, earned: round1(c.earned) })),
  };
}
