// Pure helpers that shape a saved Practice attempt (RAD-042). The evaluation engine is not touched: this only COPIES what it already
// produced into a compact, bounded JSON object. No free text, no personal data (the DB also bounds sizes: migration 20261017000100).
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import type { EvaluationResult } from "@/features/evaluation/types";
import { evaluationVersion } from "@/features/evaluation/version";

export type RecordKind = "attempt" | "event" | "feedback";
export const PILOT_WRITER_VERSION = "radlab-pilot-writer/1";
export const RECORD_FORMAT_FIELDS = {
  attempt: ["settings_format_version", "result_format_version"],
  event: ["payload_format_version"],
  feedback: ["note_format_version"],
} as const;
const COMMON_FIELDS = ["mode", "record_kind", "producer_version", "engine_version"] as const;
const ALL_CONTRACT_FIELDS = [...COMMON_FIELDS, ...Object.values(RECORD_FORMAT_FIELDS).flat(), "locale_registered"];
export type RecordStamps<K extends RecordKind> = {
  mode: "practice"; record_kind: K; producer_version: string; engine_version: string;
};
export type KnownRecordContract = {
  legacy: boolean; mode: "practice"; kind: RecordKind; producerVersion: string; engineVersion: string; formatVersions: readonly number[];
};
export function recordStamps<K extends RecordKind>(kind: K): RecordStamps<K> {
  return { mode: "practice", record_kind: kind, producer_version: PILOT_WRITER_VERSION, engine_version: "unknown" };
}
/** Absent metadata is the historical v1 path; partial/unknown metadata is rejected, never guessed. */
export function readRecordContract(row: Record<string, unknown>, kind: RecordKind): KnownRecordContract | null {
  if (!ALL_CONTRACT_FIELDS.some((key) => Object.hasOwn(row, key))) {
    return { legacy: true, mode: "practice", kind, producerVersion: "unknown", engineVersion: "unknown", formatVersions: RECORD_FORMAT_FIELDS[kind].map(() => 1) };
  }
  if (row.mode !== "practice" || row.record_kind !== kind
    || typeof row.producer_version !== "string" || row.producer_version.length < 1 || row.producer_version.length > 100
    || typeof row.engine_version !== "string" || row.engine_version.length < 1 || row.engine_version.length > 100
    || !RECORD_FORMAT_FIELDS[kind].every((key) => row[key] === 1)) return null;
  // A field for another kind is not a compatible record contract.
  if (Object.entries(RECORD_FORMAT_FIELDS).some(([k, keys]) => k !== kind && keys.some((key) => Object.hasOwn(row, key)))) return null;
  return { legacy: false, mode: "practice", kind, producerVersion: row.producer_version, engineVersion: row.engine_version, formatVersions: RECORD_FORMAT_FIELDS[kind].map(() => 1) };
}
export function buildEventRow(type: string, payload: Record<string, unknown> = {}) {
  return { type, payload, payload_format_version: 1, ...recordStamps("event") };
}
export function buildFeedbackRow(examId: string, attemptId: string, text: string) {
  return { exam_id: examId, attempt_id: attemptId, text, note_format_version: 1, ...recordStamps("feedback") };
}

export type AttemptRow = RecordStamps<"attempt"> & {
  settings_format_version: 1;
  result_format_version: 1;
  id: string;
  attempt_no: number;
  exam_id: string;
  case_id: string;
  definition_version: string;
  settings: SimulationSettings;
  result: CompactResult;
  locale: string;
  device: Device;
  started_at: string;
  finished_at: string;
};

export type CompactResult = {
  total: number;
  passed: boolean;
  thresholdMet: boolean;
  primaryVariant: string;
  critical: string[];
  categories: { c: string; earned: number; weight: number }[];
  checks: { id: string; o: string; credit: number }[];
};

export type Device = { w: number; h: number; touch: boolean };

/** `RadCase.id` is `<exam>` for the default case and `<exam>/<case>` otherwise (publicCaseId). */
export function splitCaseId(id: string): { examId: string; caseId: string } {
  const i = id.indexOf("/");
  return i < 0 ? { examId: id, caseId: "default" } : { examId: id.slice(0, i), caseId: id.slice(i + 1) };
}

export function compactResult(r: EvaluationResult): CompactResult {
  return {
    total: r.score.total,
    passed: r.score.passed,
    thresholdMet: r.score.thresholdMet,
    primaryVariant: r.primaryVariant,
    critical: r.criticalFindings.map((f) => f.id),
    categories: r.score.categories.map((c) => ({ c: c.category, earned: c.earned, weight: c.weight })),
    checks: r.checks.filter((k) => k.scored).map((k) => ({ id: k.ruleId, o: k.outcome, credit: k.credit })),
  };
}

/** Short stable fingerprint of the composed case definition (the exam + case data the attempt was scored against). */
export async function definitionVersion(c: RadCase): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(c));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest).slice(0, 8), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function buildAttemptRow(a: {
  id: string;
  radCase: RadCase;
  version: string;
  attemptNo: number;
  settings: SimulationSettings;
  result: EvaluationResult;
  locale: string;
  device: Device;
  startedAt: Date;
  finishedAt: Date;
}): AttemptRow {
  const { examId, caseId } = splitCaseId(a.radCase.id);
  return {
    id: a.id,
    attempt_no: a.attemptNo,
    exam_id: examId,
    case_id: caseId,
    definition_version: a.version,
    settings: a.settings,
    result: compactResult(a.result),
    locale: a.locale,
    settings_format_version: 1,
    result_format_version: 1,
    ...recordStamps("attempt"),
    engine_version: evaluationVersion(a.result),
    device: a.device,
    started_at: a.startedAt.toISOString(),
    finished_at: a.finishedAt.toISOString(),
  };
}
