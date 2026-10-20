/** Private, finite job lifecycle. No timer, HTTP endpoint, credential discovery or automatic recovery. */
import { createWorkerBinding, type WorkerBinding } from "./server-runtime";
import { runAssessJobs, type AssessRpc } from "./server-service";

type Worker = AssessRpc & { close(): Promise<void> };
export interface JobReport {
  contract: "assess-job/1";
  outcome: "COMPLETE" | "STOP";
  code: "complete" | "configuration" | "stopped" | "unavailable" | "grading_uncertain" | "cleanup_failed";
  counts?: Record<string, number>;
  runtimeOrLaunchVerified: false;
}
export function parseJobConfig(raw: unknown): WorkerBinding {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("configuration");
  const keys = ["host", "port", "database", "user", "password", "ca"];
  const config = raw as Record<string, unknown>;
  if (Object.keys(config).length !== keys.length || keys.some(key => !Object.hasOwn(config, key)) ||
      keys.filter(key => key !== "port").some(key => typeof config[key] !== "string" || !config[key] || String(config[key]).length > 32768) ||
      typeof config.port !== "number" || !Number.isInteger(config.port) || config.port < 1 || config.port > 65535) throw new Error("configuration");
  // A fresh object excludes prototype/extra fields and fixes this first job to pool=1.
  return { host: config.host as string, port: config.port, database: config.database as string,
    user: config.user as string, password: config.password as string, ca: config.ca as string, connections: 1 };
}

export async function executeAssessJob(load: () => Promise<unknown>, signal: AbortSignal,
  make: (config: WorkerBinding) => Worker = createWorkerBinding): Promise<JobReport> {
  let worker: Worker | undefined;
  let code: JobReport["code"] = "configuration", counts: JobReport["counts"];
  try {
    if (signal.aborted) return { contract: "assess-job/1", outcome: "STOP", code: "stopped", runtimeOrLaunchVerified: false };
    const config = parseJobConfig(await load());
    if (signal.aborted) return { contract: "assess-job/1", outcome: "STOP", code: "stopped", runtimeOrLaunchVerified: false };
    worker = make(config);
    code = "unavailable";
    const result = await runAssessJobs(worker, 1, signal);
    // Copy only bounded counters, never serialize a worker response wholesale.
    const candidates = {
      expired: result.maintenance.expired, purged: result.maintenance.purged,
      ...(result.maintenance.reservationsPurged === undefined ? {} : { reservationsPurged: result.maintenance.reservationsPurged }),
      ...(result.maintenance.consentsPurged === undefined ? {} : { consentsPurged: result.maintenance.consentsPurged }),
      graded: result.graded, failed: result.failed,
      healthFailed: result.health.failed, alert: result.health.alert, overdue: result.health.overdue, purgeDue: result.health.purgeDue,
    };
    if (Object.values(candidates).some(value => !Number.isSafeInteger(value) || value < 0)) throw new Error();
    counts = candidates;
    code = result.failed > 0 ? "grading_uncertain" : "complete";
  } catch { /* No raw message/code/detail, config, claims or private responses in the report. */ }
  finally {
    if (worker) { try { await worker.close(); } catch { code = "cleanup_failed"; } }
  }
  if (signal.aborted && code !== "cleanup_failed") code = "stopped";
  return { contract: "assess-job/1", outcome: code === "complete" ? "COMPLETE" : "STOP", code,
    ...(counts ? { counts } : {}), runtimeOrLaunchVerified: false };
}

/** Shared by the real entrypoint and synthetic child-process QA. Handlers precede config loading. */
export async function runAssessJobProcess(load: () => Promise<unknown>, make?: (config: WorkerBinding) => Worker) {
  const stop = new AbortController(), onStop = () => stop.abort();
  process.on("SIGTERM", onStop); process.on("SIGINT", onStop);
  try {
    const report = await executeAssessJob(load, stop.signal, make);
    return { report, exitCode: report.code === "stopped" ? 130 : report.outcome === "COMPLETE" ? 0 : 1 };
  } finally { process.off("SIGTERM", onStop); process.off("SIGINT", onStop); }
}
