// Turns simulation-store transitions into saved attempts + usage events (RAD-042). No React, no engine change: it only OBSERVES the
// store snapshots it is given. Best effort: any failure is swallowed so the simulator never breaks; only approved accounts write
// (the database enforces it too). Nothing is sent unless a pilot session exists (the component checks before creating the logger).
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RadCase } from "@/domain/case";
import type { SimulationPhase, SimulationSettings } from "@/domain/simulation";
import type { EvaluationResult } from "@/features/evaluation/types";
import type { ProfileStatus } from "./account-state";
import { buildAttemptRow, definitionVersion, splitCaseId, type Device } from "./attempt-record";
import type { SavedAttempt } from "./saved-attempt";

export type Snapshot = {
  activeCase: RadCase | null;
  settings: SimulationSettings | null;
  phase: SimulationPhase;
  result: EvaluationResult | null;
  attempt: number;
};

export type LoggerDeps = {
  getClient: () => Promise<SupabaseClient | null>;
  getStatus: (client: SupabaseClient) => Promise<ProfileStatus | null>;
  locale: () => string;
  device: () => Device;
  now?: () => Date;
  uuid?: () => string;
  /** Tells the feedback box which attempt the result shows and whether its row was saved (RAD-043b). */
  report?: (a: SavedAttempt) => void;
};

export function createAttemptLogger(deps: LoggerDeps) {
  const now = deps.now ?? (() => new Date());
  const uuid = deps.uuid ?? (() => crypto.randomUUID());
  let prev: Snapshot | null = null;
  let attemptId = uuid();
  let startedAt = now();
  let started = false;
  let chain: Promise<void> = Promise.resolve();

  const report = deps.report ?? (() => undefined);

  /** Serialised so events keep their order; never rejects. Resolves true only when the job ran without an error. */
  const run = (job: (client: SupabaseClient) => Promise<void>): Promise<boolean> => {
    const done = chain.then(async () => {
      try {
        const client = await deps.getClient();
        if (!client) return false;
        if ((await deps.getStatus(client)) !== "approved") return false;
        await job(client);
        return true;
      } catch {
        return false; /* best effort */
      }
    });
    chain = done.then(() => undefined);
    return done;
  };

  const event = (type: string, payload: Record<string, unknown>) =>
    run(async (client) => {
      await client.from("events").insert({ type, payload });
    });

  const ids = (c: RadCase) => {
    const { examId, caseId } = splitCaseId(c.id);
    return { exam_id: examId, case_id: caseId };
  };

  function onState(s: Snapshot) {
    const p = prev;
    prev = s;
    const c = s.activeCase;
    if (!c) return;

    if (!p || p.activeCase?.id !== c.id) {
      attemptId = uuid();
      startedAt = now();
      started = false;
      report(null);
      void event("exam_opened", { ...ids(c), attempt_id: attemptId });
      return;
    }
    if (p.phase === "result" && s.phase === "setup") {
      attemptId = uuid();
      startedAt = now();
      started = false;
      report(null);
      if (s.attempt > p.attempt) void event("attempt_retry", { ...ids(c), attempt_no: s.attempt, attempt_id: attemptId });
      return;
    }
    if (s.phase === "setup" && !started && JSON.stringify(p.settings) !== JSON.stringify(s.settings)) {
      started = true;
      void event("attempt_started", { ...ids(c), attempt_no: s.attempt, attempt_id: attemptId });
      return;
    }
    if (p.phase === "setup" && s.phase === "result" && s.result && s.settings) {
      const id = attemptId;
      const { result, settings } = s;
      const finishedAt = now();
      const row = definitionVersion(c).then((version) =>
        buildAttemptRow({ id, radCase: c, version, attemptNo: s.attempt, settings, result, locale: deps.locale(), device: deps.device(), startedAt, finishedAt }),
      );
      report({ id, status: "pending" });
      void run(async (client) => {
        const { error } = await client.from("attempts").insert(await row);
        if (error) throw new Error("attempt not saved");
      }).then((saved) => {
        if (attemptId === id) report({ id, status: saved ? "saved" : "unavailable" });
      });
      void event("attempt_submitted", { ...ids(c), attempt_no: s.attempt, attempt_id: id, score: result.score.total });
    }
  }

  return { onState };
}
