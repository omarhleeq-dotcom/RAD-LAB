import type { EvaluationResult } from "./types";

/**
 * Semantic identity of the Practice evaluation contract, NOT the app release/date.
 * Advance /1 whenever engine/scoring or a dependency changes saved outcomes,
 * credits, totals, pass/critical gates or category meanings. Keep it for UI/copy-only
 * changes. Case rules/data are additionally separated by definition_version.
 * Maintenance is reviewed manually; tests do not detect every semantic change.
 * See docs/PILOT_SUPABASE_SETUP.md#practice-evaluation-version.
 */
export const PRACTICE_EVALUATION_VERSION = "radlab-practice-evaluation/1";

// Capture provenance at evaluation time, without changing result/score JSON bytes.
// Weak keys retain no history; clones/deserialised/unidentified results fail closed.
const versions = new WeakMap<EvaluationResult, string>();
export function identifyEvaluation(result: EvaluationResult): EvaluationResult {
  versions.set(result, PRACTICE_EVALUATION_VERSION);
  return result;
}
export function evaluationVersion(result: EvaluationResult): string {
  return versions.get(result) ?? "unknown";
}
