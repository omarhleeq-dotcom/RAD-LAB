"use client";
import { useEffect, useState } from "react";
import { getPilotClient } from "./client";
import { readSavedResults, type SavedResults } from "./saved-results";
import { TrainingReadError } from "./training";
export function useSavedResults(user: string | null, scope: "own" | "all" = "own", days: number | null = null) {
  const key = JSON.stringify([user, scope, days]);
  const [revision, setRevision] = useState(0);
  const [load, setLoad] = useState<{ key: string; data: SavedResults }>();
  const [result, setResult] = useState<{ key: string; data?: SavedResults; error?: "error" | "expired" | "denied" | "schema" }>();
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      try {
        const client = await getPilotClient();
        if (!client) throw new TrainingReadError("error");
        const data = await readSavedResults(client, user, scope, days, load?.key === key ? load.data : undefined);
        if (!cancelled) { setResult({ key, data }); setBusy(false); }
      } catch (e) {
        if (!cancelled) { setResult({ key, error: e instanceof TrainingReadError ? e.kind : "error" }); setBusy(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [key, user, scope, days, revision, load]);
  return { data: user && result?.key === key ? result.data : undefined, error: user && result?.key === key ? result.error : undefined, busy,
    refresh: () => { setLoad(undefined); setBusy(true); setRevision(v => v + 1); },
    loadOlder: () => { if (result?.key === key && result.data?.next) { setBusy(true); setLoad({ key, data: result.data }); } } };
}
