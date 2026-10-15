"use client";

// Account state for the account page (RAD-041b): session + own profile + the four actions. All network goes through getPilotClient().
import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { type AuthErrorKey, authErrorKey, parseProfile, type Profile } from "./account-state";
import { recordActivity } from "./activity";
import { CONSENT_VERSION, parseConsentVersion } from "./consent";
import { getPilotClient } from "./client";

export type AccountState =
  | { kind: "loading" }
  | { kind: "signedOut" }
  | { kind: "profileError"; email: string }
  | { kind: "signedIn"; email: string; userId: string; profile: Profile; consentVersion: string | null };

export type ActionResult = { ok: true } | { ok: false; error: AuthErrorKey };

export function useAccount(redirectTo: string) {
  const [state, setState] = useState<AccountState>({ kind: "loading" });
  const loaded = useRef<string | null>(null);

  const load = useCallback(async (session: Session | null, announce: boolean) => {
    const client = await getPilotClient();
    if (!client) return;
    if (!session) {
      loaded.current = null;
      setState({ kind: "signedOut" });
      return;
    }
    const email = session.user.email ?? "";
    const { data } = await client.from("profiles").select("status, role, participant_code, consent_version").eq("user_id", session.user.id).maybeSingle();
    const profile = parseProfile(data);
    if (!profile) {
      setState({ kind: "profileError", email });
      return;
    }
    setState({ kind: "signedIn", email, userId: session.user.id, profile, consentVersion: parseConsentVersion(data) });
    if (loaded.current !== session.user.id) {
      loaded.current = session.user.id;
      await recordActivity(client, profile.status, announce ? "signed_in" : "heartbeat");
    }
  }, []);

  useEffect(() => {
    let off: (() => void) | undefined;
    let cancelled = false;
    void getPilotClient()?.then(async (client) => {
      if (cancelled) return;
      const { data } = await client.auth.getSession();
      if (cancelled) return;
      await load(data.session, false);
      const sub = client.auth.onAuthStateChange((event, session) => {
        // INITIAL_SESSION / TOKEN_REFRESHED fire on their own; only a real sign-in or sign-out changes what the page shows.
        if (event === "SIGNED_OUT") void load(null, false);
        else if (event === "SIGNED_IN") void load(session, true);
      });
      off = () => sub.data.subscription.unsubscribe();
    });
    return () => {
      cancelled = true;
      off?.();
    };
  }, [load]);

  const signIn = useCallback(async (email: string, password: string): Promise<ActionResult> => {
    const client = await getPilotClient();
    if (!client) return { ok: false, error: "generic" };
    try {
      const { error } = await client.auth.signInWithPassword({ email, password });
      return error ? { ok: false, error: authErrorKey(error) } : { ok: true };
    } catch {
      return { ok: false, error: "network" };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<ActionResult> => {
    const client = await getPilotClient();
    if (!client) return { ok: false, error: "generic" };
    try {
      const { error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo, data: { consent_version: CONSENT_VERSION } } });
      return error ? { ok: false, error: authErrorKey(error) } : { ok: true };
    } catch {
      return { ok: false, error: "network" };
    }
  }, [redirectTo]);

  /** Existing accounts accept from the account page (a participant may update only the two consent columns of their own row). */
  const acceptTerms = useCallback(async (): Promise<boolean> => {
    const client = await getPilotClient();
    if (!client || state.kind !== "signedIn") return false;
    try {
      const { error } = await client.from("profiles").update({ consent_version: CONSENT_VERSION, consented_at: new Date().toISOString() }).eq("user_id", state.userId);
      if (error) return false;
      setState({ ...state, consentVersion: CONSENT_VERSION });
      return true;
    } catch {
      return false;
    }
  }, [state]);

  /** Survey link clicked: one event, ids-free (the code is already the user). Only for an approved, consenting account; never blocks the link. */
  const surveyOpened = useCallback(async () => {
    if (state.kind !== "signedIn" || state.profile.status !== "approved" || state.consentVersion !== CONSENT_VERSION) return;
    const client = await getPilotClient();
    if (client) await recordActivity(client, state.profile.status, "survey_opened");
  }, [state]);

  const signOut = useCallback(async () => {
    const client = await getPilotClient();
    if (!client) return;
    if (state.kind === "signedIn") await recordActivity(client, state.profile.status, "logout");
    await client.auth.signOut();
  }, [state]);

  const retry = useCallback(async () => {
    setState({ kind: "loading" });
    const client = await getPilotClient();
    const { data } = (await client?.auth.getSession()) ?? { data: { session: null } };
    await load(data.session, false);
  }, [load]);

  return { state, signIn, signUp, signOut, retry, acceptTerms, surveyOpened };
}
