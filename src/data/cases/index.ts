import type { RadCase } from "@/domain/case";
import type { CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";
import { getExam } from "../exams";
import { chestApAdultDemo } from "./chest-ap-supine";
import { chestLateralAdultDemo } from "./chest-lateral-erect";
import { chestPaAdultDemo } from "./chest-pa-erect";
import { elbowApAdultDemo } from "./elbow-ap";
import { elbowLateralAdultDemo } from "./elbow-lateral";
import { footApAdultDemo } from "./foot-ap";
import { handLateralAdultDemo } from "./hand-lateral";
import { handPaAdultDemo } from "./hand-pa";
import { wristLateralAdultDemo } from "./wrist-lateral";
import { wristPaAdultDemo } from "./wrist-pa";

/** Registry of case definitions (patient scenarios). Each belongs to an exam in `src/data/exams`. */
export const CASE_DEFINITIONS: readonly CaseDefinition[] = [chestPaAdultDemo, chestLateralAdultDemo, chestApAdultDemo, wristPaAdultDemo, wristLateralAdultDemo, handPaAdultDemo, handLateralAdultDemo, elbowApAdultDemo, elbowLateralAdultDemo, footApAdultDemo];

/**
 * The compatibility view the engine, store and UI consume: every case composed with its exam (`composeCase`
 * memoises, so `CASES[0] === chestPaErect`). The default case of an exam keeps the exam id as its public id.
 */
export const CASES: readonly RadCase[] = CASE_DEFINITIONS.map((def) => {
  const exam = getExam(def.examId);
  if (!exam) throw new Error(`case "${def.id}" refers to unknown exam "${def.examId}"`);
  return composeCase(exam, def);
});

export function getCase(id: string): RadCase | undefined {
  return CASES.find((c) => c.id === id);
}
