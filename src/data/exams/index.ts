import type { AnyExamDefinition } from "@/domain/exam";
import { chestApSupineExam } from "./xray/chest-ap-supine";
import { chestLateralErectExam } from "./xray/chest-lateral-erect";
import { chestPaErectExam } from "./xray/chest-pa-erect";
import { wristLateralExam } from "./xray/wrist-lateral";
import { wristPaExam } from "./xray/wrist-pa";

/** Registry of exam definitions. Add a new exam here (data only, if it fits the existing vocabulary). */
export const EXAMS: readonly AnyExamDefinition[] = [chestPaErectExam, chestLateralErectExam, chestApSupineExam, wristPaExam, wristLateralExam];

export function getExam(id: string): AnyExamDefinition | undefined {
  return EXAMS.find((e) => e.id === id);
}
