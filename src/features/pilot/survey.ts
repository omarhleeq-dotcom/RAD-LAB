// Survey link (RAD-043b, DECISIONS S-PILOT-11). The URL comes from the public build variable NEXT_PUBLIC_SURVEY_URL; absent or unusable = no link.
// The pseudonymous participant code (never the e-mail) is appended as `?code=` so the owner can join answers to a participant.
// A plain navigation to the survey tool (new tab): no request from the app, so the CSP and `preview:smoke` are unaffected.

/** `https://` only, no embedded credentials, no fragment trickery; anything else = null (feature off). Never throws. */
export function readSurveyUrl(raw: string | undefined): URL | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || !url.hostname.includes(".")) return null;
    return url;
  } catch {
    return null;
  }
}

/** The link to open: the survey URL with `code=<participant code>` (an existing `code` parameter is replaced). */
export function surveyHref(base: URL, participantCode: string): string {
  const url = new URL(base.toString());
  url.searchParams.set("code", participantCode);
  return url.toString();
}

// `process.env.NEXT_PUBLIC_*` must be written out in full so the bundler can inline the value.
export const SURVEY_URL = readSurveyUrl(process.env.NEXT_PUBLIC_SURVEY_URL);
