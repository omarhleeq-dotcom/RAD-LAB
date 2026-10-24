"use client";

// Attempts and notes of one participant (a collapsed section inside the owner's participant card) and the CSV download bar (RAD-044b).
import { useTranslations } from "next-intl";
import { useState } from "react";
import { getPilotClient } from "./client";
import { type Cursor, type OwnerFilters, type OwnerPage, csvFileName, exportOwnerPart, parseAttempts, parseNotes, readOwnerPage } from "./owner-data";
import { useOwnerData } from "./useOwnerData";
import { formatStamp } from "./owner-state";

const btn = "rounded-md border border-line px-3 py-1.5 text-sm font-medium hover:bg-paper disabled:opacity-60";

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: name.endsWith(".json") ? "application/json;charset=utf-8" : "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Independent export session. Each explicit click saves one bounded part; no large in-memory concatenation. */
export function CsvBar({ filters }: { filters: OwnerFilters }) {
  const t = useTranslations("owner");
  const [session, setSession] = useState<{ stream: "attempts" | "notes"; page: OwnerPage; part: number; written: number; skipped: number; filters: OwnerFilters } | null>(null);
  const [activeStream, setActiveStream] = useState<"attempts" | "notes" | null>(null);
  const [partsSaved, setPartsSaved] = useState(0);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [complete, setComplete] = useState(false);
  async function load(stream: "attempts" | "notes", previous = session) {
    setActiveStream(stream); setBusy(true); setFailed(false);
    try {
      const client = await getPilotClient();
      if (!client) throw new Error("off");
      const page = await readOwnerPage((args) => client.rpc("owner_page_v1", args), stream, previous?.filters ?? filters, previous?.page.next ?? null, previous?.page.boundary ?? null, true, 1000);
      setSession({ stream, page, part: (previous?.part ?? 0) + 1, written: previous?.written ?? 0, skipped: previous?.skipped ?? 0, filters: previous?.filters ?? { ...filters } });
    } catch { setFailed(true); }
    setBusy(false);
  }
  function save() {
    if (!session) return;
    const part = exportOwnerPart(session.stream, session.page);
    download(csvFileName(session.stream, new Date()).replace(".csv", `-part-${session.part}.csv`), part.csv);
    const next = { ...session, written: session.written + part.written, skipped: session.skipped + part.skipped };
    setSession(next); setPartsSaved((n) => n + 1);
    if (session.page.next) void load(session.stream, next); else setComplete(true);
  }
  return <div data-testid="csv-bar" className="my-3 space-y-2">
    <details className="text-sm text-muted"><summary aria-label={t("dashboard.exportInfo")} className="min-h-11 cursor-pointer">ⓘ</summary><p>{t("paging.exportHint")}</p></details>
    <div className="flex flex-wrap gap-2">
      {(["attempts", "notes"] as const).map((stream) => <button key={stream} data-testid={`csv-${stream}`} className={btn} disabled={busy || !!session} onClick={() => void load(stream, null)}>{t(`csv.${stream}`)}</button>)}
      {session && !complete && !failed && <button data-testid="export-save" className={btn} disabled={busy} onClick={save}>{t("paging.savePart", { part: session.part })}</button>}
      {session && <button className={btn} disabled={busy} onClick={() => { setSession(null); setComplete(false); setFailed(false); setPartsSaved(0); setActiveStream(null); }}>{t("paging.resetExport")}</button>}
      {activeStream && <button data-testid="export-report" className={btn} disabled={busy} onClick={() => download("radlab-export-report.json", JSON.stringify({ version: 1, stream: activeStream, partsSaved, boundary: session?.page.boundary ?? null, filters: { participant: (session?.filters ?? filters).participantCode ?? "", exam: (session?.filters ?? filters).exam, from: (session?.filters ?? filters).from, to: (session?.filters ?? filters).to }, utc: new Date().toISOString(), written: session?.written ?? 0, skipped: session?.skipped ?? 0, complete: complete && !failed && session?.skipped === 0, error: failed, status: "Rows read within boundary during export; not a point-in-time snapshot" }, null, 2))}>{t("paging.report")}</button>}
    </div>
    {busy && <p role="status">{t("loading")}</p>}
    {failed && <p data-testid="export-error" role="alert">{t("paging.exportError")}</p>}
    {session && <p data-testid="export-status" role="status">{t("paging.exportStatus", { count: session.written, skipped: session.skipped })} {complete ? t("paging.complete") : t("paging.incomplete")}</p>}
  </div>;
}

const when = (iso: string) => formatStamp(new Date(iso));

export function ParticipantActivity({ code, userId, filters, version }: { code: string; userId: string; filters: OwnerFilters; version: number }) {
  const t = useTranslations("owner");
  const [open, setOpen] = useState(false);
  const [stream, setStream] = useState<"attempts" | "notes">("attempts");
  const [cursor, setCursor] = useState<Cursor | null>(null);
  const [boundary, setBoundary] = useState<string | null>(null);
  const data = useOwnerData(open, version, stream, { ...filters, participant: userId }, cursor, boundary);
  const page = data.kind === "ready" ? data.page : null;
  const pa = parseAttempts(stream === "attempts" ? page?.rows : []), pn = parseNotes(stream === "notes" ? page?.rows : []);
  const attempts = pa.items, notes = pn.items;
  const attemptNo = new Map((page?.rows ?? []).flatMap((r) => typeof r.attempt_id === "string" && typeof r.attempt_no === "number" ? [[r.attempt_id, r.attempt_no] as const] : []));
  const label = t("dashboard.activity");
  return (
    <details onToggle={(e) => setOpen(e.currentTarget.open)} data-testid={`activity-${code}`} className="mt-3 rounded-md border border-line">
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium">{label}</summary>
      <div className="space-y-4 px-3 pb-3">
        <div className="flex flex-wrap gap-2">{(["attempts", "notes"] as const).map((s) => <button key={s} data-testid={`show-${s}-${code}`} className={btn} onClick={() => { setStream(s); setCursor(null); setBoundary(null); }}>{t(`activity.${s}Title`)}</button>)}</div>
        {data.kind === "loading" && <p role="status">{t("loading")}</p>}
        {data.kind === "error" && <p role="alert" data-testid="owner-data-error">{t("errors.data")}</p>}
        {page && <p data-testid={`total-${code}`}>{t("paging.total", { total: page.total })}</p>}
        {page && page.rows.length === 0 && <p>{t("activity.none")}</p>}
        {pa.skipped + pn.skipped > 0 && <p role="status">{t("activity.skipped", { count: pa.skipped + pn.skipped })}</p>}
        <button className={btn} onClick={() => { setCursor(null); setBoundary(null); }}>{t("paging.first")}</button>
        <button data-testid={`detail-next-${code}`} className={btn} disabled={!page?.next} onClick={() => { setCursor(page!.next); setBoundary(page!.boundary); }}>{t("paging.next")}</button>
        {attempts.length > 0 && (
          <div role="region" aria-label={t("activity.attemptsOf", { code })} tabIndex={0} className="overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-start text-sm">
              <caption className="pb-1 text-start font-medium">{t("activity.attemptsTitle")}</caption>
              <thead>
                <tr className="border-b border-line text-start text-muted">
                  {(["no", "exam", "score", "result", "critical", "language", "finished"] as const).map((k) => (
                    <th key={k} scope="col" className="py-1 pe-3 text-start font-medium">{t(`activity.col.${k}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} data-testid={`attempt-${a.id}`} className="border-b border-line/60 align-top">
                    <td dir="ltr" className="py-1 pe-3 text-start">{a.attemptNo}</td>
                    <td dir="ltr" className="py-1 pe-3 text-start font-mono text-xs">{a.examId}{a.caseId !== "default" ? ` / ${a.caseId}` : ""}</td>
                    <td dir="ltr" className="py-1 pe-3 text-start">{a.total}</td>
                    <td className="py-1 pe-3">{a.passed ? t("activity.passed") : t("activity.notPassed")}</td>
                    <td dir="ltr" className="py-1 pe-3 text-start font-mono text-xs">{a.critical.length === 0 ? "—" : a.critical.join(", ")}</td>
                    <td dir="ltr" className="py-1 pe-3 text-start uppercase">{a.locale}</td>
                    <td dir="ltr" className="py-1 text-start">{when(a.finishedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {notes.length > 0 && (
          <div>
            <h3 className="font-medium">{t("activity.notesTitle")}</h3>
            <ul className="mt-1 space-y-2">
              {notes.map((n) => {
                const no = n.attemptId ? attemptNo.get(n.attemptId) : undefined;
                return (
                  <li key={n.id} data-testid={`note-${n.id}`} className="rounded-md bg-paper px-3 py-2">
                    <p className="text-sm text-muted">
                      <span dir="ltr">{when(n.at)}</span> · {no !== undefined ? t("activity.onAttempt", { no }) : t("activity.noAttempt")}
                    </p>
                    <p dir="auto" className="mt-1 whitespace-pre-wrap break-words">{n.text}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}
