// Pilot accounts configuration (RAD-041b, DECISIONS S-PILOT-4/5/6). The two NEXT_PUBLIC_ variables are inlined at build time;
// when either is missing or unusable the whole account feature is OFF: no link, no page content, no client, no network request.
import { assertPublishableKey, supabaseOrigin } from "../../../scripts/pages/headers.mjs";

export type PilotConfig = { readonly url: string; readonly key: string };

/** `null` = feature off. Never throws: a bad value (including a SECRET key) simply turns the feature off in the browser. */
export function readPilotConfig(env: { url?: string | undefined; key?: string | undefined }): PilotConfig | null {
  try {
    const url = supabaseOrigin(env.url);
    const key = assertPublishableKey(env.key);
    return url && key ? { url, key } : null;
  } catch {
    return null;
  }
}

// `process.env.NEXT_PUBLIC_*` must be written out in full so the bundler can inline the values.
export const PILOT = readPilotConfig({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

/** localStorage key supabase-js uses for the session: `sb-<project ref>-auth-token` (used only to know whether a session exists). */
export function sessionStorageKey(url: string): string {
  return `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
}
