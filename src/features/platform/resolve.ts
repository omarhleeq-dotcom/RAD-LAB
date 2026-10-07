/**
 * Pure URL → registry resolution (ADR-0011). Unknown modality / exam / mode / case → `undefined`; callers show the
 * bilingual not-found page. Nothing here knows about medical content or React.
 */
import { CASE_DEFINITIONS } from "@/data/cases";
import { EXAMS } from "@/data/exams";
import { MODALITIES, MODES, type ModalityEntry, type ModeEntry } from "@/data/modalities";
import type { RadCase } from "@/domain/case";
import type { AnyExamDefinition, CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";

/** Only `available` modalities have routes. */
export const findModality = (id: string): ModalityEntry | undefined => MODALITIES.find((m) => m.id === id && m.status === "available");

export const examsOf = (m: ModalityEntry): AnyExamDefinition[] => (m.examModality ? EXAMS.filter((e) => e.modality === m.examModality) : []);

export const findExam = (modalityId: string, examId: string): AnyExamDefinition | undefined => {
  const m = findModality(modalityId);
  return m && examsOf(m).find((e) => e.id === examId);
};

export const findMode = (id: string): ModeEntry | undefined => MODES.find((m) => m.id === id && m.status === "available");

export const casesOf = (exam: AnyExamDefinition): CaseDefinition[] => CASE_DEFINITIONS.filter((c) => c.examId === exam.id);

/** `?case=` value → case definition. No value = the exam's default case. */
export const findCase = (exam: AnyExamDefinition, param: string | null | undefined): CaseDefinition | undefined =>
  casesOf(exam).find((c) => c.id === (param || exam.defaultCaseId));

/** The `RadCase` compatibility view the store/UI consume (public id: exam id for the default case). */
export const resolveRadCase = (exam: AnyExamDefinition, param: string | null | undefined): RadCase | undefined => {
  const def = findCase(exam, param);
  return def && composeCase(exam, def);
};

/** Every (modality, exam) pair that has pages: drives `generateStaticParams`. */
export const allExamRoutes = () =>
  MODALITIES.flatMap((m) => (m.status === "available" ? examsOf(m).map((e) => ({ modality: m.id, exam: e.id })) : []));
