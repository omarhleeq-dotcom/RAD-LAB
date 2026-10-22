import type { AnyExamDefinition } from "@/domain/exam";
import { makeUpperLimbExam } from "./upper-limb-common";

/** Exam definition: Adult Elbow X-ray — AP (extended) (S14.3). All data is built by `makeUpperLimbExam("elbow-ap")` in `upper-limb-common.ts`. BONTRAGER-9 p.166. */
export const elbowApExam: AnyExamDefinition = makeUpperLimbExam("elbow-ap");
