import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { MY_ATTEMPTS_PAGE_SIZE, readMyAttemptsPage } from "./my-attempts";

const user = "00000000-0000-0000-0000-00000000000a";
const id = (n: number) => `10000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const time = "2026-10-17T10:00:00.123456+00:00";
const row = (n: number, extra: Record<string, unknown> = {}) => ({
  id: id(n), user_id: user, attempt_no: n, exam_id: "historical-exam", case_id: "historical-case", definition_version: "saved-v1",
  settings: { kvp: 110 }, result: { total: 82.25, passed: false, critical: ["saved-critical"], categories: [{ c: "positioning", earned: 20, weight: 28 }], checks: [{ id: "rotation", o: "fail", credit: 0.5 }] },
  locale: "ar", started_at: "2026-10-17T09:59:00Z", finished_at: time,
  mode: "practice", record_kind: "attempt", producer_version: "unknown", engine_version: "unknown", settings_format_version: 1, result_format_version: 1, ...extra,
});
function client(data: unknown, status = 200) {
  const calls: URL[] = [];
  return { calls, api: createClient("https://synthetic.supabase.co", "synthetic-public-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (url) => { calls.push(new URL(String(url))); return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } }); } },
  }) };
}
describe("My Attempts bounded PostgREST reads", () => {
  it("sends own-user, Practice and record filters, explicit projection, stable server order and one lookahead; preserves actual saved values", async () => {
    const { api, calls } = client(Array.from({ length: 21 }, (_, i) => row(i + 1)));
    const page = await readMyAttemptsPage(api, user);
    expect(page.items).toHaveLength(MY_ATTEMPTS_PAGE_SIZE);
    expect(page.next).toEqual({ time, id: id(20) });
    expect(page.items[0]).toMatchObject({ examId: "historical-exam", caseId: "historical-case", definitionVersion: "saved-v1", total: 82.25, passed: false, settings: { kvp: 110 }, checks: [{ id: "rotation", o: "fail", credit: 0.5 }] });
    const q = calls[0]!.searchParams;
    expect(q.get("user_id")).toBe(`eq.${user}`);
    expect(q.get("mode")).toBe("eq.practice"); expect(q.get("record_kind")).toBe("eq.attempt");
    expect(q.get("order")).toBe("finished_at.desc,id.asc"); expect(q.get("limit")).toBe("21");
    expect(q.get("select")).not.toMatch(/\*|device|email/); expect(q.get("select")).toContain("result_format_version");
    expect(calls).toHaveLength(1);
  });
  it("keeps microseconds in keyset filters, accepts older rows and terminates at a short/empty page", async () => {
    const { api, calls } = client([row(22, { finished_at: "2026-10-17T10:00:00.123455+00:00" })]);
    const cursor = { time, id: id(21) };
    expect((await readMyAttemptsPage(api, user, cursor)).next).toBeNull();
    expect(calls[0]!.searchParams.get("or")).toBe(`(finished_at.lt.${time},and(finished_at.eq.${time},id.gt.${id(21)}))`);
    expect(await readMyAttemptsPage(client([]).api, user)).toEqual({ items: [], next: null });
  });
  it("rejects a whole malformed or foreign page visibly, never filters it into an apparently complete result", async () => {
    for (const data of [null, [row(1, { user_id: id(99) })], [row(1, { mode: "assess" })], [row(1, { result_format_version: 2 })], [row(1, { started_at: "invalid" })], [row(1, { result: { total: 55, passed: true, critical: [], categories: [{ c: "broken" }], checks: [] } })], Array.from({ length: 22 }, (_, i) => row(i + 1)), [row(1), row(1)], [row(2), row(1)]]) {
      await expect(readMyAttemptsPage(client(data).api, user)).rejects.toMatchObject({ kind: "error" });
    }
    await expect(readMyAttemptsPage(client([row(2)]).api, user, { time, id: id(3) })).rejects.toMatchObject({ kind: "error" });
  });
  it("validates filter inputs before any request and distinguishes session expiry from read errors", async () => {
    const c = client([]);
    await expect(readMyAttemptsPage(c.api, "x")).rejects.toThrow();
    await expect(readMyAttemptsPage(c.api, user, { time: `${time},id.gt.x`, id: id(1) })).rejects.toThrow();
    expect(c.calls).toHaveLength(0);
    for (const status of [401, 403, 500]) await expect(readMyAttemptsPage(client({ message: "synthetic failure" }, status).api, user)).rejects.toMatchObject({ kind: status === 401 ? "expired" : "error" });
  });
});
