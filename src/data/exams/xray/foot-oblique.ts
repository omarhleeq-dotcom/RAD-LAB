import type { AnyExamDefinition } from "@/domain/exam";
import { makeLowerLimbExam } from "./lower-limb-common";

/** Exam definition: Adult Foot X-ray — AP medial oblique (S14.4, right side). All data is built by `makeLowerLimbExam("foot-oblique")` in `lower-limb-common.ts`. */
export const footObliqueExam: AnyExamDefinition = makeLowerLimbExam("foot-oblique");
