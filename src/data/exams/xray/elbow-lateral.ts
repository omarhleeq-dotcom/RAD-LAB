import type { AnyExamDefinition } from "@/domain/exam";
import { makeUpperLimbExam } from "./upper-limb-common";

/** Exam definition: Adult Elbow X-ray — Lateral (flexed 90°) (S14.3). All data is built by `makeUpperLimbExam("elbow-lateral")` in `upper-limb-common.ts`. BONTRAGER-9 p.172. */
export const elbowLateralExam: AnyExamDefinition = makeUpperLimbExam("elbow-lateral");
