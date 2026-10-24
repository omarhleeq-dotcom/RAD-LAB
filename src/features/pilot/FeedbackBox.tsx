"use client";

// Note box under the result panel (RAD-043b): a short free-text note linked to the SAVED attempt. Shown only when the pilot saved this
// attempt (approved + consented account); everyone else sees nothing. Best effort: a failure shows a retry message, never breaks the page.
import { ResultDisclosure } from "@/features/evaluation/ResultDisclosure";
import { useTranslations } from "next-intl";
import { useId, useState, useSyncExternalStore } from "react";
import { buildEventRow, buildFeedbackRow } from "./attempt-record";
import { getPilotClient } from "./client";
import { FEEDBACK_MAX, cleanNote, noteLength } from "./feedback";
import { savedAttempt } from "./saved-attempt";

type Phase = "idle" | "sending" | "sent" | "failed";

export function FeedbackBox({ examId }: { examId: string }) {
  const t = useTranslations("feedback");
  const tr = useTranslations("result");
  const saved = useSyncExternalStore(savedAttempt.subscribe, savedAttempt.get, () => null);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const uid = useId();

  if (!saved || saved.status !== "saved") return null;
  const note = cleanNote(text);
  const attemptId = saved.id;

  async function send() {
    if (!note) return;
    setPhase("sending");
    try {
      const client = await getPilotClient();
      if (!client) throw new Error("no client");
      const { error } = await client.from("feedback").insert(buildFeedbackRow(examId, attemptId, note));
      if (error) throw error;
      setPhase("sent");
      setText("");
      // Event payload: ids only, never the text.
      void Promise.resolve(client.from("events").insert(buildEventRow("feedback_sent", { exam_id: examId, attempt_id: attemptId }))).catch(() => undefined);
    } catch {
      setPhase("failed");
    }
  }

  return (
    <section aria-labelledby={`${uid}-h`} data-testid="feedback-box" className="mt-5 rounded-lg border border-line bg-panel p-4">
      <ResultDisclosure title={tr("addNote")}>
        <h2 id={`${uid}-h`} className="text-lg font-semibold">{t("title")}</h2>
        {phase === "sent" ? (
          <div className="mt-2">
            <p role="status" data-testid="feedback-sent">{t("sent")}</p>
            <button type="button" className="mt-3 rounded-md border border-line px-4 py-2" onClick={() => setPhase("idle")}>{t("another")}</button>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted">{t("hint")}</p>
            <p id={`${uid}-w`} className="mt-2 rounded-md border border-signal bg-signal/10 px-3 py-2 text-sm" data-testid="feedback-warning">{t("warning")}</p>
            <label htmlFor={`${uid}-t`} className="mt-3 block font-medium">{t("label")}</label>
            <textarea
              id={`${uid}-t`}
              dir="auto"
              rows={4}
              className="mt-1 block w-full rounded-md border border-line bg-paper px-3 py-2 text-base"
              value={text}
              disabled={phase === "sending"}
              aria-describedby={`${uid}-w ${uid}-c`}
              onChange={(e) => { setText(e.target.value); if (phase === "failed") setPhase("idle"); }}
            />
            <p id={`${uid}-c`} className={`mt-1 text-sm ${noteLength(text) > FEEDBACK_MAX ? "text-bad" : "text-muted"}`}>
              <span dir="ltr">{t("counter", { n: noteLength(text), max: FEEDBACK_MAX })}</span>
            </p>
            {phase === "failed" && <p role="alert" data-testid="feedback-failed" className="mt-2 text-bad">{t("failed")}</p>}
            <button type="button" disabled={!note || phase === "sending"} className="mt-3 rounded-md bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-strong disabled:opacity-60" onClick={() => void send()}>
              {phase === "sending" ? t("sending") : t("send")}
            </button>
          </>
        )}
      </ResultDisclosure>
    </section>
  );
}
