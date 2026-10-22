import type { AnyExamDefinition } from "@/domain/exam";
import { makeUpperLimbExam } from "./upper-limb-common";

/** Exam definition: Adult Wrist X-ray — PA (S14.1c). All data is built by `makeUpperLimbExam("wrist-pa")` in `upper-limb-common.ts`. BONTRAGER-9 p.156. */
export const wristPaExam: AnyExamDefinition = makeUpperLimbExam("wrist-pa");
