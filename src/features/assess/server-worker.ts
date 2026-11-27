/** Local-only RAD-085 preparation. No scheduler, publisher, recovery writer or provider adapter. */
import { CASES } from "@/data/cases";
import { PRACTICE_EVALUATION_VERSION } from "@/features/evaluation/version";
import { ASSESS_EVALUATOR, caseVersion } from "./server-validation";
import { parseJobConfig } from "./server-job";
import { createGradingWorkerBinding, type WorkerBinding } from "./server-runtime";
import { runAssessJobs, type AssessRpc, type JobControls } from "./server-service";
import { judgeWitness, parseDbWitness, type WitnessStore } from "./witness";
export { gcsWitnessStore } from "./witness";

export const WORKER_VERSION = "rad085-grading-worker/1";
export function workerVersions() {
  return { worker: WORKER_VERSION, evaluator: ASSESS_EVALUATOR, practice: PRACTICE_EVALUATION_VERSION,
    cases: CASES.map(c => ({ id: c.id, version: caseVersion(c) })) };
}
type Worker = AssessRpc & { close(): Promise<void> };
type Recovery = () => Promise<void>;
/** The host verifier must freeze and recheck latest external evidence, completed
 * replay/maintenance and revoked capabilities. No launch_gate or snapshot flag. */
export async function executeGradingWorker(load: () => Promise<unknown>, signal: AbortSignal, verifyRecovery: Recovery,
  make: (config: WorkerBinding) => Worker = createGradingWorkerBinding, observe?: JobControls["observe"],
  /** RAD-105 P3, additive: omitted keeps today's one-attempt run. batch is 1..100; budgetMs bounds when a new claim may start. */
  options?: { batch?: number; budgetMs?: number;
    /** RAD-105 P5, additive: external restore witness. shadow only records; enforcing fails closed before any claim. */
    witness?: { mode: "shadow" | "enforcing"; projectRef: string; store: WitnessStore } }) {
  let worker: Worker | undefined;
  let code = "configuration";
  let counts: Record<string, number> | undefined;
  let gradeMilliseconds = 0, uncertain = false;
  let witnessReport: { mode: string; result: string; credentialDaysLeft?: number } | undefined;
  const began = performance.now();
  try {
    if (signal.aborted) { code = "stopped"; }
    else {
      const config = parseJobConfig(await load());
      code = "quarantined";
      await verifyRecovery();
      if (signal.aborted) code = "stopped";
      else {
        worker = make(config);
        code = "unavailable";
        const w = options?.witness;
        if (w) {
          // The tick happens inside health_v1 (P5 SQL); timestamps in the witness are the database clock's.
          let result = "db-witness-missing", db = null as ReturnType<typeof parseDbWitness>;
          try {
            db = parseDbWitness(((await worker.call<{ witness?: unknown }>("health_v1", {})) ?? {}).witness);
            const read = await w.store.read();
            const verdict = judgeWitness(w.projectRef, db, read === "unreadable" ? "unreadable" : read.value, w.mode);
            if (!verdict.ok) result = verdict.code;
            else if (read === "unreadable" || !(await w.store.write(verdict.next, read.generation))) result = "witness-write-failed";
            else result = verdict.action;
          } catch { result = "witness-unreadable"; }
          const passed = ["init", "advance", "adopt"].includes(result);
          witnessReport = { mode: w.mode, result,
            ...(db?.credentialValidUntil && Number.isFinite(Date.parse(db.credentialValidUntil)) ? { credentialDaysLeft: Math.floor((Date.parse(db.credentialValidUntil) - Date.parse(db.now)) / 86_400_000) } : {}) };
          if (!passed && w.mode === "enforcing") { code = "restore_suspected"; throw new Error("witness"); }
        }
        const batch = options?.batch ?? 1;
        const result = await runAssessJobs(worker, batch, signal, { stopBeforeFinalize: true, verify: verifyRecovery,
          ...(options?.budgetMs === undefined ? {} : { deadlineMs: began + options.budgetMs }), ...(batch > 1 ? { maintainLimit: 100 } : {}), observe: event => {
          if (event.phase === "grade") gradeMilliseconds += event.milliseconds;
          if (event.phase === "uncertain") uncertain = true;
          observe?.(event);
        } });
        const selected = { graded: result.graded, failed: result.failed,
          expired: result.maintenance.expired, purged: result.maintenance.purged,
          healthFailed: result.health.failed, alert: result.health.alert, overdue: result.health.overdue, purgeDue: result.health.purgeDue };
        if (Object.values(selected).some(n => !Number.isSafeInteger(n) || n < 0)) throw Error();
        counts = selected;
        code = result.failed ? "grading_uncertain" : "complete";
      }
    }
  } catch { if (uncertain) code = "grading_uncertain"; /* No raw failure payload. */ }
  finally { if (worker) try { await worker.close(); } catch { code = "cleanup_failed"; } }
  if (signal.aborted && code !== "cleanup_failed") code = "stopped";
  const usage = process.resourceUsage();
  return { contract: WORKER_VERSION, outcome: code === "complete" ? "COMPLETE" : "STOP", code,
    ...(counts ? { counts } : {}), ...(options?.batch && options.batch > 1 ? { batch: options.batch } : {}), ...(witnessReport ? { witness: witnessReport } : {}), milliseconds: Math.ceil(performance.now() - began), gradeMilliseconds: Math.ceil(gradeMilliseconds),
    resources: { userCpuMicroseconds: usage.userCPUTime, systemCpuMicroseconds: usage.systemCPUTime, maxRssKiB: usage.maxRSS },
    reconciliationRequired: code !== "complete", runtimeOrLaunchVerified: false };
}
