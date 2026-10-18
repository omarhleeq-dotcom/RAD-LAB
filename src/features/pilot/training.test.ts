import { createClient } from "@supabase/supabase-js";
import { expect, it } from "vitest";
import { comparableAttempts, parseTrainingPage, readTraining, validName, type TrainingAttempt } from "./training";
const row: TrainingAttempt = { id: "a", exam: "x", case: "default", definition: "v1", engine: "v1", producer: "v1", format: 1, time: "2026-01-01T00:00:00Z", result: { total: 80, passed: true, critical: [], categories: [{ c: "positioning", earned: 10, weight: 20 }] } };
const page = { version: 1, boundary: row.time, summary: null, rows: [row], next: null };
it("uses explicit bounded RPC values and preserves microsecond cursors", async () => {
  let body: Record<string, unknown> = {};
  const client = createClient("https://synthetic.supabase.co", "synthetic", { auth: { persistSession: false }, global: { fetch: async (input, init) => {
    expect(String(input)).toContain("/rest/v1/rpc/training_page_v1"); body = JSON.parse(String(init?.body)); return new Response(JSON.stringify(page), { status: 200 });
  } } });
  const cursor = { id: "a", time: "2026-01-01T00:00:00.123456Z" };
  await readTraining(client, { view: "history", scope: "own", user: "id", exam: "x", cursor });
  expect(body).toMatchObject({ p_scope: "own", p_user: "id", p_limit: 20, p_cursor: cursor, p_exam: "x" });
});
it("rejects unsupported and malformed saved results instead of fabricating scores", () => {
  expect(parseTrainingPage(page, "history").rows).toHaveLength(1);
  for (const bad of [{ ...page, version: 2 }, { ...page, rows: Array(21).fill(row) }, { ...page, rows: [{ ...row, format: 2 }] }, { ...page, rows: [{ ...row, result: { total: 99 } }] }]) expect(() => parseTrainingPage(bad, "history")).toThrow();
});
it("compares only matching known versions/cases, without recalculation", () => {
  expect(comparableAttempts([row, { ...row, id: "b", result: { ...row.result, total: 60 } }, { ...row, case: "other" }, { ...row, definition: "v2" }, { ...row, engine: "v2" }, { ...row, producer: "v2" }]).map((a) => a.result.total)).toEqual([60, 80]);
  expect(comparableAttempts([{ ...row, engine: "unknown" }, row])).toEqual([]);
});
it("accepts Arabic/English and single names, rejecting empty and excessive names", () => {
  for (const name of ["عمر", "  أحمد علي  ", "Jane", "Name 2"]) expect(validName(name)).toBe(true);
  for (const name of ["", "   ", "x".repeat(101)]) expect(validName(name)).toBe(false);
});
it("distinguishes expired sessions and denied scope", async () => {
  for (const [status, code, kind] of [[401, "expired", "expired"], [403, "42501", "denied"], [500, "XX000", "error"]] as const) {
    const client = createClient("https://synthetic.supabase.co", "synthetic", { auth: { persistSession: false }, global: { fetch: async () => new Response(JSON.stringify({ code, message: "synthetic" }), { status }) } });
    await expect(readTraining(client, { view: "summary", scope: "own" })).rejects.toMatchObject({ kind });
  }
});
