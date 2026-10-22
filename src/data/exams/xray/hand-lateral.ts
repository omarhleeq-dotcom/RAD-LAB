import type { AnyExamDefinition } from "@/domain/exam";
import { makeUpperLimbExam } from "./upper-limb-common";

/** Exam definition: Adult Hand X-ray — Lateral, extension variant (S14.2b, S14.2-6). All data is built by `makeUpperLimbExam("hand-lateral")` in `upper-limb-common.ts`. BONTRAGER-9 p.153. */
export const handLateralExam: AnyExamDefinition = makeUpperLimbExam("hand-lateral");
