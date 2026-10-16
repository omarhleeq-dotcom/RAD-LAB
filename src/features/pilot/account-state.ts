// Pure rules for the account page and the activity heartbeat (RAD-041b). No React, no network: tested in account-state.test.ts.

export type ProfileStatus = "pending" | "approved" | "suspended";
export type ProfileRole = "participant" | "owner";
export type Profile = { readonly status: ProfileStatus; readonly role: ProfileRole; readonly code: string };

/** Message key (under `account.errors.`) for a Supabase Auth error. Unknown errors are generic; nothing reveals whether an e-mail exists. */
export type AuthErrorKey = "invalidCredentials" | "emailNotConfirmed" | "rateLimited" | "weakPassword" | "signupDisabled" | "invalidEmail" | "samePassword" | "network" | "generic";

export function authErrorKey(error: { code?: string | undefined; status?: number | undefined; name?: string | undefined } | null | undefined): AuthErrorKey {
  if (!error) return "generic";
  switch (error.code) {
    case "invalid_credentials": return "invalidCredentials";
    case "email_not_confirmed": return "emailNotConfirmed";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit": return "rateLimited";
    case "weak_password": return "weakPassword";
    case "signup_disabled": return "signupDisabled";
    case "email_address_invalid": return "invalidEmail";
    case "same_password": return "samePassword";
    default: break;
  }
  if (error.status === 429) return "rateLimited";
  if (error.name === "AuthRetryableFetchError" || error.status === 0) return "network";
  return "generic";
}

/**
 * What the address fragment of the account page says (RAD-046). Supabase redirects a reset link to `/account#access_token=…&type=recovery`
 * (implicit flow), and an expired or already used link to `/account#error=…&error_code=…`. The fragment is read once, before supabase-js clears it.
 * Anything else, including a sign-up confirmation, is `null` and changes nothing.
 */
export function recoveryFromHash(hash: string): "recovery" | "linkError" | null {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  if (params.get("type") === "recovery" && params.has("access_token")) return "recovery";
  if (params.has("error") && params.has("error_code")) return "linkError";
  return null;
}

/** The password rule enforced by the project (owner decision S-PILOT-6): min 8 with lower, upper, digit and symbol. Checked client-side for fast feedback only; the server decides. */
export const PASSWORD_MIN = 8;
export function passwordProblem(password: string): "short" | "classes" | null {
  if (password.length < PASSWORD_MIN) return "short";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) return "classes";
  return null;
}

export function isStatus(v: unknown): v is ProfileStatus {
  return v === "pending" || v === "approved" || v === "suspended";
}

/** Reads a `profiles` row returned by the API; anything unexpected = null (the page shows a retry state, never a guess). */
export function parseProfile(row: unknown): Profile | null {
  if (typeof row !== "object" || row === null) return null;
  const r = row as Record<string, unknown>;
  if (!isStatus(r.status) || (r.role !== "participant" && r.role !== "owner") || typeof r.participant_code !== "string") return null;
  return { status: r.status, role: r.role, code: r.participant_code };
}

/** Heartbeat = "last activity" (Plan §5). Any signed-in user with a known profile may beat (approved → an `events` row, pending / suspended → `touch_last_seen`, see activity.ts); at most one per interval; never while the tab is hidden. */
export const HEARTBEAT_MS = 5 * 60 * 1000;
export function shouldHeartbeat(input: { status: ProfileStatus | null; visible: boolean; nowMs: number; lastMs: number | null }): boolean {
  if (input.status === null || !input.visible) return false;
  return input.lastMs === null || input.nowMs - input.lastMs >= HEARTBEAT_MS;
}
