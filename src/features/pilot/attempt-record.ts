// Pure helpers that shape a saved Practice attempt (RAD-042). The evaluation engine is not touched: this only COPIES what it already
// produced into a compact, bounded JSON object. No free text, no personal data (the DB also bounds sizes: migration 20261017000100).
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import type { EvaluationResult } from "@/features/evaluation/types";

export type AttemptRow = {
  id: string;
  attempt_no: number;
  exam_id: string;
  case_id: string;
  definition_version: string;
  settings: SimulationSettings;
  result: CompactResult;
  locale: "en" | "ar";
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
    locale: a.locale === "ar" ? "ar" : "en",
    device: a.device,
    started_at: a.startedAt.toISOString(),
    finished_at: a.finishedAt.toISOString(),
  };
}
