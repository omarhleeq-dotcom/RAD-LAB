import type { AnyExamDefinition } from "@/domain/exam";
import { makeElbowExam } from "./elbow-common";

/** Exam definition: Adult Elbow X-ray — Lateral (flexed 90°) (S14.3). All data is built by `makeElbowExam("lateral")` in `elbow-common.ts`. BONTRAGER-9 p.172. */
export const elbowLateralExam: AnyExamDefinition = makeElbowExam("lateral");
