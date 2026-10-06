import type { LocalizedText } from "@/domain/localized";
import type { CategoryId, ImageVariantId } from "@/domain/simulation";
import type { ScoreSummary } from "@/features/scoring/score";

export type CheckOutcome = "pass" | "partial" | "fail";

export interface CheckResult {
  ruleId: string;
  category: CategoryId;
  label: LocalizedText;
  outcome: CheckOutcome;
  /** 0, 0.5 or 1. */
  credit: number;
  weight: number;
  /** What the student set, formatted for display (e.g. "8 °"). */
  observed: string;
  /** Set when `observed` is an enum id that the UI should translate. */
  observedKind?: "projection" | "breathing";
  feedback: LocalizedText;
  variant?: ImageVariantId;
}

export interface EvaluationResult {
  checks: CheckResult[];
  score: ScoreSummary;
  /** Image variants implied by non-passing checks; `["correct"]` when everything passes. */
  variants: ImageVariantId[];
  primaryVariant: ImageVariantId;
}
