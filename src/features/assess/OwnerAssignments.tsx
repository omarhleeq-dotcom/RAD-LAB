"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { getPilotClient } from "@/features/pilot/client";
import { useSessionAccount } from "@/features/pilot/SessionGate";
import { closeOwnerAssignment, OwnerAssignmentError, readOwnerAssignments, type AssignmentFailure, type OwnerAssignment, type OwnerAssignmentPage } from "./owner-assignments";

const control = "min-h-11 min-w-0 max-w-full break-words rounded-lg border border-line bg-panel px-4 py-2 disabled:opacity-60";
async function client() {
  const c = await getPilotClient();
  if (!c) throw new OwnerAssignmentError("unavailable");
  return c;
}
/** Defence in depth; OwnerPanel also unmounts its entire owner subtree on identity/role changes. */
export function OwnerAssignments() {
  const { state } = useSessionAccount();
  return state.kind === "signedIn" && state.profile.role === "owner" && state.profile.status === "approved"
    ? <AssignmentList key={state.userId}/> : null;
}
function AssignmentList() {
  const t = useTranslations("ownerAssignments");
  const [page, setPage] = useState<OwnerAssignmentPage>();
  const [cursor, setCursor] = useState<string | null>(null);
  const [selected, setSelected] = useState<OwnerAssignment>();
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState<AssignmentFailure | "closed" | null>(null);
  const active = useRef<AbortController | null>(null);
  const locked = useRef(true);
  useEffect(() => {
    const c = new AbortController(); active.current = c; locked.current = true;
    void client().then(s => readOwnerAssignments(s, null, c.signal)).then(result => {
      if (!c.signal.aborted) setPage(result);
    }).catch(error => { if (!c.signal.aborted) setNotice(error instanceof OwnerAssignmentError ? error.kind : "unavailable"); }).finally(() => {
      if (!c.signal.aborted) { locked.current = false; setBusy(false); }
    });
    return () => { c.abort(); active.current?.abort(); };
  }, []);
  async function run(after: string | null, assignment?: OwnerAssignment) {
    if (locked.current) return;
    locked.current = true;
    active.current?.abort();
    const c = new AbortController(); active.current = c;
    setBusy(true); setPage(undefined); setSelected(undefined); setNotice(null);
    const current = () => !c.signal.aborted && active.current === c;
    let message: AssignmentFailure | "closed" | null = null;
    try {
      const s = await client();
      if (!current()) return;
      if (assignment) {
        try { await closeOwnerAssignment(s, assignment, c.signal); message = "closed"; }
        catch (error) {
          const kind = error instanceof OwnerAssignmentError ? error.kind : "ambiguous";
          if (kind !== "conflict") throw error;
          // A rejected stale revision is safe to re-read; never re-send the write.
          message = "conflict";
          if (current()) setNotice(message);
        }
      }
      if (!current()) return;
      const result = await readOwnerAssignments(s, after, c.signal);
      if (current()) { setPage(result); setCursor(after); setNotice(message); }
    } catch (error) {
      if (current()) setNotice(message === "conflict" ? "conflict" : message === "closed" ? "closed" : error instanceof OwnerAssignmentError ? error.kind : "unavailable");
    } finally {
      if (current()) { locked.current = false; setBusy(false); }
    }
  }
  return <section className="min-w-0 space-y-3 rounded-xl border border-line p-3" aria-label={t("title")} aria-busy={busy}>
    <h3 className="text-lg font-semibold">{t("title")}</h3>
    <p className="text-sm text-muted">{t("hint")}</p>
    {busy && <p role="status">{t("loading")}</p>}
    {notice && <p role={notice === "closed" ? "status" : "alert"}>{t(notice)}</p>}
    {!busy && !page && <p>{t("readRequired")}</p>}
    <button className={control} disabled={busy} onClick={() => void run(cursor)}>{t("read")}</button>
    {page && <>
      {!page.rows.length && <p>{t("empty")}</p>}
      <ul className="space-y-4">{page.rows.map(a => <li key={a.id} className="min-w-0 space-y-2 break-words">
        <p><bdi>{a.name}</bdi></p>
        <p>{a.closedAt ? <>{t("closedAt")}: <time dateTime={a.closedAt} dir="ltr" className="inline-block">{new Date(a.closedAt).toISOString()}</time></> : t("open")}</p>
        {!a.closedAt && <button className={control} disabled={busy} onClick={() => setSelected(a)}>{t("close")}</button>}
        {selected?.id === a.id && <div role="group" aria-label={t("confirmTitle")} className="space-y-2 rounded-lg border border-line p-3">
          <p>{t("confirmText", { name: a.name })}</p>
          <div className="flex flex-wrap gap-2">
            <button className={control} disabled={busy} onClick={() => void run(cursor, selected)}>{t("confirm")}</button>
            <button className={control} disabled={busy} onClick={() => setSelected(undefined)}>{t("keep")}</button>
          </div>
        </div>}
      </li>)}</ul>
      <div className="flex flex-wrap gap-2">
        <button className={control} disabled={busy || !cursor} onClick={() => void run(null)}>{t("first")}</button>
        <button className={control} disabled={busy || !page.next} onClick={() => void run(page.next)}>{t("next")}</button>
      </div>
    </>}
  </section>;
}
