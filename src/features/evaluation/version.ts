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
 *
 * Version history (newest first; each entry names the rule that changed saved outcomes):
 *  - /6: RAD-068 part 3 batch 6 (S5 follow-up). Chest exams: a missing "stay still" instruction costs the engine's partial credit (half) inside
 *    the breathing / instruction category, an instruction to move costs all of it; the motion gate is unchanged.
 *  - /5: RAD-068 part 3 batch 5 (S6). The limb exams gain the wrong-projection and visible-motion critical findings; pelvis and
 *    shoulder gain visible motion. Lost required anatomy was assessed and not added.
 *  - /4: RAD-068 part 3 batch 4 (S2). Coverage and margins: a cut that takes only an anatomy-free strip no longer fails clipping, and
 *    the field opening that the ray position or the placed marker forces is not excess (the allowance is the extra actually needed, never added on top of the maximum margin: a fully open field stays excess). Chest PA first (4a), then the limbs (4b).
 *  - /3: RAD-068 part 3 batch 3 (S5). A missing "stay still" instruction no longer creates the critical patient-motion gate by itself;
 *    the instruction stays its own check and the assumed motion is still drawn.
 *  - /2: RAD-068 part 3 batch 2 (S3 option D). Chest Lateral: the marker letter's display half no longer fails or gates; only a
 *    letter that differs from the side against the detector is a wrong marker.
 *  - /1: first declared identity of the evaluation contract.
 */
export const PRACTICE_EVALUATION_VERSION = "radlab-practice-evaluation/6";

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
