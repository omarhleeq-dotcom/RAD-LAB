"use client";

// Saves Practice attempts and usage events for an approved pilot account (RAD-042). Renders nothing. Inactive (no import of
// supabase-js, no request) unless accounts are enabled in this build AND a saved session exists in this browser.
import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useSimulationStore } from "@/stores/simulation-store";
import { parseProfile, type ProfileStatus } from "./account-state";
import { createAttemptLogger, type Snapshot } from "./attempt-logger";
import { needsConsent, parseConsentVersion } from "./consent";
import { getPilotClient } from "./client";
import { PILOT, sessionStorageKey } from "./config";
import { savedAttempt, type SavedAttempt } from "./saved-attempt";

// Retain one detached observer only while the existing simulation snapshot and login session are unchanged.
// A locale navigation remounts React, but is not an exam-open, retry or submission transition.
let detached: {
  snapshot: Snapshot;
  session: string;
  context: { locale: string; saved: SavedAttempt; status: Promise<ProfileStatus | null> | null };
  logger: ReturnType<typeof createAttemptLogger>;
} | null = null;

function savedSession(): string | null {
  if (!PILOT) return null;
  try {
    return window.localStorage.getItem(sessionStorageKey(PILOT.url));
  } catch {
    return null;
  }
}

export function AttemptRecorder() {
  const locale = useLocale();
  useEffect(() => {
    const session = savedSession();
    if (!session) { detached = null; return; }
    const previous = detached?.snapshot === useSimulationStore.getState() && detached.session === session ? detached : null;
    detached = null;
    const context = previous?.context ?? { locale, saved: null, status: null as Promise<ProfileStatus | null> | null };
    context.locale = locale;
    context.status = null;
    const logger = previous?.logger ?? createAttemptLogger({
      getClient: async () => (await getPilotClient()) ?? null,
      getStatus: (client) => {
        context.status ??= (async () => {
          const { data: s } = await client.auth.getSession();
          if (!s.session) return null;
          const { data } = await client.from("profiles").select("status, role, participant_code, consent_version").eq("user_id", s.session.user.id).maybeSingle();
          const profile = parseProfile(data);
          // Nothing is saved until the participant accepted the current Terms and Privacy page (the database enforces it for attempts too).
          return profile && !needsConsent(parseConsentVersion(data)) ? profile.status : null;
        })().catch(() => null);
        return context.status;
      },
      report: (a) => { context.saved = a; savedAttempt.set(a); },
      locale: () => context.locale,
      device: () => ({ w: window.innerWidth, h: window.innerHeight, touch: window.matchMedia("(pointer: coarse)").matches }),
    });
    savedAttempt.set(context.saved);
    logger.onState(useSimulationStore.getState());
    const off = useSimulationStore.subscribe((state) => logger.onState(state));
    return () => {
      off();
      detached = { snapshot: useSimulationStore.getState(), session, context, logger };
      savedAttempt.set(null);
    };
  }, [locale]);
  return null;
}
