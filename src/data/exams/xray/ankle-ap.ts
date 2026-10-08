import type { AnyExamDefinition } from "@/domain/exam";
import { makeLowerLimbExam } from "./lower-limb-common";

/** Exam definition: Adult Ankle X-ray — AP (S14.5, left side inferred). All data is built by `makeLowerLimbExam("ankle-ap")` in `lower-limb-common.ts`. */
export const ankleApExam: AnyExamDefinition = makeLowerLimbExam("ankle-ap");
