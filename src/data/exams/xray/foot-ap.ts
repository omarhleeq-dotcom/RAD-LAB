import type { AnyExamDefinition } from "@/domain/exam";
import { makeLowerLimbExam } from "./lower-limb-common";

/** Exam definition: Adult Foot X-ray — AP (dorsoplantar) (S14.4, right side). All data is built by `makeLowerLimbExam("foot-ap")` in `lower-limb-common.ts`. */
export const footApExam: AnyExamDefinition = makeLowerLimbExam("foot-ap");
