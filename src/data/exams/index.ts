import type { ExamDefinition } from "@/domain/exam";
import { chestApSupineExam } from "./xray/chest-ap-supine";
import { chestLateralErectExam } from "./xray/chest-lateral-erect";
import { chestPaErectExam } from "./xray/chest-pa-erect";

/** Registry of exam definitions. Add a new exam here (data only, if it fits the existing vocabulary). */
export const EXAMS: readonly ExamDefinition[] = [chestPaErectExam, chestLateralErectExam, chestApSupineExam];

export function getExam(id: string): ExamDefinition | undefined {
  return EXAMS.find((e) => e.id === id);
}
