"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { NotFoundView } from "@/components/shell/NotFoundView";
import { SimulationWorkspace } from "@/features/simulation/SimulationWorkspace";
import { categoryLibraryPath } from "./library";
import { examPath } from "./routes";
import { findExam, resolveRadCase } from "./resolve";

/**
 * Practice for one exam. The default case (no `?case=`) is what the static HTML is built for; any other case is
 * resolved here, on the client, from the registries. An unknown `?case=` shows an in-page not-found (a static host
 * cannot return a 404 for a query string).
 */
export function PracticeEntry({ modality, examId }: { modality: string; examId: string }) {
  const t = useTranslations("notFound");
  const param = useSearchParams().get("case");
  const exam = findExam(modality, examId);
  const radCase = exam && resolveRadCase(exam, param);
  if (!exam || !radCase) {
    return <NotFoundView title={t("caseTitle")} body={t("caseBody")} linkLabel={t("backToExam")} href={examPath(modality, examId)} />;
  }
  return <SimulationWorkspace caseId={radCase.id} backHref={categoryLibraryPath(modality, exam.bodyPart)} />;
}
