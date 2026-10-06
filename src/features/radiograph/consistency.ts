/**
 * Session 5: the single registry that says which image effect shows which scored finding.
 *
 * The score, the feedback text and the picture must describe the SAME findings. A scored finding is either
 *  - "drawn": the radiograph shows the matching effect, or
 *  - "not drawn": it is scored from the settings and deliberately has no visible effect in this image
 *    (e.g. SID, a kVp inside the reference range, excess exposure — dose creep is invisible by design).
 * The UI labels the second kind so a learner never looks for an effect that is not there, and the scenario-matrix
 * tests use the same registry to prove that nothing is drawn without a finding and no drawable finding is missing.
 *
 * Pure data + pure functions: no scoring, no pixels, no React.
 */
import type { ExamDefinition } from "@/domain/exam";
import type { CoreImageVariantId, ImageVariantId } from "@/domain/simulation";
import type { EffectId, RenderPlan } from "./plan";

/** Effects that exist only because a scored finding is not passed (never drawn for a clean attempt). */
export const FINDING_EFFECTS: readonly EffectId[] = [
  "rotation",
  "collimation-clipping",
  "excess-field",
  "centering",
  "scapulae",
  "chin",
  "inspiration",
  "motion",
  "low-exposure",
  "excess-exposure",
  "low-penetration",
  "projection",
];

/**
 * Non-passing check → the effect(s) that show it. An empty list means "scored, but nothing is drawn by design".
 * Keyed by rule id; `partialEmpty` lists rules whose PARTIAL outcome has no effect while a FAIL has one.
 */
export const RULE_EFFECTS: Record<string, { effects: EffectId[]; partialDrawn?: boolean; silent?: boolean }> = {
  projection: { effects: ["projection"] },
  "collimation-clipping": { effects: ["collimation-clipping"] },
  "collimation-excess": { effects: ["excess-field"] },
  chin: { effects: ["chin"] },
  shoulders: { effects: ["scapulae"] },
  // "No marker placed" has nothing to draw; the check text already says so, so no "not drawn" label is added.
  "side-marker": { effects: ["marker"], silent: true },
  rotation: { effects: ["rotation"] },
  "centering-lateral": { effects: ["centering"] },
  "centering-vertical": { effects: ["centering"] },
  // Only a clearly low kVp (below the reference range → FAIL) lowers visibility; a partial kVp draws nothing.
  kvp: { effects: ["low-penetration"], partialDrawn: false },
  "exposure-adequacy": { effects: ["low-exposure"] },
  // Excess detector exposure is invisible on DR by design (dose creep): shown by DI / dose-awareness only.
  "dose-optimization": { effects: ["excess-exposure"] },
  "aec-chambers": { effects: [] },
  // SID: geometry (magnification / unsharpness) is not drawn in this version.
  sid: { effects: [] },
  breathing: { effects: ["inspiration"] },
  "motion-instruction": { effects: ["motion"] },
};

/** Image-quality variant → the effect that shows it (empty = not drawn by design). */
export const VARIANT_EFFECTS: Record<CoreImageVariantId, EffectId[]> = {
  correct: [],
  rotated: ["rotation"],
  "wrong-projection": ["projection"],
  clipped: ["collimation-clipping"],
  "poor-inspiration": ["inspiration"],
  "magnified-geometry": [],
  "chin-overlap": ["chin"],
  "scapulae-overlap": ["scapulae"],
  "low-exposure": ["low-exposure"],
  "excess-exposure": ["excess-exposure"],
  "low-penetration": ["low-penetration"],
  motion: ["motion"],
};

/** Effects that show a variant; a variant nobody registered has none (reported "not drawn"), never a crash (S11). */
export const effectsOfVariant = (variant: ImageVariantId): EffectId[] =>
  (VARIANT_EFFECTS as Record<string, EffectId[] | undefined>)[variant] ?? [];

/** Effects that are explained to the learner but change nothing in the picture by design (dose creep is invisible). */
export const INVISIBLE_EFFECTS: readonly EffectId[] = ["excess-exposure"];

const present = (plan: RenderPlan, id: EffectId) => plan.effects.some((e) => e.id === id) && !INVISIBLE_EFFECTS.includes(id);

/** True when the picture shows this non-passing check (every mapped effect is in the plan). */
export function checkIsDrawn(ruleId: string, outcome: "pass" | "partial" | "fail", plan: RenderPlan): boolean {
  if (outcome === "pass") return false;
  const entry = RULE_EFFECTS[ruleId];
  if (!entry || entry.effects.length === 0) return false;
  if (outcome === "partial" && entry.partialDrawn === false) return false;
  return entry.effects.every((id) => present(plan, id));
}

/** True when the picture shows this image-quality variant. */
export function variantIsDrawn(variant: ImageVariantId, plan: RenderPlan): boolean {
  const effects = effectsOfVariant(variant);
  return effects.length > 0 && effects.every((id) => present(plan, id));
}

/** True when the learner should be told that this scored finding has no visible effect in the picture. */
export function needsNotDrawnLabel(ruleId: string, outcome: "pass" | "partial" | "fail", plan: RenderPlan): boolean {
  return outcome !== "pass" && !RULE_EFFECTS[ruleId]?.silent && !checkIsDrawn(ruleId, outcome, plan);
}

/**
 * Image variants an exam names (rule `variantOn*`, possible errors) that have no entry in `VARIANT_EFFECTS` — i.e. that
 * the renderer cannot say anything about. Empty for a well-formed exam (S11: checked by test, kept out of
 * `validateExam` because logic modules must not depend on the renderer, see the architecture test).
 */
export function unregisteredVariants(exam: Pick<ExamDefinition, "rules" | "possibleErrors">): string[] {
  const named = new Set<string>(exam.possibleErrors.map((e) => e.variant));
  for (const r of exam.rules) {
    for (const k of ["variantOnFail", "variantOnLow", "variantOnHigh", "variantOnClipped"] as const) {
      const v = (r as unknown as Record<string, unknown>)[k];
      if (typeof v === "string") named.add(v);
    }
  }
  return [...named].filter((v) => !(v in VARIANT_EFFECTS));
}
