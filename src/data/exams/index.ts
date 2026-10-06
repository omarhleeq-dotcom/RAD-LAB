import type { ExamDefinition } from "@/domain/exam";
import { chestPaErectExam } from "./xray/chest-pa-erect";

/** Registry of exam definitions. Add a new exam here (data only, if it fits the existing vocabulary). */
export const EXAMS: readonly ExamDefinition[] = [chestPaErectExam];

export function getExam(id: string): ExamDefinition | undefined {
  return EXAMS.find((e) => e.id === id);
}
