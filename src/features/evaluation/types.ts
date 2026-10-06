import type { RuleEvidence } from "@/domain/case";
import type { LocalizedText } from "@/domain/localized";
import type { RadiographResultState } from "@/domain/result-state";
import type { DetectorExposureResult } from "@/domain/technique";
import type { CategoryId, EnumSettingKey, ImageVariantId } from "@/domain/simulation";
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
  /** False for educational-only checks (weight 0) that never affect the score. */
  scored: boolean;
  /** What the student set, formatted for display (e.g. "8 °"). */
  observed: string;
  /** Set when `observed` is an enum id that the UI should translate. */
  observedKind?: EnumSettingKey;
  feedback: LocalizedText;
  variant?: ImageVariantId;
  /** Evidence class + reference of the rule that produced this check (shown to the learner). */
  evidence: RuleEvidence;
}

export interface EvaluationResult {
  checks: CheckResult[];
  score: ScoreSummary;
  /** Image variants implied by non-passing checks; `["correct"]` when everything passes. */
  variants: ImageVariantId[];
  primaryVariant: ImageVariantId;
  /** Deterministic educational detector-exposure result (DI-like, noise, penetration, dose awareness). */
  exposure: DetectorExposureResult;
  /** Renderer-facing state for the future image renderer (Session 4). Never derived from pixels. */
  resultState: RadiographResultState;
}
