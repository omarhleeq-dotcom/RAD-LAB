// Build-time CSP helper for the static export (RAD-041a, DECISIONS S-PILOT-5).
// `public/_headers` keeps `connect-src 'self'`; when the pilot's Supabase project is configured, `finalize-headers.mjs`
// adds exactly ONE origin to it in `out/_headers`. Nothing is added when the variable is empty or unset.

const HOST = /^[a-z0-9-]+\.supabase\.co$/;

/** Returns the validated origin (e.g. `https://abcd.supabase.co`) or `null` when `raw` is empty / unset. Throws on anything else. */
export function supabaseOrigin(raw) {
  const value = (raw ?? "").trim();
  if (value === "") return null;
  let url;
  try { url = new URL(value); } catch { throw new Error(`NEXT_PUBLIC_SUPABASE_URL is not a URL: ${JSON.stringify(value)}`); }
  if (url.protocol !== "https:" || !HOST.test(url.hostname) || url.port !== "" || url.username || url.password || url.search || url.hash || !/^\/*$/.test(url.pathname)) {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL must be https://<project>.supabase.co (got ${JSON.stringify(value)})`);
  }
  return url.origin;
}

/** Adds `origin` to the single `connect-src 'self'` directive of a `_headers` file. Throws if the directive is not found exactly once. */
export function withConnectSrc(headersText, origin) {
  const needle = "connect-src 'self';";
  const parts = headersText.split(needle);
  if (parts.length !== 2) throw new Error(`expected exactly one "${needle}" in _headers, found ${parts.length - 1}`);
  return `${parts[0]}connect-src 'self' ${origin};${parts[1]}`;
}

/**
 * Guard for NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (RAD-041b): everything NEXT_PUBLIC_* is shipped to every visitor's browser,
 * so a SECRET key put there by mistake must stop the build. Returns the trimmed key, or null when empty / unset.
 * Accepts the new `sb_publishable_…` keys and the legacy `anon` JWT; refuses `sb_secret_…` and any JWT whose role is not `anon`.
 */
export function assertPublishableKey(raw) {
  const key = (raw ?? "").trim();
  if (key === "") return null;
  if (/^[A-Z_]+=/.test(key)) throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must hold only the key, not a `NAME=value` line: remove the leading `NEXT_PUBLIC_…=` so it starts with sb_publishable_.");
  if (key.startsWith("sb_secret_")) throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY holds a SECRET key (sb_secret_…). Never publish it; use the publishable key (sb_publishable_…).");
  if (key.startsWith("sb_publishable_")) {
    // A real key is `sb_publishable_` + a long random token. Refuse a placeholder such as "sb_publishable_…" or "sb_publishable_xxx".
    if (!/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key)) throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY looks like a placeholder, not a real key (expected sb_publishable_ followed by at least 16 letters, digits, - or _).");
    return key;
  }
  const parts = key.split(".");
  if (parts.length === 3) {
    let role;
    try { role = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))).role; } catch { role = undefined; }
    if (role === "anon") return key;
    throw new Error(`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is a JWT with role ${JSON.stringify(role)}; only the publishable / anon key may be public.`);
  }
  throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not a recognised publishable key (expected sb_publishable_…).");
}
