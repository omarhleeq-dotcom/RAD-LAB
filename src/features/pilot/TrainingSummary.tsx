"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getPilotClient } from "./client";
import { PILOT } from "./config";
import { useSessionAccount } from "./SessionGate";
import { readTraining, TrainingReadError, type TrainingPage, type TrainingRequest, type TrainingSummaryData } from "./training";

export const trainingButton = "inline-block rounded-md border border-line px-4 py-2 font-medium text-brand hover:bg-paper disabled:opacity-60";
export function useTraining(request: TrainingRequest) {
  const [revision, setRevision] = useState(0);
  const key = JSON.stringify([request, revision]);
  const [result, setResult] = useState<{ key: string; page?: TrainingPage; error?: "error" | "expired" | "denied" } | null>(null);
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
export function TrainingReadStatus({ error, retry }: { error?: "error" | "expired" | "denied"; retry: () => void }) {
  const t = useTranslations("training");
  const { signOut } = useSessionAccount();
  if (!error) return <p role="status" className="py-5">{t("loading")}</p>;
  return <div className="py-5"><p role="alert">{t(error)}</p><button type="button" className={`mt-3 ${trainingButton}`} onClick={() => error === "expired" ? void signOut() : retry()}>{t(error === "expired" ? "signIn" : "retry")}</button></div>;
}
export function SummaryCards({ data }: { data: TrainingSummaryData }) {
  const t = useTranslations("training");
  const locale = useLocale();
  return <dl className="my-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="training-summary">
    {([["attempts", data.attempts], ["exams", data.exams], ...(data.trainees !== null ? [["activeTrainees", data.trainees]] : []), ["latest", data.latest ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(data.latest)) : t("none")]] as [string, string | number][]).map(([label, value]) =>
      <div key={label} className="rounded-lg border border-line bg-panel p-4"><dt className="text-sm text-muted">{t(label)}</dt><dd className="mt-2 text-xl font-semibold"><bdi>{typeof value === "number" ? value.toLocaleString(locale) : value}</bdi></dd></div>)}
  </dl>;
}
function Summary({ userId, owner }: { userId: string; owner: boolean }) {
  const t = useTranslations("training");
  const { page, error, retry } = useTraining({ view: "summary", scope: owner ? "all" : "own", ...(owner ? {} : { user: userId }) });
  return <>
    <h3 className="mt-4 text-xl font-semibold">{t(owner ? "follow" : "mine")}</h3>
    <p className="mt-2 text-sm text-muted">{t("practiceOnly")}</p>
    {page?.summary ? <SummaryCards data={page.summary} /> : <TrainingReadStatus error={error} retry={retry} />}
    <Link href="/training" className={trainingButton}>{t(owner ? "follow" : "open")}</Link>
  </>;
}
export function TrainingSummary() {
  const t = useTranslations("training");
  const { state } = useSessionAccount();
  if (!PILOT || state.kind !== "signedIn" || state.profile.status !== "approved") return null;
  return <div data-testid="home-training" className="min-w-0 [overflow-wrap:anywhere]">
    {state.displayName ? <p className="mt-3 text-lg">{t("welcome", { name: state.displayName })}</p> : <p className="mt-3 rounded-md bg-paper p-3">{t("completeName")} <Link href="/account" className="text-brand underline">{t("personal")}</Link></p>}
    <Summary key={state.userId} userId={state.userId} owner={state.profile.role === "owner"} />
  </div>;
}
