"use client";
/** RAD-105 P2: dormant self-service screens. Presentational and adapter-injected: no database call lives here, and nothing in the app imports this file until the P7 promotion. */
import { useState, useId } from "react";
import { ammanLocalToUtc, defaultWindow, formatAmman, latestFullStart, validateWindow } from "./window-time";
import { studentExamKind, type SessionInfo, type WindowInfo } from "./student-state";
import { SelfServiceError } from "./contracts";
import type { SelfServiceStrings } from "./strings";

export type ScheduleAdapter = { available: boolean; schedule: (opensAtIso: string, closesAtIso: string) => Promise<void> };
const field = "min-h-11 w-full rounded border border-line bg-transparent px-3 py-2";
const button = "min-h-11 rounded border border-line px-4 py-2 disabled:opacity-50";
const fill = (text: string, time: string) => text.replace("{time}", time);

export function SupervisorSchedule({ adapter, strings, locale, durationSeconds, nowMs, clock, initial }: { adapter: ScheduleAdapter; strings: SelfServiceStrings; locale: "en" | "ar"; durationSeconds: number; nowMs: number; clock: () => number; initial?: { opensLocal: string; closesLocal: string } }) {
 const values = initial ?? defaultWindow(nowMs), titleId=useId();
 const [opens, setOpens] = useState(values.opensLocal), [closes, setCloses] = useState(values.closesLocal);
 const [message, setMessage] = useState<string | null>(null), [busy, setBusy] = useState(false);
 if (!adapter.available) return <p role="status">{strings.unavailable}</p>;
 const o = ammanLocalToUtc(opens), c = ammanLocalToUtc(closes);
 const last = c ? latestFullStart(c, durationSeconds) : null;
 async function save() {
  const bad = validateWindow(o, c, clock());
  if ((bad && !(initial && bad === "past")) || !o || !c) { setMessage(strings[bad ?? "invalid"]); return; }
  setBusy(true); setMessage(strings.saving);
  try { await adapter.schedule(o, c); setMessage(strings.saved); } catch(error) { setMessage(error instanceof SelfServiceError ? strings[error.kind] : strings.unknown); } finally { setBusy(false); }
 }
 return <section className="space-y-3 rounded border border-line p-4" aria-labelledby={titleId} data-testid="selfservice-schedule">
  <h2 id={titleId} className="text-xl font-semibold">{strings.title}</h2>
  <p className="text-sm">{strings.timezone}</p>
  <label className="block"><span className="font-semibold">{strings.opens}</span><input className={field} type="datetime-local" dir="ltr" value={opens} onChange={e => setOpens(e.target.value)} /></label>
  <label className="block"><span className="font-semibold">{strings.closes}</span><input className={field} type="datetime-local" dir="ltr" value={closes} onChange={e => setCloses(e.target.value)} /></label>
  {last && <p className="text-sm">{strings.latestStart}: <bdi>{formatAmman(last, locale)}</bdi></p>}
  <button className={button} disabled={busy} onClick={() => void save()}>{strings.schedule}</button>
  {message && <p role="status">{message}</p>}
 </section>;
}

export type StatusCounts = { notStarted: number; inProgress: number; submitted: number; graded: number; missed: number };
export function StatusBoard({ counts, strings }: { counts: StatusCounts; strings: SelfServiceStrings }) {
 const rows: Array<[keyof StatusCounts, number]> = [["notStarted", counts.notStarted], ["inProgress", counts.inProgress], ["submitted", counts.submitted], ["graded", counts.graded], ["missed", counts.missed]];
 return <section className="space-y-2" aria-labelledby="ss-status-title" data-testid="selfservice-status">
  <h2 id="ss-status-title" className="text-xl font-semibold">{strings.statusTitle}</h2>
  <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">{rows.map(([k, n]) => <div key={k} className="rounded border border-line p-3"><dt className="text-sm">{strings[k]}</dt><dd className="text-2xl font-semibold"><bdi>{n}</bdi></dd></div>)}</dl>
 </section>;
}

export type StudentItem = { id: string; name: string; window: WindowInfo | null; session: SessionInfo | null; sessionId?: string | null; track?: "mixed" | "full-practical"; audience?: "group" | "all-students" };
export function StudentExamList({ enabled, items, strings, locale, historyHref, onStart, busy = false }: { enabled: boolean; items: StudentItem[]; strings: SelfServiceStrings; locale: "en" | "ar"; historyHref: string; onStart: (id: string) => void; busy?: boolean }) {
 if (!enabled) return null;
 if (items.length === 0) return <p role="status" data-testid="selfservice-empty">{strings.empty}</p>;
 return <ul className="space-y-3" data-testid="selfservice-exams">{items.map(item => {
  const kind = studentExamKind(item.window, item.session);
  const w = item.window;
  return <li key={item.id} className="space-y-2 rounded border border-line p-4" data-state={kind}>
   <h3 className="font-semibold" dir="auto">{item.name}</h3>
   {item.audience && <p>{item.audience === "all-students" ? strings.quiz : strings.group}</p>}
   {kind === "upcoming" && w && <p>{fill(strings.upcoming, formatAmman(w.opensAt, locale))}</p>}
   {(kind === "open" || kind === "in-progress") && w && <><p>{fill(strings.open, formatAmman(w.closesAt, locale))}</p><button className={button} disabled={busy} onClick={() => onStart(item.id)}>{kind === "open" ? strings.start : strings.resume}</button></>}
   {kind === "submitted" && <><p>{strings.submittedBody}</p><a className="underline" href={historyHref}>{strings.historyLink}</a></>}
   {kind === "grading" && <><p>{strings.gradingBody}</p><a className="underline" href={historyHref}>{strings.historyLink}</a></>}
   {kind === "expired" && <p>{strings.expiredBody}</p>}
   {kind === "graded" && <><p>{strings.gradedBody}</p><a className="underline" href={historyHref}>{strings.historyLink}</a></>}
   {kind === "missed" && <p>{strings.missedBody}</p>}
   {kind === "cancelled" && <p>{strings.cancelledBody}</p>}
   {kind === "unavailable" && <p>{strings.unavailableBody}</p>}
  </li>;
 })}</ul>;
}
