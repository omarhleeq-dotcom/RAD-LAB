import type { AnyExamDefinition } from "@/domain/exam";
import { makeUpperLimbExam } from "./upper-limb-common";

/** Exam definition: Adult Hand X-ray — PA (S14.2b). All data is built by `makeUpperLimbExam("hand-pa")` in `upper-limb-common.ts`. BONTRAGER-9 p.150. */
export const handPaExam: AnyExamDefinition = makeUpperLimbExam("hand-pa");
