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
