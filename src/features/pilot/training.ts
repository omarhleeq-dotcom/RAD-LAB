import type { SupabaseClient } from "@supabase/supabase-js";
import { backendFailure } from "./profile-read";

export type TrainingView = "summary" | "people" | "exams" | "history";
export type TrainingRequest = { view: TrainingView; scope: "own" | "all"; user?: string; exam?: string; search?: string; status?: string; days?: number | null; cursor?: Record<string, string> | null; boundary?: string | null };
export type TrainingSummaryData = { attempts: number; exams: number; latest: string | null; trainees: number | null };
export type Trainee = { id: string; name: string | null; email: string | null; status: "approved" | "pending" | "suspended"; attempts: number; exams: number; latest: string | null };
export type TrainingExam = { exam: string; attempts: number; latest: string };
export type TrainingAttempt = { id: string; exam: string; case: string; definition: string; comparison?: string | null; engine: string; producer: string; format: number; time: string; result: { total: number; passed: boolean; critical: string[]; categories: { c: string; earned: number; weight: number }[] } };
export type TrainingPage = { version: 1; boundary: string; summary: TrainingSummaryData | null; rows: (Trainee | TrainingExam | TrainingAttempt)[]; next: Record<string, string> | null };
export class TrainingReadError extends Error {
  constructor(readonly kind: "error" | "expired" | "denied" | "schema") { super("Training unavailable"); }
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const count = (v: unknown) => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const number = (v: unknown) => typeof v === "number" && Number.isFinite(v);
const string = (v: unknown) => typeof v === "string" && v.length > 0;
const stamp = (v: unknown) => typeof v === "string" && /^\d{4}-\d\d-\d\dT/.test(v) && Number.isFinite(Date.parse(v));
const nullableStamp = (v: unknown) => v === null || stamp(v);
export const validName = (v: string) => [...v.trim()].length >= 1 && [...v.trim()].length <= 100;

export function parseTrainingPage(raw: unknown, view: TrainingView): TrainingPage {
  const fail = () => { throw new TrainingReadError("error"); };
  if (!object(raw) || raw.version !== 1 || !stamp(raw.boundary) || !Array.isArray(raw.rows) || raw.rows.length > 20) return fail();
  if (raw.next !== null && (!object(raw.next) || !Object.values(raw.next).every(string)
    || (view === "people" && !string(raw.next.id)) || (view === "exams" && !string(raw.next.exam))
    || (view === "history" && (!string(raw.next.id) || !stamp(raw.next.time))) || view === "summary")) return fail();
  if (view === "summary") {
    const s = raw.summary;
    if (!object(s) || !count(s.attempts) || !count(s.exams) || !nullableStamp(s.latest) || !(s.trainees === null || count(s.trainees)) || raw.rows.length) return fail();
  }
  for (const row of raw.rows) {
    if (!object(row)) return fail();
    if (view === "people") {
      if (!string(row.id) || !(row.name === null || (typeof row.name === "string" && validName(row.name))) || !(row.email === null || typeof row.email === "string")
        || !["approved", "pending", "suspended"].includes(String(row.status)) || !count(row.attempts) || !count(row.exams) || !nullableStamp(row.latest)) return fail();
    } else if (view === "exams") {
      if (!string(row.exam) || !count(row.attempts) || !stamp(row.latest)) return fail();
    } else if (view === "history") {
      if (![row.id, row.exam, row.case, row.definition, row.engine, row.producer].every(string) || row.format !== 1 || !stamp(row.time)) return fail();
      if (row.comparison !== undefined && row.comparison !== null
        && (typeof row.comparison !== "string" || row.comparison.length > 100 || !/^radlab-comparison\/[1-9][0-9]*:[0-9a-f]{64}$/.test(row.comparison))) return fail();
      const r = row.result;
      if (!object(r) || !number(r.total) || typeof r.passed !== "boolean" || !Array.isArray(r.critical) || !r.critical.every(string)
        || !Array.isArray(r.categories) || !r.categories.every((c: unknown) => object(c) && string(c.c) && number(c.earned) && number(c.weight))) return fail();
    }
  }
  return raw as unknown as TrainingPage;
}

export async function readTraining(client: SupabaseClient, request: TrainingRequest): Promise<TrainingPage> {
  const { data, error, status } = await client.rpc("training_page_v1_with_comparison", {
    p_view: request.view, p_scope: request.scope, p_user: request.user ?? null, p_exam: request.exam ?? null,
    p_search: request.search ?? "", p_status: request.status ?? "", p_days: request.days ?? null,
    p_cursor: request.cursor ?? null, p_boundary: request.boundary ?? null, p_limit: 20,
  });
  if (error) {
    const kind = backendFailure(error, status);
    throw new TrainingReadError(kind === "schema" || kind === "expired" || kind === "denied" ? kind : "error");
  }
  return parseTrainingPage(data, request.view);
}

// New semantic identities and historical original fingerprints are separate domains.
// Neither domain joins unknown evaluators, producers, cases or result formats.
const knownComparison = (a: TrainingAttempt) => [a.definition, a.engine, a.producer].every((v) => v.trim().length > 0 && v !== "unknown")
  && (a.comparison == null || /^radlab-comparison\/1:[0-9a-f]{64}$/.test(a.comparison));
export function comparableAttempts(rows: TrainingAttempt[]): TrainingAttempt[] {
  const latest = rows[0];
  if (!latest || !knownComparison(latest)) return [];
  const key = (a: TrainingAttempt) => JSON.stringify([a.exam, a.case, a.comparison == null ? ["original", a.definition] : ["semantic", a.comparison], a.engine, a.producer, a.format]);
  return rows.filter((a) => knownComparison(a) && key(a) === key(latest)).reverse();
}

export function comparisonMessage(rows: TrainingAttempt[]): "notComparable" | "unknownComparison" | "differentComparison" | null {
  if (comparableAttempts(rows).length >= 2) return null;
  if (rows.some((a) => !knownComparison(a))) return "unknownComparison";
  return rows.length < 2 ? "notComparable" : "differentComparison";
}
