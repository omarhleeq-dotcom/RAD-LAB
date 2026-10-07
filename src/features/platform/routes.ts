/** Locale-less public paths (the next-intl `Link` adds `/{locale}`). One place for the URL scheme of ADR-0011. */
import type { AnyExamDefinition, CaseDefinition } from "@/domain/exam";

export const modalityPath = (modality: string) => `/${modality}`;
export const examPath = (modality: string, exam: string) => `/${modality}/${exam}`;
/** The exam's default case has no `?case=` (static HTML); any other case is `?case=<case id>`. */
export const practicePath = (modality: string, exam: AnyExamDefinition, def?: CaseDefinition) =>
  `/${modality}/${exam.id}/practice${def && def.id !== exam.defaultCaseId ? `?case=${encodeURIComponent(def.id)}` : ""}`;
