import { expect, it, vi } from "vitest";
import { executeGradingWorker, workerVersions } from "./server-worker";
import { runAssessJobs } from "./server-service";
import { mixedFixture } from "../../../scripts/assess/d-fixture";
const config = { host: "synthetic.invalid", port: 5432, database: "synthetic", user: "synthetic_worker", password: "SYNTHETIC_SECRET", ca: "-----BEGIN CERTIFICATE-----synthetic" };
const claim = () => ({ attemptId: "private", token: "private", publication: mixedFixture(), answers: {}, locked: [] });
function fixture(hook?: (name: string) => void) {
  const calls: string[] = [];
  const close = vi.fn(async () => {});
  const worker = { close, async call<T>(name: string): Promise<T> {
    calls.push(name); hook?.(name);
    return ({ maintain_v1: { expired: 0, purged: 0 }, claim_v1: claim(), finish_v1: null,
      health_v1: { failed: 0, alert: 0, overdue: 0, purgeDue: 0 } } as Record<string, unknown>)[name] as T;
  } };
  return { calls, close, worker };
}
it("requires an external recovery verifier before constructing any connection", async () => {
  const make = vi.fn();
  const result = await executeGradingWorker(async () => config, new AbortController().signal, async () => { throw Error("SYNTHETIC_SECRET"); }, make);
  expect(result).toMatchObject({ outcome: "STOP", code: "quarantined" });
  expect(make).not.toHaveBeenCalled(); expect(JSON.stringify(result)).not.toContain("SYNTHETIC_SECRET");
});
it("does not load or construct on STOP before startup", async () => {
  const signal = new AbortController(); signal.abort(); const load = vi.fn(), make = vi.fn(), verify = vi.fn();
  expect(await executeGradingWorker(load, signal.signal, verify, make)).toMatchObject({ code: "stopped" });
  expect(load).not.toHaveBeenCalled(); expect(make).not.toHaveBeenCalled(); expect(verify).not.toHaveBeenCalled();
});
it.each(["maintain_v1", "claim_v1"])("STOP at %s leaves the claimed lease and never finalizes", async stage => {
  const stop = new AbortController(), f = fixture(name => { if (name === stage) stop.abort(); });
  await runAssessJobs(f.worker, 1, stop.signal, { stopBeforeFinalize: true });
  expect(f.calls).not.toContain("finish_v1"); expect(f.calls).not.toContain("fail_v1");
});
it("STOP immediately before finalize leaves lease recovery to SQL", async () => {
  const stop = new AbortController(), f = fixture(); let n = 0;
  await runAssessJobs(f.worker, 1, stop.signal, { stopBeforeFinalize: true, verify: async () => { if (++n === 4) stop.abort(); } });
  expect(f.calls).toEqual(["maintain_v1", "claim_v1", "health_v1"]);
});
it("STOP during the external pre-claim check cannot slip into another claim", async () => {
  const stop = new AbortController(), f = fixture(); let n = 0;
  await runAssessJobs(f.worker, 1, stop.signal, { stopBeforeFinalize: true, verify: async () => { if (++n === 2) stop.abort(); } });
  expect(f.calls).toEqual(["maintain_v1", "health_v1"]);
});
it("an acknowledged pre-COMMIT rollback can use fail under the current lease", async () => {
  const f = fixture(name => { if (name === "finish_v1") throw Object.assign(Error("private"), { writeOutcome: "rolled_back" }); });
  expect(await runAssessJobs(f.worker, 1)).toMatchObject({ failed: 1, graded: 0 });
  expect(f.calls).toEqual(["maintain_v1", "claim_v1", "finish_v1", "fail_v1", "health_v1"]);
});
it("lost finish ACK never runs fail/recover/another claim", async () => {
  const f = fixture(name => { if (name === "finish_v1") throw Error("SYNTHETIC_SECRET"); });
  expect(await runAssessJobs(f.worker, 2)).toMatchObject({ graded: 0, failed: 1 });
  expect(f.calls).toEqual(["maintain_v1", "claim_v1", "finish_v1", "health_v1"]);
});
it("monitor failure during grading is isolated and cannot replay a write", async () => {
  const f = fixture();
  expect(await runAssessJobs(f.worker, 1, undefined, { observe: () => { throw Error("SYNTHETIC_SECRET"); } })).toMatchObject({ graded: 1 });
  expect(f.calls.filter(n => n === "finish_v1")).toHaveLength(1);
});
it("revoked recovery evidence after claim closes the worker without a finalize", async () => {
  const f = fixture(); let n = 0;
  const result = await executeGradingWorker(async () => config, new AbortController().signal, async () => { if (++n === 4) throw Error(); }, () => f.worker);
  expect(result).toMatchObject({ outcome: "STOP" }); expect(f.close).toHaveBeenCalledOnce();
  expect(f.calls).not.toContain("finish_v1"); expect(f.calls).not.toContain("fail_v1");
});
it("monitor RPC failure after acknowledged finalize reports STOP and cannot erase/rewrite the result", async () => {
  const f = fixture(name => { if (name === "health_v1") throw Error("private answer"); });
  const report = await executeGradingWorker(async () => config, new AbortController().signal, async () => {}, () => f.worker);
  expect(report).toMatchObject({ outcome: "STOP", code: "unavailable" });
  expect(report).not.toHaveProperty("counts"); expect(f.calls.filter(n => n === "finish_v1")).toHaveLength(1);
});
it("pins every registered case and evaluator without changing their identities", () => {
  const v = workerVersions(); expect(v.worker).toBe("rad085-grading-worker/1"); expect(v.evaluator).toBe("assess-grader/1");
  expect(v.cases.length).toBeGreaterThan(0);
  for (const c of v.cases) expect(c.version).toMatch(/^[0-9a-f]{64}$/);
});
// Unit fault boundaries supplement the required Docker/PostgreSQL rehearsal in CI;
// they are not evidence of DB privileges, transaction behavior or image execution.
