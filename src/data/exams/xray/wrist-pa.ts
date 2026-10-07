import type { AnyExamDefinition } from "@/domain/exam";
import { makeWristExam } from "./wrist-common";

/** Exam definition: Adult Wrist X-ray — PA (S14.1c). All data is built by `makeWristExam("pa")` in `wrist-common.ts`. BONTRAGER-9 p.156. */
export const wristPaExam: AnyExamDefinition = makeWristExam("pa");
