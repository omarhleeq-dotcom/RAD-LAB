import type { AnyExamDefinition } from "@/domain/exam";
import { makeWristExam } from "./wrist-common";

/** Exam definition: Adult Wrist X-ray — Lateral (S14.1c). All data is built by `makeWristExam("lateral")` in `wrist-common.ts`. BONTRAGER-9 p.158. */
export const wristLateralExam: AnyExamDefinition = makeWristExam("lateral");
