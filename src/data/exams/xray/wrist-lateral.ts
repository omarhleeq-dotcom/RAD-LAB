import type { AnyExamDefinition } from "@/domain/exam";
import { makeUpperLimbExam } from "./upper-limb-common";

/** Exam definition: Adult Wrist X-ray — Lateral (S14.1c). All data is built by `makeUpperLimbExam("wrist-lateral")` in `upper-limb-common.ts`. BONTRAGER-9 p.158. */
export const wristLateralExam: AnyExamDefinition = makeUpperLimbExam("wrist-lateral");
