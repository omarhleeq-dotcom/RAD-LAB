import type { AnyExamDefinition } from "@/domain/exam";
import { chestApSupineExam } from "./xray/chest-ap-supine";
import { chestLateralErectExam } from "./xray/chest-lateral-erect";
import { chestPaErectExam } from "./xray/chest-pa-erect";
import { elbowApExam } from "./xray/elbow-ap";
import { elbowLateralExam } from "./xray/elbow-lateral";
import { footApExam } from "./xray/foot-ap";
import { handLateralExam } from "./xray/hand-lateral";
import { handPaExam } from "./xray/hand-pa";
import { wristLateralExam } from "./xray/wrist-lateral";
import { wristPaExam } from "./xray/wrist-pa";

/** Registry of exam definitions. Add a new exam here (data only, if it fits the existing vocabulary). */
export const EXAMS: readonly AnyExamDefinition[] = [chestPaErectExam, chestLateralErectExam, chestApSupineExam, wristPaExam, wristLateralExam, handPaExam, handLateralExam, elbowApExam, elbowLateralExam, footApExam];

export function getExam(id: string): AnyExamDefinition | undefined {
  return EXAMS.find((e) => e.id === id);
}
