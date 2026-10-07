import type { ChoiceControlSpec } from "@/domain/case";
import type { LocalizedText } from "@/domain/localized";
import type { ProjectionId } from "@/domain/simulation";

/**
 * The exam-declared label of a projection for the current choice values (S13-6: "AP supine" / "AP semi-erect"), or
 * undefined when no choice control relabels it (every other exam: the generic projection label applies). Pure, no React.
 */
export function projectionLabelOf(
  controls: readonly ChoiceControlSpec[] | undefined,
  choices: Record<string, string> | undefined,
  projection: ProjectionId,
): LocalizedText | undefined {
  for (const cc of controls ?? []) {
    const pl = cc.projectionLabels;
    const value = choices?.[cc.id];
    if (pl && pl.projection === projection && value !== undefined && pl.byOption[value]) return pl.byOption[value];
  }
  return undefined;
}
