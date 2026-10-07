import type { AnyExamDefinition } from "@/domain/exam";
import { makeHandExam } from "./hand-common";

/** Exam definition: Adult Hand X-ray — PA (S14.2b). All data is built by `makeHandExam("pa")` in `hand-common.ts`. BONTRAGER-9 p.150. */
export const handPaExam: AnyExamDefinition = makeHandExam("pa");
