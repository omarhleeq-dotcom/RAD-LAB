import type { AnyExamDefinition } from "@/domain/exam";
import { makeLowerLimbExam } from "./lower-limb-common";

/** Exam definition: Adult Ankle X-ray — Lateral (S14.5, left side inferred). All data is built by `makeLowerLimbExam("ankle-lateral")` in `lower-limb-common.ts`. */
export const ankleLateralExam: AnyExamDefinition = makeLowerLimbExam("ankle-lateral");
