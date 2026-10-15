// Sign-in / sign-out / last-activity events (RAD-041b, S-PILOT-4 (5)). Best effort: a failure here must never block or break the UI,
// and only an approved user can write (RLS, migration 20261015000100). No free text and no personal data in the payload.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileStatus } from "./account-state";

export type ActivityType = "signed_in" | "heartbeat" | "logout";

export async function recordActivity(client: SupabaseClient, status: ProfileStatus | null, type: ActivityType): Promise<void> {
  try {
    if (status === "approved") await client.from("events").insert({ type });
    else if (status !== null) await client.rpc("touch_last_seen"); // pending / suspended: the owner can still see they came back
  } catch {
    /* best effort */
  }
}
