"use client";

// Saves Practice attempts and usage events for an approved pilot account (RAD-042). Renders nothing. Inactive (no import of
// supabase-js, no request) unless accounts are enabled in this build AND a saved session exists in this browser.
import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useSimulationStore } from "@/stores/simulation-store";
import { parseProfile, type ProfileStatus } from "./account-state";
import { createAttemptLogger } from "./attempt-logger";
import { needsConsent, parseConsentVersion } from "./consent";
import { getPilotClient } from "./client";
import { PILOT, sessionStorageKey } from "./config";
import { savedAttempt } from "./saved-attempt";

function hasSavedSession(): boolean {
  if (!PILOT) return false;
  try {
    return window.localStorage.getItem(sessionStorageKey(PILOT.url)) !== null;
  } catch {
    return false;
  }
}

export function AttemptRecorder() {
  const locale = useLocale();
  useEffect(() => {
    if (!hasSavedSession()) return;
    let status: Promise<ProfileStatus | null> | null = null;
    const logger = createAttemptLogger({
      getClient: async () => (await getPilotClient()) ?? null,
      getStatus: (client) => {
        status ??= (async () => {
          const { data: s } = await client.auth.getSession();
          if (!s.session) return null;
          const { data } = await client.from("profiles").select("status, role, participant_code, consent_version").eq("user_id", s.session.user.id).maybeSingle();
          const profile = parseProfile(data);
          // Nothing is saved until the participant accepted the current Terms and Privacy page (the database enforces it for attempts too).
          return profile && !needsConsent(parseConsentVersion(data)) ? profile.status : null;
        })().catch(() => null);
        return status;
      },
      report: (a) => savedAttempt.set(a),
      locale: () => locale,
      device: () => ({ w: window.innerWidth, h: window.innerHeight, touch: window.matchMedia("(pointer: coarse)").matches }),
    });
    logger.onState(useSimulationStore.getState());
    const off = useSimulationStore.subscribe((state) => logger.onState(state));
    return () => {
      off();
      savedAttempt.set(null);
    };
  }, [locale]);
  return null;
}
