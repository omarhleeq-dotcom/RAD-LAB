import type { CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";
import { elbowApExam } from "../exams/xray/elbow-ap";
import { makeUpperLimbCase } from "./upper-limb-case";

/** Case "adult-demo" of the Elbow AP exam (S14.3): see `upper-limb-case.ts`. */
export const elbowApAdultDemo: CaseDefinition = makeUpperLimbCase("elbow-ap");

/** Compatibility view (what the engine, renderer, store and UI consume): the case composed with its exam. */
export const elbowAp = composeCase(elbowApExam, elbowApAdultDemo);
