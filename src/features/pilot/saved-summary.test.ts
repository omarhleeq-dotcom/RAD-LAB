import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { rankLastResults, readSavedResults, reviewTarget, savedExamResults } from "./saved-results";
import { readSavedSummary } from "./saved-summary";
// @ts-expect-error The manual Node browser harness is JavaScript, outside the TS app.
import { measurementPlan, summarize } from "../../../scripts/qa/saved-summary-performance.mjs";

const user = "00000000-0000-0000-0000-000000000001", time = "2026-11-05T12:00:00Z", boundary = "2026-11-06T00:00:00Z";
function row(i: number) {
  return { id: `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`, exam_id: ["wrist-pa", "hand-pa", "archived-exam"][i % 3], case_id: "default", definition_version: "unknown", comparison_version: null,
    engine_version: "unknown", producer_version: "legacy", result_format_version: 1, finished_at: time,
    result: { total: i % 2 ? 99 : 90, passed: i % 2 === 0, critical: i % 2 ? ["marker"] : [], categories: [{ c: "position", earned: 90, weight: 100 }], checks: [{ id: "detail", o: "pass", credit: 1 }] } };
}
function fixture(size: number, mutate?: (r: Record<string, unknown>) => void, status = 200) {
  const calls: URL[] = [], signals: (AbortSignal | null | undefined)[] = [];
  const client = createClient("https://synthetic.supabase.co", "fixture", { auth: { persistSession: false }, global: { fetch: async (input, init) => {
    const url = new URL(String(input)); calls.push(url); signals.push(init?.signal);
    if (url.pathname.includes("rpc/")) {
      expect(JSON.parse(String(init?.body))).toMatchObject({ p_view: "summary", p_scope: "own", p_user: user, p_days: null, p_limit: 20 });
      return new Response(JSON.stringify({ version: 1, boundary, rows: [], next: null, summary: { attempts: size, exams: Math.min(3, size), latest: size ? time : null, trainees: null } }));
    }
    if (status !== 200) return new Response(JSON.stringify({ code: status === 403 ? "42501" : "error" }), { status });
    expect(url.searchParams.get("user_id")).toBe(`eq.${user}`); expect(url.searchParams.get("mode")).toBe("eq.practice");
    expect(url.searchParams.get("record_kind")).toBe("eq.attempt"); expect(url.searchParams.get("limit")).toBe("101");
    expect(url.searchParams.get("finished_at")).toBe(`lte.${boundary}`); expect(url.searchParams.get("order")).toBe("finished_at.desc,id.asc");
    const offset = Number(url.searchParams.get("or")?.match(/id.gt.00000000-0000-0000-0000-(\d+)/)?.[1] ?? 0);
    const rows = Array.from({ length: Math.min(101, size - offset) }, (_, i) => { const r = row(i + offset + 1); mutate?.(r); return r; });
    const projected = url.searchParams.get("select")?.includes("result->");
    const data = projected ? rows.map(({ result, ...r }) => ({ ...r, total: result?.total, passed: result?.passed, critical: result?.critical, categories: result?.categories })) : rows;
    return new Response(JSON.stringify(data));
  } } });
  return { client, calls, signals };
}
const visible = (data: Awaited<ReturnType<typeof readSavedResults>>) => ({
  summary: data.summary, coverage: [data.rows.length, data.next],
  groups: savedExamResults(data.rows).map(g => [g.exam, g.last.id, g.last.result.total, g.last.result.passed]),
  ranked: rankLastResults(data.rows).map(g => g.exam), review: reviewTarget(rankLastResults(data.rows), savedExamResults(data.rows)[0]?.exam)?.exam,
});
describe("bounded saved summary projection", () => {
  it("reports repeatable median and nearest-rank p95 without dropping slow samples", () => {
    const samples = Array.from({ length: 10 }, (_, i) => ({ firstMs: i + 1, completeMs: i + 11, requests: 6, bytes: 123 }));
    expect(summarize(samples)).toEqual({ requests: [6], bytes: [123], first: { median: 5.5, p95: 10 }, complete: { median: 15.5, p95: 20 } });
  });
  it.each([0, 7, 100, 101, 499, 500, 503])("matches the old visible meaning at %i rows, including ties, unknown historical identities and archived exams", async size => {
    const old = fixture(size), next = fixture(size), controller = new AbortController();
    const before = await readSavedResults(old.client, user), after = await readSavedSummary(next.client, user, controller.signal);
    expect(visible(after)).toEqual(visible(before)); expect(after.rows.length).toBe(Math.min(size, 500));
    expect(next.calls.length).toBe(old.calls.length); expect(next.signals.every(s => s === controller.signal)).toBe(true);
    expect(next.calls[1]!.searchParams.get("select")).toContain("total:result->total,passed:result->passed,critical:result->critical,categories:result->categories");
    expect(next.calls[1]!.searchParams.get("select")).not.toContain("checks");
    if (size > 0) expect(after.rows[0]!.result).toMatchObject({ total: 99, passed: false });
    expect(measurementPlan.baseline).toBe("98f579c2781698b5dd4f97de700ac69ba73f75d4");
  });
  const invalid: [string, (r: Record<string, unknown>) => void][] = [
    ["identity", r => { r.id = "unsafe,filter"; }], ["timestamp", r => { r.finished_at = "invalid"; }], ["exam", r => { r.exam_id = ""; }],
    ["case", r => { r.case_id = null; }], ["definition", r => { r.definition_version = null; }], ["engine", r => { r.engine_version = ""; }],
    ["producer", r => { r.producer_version = null; }], ["format", r => { r.result_format_version = 2; }], ["comparison", r => { r.comparison_version = "unrecognized"; }],
    ["result", r => { r.result = null; }], ["passed", r => { (r.result as Record<string, unknown>).passed = "true"; }],
    ["total", r => { (r.result as Record<string, unknown>).total = "99"; }], ["critical", r => { (r.result as Record<string, unknown>).critical = [4]; }],
    ["categories", r => { (r.result as Record<string, unknown>).categories = [{ c: "position", earned: "90", weight: 100 }]; }],
  ];
  it.each(invalid)("preserves rejection of malformed %s", async (_name, mutate) => {
    await expect(readSavedResults(fixture(1, mutate).client, user)).rejects.toMatchObject({ kind: "error" });
    await expect(readSavedSummary(fixture(1, mutate).client, user, new AbortController().signal)).rejects.toMatchObject({ kind: "error" });
  });
  it("publishes counts only after the successful summary and waits for all pages before recommendations", async () => {
    const f = fixture(503), counts: unknown[] = [];
    const data = await readSavedSummary(f.client, user, new AbortController().signal, summary => { expect(f.calls).toHaveLength(1); counts.push(summary); });
    expect(counts).toEqual([data.summary]); expect(f.calls).toHaveLength(6); expect(data.next?.id).toBe(row(500).id);
  });
  it("retains timestamp precedence over id and preserves a newer failure over an older pass", async () => {
    const mutate = (r: Record<string, unknown>) => {
      r.exam_id = "wrist-pa"; r.finished_at = r.id === row(1).id ? "2026-11-04T12:00:00Z" : time;
      (r.result as Record<string, unknown>).passed = r.id !== row(2).id;
    };
    const old = await readSavedResults(fixture(7, mutate).client, user);
    const next = await readSavedSummary(fixture(7, mutate).client, user, new AbortController().signal);
    expect(visible(next)).toEqual(visible(old)); expect(savedExamResults(next.rows)[0]!.last).toMatchObject({ id: row(2).id, result: { passed: false } });
  });
  it("does not publish unsuccessful or malformed summary responses or start details", async () => {
    for (const response of [{ data: {}, error: null }, { data: null, error: { code: "42501" }, status: 403 }]) {
      let details = 0, counts = 0;
      const client = { rpc: () => ({ abortSignal: async () => response }), from: () => { details++; } } as unknown as Parameters<typeof readSavedSummary>[0];
      await expect(readSavedSummary(client, user, new AbortController().signal, () => { counts++; })).rejects.toThrow();
      expect([counts, details]).toEqual([0, 0]);
    }
  });
  it.each([401, 403, 500])("preserves structured failure classification for %i", async status => {
    await expect(readSavedSummary(fixture(1, undefined, status).client, user, new AbortController().signal)).rejects.toMatchObject({ kind: status === 401 ? "expired" : status === 403 ? "denied" : "error", message: "Training unavailable" });
  });
  it("rejects unsafe users and cancellation before reading", async () => {
    const f = fixture(1), c = new AbortController(); c.abort();
    await expect(readSavedSummary(f.client, user, c.signal)).rejects.toThrow();
    await expect(readSavedSummary(f.client, "unsafe", new AbortController().signal)).rejects.toThrow(); expect(f.calls).toEqual([]);
  });
});
