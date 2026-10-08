import type { CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";
import { ankleApExam } from "../exams/xray/ankle-ap";
import { makeLowerLimbCase } from "./lower-limb-case";

/** Case "adult-demo" of the ankle-ap exam (S14.5): see `lower-limb-case.ts`. */
export const ankleApAdultDemo: CaseDefinition = makeLowerLimbCase("ankle-ap");

/** Compatibility view (what the engine, renderer, store and UI consume): the case composed with its exam. */
export const ankleAp = composeCase(ankleApExam, ankleApAdultDemo);
