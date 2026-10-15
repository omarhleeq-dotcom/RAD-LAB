"use client";

// Attempts and notes of one participant (a collapsed section inside the owner's participant card) and the CSV download bar (RAD-044b).
import { useTranslations } from "next-intl";
import { type ActivityByUser, attemptsCsv, type CodeOf, csvFileName, notesCsv, type OwnerAttempt, type OwnerNote } from "./owner-data";
import { formatStamp } from "./owner-state";

const btn = "rounded-md border border-line px-3 py-1.5 text-sm font-medium hover:bg-paper disabled:opacity-60";

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Download buttons for the two CSV files; the files carry participant codes only (see owner-data.ts). */
export function CsvBar({ attempts, notes, codes }: { attempts: readonly OwnerAttempt[]; notes: readonly OwnerNote[]; codes: CodeOf }) {
  const t = useTranslations("owner");
  const now = () => new Date();
  return (
    <div data-testid="csv-bar" className="mt-3 flex flex-wrap items-center gap-2">
      <button type="button" className={btn} disabled={attempts.length === 0} data-testid="csv-attempts" onClick={() => download(csvFileName("attempts", now()), attemptsCsv(attempts, codes))}>
        {t("csv.attempts")}
      </button>
      <button type="button" className={btn} disabled={notes.length === 0} data-testid="csv-notes" onClick={() => download(csvFileName("notes", now()), notesCsv(notes, attempts, codes))}>
        {t("csv.notes")}
      </button>
      <span className="text-sm text-muted">{t("csv.hint")}</span>
    </div>
  );
}

const when = (iso: string) => formatStamp(new Date(iso));

export function ParticipantActivity({ code, activity }: { code: string; activity: ActivityByUser | undefined }) {
  const t = useTranslations("owner");
  const attempts = activity?.attempts ?? [];
  const notes = activity?.notes ?? [];
  const attemptNo = new Map(attempts.map((a) => [a.id, a.attemptNo]));
  const label = t("activity.summary", { attempts: attempts.length, notes: notes.length });
  if (attempts.length === 0 && notes.length === 0) return <p data-testid={`activity-${code}`} className="mt-3 text-sm text-muted">{t("activity.none")}</p>;
  return (
    <details data-testid={`activity-${code}`} className="mt-3 rounded-md border border-line">
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium">{label}</summary>
      <div className="space-y-4 px-3 pb-3">
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
