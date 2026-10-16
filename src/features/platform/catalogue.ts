// Catalogue presentation only. Exam definitions, routes and simulation behaviour are unchanged.
import { BODY_PARTS, type BodyPartEntry } from "@/data/modalities";
import type { AnyExamDefinition } from "@/domain/exam";

export interface ExamGroup {
  readonly bodyPart: BodyPartEntry;
  readonly exams: readonly AnyExamDefinition[];
}

/** O(regions + exams), registry order, no empty groups and no silently dropped exams. */
export function groupExamsByBodyPart(exams: readonly AnyExamDefinition[], parts: readonly BodyPartEntry[] = BODY_PARTS): ExamGroup[] {
  const groups = new Map(parts.map((bodyPart) => [bodyPart.id, { bodyPart, exams: [] as AnyExamDefinition[] }]));
  for (const exam of exams) {
    const group = groups.get(exam.bodyPart);
    if (!group) throw new Error(`Unregistered body part: ${exam.bodyPart}`);
    group.exams.push(exam);
  }
  return [...groups.values()].filter((group) => group.exams.length > 0);
}
