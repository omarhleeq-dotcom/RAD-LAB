import type { CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";
import { ankleLateralExam } from "../exams/xray/ankle-lateral";
import { makeLowerLimbCase } from "./lower-limb-case";

/** Case "adult-demo" of the ankle-lateral exam (S14.5): see `lower-limb-case.ts`. */
export const ankleLateralAdultDemo: CaseDefinition = makeLowerLimbCase("ankle-lateral");

/** Compatibility view (what the engine, renderer, store and UI consume): the case composed with its exam. */
export const ankleLateral = composeCase(ankleLateralExam, ankleLateralAdultDemo);
