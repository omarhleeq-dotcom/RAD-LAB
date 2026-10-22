import type { CaseDefinition } from "@/domain/exam";
import { composeCase } from "@/features/exam/compose";
import { elbowLateralExam } from "../exams/xray/elbow-lateral";
import { makeUpperLimbCase } from "./upper-limb-case";

/** Case "adult-demo" of the Elbow Lateral exam (S14.3): see `upper-limb-case.ts`. */
export const elbowLateralAdultDemo: CaseDefinition = makeUpperLimbCase("elbow-lateral");

/** Compatibility view (what the engine, renderer, store and UI consume): the case composed with its exam. */
export const elbowLateral = composeCase(elbowLateralExam, elbowLateralAdultDemo);
