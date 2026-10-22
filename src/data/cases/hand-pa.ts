import type { CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";
import { handPaExam } from "../exams/xray/hand-pa";
import { makeUpperLimbCase } from "./upper-limb-case";

/** Case "adult-demo" of the Hand PA exam (S14.2b): see `upper-limb-case.ts`. */
export const handPaAdultDemo: CaseDefinition = makeUpperLimbCase("hand-pa");

/** Compatibility view (what the engine, renderer, store and UI consume): the case composed with its exam. */
export const handPa = composeCase(handPaExam, handPaAdultDemo);
