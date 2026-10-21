/** Local library only. No entrypoint, configuration discovery, deployment or auto-run. */
import { createWorkerBinding, type WorkerBinding } from "../../src/features/assess/server-runtime";
import { executeAssessJob } from "../../src/features/assess/server-job";
import { AssessServiceError, type AssessRpc } from "../../src/features/assess/server-service";

const names = {
  maintain_v1: "trial_maintain_v1", claim_v1: "trial_claim_v1", health_v1: "trial_health_v1",
  finish_v1: "trial_finish_v1", fail_v1: "trial_fail_v1",
} as const;
type Worker = AssessRpc & { close(): Promise<void> };

/** Always uses guarded RPCs. Missing SQL/disabled scope is a failure, never fallback. */
export function scopedTrialWorker(trial: string, worker: Worker): Worker {
  if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(trial)) throw new AssessServiceError("invalid");
  return {
    call<T>(name: string, args: Record<string, unknown>): Promise<T> {
      if (!Object.hasOwn(names, name) || Object.hasOwn(args, "p_trial")) throw new AssessServiceError("invalid");
      return worker.call<T>(names[name as keyof typeof names], { ...args, p_trial: trial });
    },
    close: () => worker.close(),
  };
}

/** Reuses one-tick cancellation, redaction and drain. Neither prepares nor arms SQL.
 * Caller must supply a reviewed scope UUID separately from the unchanged secret.
 */
export function executeTrialJob(trial: string, load: () => Promise<unknown>, signal: AbortSignal,
  make: (config: WorkerBinding) => Worker = createWorkerBinding) {
  return executeAssessJob(async () => {
    if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(trial)) throw new AssessServiceError("invalid");
    return load();
  }, signal, config => scopedTrialWorker(trial, make(config)));
}
