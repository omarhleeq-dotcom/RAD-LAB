import type { CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";
import { wristPaExam } from "../exams/xray/wrist-pa";
import { makeUpperLimbCase } from "./upper-limb-case";

/** Case "adult-demo" of the Wrist PA exam (S14.1c): see `upper-limb-case.ts`. */
export const wristPaAdultDemo: CaseDefinition = makeUpperLimbCase("wrist-pa");

/** Compatibility view (what the engine, renderer, store and UI consume): the case composed with its exam. */
export const wristPa = composeCase(wristPaExam, wristPaAdultDemo);
