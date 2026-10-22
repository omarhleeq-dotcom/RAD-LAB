import type { CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";
import { wristLateralExam } from "../exams/xray/wrist-lateral";
import { makeUpperLimbCase } from "./upper-limb-case";

/** Case "adult-demo" of the Wrist Lateral exam (S14.1c): see `upper-limb-case.ts`. */
export const wristLateralAdultDemo: CaseDefinition = makeUpperLimbCase("wrist-lateral");

/** Compatibility view (what the engine, renderer, store and UI consume): the case composed with its exam. */
export const wristLateral = composeCase(wristLateralExam, wristLateralAdultDemo);
