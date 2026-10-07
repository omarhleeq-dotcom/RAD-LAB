import type { AnyExamDefinition } from "@/domain/exam";
import { makeElbowExam } from "./elbow-common";

/** Exam definition: Adult Elbow X-ray — AP (extended) (S14.3). All data is built by `makeElbowExam("ap")` in `elbow-common.ts`. BONTRAGER-9 p.166. */
export const elbowApExam: AnyExamDefinition = makeElbowExam("ap");
