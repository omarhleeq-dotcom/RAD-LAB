// Read-only display of saved results. Never imports or calls an evaluator.
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseTrainingPage, readTraining, TrainingReadError, type TrainingAttempt, type TrainingSummaryData } from "./training";
import { backendFailure } from "./profile-read";
export const SAVED_PAGE_SIZE = 100;
export const SAVED_BATCH_PAGES = 5;
export type SavedCursor = { time: string; id: string };
export type SavedResults = { rows: TrainingAttempt[]; summary: TrainingSummaryData; boundary: string; next: SavedCursor | null };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const timestamp = (s: string) => /^\d{4}-\d\d-\d\dT[\d:.]+(?:Z|[+-]\d\d:\d\d)$/.test(s) && Number.isFinite(Date.parse(s));

export async function readSavedResults(client: SupabaseClient, user: string, scope: "own" | "all" = "own", days: number | null = null, previous?: SavedResults): Promise<SavedResults> {
  if (!uuid.test(user)) throw new TrainingReadError("error");
  const overview = previous ?? await readTraining(client, { view: "summary", scope, user, days });
  if (!overview.summary) throw new TrainingReadError("error");
  const boundary = overview.boundary;
  let next: SavedCursor | null = previous?.next ?? null;
  const rows = previous ? [...previous.rows] : [];
  for (let page = 0; page < SAVED_BATCH_PAGES; page++) {
    let query = client.from("attempts").select("id,exam_id,case_id,definition_version,comparison_version,engine_version,producer_version,result_format_version,finished_at,result")
      .eq("user_id", user).eq("mode", "practice").eq("record_kind", "attempt").lte("finished_at", boundary)
      .order("finished_at", { ascending: false }).order("id", { ascending: true }).limit(SAVED_PAGE_SIZE + 1);
    if (days !== null) query = query.gte("finished_at", new Date(Date.parse(boundary) - days * 86400000).toISOString());
    if (next) {
      if (!uuid.test(next.id) || !timestamp(next.time)) throw new TrainingReadError("error");
      query = query.or(`finished_at.lt.${next.time},and(finished_at.eq.${next.time},id.gt.${next.id})`);
    }
    const { data, error, status } = await query;
    if (error) { const kind = backendFailure(error, status); throw new TrainingReadError(kind === "expired" || kind === "denied" || kind === "schema" ? kind : "error"); }
    if (!Array.isArray(data) || data.length > SAVED_PAGE_SIZE + 1) throw new TrainingReadError("error");
    const selected = data.slice(0, SAVED_PAGE_SIZE).map((r) => ({ id: r.id, exam: r.exam_id, case: r.case_id, definition: r.definition_version, comparison: r.comparison_version,
      engine: r.engine_version, producer: r.producer_version, format: r.result_format_version, time: r.finished_at, result: r.result }));
    // Reuse the existing versioned saved-history parser, in its bounded chunks.
    for (let i = 0; i < selected.length; i += 20) parseTrainingPage({ version: 1, boundary, summary: null, rows: selected.slice(i, i + 20), next: null }, "history");
    const parsed = selected as TrainingAttempt[];
    if (parsed.some((r) => !uuid.test(r.id) || !timestamp(r.time))) throw new TrainingReadError("error");
    rows.push(...parsed);
    const last = parsed.at(-1);
    next = data.length > SAVED_PAGE_SIZE && last ? { time: last.time, id: last.id } : null;
    if (!next) break;
  }
  return { rows, summary: overview.summary, boundary, next };
}
export function savedExamResults(rows: readonly TrainingAttempt[]) {
  const groups = new Map<string, { exam: string; last: TrainingAttempt; best: number; rows: TrainingAttempt[] }>();
  // Descending timestamp, then stable id, including equal timestamps across page boundaries.
  for (const row of [...rows].sort((a, b) => Date.parse(b.time) - Date.parse(a.time) || a.id.localeCompare(b.id))) {
    const group = groups.get(row.exam);
    if (group) { group.rows.push(row); group.best = Math.max(group.best, row.result.total); }
    else groups.set(row.exam, { exam: row.exam, last: row, best: row.result.total, rows: [row] });
  }
  return [...groups.values()];
}
// A saved pass outranks a saved failure, including a high score failed by a critical finding.
export function rankLastResults(rows: readonly TrainingAttempt[]) {
  return savedExamResults(rows).sort((a, b) => Number(a.last.result.passed) - Number(b.last.result.passed) || a.last.result.total - b.last.result.total || a.exam.localeCompare(b.exam));
}
