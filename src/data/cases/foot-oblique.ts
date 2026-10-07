import type { CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";
import { footObliqueExam } from "../exams/xray/foot-oblique";
import { makeLowerLimbCase } from "./lower-limb-case";

/** Case "adult-demo" of the foot-oblique exam (S14.4): see `lower-limb-case.ts`. */
export const footObliqueAdultDemo: CaseDefinition = makeLowerLimbCase("foot-oblique");

/** Compatibility view (what the engine, renderer, store and UI consume): the case composed with its exam. */
export const footOblique = composeCase(footObliqueExam, footObliqueAdultDemo);
