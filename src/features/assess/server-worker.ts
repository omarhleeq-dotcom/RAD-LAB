/** Local-only RAD-085 preparation. No scheduler, publisher, recovery writer or provider adapter. */
import { CASES } from "@/data/cases";
import { PRACTICE_EVALUATION_VERSION } from "@/features/evaluation/version";
import { ASSESS_EVALUATOR, caseVersion } from "./server-validation";
import { parseJobConfig } from "./server-job";
import { createGradingWorkerBinding, type WorkerBinding } from "./server-runtime";
import { runAssessJobs, type AssessRpc, type JobControls } from "./server-service";

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
  make: (config: WorkerBinding) => Worker = createGradingWorkerBinding, observe?: JobControls["observe"]) {
  let worker: Worker | undefined;
  let code = "configuration";
  let counts: Record<string, number> | undefined;
  let gradeMilliseconds = 0, uncertain = false;
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
        const result = await runAssessJobs(worker, 1, signal, { stopBeforeFinalize: true, verify: verifyRecovery, observe: event => {
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
    ...(counts ? { counts } : {}), milliseconds: Math.ceil(performance.now() - began), gradeMilliseconds: Math.ceil(gradeMilliseconds),
    resources: { userCpuMicroseconds: usage.userCPUTime, systemCpuMicroseconds: usage.systemCPUTime, maxRssKiB: usage.maxRSS },
    reconciliationRequired: code !== "complete", runtimeOrLaunchVerified: false };
}
