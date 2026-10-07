import type { CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";
import { kneeApExam } from "../exams/xray/knee-ap";
import { makeLowerLimbCase } from "./lower-limb-case";

/** Case "adult-demo" of the knee-ap exam (S14.4): see `lower-limb-case.ts`. */
export const kneeApAdultDemo: CaseDefinition = makeLowerLimbCase("knee-ap");

/** Compatibility view (what the engine, renderer, store and UI consume): the case composed with its exam. */
export const kneeAp = composeCase(kneeApExam, kneeApAdultDemo);
