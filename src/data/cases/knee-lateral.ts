import type { CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";
import { kneeLateralExam } from "../exams/xray/knee-lateral";
import { makeLowerLimbCase } from "./lower-limb-case";

/** Case "adult-demo" of the knee-lateral exam (S14.4): see `lower-limb-case.ts`. */
export const kneeLateralAdultDemo: CaseDefinition = makeLowerLimbCase("knee-lateral");

/** Compatibility view (what the engine, renderer, store and UI consume): the case composed with its exam. */
export const kneeLateral = composeCase(kneeLateralExam, kneeLateralAdultDemo);
