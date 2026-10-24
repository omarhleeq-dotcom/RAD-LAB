"use client";

// Attempts and notes of one participant (a collapsed section inside the owner's participant card) and the CSV download bar (RAD-044b).
import { useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore } from "react";
import { getPilotClient } from "./client";
import { type Cursor, type OwnerFilters, parseAttempts, parseNotes, readOwnerPage } from "./owner-data";
import { createOwnerExport, EXPORT_PAGE_SIZE } from "./owner-export";
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

/** Main actions always start a new export. Only large exports need an explicit next-part click. */
export function CsvBar({ filters }: { filters: OwnerFilters }) {
  const t = useTranslations("owner");
  const [flow]=useState(()=>createOwnerExport({
    read:async(stream,selected,cursor,boundary,signal)=>{
      const client=await getPilotClient();
      if(!client||signal.aborted)throw new Error("off");
      return readOwnerPage(args=>client.rpc("owner_page_v1",args).abortSignal(signal),stream,selected,cursor,boundary,true,EXPORT_PAGE_SIZE);
    },
    save:download,
  }));
  const state=useSyncExternalStore(flow.subscribe,flow.getSnapshot,flow.getSnapshot);
  useEffect(()=>()=>flow.dispose(),[flow]);
  return <div data-testid="csv-bar" className="my-3 space-y-2">
    <div className="flex flex-wrap gap-2">
      {(["attempts","notes"] as const).map(stream=><button key={stream} data-testid={`csv-${stream}`} className={btn} onClick={()=>void flow.start(stream,filters)}>{t(`csv.${stream}`)}</button>)}
    </div>
    {state.multipart&&state.cursor&&<div className="space-y-2">
      <p className="text-sm text-muted">{t("exportFlow.large")}</p>
      <button data-testid="export-next" className={btn} disabled={state.busy} onClick={()=>void flow.next()}>{t("exportFlow.next",{part:state.files+1,parts:state.parts})}</button>
    </div>}
    {state.busy&&<p role="status">{t("exportFlow.preparing")}</p>}
    {state.failed&&<p data-testid="export-error" role="alert">{t("exportFlow.failed")}</p>}
    {state.files>0&&state.stream&&<p data-testid="export-status" role="status">{t(`exportFlow.${state.stream}Downloaded`,{count:state.written,files:state.files})}</p>}
    {state.skipped>0&&<p role="alert">{t("exportFlow.skipped",{count:state.skipped})}</p>}
    <details data-testid="export-info" className="text-sm text-muted">
      <summary aria-label={t("dashboard.exportInfo")} className="min-h-11 cursor-pointer">ⓘ</summary>
      <p>{t("paging.exportHint")}</p>
      {state.multipart&&state.files>0&&<button data-testid="export-report" className={btn} onClick={()=>download("radlab-export-report.json",JSON.stringify(flow.report(),null,2))}>{t("paging.report")}</button>}
    </details>
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
