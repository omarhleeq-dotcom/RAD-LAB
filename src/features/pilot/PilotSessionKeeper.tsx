"use client";

// Site-wide "last activity" (RAD-041b): when a saved session exists, writes a heartbeat at most every 5 minutes while the tab is visible.
// SessionGate mounts this only after useAccount has loaded the profile and recorded the first activity.
// Reuse that profile and start the interval after its first heartbeat; never duplicate the initial read/write.
import { useEffect } from "react";
import { HEARTBEAT_MS, type ProfileStatus, shouldHeartbeat } from "./account-state";
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

export function PilotSessionKeeper({ profileStatus }: { profileStatus: ProfileStatus }) {
  useEffect(() => {
    if (!hasSavedSession()) return;
    let stop = false;
    const status = profileStatus;
    let last: number | null = Date.now();

    const tick = async () => {
      if (stop || document.visibilityState !== "visible") return;
      if (last !== null && Date.now() - last < HEARTBEAT_MS) return; // cheap check before any network
      const client = await getPilotClient();
      if (!client || stop) return;
      const { data: s } = await client.auth.getSession();
      if (!s.session) return;
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
  }, [profileStatus]);
  return null;
}
