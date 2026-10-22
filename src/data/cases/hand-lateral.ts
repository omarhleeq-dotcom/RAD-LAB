import type { CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";
import { handLateralExam } from "../exams/xray/hand-lateral";
import { makeUpperLimbCase } from "./upper-limb-case";

/** Case "adult-demo" of the Hand Lateral (extension) exam (S14.2b, S14.2-6): see `upper-limb-case.ts`. */
export const handLateralAdultDemo: CaseDefinition = makeUpperLimbCase("hand-lateral");

/** Compatibility view (what the engine, renderer, store and UI consume): the case composed with its exam. */
export const handLateral = composeCase(handLateralExam, handLateralAdultDemo);
