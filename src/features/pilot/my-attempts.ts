// Saved Practice reads only. Reuses the existing record parser; never evaluates a saved attempt.
import type { SupabaseClient } from "@supabase/supabase-js";
import { ATTEMPT_COLUMNS, parseAttempt, type OwnerAttempt } from "./owner-data";

export const MY_ATTEMPTS_PAGE_SIZE = 20;
export const MY_ATTEMPT_COLUMNS = `${ATTEMPT_COLUMNS},mode,record_kind,producer_version,engine_version,settings_format_version,result_format_version`;
export type AttemptCursor = { time: string; id: string };
export type MyAttemptsPage = { items: OwnerAttempt[]; next: AttemptCursor | null };
export class AttemptsReadError extends Error {
  constructor(readonly kind: "error" | "expired") { super("Saved attempts unavailable"); }
}
const uuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v);
// Keep PostgreSQL microseconds, including ties; validate before putting a cursor in PostgREST's filter grammar.
const stamp = (v: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(v) && Number.isFinite(Date.parse(v));
const timeKey = (v: string) => BigInt(Date.parse(v)) * 1000n
  + BigInt((v.match(/\.(\d{1,6})(?:Z|[+-]\d{2}:\d{2})$/)?.[1] ?? "").padEnd(6, "0").slice(3));
const after = (a: AttemptCursor, b: AttemptCursor) => timeKey(a.time) < timeKey(b.time)
  || (timeKey(a.time) === timeKey(b.time) && a.id > b.id);

export async function readMyAttemptsPage(client: SupabaseClient, userId: string, cursor: AttemptCursor | null = null): Promise<MyAttemptsPage> {
  if (!uuid(userId) || (cursor && (!uuid(cursor.id) || !stamp(cursor.time)))) throw new AttemptsReadError("error");
  // RLS independently restricts participants. Explicit server equality also keeps an owner's account view own-only.
  let query = client.from("attempts").select(MY_ATTEMPT_COLUMNS)
    .eq("user_id", userId).eq("mode", "practice").eq("record_kind", "attempt")
    .order("finished_at", { ascending: false }).order("id", { ascending: true }).limit(MY_ATTEMPTS_PAGE_SIZE + 1);
  if (cursor) query = query.or(`finished_at.lt.${cursor.time},and(finished_at.eq.${cursor.time},id.gt.${cursor.id})`);
  const { data, error, status } = await query;
  if (error) throw new AttemptsReadError(status === 401 ? "expired" : "error");
  if (!Array.isArray(data) || data.length > MY_ATTEMPTS_PAGE_SIZE + 1) throw new AttemptsReadError("error");
  let previous = cursor;
  const items = data.map((row): OwnerAttempt => {
    // The locale FK in the current schema guarantees registration, without exposing the configuration table.
    const attempt = parseAttempt({ ...row, locale_registered: true });
    if (!attempt || attempt.userId !== userId || !uuid(attempt.id) || !stamp(attempt.finishedAt) || !stamp(attempt.startedAt)
      || !Number.isFinite(attempt.total) || !Number.isInteger(attempt.attemptNo) || attempt.attemptNo < 1
      || !Array.isArray(row.result.critical) || !row.result.critical.every((v: unknown) => typeof v === "string")
      || !Array.isArray(row.result.categories) || row.result.categories.length !== attempt.categories.length
      || !attempt.categories.every((v) => Number.isFinite(v.earned) && Number.isFinite(v.weight))
      || !Array.isArray(row.result.checks) || row.result.checks.length !== attempt.checks.length
      || !attempt.checks.every((v) => Number.isFinite(v.credit))) throw new AttemptsReadError("error");
    const current = { time: attempt.finishedAt, id: attempt.id };
    if (previous && !after(current, previous)) throw new AttemptsReadError("error");
    previous = current;
    return attempt;
  });
  const visible = items.slice(0, MY_ATTEMPTS_PAGE_SIZE);
  const last = visible.at(-1);
  return { items: visible, next: items.length > MY_ATTEMPTS_PAGE_SIZE && last ? { time: last.finishedAt, id: last.id } : null };
}
