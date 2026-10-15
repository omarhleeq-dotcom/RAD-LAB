"use client";

// Site-wide "last activity" (RAD-041b): when a saved session exists, writes a heartbeat at most every 5 minutes while the tab is visible.
// Visitors without a session never load supabase-js and make no request. Mounted in the layout only when accounts are enabled.
import { useEffect } from "react";
import { HEARTBEAT_MS, type ProfileStatus, parseProfile, shouldHeartbeat } from "./account-state";
import { recordActivity } from "./activity";
import { getPilotClient } from "./client";
import { PILOT, sessionStorageKey } from "./config";

function hasSavedSession(): boolean {
  if (!PILOT) return false;
  try {
    return window.localStorage.getItem(sessionStorageKey(PILOT.url)) !== null;
  } catch {
    return false;
  }
}

export function PilotSessionKeeper() {
  useEffect(() => {
    if (!hasSavedSession()) return;
    let stop = false;
    let status: ProfileStatus | null = null;
    let last: number | null = null;

    const tick = async () => {
      if (stop || document.visibilityState !== "visible") return;
      if (last !== null && Date.now() - last < HEARTBEAT_MS) return; // cheap check before any network
      const client = await getPilotClient();
      if (!client || stop) return;
      const { data: s } = await client.auth.getSession();
      if (!s.session) return;
      if (status === null) {
        const { data } = await client.from("profiles").select("status, role, participant_code").eq("user_id", s.session.user.id).maybeSingle();
        status = parseProfile(data)?.status ?? null;
      }
      if (!shouldHeartbeat({ status, visible: document.visibilityState === "visible", nowMs: Date.now(), lastMs: last })) return;
      last = Date.now();
      await recordActivity(client, status, "heartbeat");
    };

    void tick();
    const timer = window.setInterval(() => void tick(), 60_000);
    const onVisible = () => void tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return null;
}
