"use client";

// Account state for the account page (RAD-041b): session + own profile + the four actions. All network goes through getPilotClient().
import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { type AuthErrorKey, authErrorKey, parseProfile, type Profile } from "./account-state";
import { recordActivity } from "./activity";
import { getPilotClient } from "./client";

export type AccountState =
  | { kind: "loading" }
  | { kind: "signedOut" }
  | { kind: "profileError"; email: string }
  | { kind: "signedIn"; email: string; userId: string; profile: Profile };

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
    const { data } = await client.from("profiles").select("status, role, participant_code").eq("user_id", session.user.id).maybeSingle();
    const profile = parseProfile(data);
    if (!profile) {
      setState({ kind: "profileError", email });
      return;
    }
    setState({ kind: "signedIn", email, userId: session.user.id, profile });
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
      const { error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
      return error ? { ok: false, error: authErrorKey(error) } : { ok: true };
    } catch {
      return { ok: false, error: "network" };
    }
  }, [redirectTo]);

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

  return { state, signIn, signUp, signOut, retry };
}
