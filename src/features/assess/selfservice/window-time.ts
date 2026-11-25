/** RAD-105 P2: pure window helpers. UTC in storage, Asia/Amman for people; mirrors the staged SQL rules (cap 7 days, no past start). */
export const AMMAN = 'Asia/Amman';
export const MAX_WINDOW_MS = 7 * 86_400_000;
export const DEFAULT_WINDOW_MS = 86_400_000;
const PAST_GRACE_MS = 60_000;
const parts = (ms: number, timeZone: string) => {
 const out: Record<string, string> = {};
 for (const p of new Intl.DateTimeFormat('en-CA', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(ms))) out[p.type] = p.value;
 return out;
};
/** "YYYY-MM-DDTHH:mm" in Amman for a UTC instant. */
export function utcToAmmanLocal(iso: string): string {
 const ms = Date.parse(iso);
 if (!Number.isFinite(ms)) return '';
 const p = parts(ms, AMMAN);
 return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
/** Amman wall-clock "YYYY-MM-DDTHH:mm" to a UTC ISO string; null for malformed or non-existent local times. */
export function ammanLocalToUtc(local: string): string | null {
 const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
 if (!m) return null;
 const wall = Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!);
 let guess = wall;
 for (let n = 0; n < 3; n++) {
  const p = parts(guess, AMMAN);
  const seen = Date.UTC(+p.year!, +p.month! - 1, +p.day!, +p.hour!, +p.minute!);
  guess += wall - seen;
 }
 return utcToAmmanLocal(new Date(guess).toISOString()) === local ? new Date(guess).toISOString() : null;
}
/** Human text in Amman time; Arabic keeps Latin digits for consistency with the rest of the app. */
export function formatAmman(iso: string, locale: 'en' | 'ar'): string {
 const ms = Date.parse(iso);
 if (!Number.isFinite(ms)) return '';
 return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-JO-u-nu-latn' : 'en-GB', { timeZone: AMMAN, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ms));
}
export type WindowError = 'invalid' | 'order' | 'cap' | 'past';
/** Same rules as assess.assignment_window_set_v1 for a first/pre-open schedule; the server stays authoritative. */
export function validateWindow(opensIso: string | null, closesIso: string | null, nowMs: number): WindowError | null {
 const o = opensIso ? Date.parse(opensIso) : NaN, c = closesIso ? Date.parse(closesIso) : NaN;
 if (!Number.isFinite(o) || !Number.isFinite(c)) return 'invalid';
 if (c <= o) return 'order';
 if (c - o > MAX_WINDOW_MS) return 'cap';
 if (o < nowMs - PAST_GRACE_MS || c <= nowMs) return 'past';
 return null;
}
/** Latest start that still gives a full-length attempt (the deadline is truncated at closes_at). */
export function latestFullStart(closesIso: string, durationSeconds: number): string | null {
 const c = Date.parse(closesIso);
 return Number.isFinite(c) && durationSeconds > 0 ? new Date(c - durationSeconds * 1000).toISOString() : null;
}
/** Default form values: next quarter hour (Amman wall clock) for 24 h. */
export function defaultWindow(nowMs: number): { opensLocal: string; closesLocal: string } {
 const start = Math.ceil((nowMs + 60_000) / 900_000) * 900_000;
 return { opensLocal: utcToAmmanLocal(new Date(start).toISOString()), closesLocal: utcToAmmanLocal(new Date(start + DEFAULT_WINDOW_MS).toISOString()) };
}
