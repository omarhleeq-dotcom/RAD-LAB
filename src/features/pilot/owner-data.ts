// Pure rules for the owner's attempts + notes view and the CSV export (RAD-044b, DECISIONS S-PILOT-12). No React, no network.
// The rows come from `attempts` / `feedback`, which the approved owner may already read through RLS (no migration). Everything here is
// keyed by the pseudonymous participant code: the e-mail never enters these types, so it cannot reach a CSV by accident.
import type { CompactResult } from "./attempt-record";

export type OwnerAttempt = {
  readonly id: string;
  readonly userId: string;
  readonly attemptNo: number;
  readonly examId: string;
  readonly caseId: string;
  readonly definitionVersion: string;
  readonly locale: "en" | "ar";
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly total: number;
  readonly passed: boolean;
  readonly thresholdMet: boolean;
  readonly primaryVariant: string;
  readonly critical: readonly string[];
  readonly categories: CompactResult["categories"];
  readonly checks: CompactResult["checks"];
  readonly settings: Record<string, unknown>;
};

export type OwnerNote = {
  readonly id: string;
  readonly userId: string;
  readonly examId: string;
  readonly attemptId: string | null;
  readonly text: string;
  readonly at: string;
};

/** The columns the owner page selects: no `device`, and nothing that could name a person. */
export const ATTEMPT_COLUMNS = "id,user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale,started_at,finished_at";
export const NOTE_COLUMNS = "id,user_id,exam_id,attempt_id,text,at";

const str = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

/** One row of `attempts`; a malformed row is dropped (never guessed), the caller counts what was skipped. */
export function parseAttempt(row: unknown): OwnerAttempt | null {
  if (!isObj(row)) return null;
  const id = str(row.id), userId = str(row.user_id), examId = str(row.exam_id), caseId = str(row.case_id), version = str(row.definition_version);
  const startedAt = str(row.started_at), finishedAt = str(row.finished_at);
  const r = row.result;
  if (!id || !userId || !examId || !caseId || !version || !startedAt || !finishedAt) return null;
  if (typeof row.attempt_no !== "number" || !Number.isInteger(row.attempt_no) || (row.locale !== "en" && row.locale !== "ar")) return null;
  if (!isObj(r) || typeof r.total !== "number" || typeof r.passed !== "boolean" || !isObj(row.settings)) return null;
  const categories = Array.isArray(r.categories)
    ? r.categories.flatMap((c) => (isObj(c) && typeof c.c === "string" && typeof c.earned === "number" && typeof c.weight === "number" ? [{ c: c.c, earned: c.earned, weight: c.weight }] : []))
    : [];
  const checks = Array.isArray(r.checks)
    ? r.checks.flatMap((k) => (isObj(k) && typeof k.id === "string" && typeof k.o === "string" && typeof k.credit === "number" ? [{ id: k.id, o: k.o, credit: k.credit }] : []))
    : [];
  return {
    id, userId, attemptNo: row.attempt_no, examId, caseId, definitionVersion: version, locale: row.locale, startedAt, finishedAt,
    total: r.total, passed: r.passed, thresholdMet: r.thresholdMet === true, primaryVariant: typeof r.primaryVariant === "string" ? r.primaryVariant : "",
    critical: strings(r.critical), categories, checks, settings: row.settings,
  };
}

/** One row of `feedback` (`id` is a bigint: PostgREST may send it as a number). */
export function parseNote(row: unknown): OwnerNote | null {
  if (!isObj(row)) return null;
  const id = typeof row.id === "number" || typeof row.id === "string" ? String(row.id) : null;
  const userId = str(row.user_id), examId = str(row.exam_id), at = str(row.at);
  if (!id || !userId || !examId || !at || typeof row.text !== "string" || row.text.trim() === "") return null;
  if (row.attempt_id !== null && row.attempt_id !== undefined && str(row.attempt_id) === null) return null;
  return { id, userId, examId, attemptId: str(row.attempt_id), text: row.text, at };
}

export type Parsed<T> = { items: T[]; skipped: number };
function parseList<T>(rows: unknown, one: (r: unknown) => T | null): Parsed<T> {
  if (!Array.isArray(rows)) return { items: [], skipped: 0 };
  const items = rows.map(one).filter((x): x is T => x !== null);
  return { items, skipped: rows.length - items.length };
}
export const parseAttempts = (rows: unknown): Parsed<OwnerAttempt> => parseList(rows, parseAttempt);
export const parseNotes = (rows: unknown): Parsed<OwnerNote> => parseList(rows, parseNote);

export type PageResult = { data: unknown[] | null; error: unknown };

/**
 * Reads a table page by page (PostgREST returns at most 1000 rows per request) until a short page or `maxRows`.
 * `truncated` is true when the cap was hit with more rows possibly left, so the owner is told the export is partial.
 */
export async function fetchAllPages(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult>,
  pageSize = 1000,
  maxRows = 10000,
): Promise<{ rows: unknown[]; truncated: boolean } | null> {
  const rows: unknown[] = [];
  while (rows.length < maxRows) {
    const { data, error } = await fetchPage(rows.length, rows.length + pageSize - 1);
    if (error || !Array.isArray(data)) return null;
    rows.push(...data);
    if (data.length < pageSize) return { rows, truncated: false };
  }
  return { rows, truncated: true };
}

export type CodeOf = ReadonlyMap<string, string>;
const codeFor = (codes: CodeOf, userId: string) => codes.get(userId) ?? "unknown";

/** Newest first, the order the owner reads them in. */
export const newestFirst = <T extends { id: string }>(items: readonly T[], time: (x: T) => string): T[] =>
  [...items].sort((a, b) => new Date(time(b)).getTime() - new Date(time(a)).getTime() || (a.id < b.id ? -1 : 1));

export type ActivityByUser = { attempts: OwnerAttempt[]; notes: OwnerNote[] };
export function groupByUser(attempts: readonly OwnerAttempt[], notes: readonly OwnerNote[]): Map<string, ActivityByUser> {
  const out = new Map<string, ActivityByUser>();
  const slot = (id: string) => out.get(id) ?? (out.set(id, { attempts: [], notes: [] }), out.get(id)!);
  for (const a of newestFirst(attempts, (x) => x.finishedAt)) slot(a.userId).attempts.push(a);
  for (const n of newestFirst(notes, (x) => x.at)) slot(n.userId).notes.push(n);
  return out;
}

// ── CSV ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * One CSV field (RFC 4180 quoting). Text that starts with = + - @ or a tab / CR would be run as a formula by Excel / Sheets, so it gets a
 * leading apostrophe: notes are free text typed by participants, and an id or a note must never be able to execute anything in the owner's sheet.
 */
export function csvField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string") return String(value);
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) || safe !== safe.trim() ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/** UTF-8 byte-order mark first so Excel opens Arabic text correctly; CRLF row ends. */
export function toCsv(header: readonly string[], rows: readonly (readonly (string | number | boolean | null | undefined)[])[]): string {
  return `﻿${[header, ...rows].map((r) => r.map(csvField).join(",")).join("\r\n")}\r\n`;
}

export const ATTEMPT_CSV_HEADER = [
  "participant_code", "attempt_no", "attempt_id", "exam_id", "case_id", "definition_version", "language", "started_at_utc", "finished_at_utc",
  "duration_seconds", "score_total", "passed", "threshold_met", "primary_variant", "critical_findings", "category_scores", "scored_checks", "settings_json",
] as const;

const seconds = (a: string, b: string): number | "" => {
  const d = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 1000);
  return Number.isFinite(d) && d >= 0 ? d : "";
};

/** One row per saved attempt, ordered by participant code then time. Keys are the participant code only: no e-mail, no user id. */
export function attemptsCsv(attempts: readonly OwnerAttempt[], codes: CodeOf): string {
  const sorted = [...attempts].sort((a, b) => codeFor(codes, a.userId).localeCompare(codeFor(codes, b.userId)) || new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime() || (a.id < b.id ? -1 : 1));
  return toCsv(
    ATTEMPT_CSV_HEADER,
    sorted.map((a) => [
      codeFor(codes, a.userId), a.attemptNo, a.id, a.examId, a.caseId, a.definitionVersion, a.locale, a.startedAt, a.finishedAt,
      seconds(a.startedAt, a.finishedAt), a.total, a.passed, a.thresholdMet, a.primaryVariant, a.critical.join(";"),
      a.categories.map((c) => `${c.c}:${c.earned}/${c.weight}`).join(";"), a.checks.map((k) => `${k.id}:${k.o}:${k.credit}`).join(";"), JSON.stringify(a.settings),
    ]),
  );
}

export const NOTE_CSV_HEADER = ["participant_code", "note_id", "exam_id", "attempt_no", "attempt_id", "written_at_utc", "note"] as const;

/** One row per note; `attempt_no` is filled when the note points at an attempt we hold. */
export function notesCsv(notes: readonly OwnerNote[], attempts: readonly OwnerAttempt[], codes: CodeOf): string {
  const no = new Map(attempts.map((a) => [a.id, a.attemptNo]));
  const sorted = [...notes].sort((a, b) => codeFor(codes, a.userId).localeCompare(codeFor(codes, b.userId)) || new Date(a.at).getTime() - new Date(b.at).getTime() || (a.id < b.id ? -1 : 1));
  return toCsv(NOTE_CSV_HEADER, sorted.map((n) => [codeFor(codes, n.userId), n.id, n.examId, n.attemptId ? (no.get(n.attemptId) ?? "") : "", n.attemptId ?? "", n.at, n.text]));
}

/** `radlab-attempts-2026-10-16.csv` (local date, like the page's other stamps). */
export function csvFileName(kind: "attempts" | "notes", d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `radlab-${kind}-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.csv`;
}

// Versioned bounded RPC contract. Legacy parsers/CSV helpers above stay compatible.
export type OwnerStream = "participants" | "attempts" | "notes";
export type OwnerFilters = { participant: string; participantCode?: string; from: string; to: string; exam: string };
export const EMPTY_FILTERS: OwnerFilters = { participant: "", from: "", to: "", exam: "" };
export type Cursor = { time: string; id: string };
export type OwnerPage = { version: 1; boundary: string; total: number; pending: number; rows: Record<string, unknown>[]; next: Cursor | null };
export type RpcRead = (args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>;
const validTime = (v: unknown): v is string => typeof v === "string" && Number.isFinite(Date.parse(v));
// PostgreSQL emits microseconds. Date.parse alone would collapse different cursor times.
const timeKey = (v: string): bigint => BigInt(Date.parse(v)) * 1000n
  + BigInt((v.match(/\.(\d{1,6})(?:Z|[+-]\d{2}:\d{2})$/)?.[1] ?? "").padEnd(6, "0").slice(3, 6));
export function parseOwnerPage(value: unknown, limit = 100): OwnerPage {
  if (!isObj(value) || value.version !== 1 || !validTime(value.boundary)
    || !Number.isSafeInteger(value.total) || Number(value.total) < 0 || !Number.isSafeInteger(value.pending) || Number(value.pending) < 0
    || !Array.isArray(value.rows) || value.rows.length > limit || !value.rows.every(isObj)
    || (value.next !== null && (!isObj(value.next) || !validTime(value.next.time) || !str(value.next.id)))
    || (value.next !== null && value.rows.length === 0)) throw new Error("Invalid page contract");
  return value as OwnerPage;
}
export async function readOwnerPage(rpc: RpcRead, stream: OwnerStream, filters: OwnerFilters, cursor: Cursor | null = null, boundary: string | null = null, exporting = false, limit = 100): Promise<OwnerPage> {
  const response = await rpc({ p_stream: stream, p_limit: limit, p_cursor: cursor, p_boundary: boundary, p_export: exporting,
    p_participant: filters.participant || null, p_from: filters.from || null, p_to: filters.to || null, p_exam: stream === "participants" ? null : filters.exam || null });
  if (response.error) throw new Error("Owner read failed");
  const page = parseOwnerPage(response.data, limit);
  if (boundary && timeKey(page.boundary) !== timeKey(boundary)) throw new Error("Boundary changed");
  if (cursor && page.next && (timeKey(page.next.time) > timeKey(cursor.time)
    || (timeKey(page.next.time) === timeKey(cursor.time) && compareIds(page.next.id, cursor.id, stream) <= 0))) throw new Error("Cursor did not advance");
  let previous = cursor;
  for (const row of page.rows) {
    const time = row[stream === "participants" ? "created_at" : stream === "attempts" ? "finished_at" : "at"];
    const id = row[stream === "participants" ? "user_id" : "id"];
    if (!validTime(time) || typeof id !== "string" || !id) throw new Error("Invalid row cursor");
    if (timeKey(time) > timeKey(page.boundary) || (previous && (timeKey(time) > timeKey(previous.time)
      || (timeKey(time) === timeKey(previous.time) && compareIds(id, previous.id, stream) <= 0)))) throw new Error("Unordered or duplicate rows");
    previous = { time, id };
  }
  if (page.next && page.rows.length) {
    const last = page.rows[page.rows.length - 1]!;
    if (String(last[stream === "participants" ? "user_id" : "id"]) !== page.next.id
      || timeKey(String(last[stream === "participants" ? "created_at" : stream === "attempts" ? "finished_at" : "at"])) !== timeKey(page.next.time)) throw new Error("Truncated page");
  }
  return page;
}
function compareIds(a: string, b: string, stream: OwnerStream): number {
  if (stream === "notes") return BigInt(a) > BigInt(b) ? 1 : BigInt(a) === BigInt(b) ? 0 : -1;
  return a > b ? 1 : a === b ? 0 : -1;
}
/** One numbered file at a time: phone-compatible Blob download, memory bounded to one RPC page. */
export function exportOwnerPart(stream: "attempts" | "notes", page: OwnerPage): { csv: string; written: number; skipped: number } {
  const seen = new Set<string>();
  let skipped = 0;
  const rows: Record<string, unknown>[] = page.rows.flatMap((r) => {
    const code = str(r.participant_code), id = str(String(r.id ?? ""));
    if (!code || !id || seen.has(id) || !validTime(r[stream === "attempts" ? "finished_at" : "at"])
      || (stream === "notes" && r.attempt_id != null && (!Number.isInteger(r.attempt_no) || Number(r.attempt_no) < 1))) { skipped++; return []; }
    seen.add(id);
    return [{ ...r, user_id: code }];
  });
  if (stream === "attempts") {
    const parsed = parseAttempts(rows);
    const csv = toCsv(ATTEMPT_CSV_HEADER, parsed.items.map((a) => [
      a.userId, a.attemptNo, a.id, a.examId, a.caseId, a.definitionVersion, a.locale, a.startedAt, a.finishedAt,
      seconds(a.startedAt, a.finishedAt), a.total, a.passed, a.thresholdMet, a.primaryVariant, a.critical.join(";"),
      a.categories.map((c) => `${c.c}:${c.earned}/${c.weight}`).join(";"), a.checks.map((k) => `${k.id}:${k.o}:${k.credit}`).join(";"), JSON.stringify(a.settings),
    ]));
    return { csv, written: parsed.items.length, skipped: skipped + parsed.skipped };
  }
  const parsed = parseNotes(rows);
  // Attempt number comes from the SQL join even if the attempt is outside this page/filter.
  const no = new Map(rows.map((r) => [String(r.id), r.attempt_no as number | null]));
  const csv = toCsv(NOTE_CSV_HEADER, parsed.items.map((n) => [n.userId, n.id, n.examId, no.get(n.id) ?? "", n.attemptId ?? "", n.at, n.text]));
  return { csv, written: parsed.items.length, skipped: skipped + parsed.skipped };
}
