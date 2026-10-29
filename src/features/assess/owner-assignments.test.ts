import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { closeOwnerAssignment, parseOwnerAssignments, readOwnerAssignments } from "./owner-assignments";
const id = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const row = (n: number) => ({ id: id(n), name: "Assessment", revision: 2, closed_at: null });
const signal = () => new AbortController().signal;
const client = (fetcher: typeof fetch) => createClient("https://synthetic.supabase.co", "public-test-key", { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: fetcher } });
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

describe("owner assignment contract", () => {
  it("uses only M3/M4 RPCs in Assess, page20/null group/cursor, explicit id+revision and void acknowledgement", async () => {
    const calls: unknown[] = [];
    const c = client(async (input, init) => {
      const name = String(input).split("/").at(-1);
      calls.push({ name, schema: new Headers(init?.headers).get("Content-Profile"), args: JSON.parse(String(init?.body)) });
      return json(name === "assignment_page_v2" ? { rows: [row(21)], next: null } : null);
    });
    expect((await readOwnerAssignments(c, id(20), signal())).rows[0]).toEqual({ id: id(21), name: "Assessment", revision: 2, closedAt: null });
    await closeOwnerAssignment(c, { id: id(21), revision: 2 }, signal());
    expect(calls).toEqual([
      { name: "assignment_page_v2", schema: "assess", args: { p_group: null, p_after: id(20), p_limit: 20 } },
      { name: "assignment_close_v2", schema: "assess", args: { p_assignment: id(21), p_revision: 2 } },
    ]);
  });
  it("accepts closed_at and full-page keyset cursors, rejects oversized/malformed/nonadvancing/duplicate pages", () => {
    const rows = Array.from({ length: 20 }, (_, i) => row(i + 1));
    expect(parseOwnerAssignments({ rows, next: id(20) }).next).toBe(id(20));
    const closed = { ...row(21), closed_at: "2026-10-29T19:00:00+00:00" };
    expect(parseOwnerAssignments({ rows: [closed], next: null }, id(20)).rows[0].closedAt).toBe(closed.closed_at);
    for (const raw of [null, { rows: [...rows, row(21)], next: null }, { rows: [row(1)], next: id(1) }, { rows: [row(1), row(1)], next: null },
      { rows: [row(2), row(1)], next: null }, { rows: [{ ...row(1), revision: 0 }], next: null }, { rows: [{ ...row(1), closed_at: "yesterday" }], next: null },
      { rows: [{ ...row(1), name: "" }], next: null }, { rows, next: id(19) }]) expect(() => parseOwnerAssignments(raw)).toThrow();
    expect(() => parseOwnerAssignments({ rows: [row(20)], next: null }, id(20))).toThrow();
  });
  it("sanitises stale, denied, schema and invalid errors without revealing server text", async () => {
    for (const [code, kind] of [["40001", "conflict"], ["42501", "denied"], ["PGRST202", "schema"], ["22023", "invalid"]]) {
      const c = client(async () => json({ code, message: "private implementation" }, 400));
      await expect(closeOwnerAssignment(c, { id: id(1), revision: 2 }, signal())).rejects.toMatchObject({ kind, message: "Owner assignments unavailable" });
    }
  });
  it("never retries ambiguous transport/5xx/malformed acknowledgements, including the SDK retry layer", async () => {
    for (const scenario of ["network", "server", "ack"]) {
      let calls = 0;
      const c = client(async () => { calls++; if (scenario === "network") throw new TypeError("connection lost after COMMIT"); return scenario === "server" ? json({ code: "XX000" }, 503) : json({ unexpected: true }); });
      await expect(closeOwnerAssignment(c, { id: id(1), revision: 2 }, signal())).rejects.toMatchObject({ kind: "ambiguous" });
      expect(calls).toBe(1);
    }
  });
  it("validates inputs before network access; read failures stay read failures", async () => {
    let calls = 0;
    const c = client(async () => { calls++; throw new TypeError("offline"); });
    await expect(closeOwnerAssignment(c, { id: id(1), revision: -1 }, signal())).rejects.toMatchObject({ kind: "invalid" });
    await expect(readOwnerAssignments(c, "bad", signal())).rejects.toMatchObject({ kind: "invalid" });
    expect(calls).toBe(0);
    await expect(readOwnerAssignments(c, null, signal())).rejects.toMatchObject({ kind: "unavailable" });
    expect(calls).toBe(1);
  });
});
