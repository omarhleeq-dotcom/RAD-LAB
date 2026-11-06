// Home/Catalogue projection only. Detailed history keeps its original reader.
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseTrainingPage, readTraining, TrainingReadError, type TrainingAttempt, type TrainingSummaryData } from "./training";
import { SAVED_BATCH_PAGES, SAVED_PAGE_SIZE, type SavedCursor, type SavedResults } from "./saved-results";
import { backendFailure } from "./profile-read";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const timestamp = (s: string) => /^\d{4}-\d\d-\d\dT[\d:.]+(?:Z|[+-]\d\d:\d\d)$/.test(s) && Number.isFinite(Date.parse(s));
const columns = "id,exam_id,case_id,definition_version,comparison_version,engine_version,producer_version,result_format_version,finished_at,total:result->total,passed:result->passed,critical:result->critical,categories:result->categories";

/** JSON projection uses the installed PostgREST API. Keep every field validated
 * by the existing parser, including critical/categories; omit checks and other
 * display-unused result keys. Never infer a verdict or recompute a score. */
export async function readSavedSummary(client: SupabaseClient, user: string, signal: AbortSignal, onSummary?: (summary: TrainingSummaryData) => void): Promise<SavedResults> {
  const check = () => { if (signal.aborted) throw new TrainingReadError("error"); };
  check();
  if (!uuid.test(user)) throw new TrainingReadError("error");
  const reader = { rpc: (name: string, args: Record<string, unknown>) => client.rpc(name, args).abortSignal(signal) } as SupabaseClient;
  const overview = await readTraining(reader, { view: "summary", scope: "own", user });
  check();
  if (!overview.summary) throw new TrainingReadError("error");
  onSummary?.(overview.summary);
  const rows: TrainingAttempt[] = [];
  let next: SavedCursor | null = null;
  for (let page = 0; page < SAVED_BATCH_PAGES; page++) {
    check();
    let query = client.from("attempts").select(columns).eq("user_id", user).eq("mode", "practice").eq("record_kind", "attempt")
      .lte("finished_at", overview.boundary).order("finished_at", { ascending: false }).order("id", { ascending: true }).limit(SAVED_PAGE_SIZE + 1);
    if (next) query = query.or(`finished_at.lt.${next.time},and(finished_at.eq.${next.time},id.gt.${next.id})`);
    const { data, error, status } = await query.abortSignal(signal);
    check();
    if (error) { const kind = backendFailure(error, status); throw new TrainingReadError(kind === "expired" || kind === "denied" || kind === "schema" ? kind : "error"); }
    if (!Array.isArray(data) || data.length > SAVED_PAGE_SIZE + 1) throw new TrainingReadError("error");
    const selected = data.slice(0, SAVED_PAGE_SIZE).map(r => ({ id: r.id, exam: r.exam_id, case: r.case_id, definition: r.definition_version, comparison: r.comparison_version,
      engine: r.engine_version, producer: r.producer_version, format: r.result_format_version, time: r.finished_at,
      result: { total: r.total, passed: r.passed, critical: r.critical, categories: r.categories } }));
    for (let i = 0; i < selected.length; i += 20) parseTrainingPage({ version: 1, boundary: overview.boundary, summary: null, rows: selected.slice(i, i + 20), next: null }, "history");
    const parsed = selected as TrainingAttempt[];
    if (parsed.some(r => !uuid.test(r.id) || !timestamp(r.time))) throw new TrainingReadError("error");
    rows.push(...parsed);
    const last = parsed.at(-1);
    next = data.length > SAVED_PAGE_SIZE && last ? { time: last.time, id: last.id } : null;
    if (!next) break;
  }
  return { rows, summary: overview.summary, boundary: overview.boundary, next };
}
