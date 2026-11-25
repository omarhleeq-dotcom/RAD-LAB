"use client";
import { useEffect, useState } from "react";
import { getPilotClient } from "./client";
import { useOptionalSessionAccount } from "./SessionGate";
import { needsConsent } from "./consent";
import { readSavedSummary } from "./saved-summary";
import type { SavedResults } from "./saved-results";
import { TrainingReadError, type TrainingSummaryData } from "./training";

export function useSavedSummary(user: string | null) {
  const account = useOptionalSessionAccount()?.state;
  const active = !!user && account?.kind === "signedIn" && account.userId === user && account.profile.status === "approved" && !needsConsent(account.consentVersion);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ account: typeof account; user: string; revision: number; summary?: TrainingSummaryData; data?: SavedResults; error?: TrainingReadError["kind"] }>();
  useEffect(() => {
    if (!active || !user) return;
    const controller = new AbortController();
    let cancelled = false;
    const promise = new Promise<SavedResults>((resolve, reject) => {
      controller.signal.addEventListener("abort", () => reject(new TrainingReadError("error")), { once: true });
      void (async () => {
        try {
          const client = await getPilotClient();
          if (!client || controller.signal.aborted) throw new TrainingReadError("error");
          const data = await readSavedSummary(client, user, controller.signal, summary => {
            if (!controller.signal.aborted) setResult({ account, user, revision, summary });
          });
          if (!controller.signal.aborted) resolve(data);
        } catch (error) { reject(error); }
      })();
    });
    // Bound the whole batch, including lazy client acquisition. Abort alone is
    // insufficient for a transport that ignores its signal; the promise rejects too.
    const timer = setTimeout(() => controller.abort(), 15_000);
    void promise.then(data => {
      if (!cancelled) setResult({ account, user, revision, summary: data.summary, data });
    }, error => {
      if (!cancelled) setResult({ account, user, revision, error: error instanceof TrainingReadError ? error.kind : "error" });
    }).finally(() => clearTimeout(timer));
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, [active, user, account, revision]);
  // The SessionProvider state object is the authorization generation. Hide old
  // values during render, before effect cleanup, including same-user reapproval.
  const current = active && result?.account === account && result?.user === user && result?.revision === revision ? result : undefined;
  return { data: current?.data, summary: current?.summary, error: current?.error, refresh: () => setRevision(v => v + 1) };
}
