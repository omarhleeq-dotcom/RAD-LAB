"use client";

// Loads every attempt and feedback note for the approved owner (RAD-044b). RLS decides what comes back: for anyone else the rows would be
// their own only, and this hook is not even mounted for them. Read-only: the owner page writes nothing to these tables.
import { useEffect, useState } from "react";
import { getPilotClient } from "./client";
import { ATTEMPT_COLUMNS, fetchAllPages, NOTE_COLUMNS, type OwnerAttempt, type OwnerNote, parseAttempts, parseNotes } from "./owner-data";

export type OwnerData =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; attempts: OwnerAttempt[]; notes: OwnerNote[]; skipped: number; truncated: boolean };

/** `version` is bumped by the page's Refresh button to read again. */
export function useOwnerData(enabled: boolean, version: number): OwnerData {
  const [data, setData] = useState<OwnerData>({ kind: "loading" });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void getPilotClient()?.then(async (client) => {
      const [a, n] = await Promise.all([
        fetchAllPages((from, to) => client.from("attempts").select(ATTEMPT_COLUMNS).order("finished_at", { ascending: false }).order("id").range(from, to)),
        fetchAllPages((from, to) => client.from("feedback").select(NOTE_COLUMNS).order("at", { ascending: false }).order("id").range(from, to)),
      ]);
      if (cancelled) return;
      if (!a || !n) return setData({ kind: "error" });
      const attempts = parseAttempts(a.rows), notes = parseNotes(n.rows);
      setData({ kind: "ready", attempts: attempts.items, notes: notes.items, skipped: attempts.skipped + notes.skipped, truncated: a.truncated || n.truncated });
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, version]);

  return data;
}
