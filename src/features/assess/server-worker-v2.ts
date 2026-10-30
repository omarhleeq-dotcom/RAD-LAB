/** Dormant v2 host entrypoint. Importing installs no job and opens no connection. */
import { createGradingWorkerBindingV2, type WorkerBinding } from './server-runtime-v2';
import { runAssessJobsV2 } from './server-service-v2';
import type { AssessRpc, JobControls } from './server-service';
export const WORKER_VERSION_V2 = 'rad062-grading-worker/2';
export async function executeGradingWorkerV2(config: WorkerBinding, signal: AbortSignal, verify: () => Promise<void>,
 make: (c: WorkerBinding) => AssessRpc & { close(): Promise<void> } = createGradingWorkerBindingV2, observe?: JobControls['observe']) {
 let worker: (AssessRpc & { close(): Promise<void> }) | undefined;
 let code = 'unavailable'; let counts: { graded: number; failed: number } | undefined;
 try {
  await verify();
  if (signal.aborted) code = 'stopped';
  else {
   worker = make(config);
   counts = await runAssessJobsV2(worker, 1, signal, { stopBeforeFinalize: true, verify, observe });
   code = counts.failed ? 'grading_uncertain' : signal.aborted ? 'stopped' : 'complete';
  }
 } catch { /* No payload, identity or raw database errors leave this boundary. */ }
 finally { if (worker) try { await worker.close(); } catch { code = 'cleanup_failed'; } }
 return { contract: WORKER_VERSION_V2, outcome: code === 'complete' ? 'COMPLETE' : 'STOP', code,
  ...(counts ? { counts } : {}), reconciliationRequired: code !== 'complete', runtimeOrLaunchVerified: false };
}
