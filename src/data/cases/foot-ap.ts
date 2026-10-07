import type { CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";
import { footApExam } from "../exams/xray/foot-ap";
import { makeLowerLimbCase } from "./lower-limb-case";

/** Case "adult-demo" of the foot-ap exam (S14.4): see `lower-limb-case.ts`. */
export const footApAdultDemo: CaseDefinition = makeLowerLimbCase("foot-ap");

/** Compatibility view (what the engine, renderer, store and UI consume): the case composed with its exam. */
export const footAp = composeCase(footApExam, footApAdultDemo);
