// The ONE place that creates the Supabase browser client (RAD-041b). Loaded lazily so visitors without a session never download it,
// and never created when the feature is off. Only the publishable key is available here (see config.ts / headers.mjs guard).
import type { SupabaseClient } from "@supabase/supabase-js";
import { PILOT } from "./config";

let pending: Promise<SupabaseClient> | null = null;

/** `null` when accounts are not enabled in this build. */
export function getPilotClient(): Promise<SupabaseClient> | null {
  if (!PILOT) return null;
  const { url, key } = PILOT;
  pending ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" } }),
  );
  return pending;
}
