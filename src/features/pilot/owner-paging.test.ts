import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, exportOwnerPart, parseOwnerPage, readOwnerPage, type OwnerPage } from "./owner-data";
const boundary = "2026-10-15T00:00:00Z";
const note = { id: "9007199254740993", participant_code: "P-code", exam_id: "x", attempt_id: "uuid", attempt_no: 42, text: '=مرحبا,"سطر"\nثان', at: boundary };
const page = (rows: Record<string, unknown>[] = [note]): OwnerPage => ({ version: 1, boundary, total: rows.length, pending: 0, rows, next: null });
describe("bounded owner reads and independent export", () => {
  it("sends filters, explicit continuation and boundary, with bounded request sizes", async () => {
    const filters = { participant: "u", exam: "x", from: boundary, to: boundary };
    let sent: Record<string, unknown> = {};
    await readOwnerPage(async (args) => { sent = args; return { data: page(), error: null }; }, "notes", filters, null, boundary, true, 1000);
    expect(sent).toEqual({ p_stream: "notes", p_limit: 1000, p_cursor: null, p_boundary: boundary, p_export: true, p_participant: "u", p_from: boundary, p_to: boundary, p_exam: "x" });
  });
  it("fails visibly for RPC errors, unknown version, invalid envelope, nonadvancing cursor and API truncation", async () => {
    for (const value of [null, { ...page(), version: 2 }, { ...page(), rows: new Array(101).fill(note) }, { ...page(), total: -1 }, { ...page([]), next: { time: boundary, id: "1" } }]) expect(() => parseOwnerPage(value)).toThrow();
    await expect(readOwnerPage(async () => ({ data: page(), error: "denied" }), "notes", EMPTY_FILTERS)).rejects.toThrow();
    const cursor = { time: boundary, id: note.id };
    await expect(readOwnerPage(async () => ({ data: { ...page(), next: cursor }, error: null }), "notes", EMPTY_FILTERS, cursor, boundary)).rejects.toThrow(/advance/);
    await expect(readOwnerPage(async () => ({ data: { ...page(), next: { time: boundary, id: "9999999999999999" } }, error: null }), "notes", EMPTY_FILTERS)).rejects.toThrow(/Truncated/);
  });
  it("exports only one part, counts omissions and duplicates, SQL linkage independent of the attempt page, Arabic and formula quoting", () => {
    const out = exportOwnerPart("notes", page([note, note, { ...note, id: "2", participant_code: null }, { ...note, id: "3", text: "" }]));
    expect(out.written).toBe(1); expect(out.skipped).toBe(3);
    expect(out.csv).toContain('P-code,9007199254740993,x,42,uuid,');
    expect(out.csv).toContain('"\'=مرحبا,""سطر""\nثان"');
    expect(out.csv.startsWith("\uFEFF")).toBe(true); expect(out.csv.endsWith("\r\n")).toBe(true);
    expect(out.csv).not.toMatch(/user_id|email|device/);
  });
  it("preserves server cursor order in new CSV parts without changing legacy CSV expectations", () => {
    const result = exportOwnerPart("notes", page([{ ...note, id: "2" }, { ...note, id: "10" }]));
    expect(result.csv.indexOf("P-code,2,")).toBeLessThan(result.csv.indexOf("P-code,10,"));
  });
  it("keeps microsecond time ordering and rejects a changed boundary within one millisecond", async () => {
    const upper = "2026-10-15T00:00:00.000999Z";
    const result = { ...page([{ ...note, id: "10", at: "2026-10-15T00:00:00.000002Z" }, { ...note, id: "2", at: "2026-10-15T00:00:00.000001+00:00" }]), boundary: upper };
    expect((await readOwnerPage(async () => ({ data: result, error: null }), "notes", EMPTY_FILTERS)).rows).toHaveLength(2);
    await expect(readOwnerPage(async () => ({ data: result, error: null }), "notes", EMPTY_FILTERS, null, "2026-10-15T00:00:00.000998Z")).rejects.toThrow(/Boundary/);
  });
  it("handles bigint note cursors beyond JS integer precision", async () => {
    const next = { time: boundary, id: note.id };
    const result = await readOwnerPage(async () => ({ data: { ...page(), next }, error: null }), "notes", EMPTY_FILTERS, { time: boundary, id: "9007199254740992" }, boundary);
    expect(result.next).toEqual(next);
  });
});
