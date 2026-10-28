// Consent to the Terms and Privacy page (RAD-043a, DECISIONS S-PILOT-10). Bump CONSENT_VERSION (a date) when the page's meaning changes:
// everyone is then asked again on the account page, and saving attempts pauses until they accept.
export const CONSENT_VERSION = "2026-10-27";

/** The consent version recorded on a `profiles` row; anything unexpected = null (treated as "not consented"). */
export function parseConsentVersion(row: unknown): string | null {
  if (typeof row !== "object" || row === null) return null;
  const v = (row as Record<string, unknown>).consent_version;
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

export const needsConsent = (recorded: string | null): boolean => recorded !== CONSENT_VERSION;
