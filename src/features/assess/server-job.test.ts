import { expect, it, vi } from "vitest";
import { spawnSync } from "node:child_process";
import { executeAssessJob, parseJobConfig } from "./server-job";
import type { AssessRpc } from "./server-service";

const config = { host: "synthetic.invalid", port: 5432, database: "synthetic", user: "assess_job_qa", password: "SYNTHETIC_PRIVATE", ca: "-----BEGIN CERTIFICATE-----synthetic" };
function fixture(stop?: AbortController) {
  const close = vi.fn(async () => {}), calls: string[] = [];
  const worker: AssessRpc & { close: typeof close } = { close, async call<T>(name: string): Promise<T> {
    calls.push(name);
    if (name === "maintain_v1") return { expired: 0, purged: 0, private: "SYNTHETIC_PRIVATE" } as T;
    if (name === "claim_v1") { stop?.abort(); return null as T; }
    if (name === "health_v1") return { failed: 0, alert: 0, overdue: 0, purgeDue: 0, claims: "SYNTHETIC_PRIVATE" } as T;
    throw new Error("SYNTHETIC_PRIVATE");
  } };
  return { worker, close, calls };
}
it("parses only the six explicit fields and fixes the pool to one", () => {
  expect(parseJobConfig(config)).toEqual({ ...config, connections: 1 });
  for (const bad of [null, [], {}, { ...config, connectionString: "SYNTHETIC_PRIVATE" }, { ...config, user: null }, { ...config, port: "5432" }, { ...config, password: "" }]) {
    expect(() => parseJobConfig(bad)).toThrow("configuration");
  }
});
it("performs one bounded tick and outputs counters only", async () => {
  const { worker, calls, close } = fixture(); const make = vi.fn(() => worker);
  const result = await executeAssessJob(async () => config, new AbortController().signal, make);
  expect(result).toMatchObject({ outcome: "COMPLETE", code: "complete", counts: { graded: 0, failed: 0 }, runtimeOrLaunchVerified: false });
  expect(calls).toEqual(["maintain_v1", "claim_v1", "health_v1"]);
  expect(make).toHaveBeenCalledWith({ ...config, connections: 1 }); expect(close).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(result)).not.toMatch(/SYNTHETIC_PRIVATE|claims|password|private/);
});
it("does not load config or create a worker on pre-abort", async () => {
  const stop = new AbortController(); stop.abort(); const load = vi.fn(), make = vi.fn();
  expect(await executeAssessJob(load, stop.signal, make)).toMatchObject({ outcome: "STOP", code: "stopped" });
  expect(load).not.toHaveBeenCalled(); expect(make).not.toHaveBeenCalled();
});
it("does not connect if stopped during secret loading", async () => {
  const stop = new AbortController(), make = vi.fn();
  expect(await executeAssessJob(async () => { stop.abort(); return config; }, stop.signal, make)).toMatchObject({ code: "stopped" });
  expect(make).not.toHaveBeenCalled();
});
it("redacts secret loading and configuration failures before creating a worker", async () => {
  const make = vi.fn();
  for (const load of [async () => { throw new Error("SYNTHETIC_PRIVATE"); }, async () => ({ ...config, extra: "SYNTHETIC_PRIVATE" })]) {
    expect(await executeAssessJob(load, new AbortController().signal, make)).toEqual({ contract: "assess-job/1", outcome: "STOP", code: "configuration", runtimeOrLaunchVerified: false });
  }
  expect(make).not.toHaveBeenCalled();
});
it("waits for tick and cleanup after signal instead of reporting complete", async () => {
  const stop = new AbortController(), { worker, calls, close } = fixture(stop);
  const result = await executeAssessJob(async () => config, stop.signal, () => worker);
  expect(result).toMatchObject({ outcome: "STOP", code: "stopped" });
  expect(calls).toEqual(["maintain_v1", "claim_v1", "health_v1"]); expect(close).toHaveBeenCalledTimes(1);
});
it.each(["maintain_v1", "claim_v1", "health_v1"])("redacts %s failure, closes and omits fabricated counters", async stage => {
  const { worker, close } = fixture(), call = worker.call;
  worker.call = async <T>(name: string) => { if (name === stage) throw { message: "SYNTHETIC_PRIVATE", claims: config }; return call<T>(name, {}); };
  expect(await executeAssessJob(async () => config, new AbortController().signal, () => worker)).toEqual({ contract: "assess-job/1", outcome: "STOP", code: "unavailable", runtimeOrLaunchVerified: false });
  expect(close).toHaveBeenCalledTimes(1);
});
it("does not classify grading uncertainty as a successful job or replay", async () => {
  const { worker, close } = fixture(), call = worker.call, names: string[] = [];
  worker.call = (async (name: string) => {
    names.push(name);
    if (name === "claim_v1") return { attemptId: "private", token: "private", publication: {}, answers: {}, locked: [] };
    if (name === "fail_v1") return null;
    return call(name, {});
  }) as AssessRpc["call"];
  expect(await executeAssessJob(async () => config, new AbortController().signal, () => worker)).toMatchObject({ outcome: "STOP", code: "grading_uncertain", counts: { graded: 0, failed: 1 } });
  expect(names).toEqual(["maintain_v1", "claim_v1", "fail_v1", "health_v1"]); expect(close).toHaveBeenCalledTimes(1);
});
it("rejects malformed counters and surfaces cleanup failure without raw details", async () => {
  const { worker, close } = fixture(), call = worker.call;
  worker.call = async <T>(name: string) => name === "health_v1" ? { failed: "SYNTHETIC_PRIVATE" } as T : call<T>(name, {});
  expect(await executeAssessJob(async () => config, new AbortController().signal, () => worker)).toMatchObject({ code: "unavailable" });
  close.mockRejectedValue(new Error("SYNTHETIC_PRIVATE"));
  expect(await executeAssessJob(async () => config, new AbortController().signal, () => worker)).toEqual({ contract: "assess-job/1", outcome: "STOP", code: "cleanup_failed", runtimeOrLaunchVerified: false });
});
it("builds a curated context and the actual entrypoint refuses unset config/flags without a connection", () => {
  const built = spawnSync(process.execPath, ["scripts/assess/build-runtime.mjs"], { encoding: "utf8", timeout: 15000 });
  expect(built.status, built.stderr).toBe(0); const { output } = JSON.parse(built.stdout);
  for (const args of [[], ["--url=SYNTHETIC_PRIVATE"]]) {
    const child = spawnSync(process.execPath, [`${output}/job-main.mjs`, ...args], { encoding: "utf8", timeout: 10000, env: { ASSESS_JOB_ENABLED: "", NODE_ENV: "test" } });
    expect(child.status).toBe(1); expect(child.stderr).toBe("");
    expect(JSON.parse(child.stdout)).toEqual({ contract: "assess-job/1", outcome: "STOP", code: "configuration", runtimeOrLaunchVerified: false });
  }
});
