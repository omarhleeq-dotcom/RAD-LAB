import type { EvaluationResult } from "./types";
import type { RadCase } from "@/domain/case";
import { comparisonVersion } from "./comparison-version";

/**
 * Semantic identity of the Practice evaluation contract, NOT the app release/date.
 * Advance /1 whenever engine/scoring or a dependency changes saved outcomes,
 * credits, totals, pass/critical gates or category meanings. Keep it for UI/copy-only
 * changes. Case rules/data are additionally separated by the independent comparison identity;
 * historical records without it retain definition_version separation.
 * Maintenance is reviewed manually; tests do not detect every semantic change.
 * See docs/PILOT_SUPABASE_SETUP.md#practice-evaluation-version.
 */
export const PRACTICE_EVALUATION_VERSION = "radlab-practice-evaluation/1";

// Capture provenance at evaluation time, without changing result/score JSON bytes.
// Weak keys retain no history; clones/deserialised/unidentified results fail closed.
const versions = new WeakMap<EvaluationResult, string>();
const comparisons = new WeakMap<EvaluationResult, Promise<string | null>>();
const readyComparisons = new WeakMap<EvaluationResult, string>();
export function identifyEvaluation(result: EvaluationResult, c: RadCase): EvaluationResult {
  versions.set(result, PRACTICE_EVALUATION_VERSION);
  // Projection is captured synchronously before hashing yields; never recomputed
  // from a later case/locale or inferred from a deserialised result.
  comparisons.set(result, comparisonVersion(c, PRACTICE_EVALUATION_VERSION).then((value) => {
    if (value) readyComparisons.set(result, value);
    return value;
  }).catch(() => null));
  return result;
}
export async function evaluationComparison(result: EvaluationResult): Promise<string | null> {
  return comparisons.get(result) ?? null;
}
export function evaluationVersion(result: EvaluationResult): string {
  return versions.get(result) ?? "unknown";
}

/** Synchronous writers fail closed until the captured identity has resolved. */
export function readyEvaluationComparison(result: EvaluationResult): string | null {
  return readyComparisons.get(result) ?? null;
}
