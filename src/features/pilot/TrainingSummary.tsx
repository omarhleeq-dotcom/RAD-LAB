"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MODALITIES } from "@/data/modalities";
import { getExam } from "@/data/exams";
import { localize } from "@/lib/localized";
import { rankLastResults, savedExamResults } from "./saved-results";
import { useSavedResults } from "./useSavedResults";
import { Link } from "@/i18n/navigation";
import { getPilotClient } from "./client";
import { PILOT } from "./config";
import { useSessionAccount } from "./SessionGate";
import { readTraining, TrainingReadError, type TrainingPage, type TrainingRequest, type TrainingSummaryData } from "./training";

export const trainingButton = "inline-block rounded-md border border-line px-4 py-2 font-medium text-brand hover:bg-paper disabled:opacity-60";
export function useTraining(request: TrainingRequest) {
  const [revision, setRevision] = useState(0);
  const key = JSON.stringify([request, revision]);
  const [result, setResult] = useState<{ key: string; page?: TrainingPage; error?: "error" | "expired" | "denied" | "schema" } | null>(null);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const client = await getPilotClient();
        if (!client) throw new TrainingReadError("error");
        const page = await readTraining(client, request);
        if (!cancelled) setResult({ key, page });
      } catch (error) {
        if (!cancelled) setResult({ key, error: error instanceof TrainingReadError ? error.kind : "error" });
      }
    })();
    return () => { cancelled = true; };
    // All query values are captured in key. Late responses cannot cross requests or account remounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { page: result?.key === key ? result.page : undefined, error: result?.key === key ? result.error : undefined, retry: () => setRevision((v) => v + 1) };
}
export function TrainingReadStatus({ error, retry }: { error?: "error" | "expired" | "denied" | "schema"; retry: () => void }) {
  const t = useTranslations("training");
  const { signOut } = useSessionAccount();
  if (!error) return <p role="status" className="py-5">{t("loading")}</p>;
  return <div className="py-5"><p role="alert">{t(error)}</p><button type="button" className={`mt-3 ${trainingButton}`} onClick={() => error === "expired" ? void signOut() : retry()}>{t(error === "expired" ? "signIn" : "retry")}</button></div>;
}
export function SummaryCards({ data }: { data: TrainingSummaryData }) {
  const t = useTranslations("training");
  const locale = useLocale();
  return <dl className="training-summary-row" data-testid="training-summary">
    {([["attempts", data.attempts], ["exams", data.exams], ...(data.trainees !== null ? [["activeTrainees", data.trainees]] : []), ["latest", data.latest ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(data.latest)) : t("none")]] as [string, string | number][]).map(([label, value]) =>
      <div key={label} className="min-w-0"><dt className="text-sm text-muted">{t(label)}</dt><dd className="text-sm font-semibold"><bdi>{typeof value === "number" ? value.toLocaleString(locale) : value}</bdi></dd></div>)}
  </dl>;
}
export function TrainingSummary() {
  const t = useTranslations("training"), th = useTranslations("home"), ts = useTranslations("shell");
  const locale = useLocale();
  const { state } = useSessionAccount();
  const user = PILOT && state.kind === "signedIn" && state.profile.status === "approved" ? state.userId : null;
  const { data } = useSavedResults(user);
  const name = state.kind === "signedIn" ? state.displayName : null;
  const groups = savedExamResults(data?.rows ?? []);
  const ranked = rankLastResults(data?.rows ?? []);
  const route = (id: string) => {
    const exam = getExam(id), modality = MODALITIES.find(m => m.status === "available" && m.examModality === exam?.modality);
    return exam && modality ? { href: `/${modality.id}/${exam.id}`, title: localize(exam.title, locale) } : null;
  };
  const last = groups[0] && route(groups[0].exam);
  const weakest = ranked[0] && route(ranked[0].exam);
  return <>
    <h1>{name ? t("welcome", { name }) : th("dashboardTitle")}</h1>
    <nav className="home-next" aria-label={t("nextPractice")}>
      {last && <Link href={last.href} className="home-action"><strong>{t("continueExam")}</strong><span>{last.title}</span><span aria-hidden="true">←</span></Link>}
      {weakest && <Link href={weakest.href} className="home-action"><strong>{t("reviewExam")}</strong><span>{weakest.title}</span><span aria-hidden="true">←</span></Link>}
      {MODALITIES.filter(m => m.status === "available").map(m => <Link key={m.id} href={`/${m.id}`} className="home-action"><strong>{ts("library")}</strong><span>{localize(m.name, locale)}</span><span aria-hidden="true">←</span></Link>)}
    </nav>
    {data && data.summary.attempts > 0 && <SummaryCards data={data.summary} />}
    {data?.next && <p className="text-sm text-muted">{t("recentScope", { count: data.rows.length })}</p>}
  </>;
}
