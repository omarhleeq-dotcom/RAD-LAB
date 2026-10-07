import type { AnyExamDefinition } from "@/domain/exam";
import { makeLowerLimbExam } from "./lower-limb-common";

/** Exam definition: Adult Knee X-ray — AP (S14.4, right side). All data is built by `makeLowerLimbExam("knee-ap")` in `lower-limb-common.ts`. */
export const kneeApExam: AnyExamDefinition = makeLowerLimbExam("knee-ap");
