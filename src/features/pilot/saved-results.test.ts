import { describe, expect, it } from "vitest";
import { EXAMS } from "@/data/exams";
import { shortExamTitle } from "@/features/platform/library";
import { createClient } from "@supabase/supabase-js";
import { rankLastResults, readSavedResults, reviewTarget, savedExamResults } from "./saved-results";
import type { TrainingAttempt } from "./training";
const user = "00000000-0000-0000-0000-000000000001";
function row(i: number, total = 90, passed = true) {
  return { id: `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`, exam_id: i % 2 ? "wrist-pa" : "hand-pa", case_id: "default", definition_version: "fixture", comparison_version: null,
    engine_version: "fixture/1", producer_version: "fixture/1", result_format_version: 1, finished_at: "2026-10-24T08:00:00Z", result: { total, passed, critical: passed ? [] : ["wrong-side-marker"], categories: [] } };
}
function clientFor(count: number, failure = false) {
  const calls: URL[] = [];
  const client = createClient("https://fixture.supabase.co", "fixture", { auth: { persistSession: false }, global: { fetch: async (input, init) => {
    const url = new URL(String(input)); calls.push(url);
    if (url.pathname.includes("rpc/")) {
      expect(JSON.parse(String(init?.body))).toMatchObject({ p_scope: "own", p_user: user, p_view: "summary" });
      return new Response(JSON.stringify({ version: 1, boundary: "2026-10-24T12:00:00Z", rows: [], next: null, summary: { attempts: count, exams: 2, latest: null, trainees: null } }));
    }
    if (failure) return new Response(JSON.stringify({ code: "42501" }), { status: 403 });
    expect(url.searchParams.get("user_id")).toBe(`eq.${user}`);
    expect(url.searchParams.get("mode")).toBe("eq.practice");
    expect(url.searchParams.get("record_kind")).toBe("eq.attempt");
    expect(url.searchParams.get("limit")).toBe("101");
    expect(url.searchParams.get("order")).toBe("finished_at.desc,id.asc");
    expect(url.searchParams.get("finished_at")).toBe("lte.2026-10-24T12:00:00Z");
    const offset = Number(url.searchParams.get("or")?.match(/id.gt.00000000-0000-0000-0000-(\d+)/)?.[1] ?? 0);
    return new Response(JSON.stringify(Array.from({ length: Math.min(101, count - offset) }, (_, i) => row(offset + i + 1))));
  } } });
  return { client, calls };
}
describe("saved result display", () => {
  it("derives every current short title in EN and AR from existing body-part and projection data", () => {
    for (const exam of EXAMS) for (const locale of ["en", "ar"]) {
      const title = shortExamTitle(exam, locale);
      expect(title).toContain(" · ");
      expect(title.split(" · ")[1]!.length).toBeLessThan(exam.title[locale as "en" | "ar"].length);
    }
  });
  it("reads all exams in one shared page with no per-card requests", async () => {
    const { client, calls } = clientFor(7); const result = await readSavedResults(client, user);
    expect(result.rows).toHaveLength(7); expect(result.next).toBeNull(); expect(calls).toHaveLength(2);
  });
  it("bounds each batch at 500, preserves a server boundary and resumes tied timestamps without duplicates", async () => {
    const { client, calls } = clientFor(503); const first = await readSavedResults(client, user);
    expect(first.rows).toHaveLength(500); expect(first.next?.id).toBe(row(500).id); expect(calls).toHaveLength(6);
    const all = await readSavedResults(client, user, "own", null, first);
    expect(all.rows).toHaveLength(503); expect(new Set(all.rows.map(r => r.id)).size).toBe(503); expect(all.next).toBeNull(); expect(calls).toHaveLength(7);
  });
  it("handles no attempts without inventing a result", async () => {
    const { client } = clientFor(0); const data = await readSavedResults(client, user);
    expect(savedExamResults(data.rows)).toEqual([]);
  });
  it("reports access failures without returning server text", async () => {
    const { client } = clientFor(1, true); await expect(readSavedResults(client, user)).rejects.toMatchObject({ kind: "denied", message: "Training unavailable" });
  });
  it("rejects unsafe query identities before reading", async () => {
    const { client, calls } = clientFor(0); await expect(readSavedResults(client, "invalid,filter")).rejects.toThrow(); expect(calls).toHaveLength(0);
  });
  const attempt = (id: number, exam: string, time: string, total: number, passed: boolean): TrainingAttempt => ({ id: String(id), exam, time, case: "default", definition: "fixture", engine: "fixture/1", producer: "fixture/1", format: 1, result: { total, passed, categories: [], critical: passed ? [] : ["wrong-side-marker"] } });
  it("uses the last saved verdict, with best score independent of pass status", () => {
    const rows = [attempt(2, "wrist-pa", "2026-10-23", 99, true), attempt(1, "wrist-pa", "2026-10-24", 91.1, false), attempt(3, "hand-pa", "2026-10-24", 88.3, true)];
    const original = JSON.stringify(rows); const grouped = savedExamResults(rows);
    expect(grouped[0]).toMatchObject({ exam: "wrist-pa", best: 99, last: { result: { total: 91.1, passed: false } } });
    expect(rankLastResults(rows).map(g => g.exam)).toEqual(["wrist-pa", "hand-pa"]); expect(JSON.stringify(rows)).toBe(original);
  });
  it("does not turn an older failed result into the latest one", () => {
    const rows = [attempt(1, "wrist-pa", "2026-10-22", 55, false), attempt(2, "wrist-pa", "2026-10-24", 84, true)];
    expect(savedExamResults(rows)[0]?.last.result.passed).toBe(true);
  });
});

describe("home Review choice", () => {
  const at = (id: number, exam: string, total: number, passed: boolean, time: string) => ({ ...row(id, total, passed), exam_id: exam, finished_at: time });
  const attempts = (rows: ReturnType<typeof at>[]) => rows.map((r) => ({ id: r.id, exam: r.exam_id, case: r.case_id, definition: r.definition_version, comparison: null, engine: r.engine_version, producer: r.producer_version, format: 1, time: r.finished_at, result: r.result })) as unknown as TrainingAttempt[];
  it("skips the last practised exam and takes the next weakest", () => {
    const rows = attempts([at(1, "wrist-pa", 40, false, "2026-10-24T09:00:00Z"), at(2, "hand-pa", 60, false, "2026-10-23T09:00:00Z"), at(3, "elbow-ap", 95, true, "2026-10-22T09:00:00Z")]);
    expect(rankLastResults(rows)[0]!.exam).toBe("wrist-pa");
    expect(reviewTarget(rankLastResults(rows), savedExamResults(rows)[0]!.exam)?.exam).toBe("hand-pa");
  });
  it("keeps the weakest when it is not the last practised exam", () => {
    const rows = attempts([at(1, "wrist-pa", 95, true, "2026-10-24T09:00:00Z"), at(2, "hand-pa", 60, false, "2026-10-23T09:00:00Z")]);
    expect(reviewTarget(rankLastResults(rows), savedExamResults(rows)[0]!.exam)?.exam).toBe("hand-pa");
  });
  it("offers no Review when only the last practised exam exists", () => {
    const rows = attempts([at(1, "wrist-pa", 40, false, "2026-10-24T09:00:00Z"), at(2, "wrist-pa", 50, false, "2026-10-23T09:00:00Z")]);
    expect(reviewTarget(rankLastResults(rows), savedExamResults(rows)[0]!.exam)).toBeUndefined();
    expect(reviewTarget([], undefined)).toBeUndefined();
  });
});
