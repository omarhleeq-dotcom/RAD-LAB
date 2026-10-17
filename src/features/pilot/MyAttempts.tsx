"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { getExam } from "@/data/exams";
import { localize } from "@/lib/localized";
import { getPilotClient } from "./client";
import { AttemptsReadError, readMyAttemptsPage, type AttemptCursor, type MyAttemptsPage } from "./my-attempts";

const button = "rounded-md border border-line px-4 py-2 font-medium hover:bg-paper disabled:opacity-60";
type ReadState = { kind: "ready"; page: MyAttemptsPage } | { kind: "error" | "expired" };

/** Mounted only for an approved account, keyed by user id. Each page replaces the last, with no history cache. */
export function MyAttempts({ userId, onExpired }: { userId: string; onExpired: () => Promise<void> }) {
  const t = useTranslations("myAttempts");
  const locale = useLocale();
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const [request, setRequest] = useState<{ cursor: AttemptCursor | null; revision: number }>({ cursor: null, revision: 0 });
  const key = JSON.stringify([userId, request]);
  const [result, setResult] = useState<{ key: string; value: ReadState } | null>(null);
  const state = result?.key === key ? result.value : null;
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const client = await getPilotClient();
        if (!client) throw new AttemptsReadError("error");
        const page = await readMyAttemptsPage(client, userId, request.cursor);
        if (!cancelled) setResult({ key, value: { kind: "ready", page } });
      } catch (error) {
        if (!cancelled) setResult({ key, value: { kind: error instanceof AttemptsReadError ? error.kind : "error" } });
      }
    })();
    return () => { cancelled = true; };
    // key captures user and all request parameters; late responses cannot replace another user's page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (state && moved.current) { heading.current?.focus(); moved.current = false; }
  }, [state]);
  function load(cursor: AttemptCursor | null) {
    moved.current = true;
    setRequest((old) => ({ cursor, revision: old.revision + 1 }));
  }
  const date = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  return <section className="mt-6 min-w-0 rounded-lg border border-line bg-panel p-5" aria-labelledby="my-attempts-heading" data-testid="my-attempts" aria-busy={!state}>
    <h2 id="my-attempts-heading" ref={heading} tabIndex={-1} className="text-xl font-semibold">{t("title")}</h2>
    <p className="mt-2 text-sm text-muted">{t("intro")}</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" className={button} disabled={!state} onClick={() => load(null)}>{t("refresh")}</button>
      {request.cursor && <button type="button" className={button} disabled={!state} onClick={() => load(null)}>{t("first")}</button>}
    </div>
    {!state && <p role="status" className="mt-4">{t("loading")}</p>}
    {state?.kind === "error" && <div className="mt-4"><p role="alert">{t("error")}</p><button type="button" className={`mt-3 ${button}`} onClick={() => load(request.cursor)}>{t("retry")}</button></div>}
    {state?.kind === "expired" && <div className="mt-4"><p role="alert">{t("expired")}</p><button type="button" className={`mt-3 ${button}`} onClick={() => void onExpired()}>{t("signInAgain")}</button></div>}
    {state?.kind === "ready" && <>
      <p role="status" className="mt-4 text-sm">{state.page.items.length ? t("pageCount", { count: state.page.items.length }) : t(request.cursor ? "end" : "empty")}</p>
      <ul className="mt-4 space-y-4">
        {state.page.items.map((a) => {
          const exam = getExam(a.examId);
          return <li key={a.id} className="min-w-0 rounded-lg border border-line p-4" data-testid="my-attempt">
            <h3 className="font-semibold break-words">{exam ? localize(exam.title, locale) : <bdi>{a.examId}</bdi>}</h3>
            <p className="mt-1 text-sm text-muted">{t("attemptNo", { no: a.attemptNo })} · <time dateTime={a.finishedAt}>{date(a.finishedAt)}</time></p>
            <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><dt className="text-sm text-muted">{t("score")}</dt><dd className="font-semibold"><bdi>{a.total}</bdi></dd></div>
              <div><dt className="text-sm text-muted">{t("result")}</dt><dd>{t(a.passed ? "passed" : "notPassed")}</dd></div>
            </dl>
            <details className="mt-4" data-testid="my-attempt-details">
              <summary className="cursor-pointer py-2 font-medium text-brand">{t("details")}<span className="sr-only"> · {t("attemptNo", { no: a.attemptNo })} · <bdi>{a.id}</bdi></span></summary>
              <p className="mt-2 text-sm text-muted">{t("savedOnly")}</p>
              <dl className="mt-3 space-y-2 text-sm">
                {([["case", a.caseId], ["version", a.definitionVersion], ["language", a.locale], ["id", a.id]] as const).map(([label, value]) => <div key={label}><dt className="text-muted">{t(label)}</dt><dd className="break-all"><bdi>{value}</bdi></dd></div>)}
                <div><dt className="text-muted">{t("started")}</dt><dd><time dateTime={a.startedAt}>{date(a.startedAt)}</time></dd></div>
                <div><dt className="text-muted">{t("finished")}</dt><dd><time dateTime={a.finishedAt}>{date(a.finishedAt)}</time></dd></div>
                <div><dt className="text-muted">{t("critical")}</dt><dd className="break-words">{a.critical.length ? a.critical.map((id, i) => <span key={i}><bdi>{id}</bdi>{i < a.critical.length - 1 ? ", " : ""}</span>) : t("none")}</dd></div>
              </dl>
              <h4 className="mt-4 font-medium">{t("categories")}</h4>
              <ul className="mt-2 text-sm">{a.categories.map((c, i) => <li key={i} className="break-words"><bdi>{c.c}: {c.earned} / {c.weight}</bdi></li>)}</ul>
              <h4 className="mt-4 font-medium">{t("checks")}</h4>
              <p className="text-sm text-muted">{t("checksHint")}</p>
              <ul className="mt-2 text-sm">{a.checks.map((c, i) => <li key={i} className="break-words"><bdi>{c.id}: {c.o} · {c.credit}</bdi></li>)}</ul>
              <h4 className="mt-4 font-medium">{t("settings")}</h4>
              <pre dir="ltr" className="mt-2 whitespace-pre-wrap break-all rounded-md bg-paper p-3 text-start text-xs">{JSON.stringify(a.settings, null, 2)}</pre>
            </details>
          </li>;
        })}
      </ul>
      {state.page.next && <button type="button" className={`mt-4 ${button}`} onClick={() => load(state.page.next)}>{t("next")}</button>}
    </>}
  </section>;
}
