import type { SupabaseClient } from "@supabase/supabase-js";
import { parseProfile } from "./account-state";
import { parseConsentVersion } from "./consent";

export type ProfileReadFailure = "schema" | "network" | "expired" | "denied" | "missing" | "invalid" | "service";
export class ProfileReadError extends Error {
  constructor(readonly kind: ProfileReadFailure) { super("Account profile unavailable"); }
}

/** Classify structured errors only; server text can contain implementation or personal information. */
export function backendFailure(error: { code?: string; status?: number; name?: string }, status = error.status): ProfileReadFailure {
  if (status === 401) return "expired";
  if (status === 403 || error.code === "42501") return "denied";
  if (["42703", "42P01", "42883", "PGRST202", "PGRST204", "PGRST205"].includes(error.code ?? "")) return "schema";
  if (status === 0 || error.name === "TypeError" || error.name === "FetchError") return "network";
  return "service";
}

export async function readAccountProfile(client: SupabaseClient, userId: string) {
  try {
    const { data, error, status } = await client.from("profiles")
      .select("status, role, participant_code, consent_version, display_name")
      .eq("user_id", userId).limit(1).maybeSingle();
    if (error) throw new ProfileReadError(backendFailure(error, status));
    if (data === null) throw new ProfileReadError("missing");
    const profile = parseProfile(data);
    if (!profile || !(data.display_name === null || typeof data.display_name === "string")) throw new ProfileReadError("invalid");
    return { profile, consentVersion: parseConsentVersion(data), displayName: data.display_name as string | null };
  } catch (error) {
    if (error instanceof ProfileReadError) throw error;
    throw new ProfileReadError(backendFailure(error instanceof Error ? error : {}));
  }
}
