import type { AnyExamDefinition } from "@/domain/exam";
import { makeHandExam } from "./hand-common";

/** Exam definition: Adult Hand X-ray — Lateral, extension variant (S14.2b, S14.2-6). All data is built by `makeHandExam("lateral")` in `hand-common.ts`. BONTRAGER-9 p.153. */
export const handLateralExam: AnyExamDefinition = makeHandExam("lateral");
