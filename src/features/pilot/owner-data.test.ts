import { describe, expect, it } from "vitest";
import {
  ATTEMPT_CSV_HEADER, attemptsCsv, csvField, csvFileName, fetchAllPages, groupByUser, NOTE_CSV_HEADER, notesCsv, parseAttempt, parseAttempts, parseNote, parseNotes, toCsv,
} from "./owner-data";

const result = { total: 82, passed: true, thresholdMet: true, primaryVariant: "ideal", critical: [], categories: [{ c: "positioning", earned: 20, weight: 28 }], checks: [{ id: "rot", o: "pass", credit: 1 }] };
const row = {
  id: "a1", user_id: "u1", attempt_no: 1, exam_id: "chest-pa-erect", case_id: "default", definition_version: "abcd", settings: { kvp: 110 }, result, locale: "en",
  started_at: "2026-10-16T10:00:00Z", finished_at: "2026-10-16T10:02:05Z",
};
const noteRow = { id: 7, user_id: "u1", exam_id: "chest-pa-erect", attempt_id: "a1", text: "The light was hard to see.", at: "2026-10-16T10:03:00Z" };
const codes = new Map([["u1", "P-aaaa1111"], ["u2", "P-bbbb2222"]]);

describe("parseAttempt / parseNote", () => {
  it("maps a database row", () => {
    expect(parseAttempt(row)).toMatchObject({ id: "a1", userId: "u1", attemptNo: 1, examId: "chest-pa-erect", total: 82, passed: true, locale: "en", settings: { kvp: 110 } });
    expect(parseNote(noteRow)).toEqual({ id: "7", userId: "u1", examId: "chest-pa-erect", attemptId: "a1", text: "The light was hard to see.", at: "2026-10-16T10:03:00Z" });
    expect(parseNote({ ...noteRow, attempt_id: null })?.attemptId).toBeNull();
  });
  it.each([null, [], {}, { ...row, id: "" }, { ...row, attempt_no: 1.5 }, { ...row, locale: "fr" }, { ...row, result: null }, { ...row, result: { ...result, total: "82" } }, { ...row, settings: [] }])("drops a bad attempt %j", (bad) => expect(parseAttempt(bad)).toBeNull());
  it.each([null, { ...noteRow, text: "   " }, { ...noteRow, text: 5 }, { ...noteRow, id: null }, { ...noteRow, attempt_id: 5 }])("drops a bad note %j", (bad) => expect(parseNote(bad)).toBeNull());
  it("keeps good rows, counts the skipped ones, and treats a non-array as empty", () => {
    expect(parseAttempts([row, { nope: 1 }])).toMatchObject({ skipped: 1, items: [{ id: "a1" }] });
    expect(parseNotes([noteRow, 3, null]).skipped).toBe(2);
    expect(parseAttempts(null)).toEqual({ items: [], skipped: 0 });
  });
  it("ignores malformed category / check entries instead of failing the attempt", () => {
    const a = parseAttempt({ ...row, result: { ...result, categories: [{ c: "x" }, ...result.categories], checks: [1, ...result.checks], critical: ["a", 3] } });
    expect(a?.categories).toHaveLength(1);
    expect(a?.checks).toHaveLength(1);
    expect(a?.critical).toEqual(["a"]);
  });
});

describe("fetchAllPages", () => {
  const table = (n: number) => Array.from({ length: n }, (_, i) => ({ i }));
  const pager = (rows: unknown[]) => async (from: number, to: number) => ({ data: rows.slice(from, to + 1), error: null });
  it("reads until a short page", async () => {
    expect(await fetchAllPages(pager(table(25)), 10)).toEqual({ rows: table(25), truncated: false });
    expect((await fetchAllPages(pager(table(20)), 10))?.rows).toHaveLength(20); // exact multiple: one extra empty page, still complete
  });
  it("stops at the cap and says it was truncated", async () => {
    const r = await fetchAllPages(pager(table(100)), 10, 30);
    expect(r?.rows).toHaveLength(30);
    expect(r?.truncated).toBe(true);
  });
  it("returns null on any error or malformed page (never a partial list that looks complete)", async () => {
    expect(await fetchAllPages(async () => ({ data: null, error: { message: "x" } }))).toBeNull();
    expect(await fetchAllPages(async (from) => (from === 0 ? { data: table(10), error: null } : { data: null, error: "boom" }), 10)).toBeNull();
  });
});

describe("groupByUser", () => {
  it("groups per user, newest first", () => {
    const a2 = parseAttempt({ ...row, id: "a2", attempt_no: 2, finished_at: "2026-10-16T11:00:00Z" })!;
    const g = groupByUser([parseAttempt(row)!, a2], [parseNote(noteRow)!]);
    expect(g.get("u1")?.attempts.map((a) => a.id)).toEqual(["a2", "a1"]);
    expect(g.get("u1")?.notes).toHaveLength(1);
    expect(g.get("u2")).toBeUndefined();
  });
});

describe("csvField", () => {
  it("quotes commas, quotes, line breaks and edge spaces", () => {
    expect(csvField("plain")).toBe("plain");
    expect(csvField('a,"b"')).toBe('"a,""b"""');
    expect(csvField("two\nlines")).toBe('"two\nlines"');
    expect(csvField(" pad")).toBe('" pad"');
  });
  it.each(["=SUM(A1)", "+1", "-2", "@cmd", "\tx", "\rx"])("neutralises a formula start %j with an apostrophe", (v) => expect(csvField(v).replaceAll('"', "").startsWith("'")).toBe(true));
  it("leaves numbers, booleans and blanks alone (a negative number is still a number)", () => {
    expect(csvField(-3)).toBe("-3");
    expect(csvField(true)).toBe("true");
    expect(csvField(null)).toBe("");
    expect(csvField(undefined)).toBe("");
  });
});

describe("attemptsCsv", () => {
  const a = parseAttempt(row)!;
  it("has a BOM, CRLF rows, a fixed header and one line per attempt keyed by participant code", () => {
    const csv = attemptsCsv([a], codes);
    expect(csv.startsWith("﻿")).toBe(true);
    const lines = csv.slice(1).split("\r\n");
    expect(lines[0]).toBe(ATTEMPT_CSV_HEADER.join(","));
    expect(lines).toHaveLength(3); // header, one row, trailing newline
    expect(lines[1]).toContain("P-aaaa1111,1,a1,chest-pa-erect,default,abcd,en,2026-10-16T10:00:00Z,2026-10-16T10:02:05Z,125,82,true,true,ideal,,positioning:20/28,rot:pass:1,");
    expect(lines[1]).toContain('"{""kvp"":110}"');
  });
  it("never contains an e-mail address or a user id (only the code is passed in)", () => {
    const csv = attemptsCsv([a], codes) + notesCsv([parseNote(noteRow)!], [a], codes);
    expect(csv).not.toContain("@");
    expect(csv).not.toContain("u1,");
    expect([...ATTEMPT_CSV_HEADER, ...NOTE_CSV_HEADER].some((h) => /mail|user_id/i.test(h))).toBe(false);
  });
  it("orders by code then time and labels an unknown owner of a row 'unknown'", () => {
    const b = parseAttempt({ ...row, id: "b1", user_id: "u2" })!;
    const early = parseAttempt({ ...row, id: "a0", attempt_no: 0 + 1, finished_at: "2026-10-16T09:00:00Z" })!;
    const stray = parseAttempt({ ...row, id: "z", user_id: "gone" })!;
    const ids = attemptsCsv([b, a, early, stray], codes).slice(1).split("\r\n").slice(1, -1).map((l) => l.split(",")[2]);
    expect(ids).toEqual(["a0", "a1", "b1", "z"]);
    expect(attemptsCsv([stray], codes)).toContain("unknown,");
  });
  it("leaves the duration empty for an impossible span", () => {
    const bad = parseAttempt({ ...row, finished_at: "2026-10-16T09:00:00Z" })!;
    expect(attemptsCsv([bad], codes).split("\r\n")[1]).toContain("2026-10-16T09:00:00Z,,82");
  });
});

describe("notesCsv", () => {
  const a = parseAttempt(row)!;
  it("links a note to its attempt number and escapes the text", () => {
    const n = parseNote({ ...noteRow, text: 'He said "dim", then\n=HYPERLINK("x")' })!;
    const csv = notesCsv([n], [a], codes);
    expect(csv.slice(1).split("\r\n")[0]).toBe(NOTE_CSV_HEADER.join(","));
    expect(csv).toContain("P-aaaa1111,7,chest-pa-erect,1,a1,2026-10-16T10:03:00Z,");
    expect(csv).toContain('"He said ""dim"", then\n=HYPERLINK(""x"")"'); // formula-looking text is mid-cell here, so only the start is guarded
  });
  it("guards a note that STARTS like a formula", () => {
    expect(notesCsv([parseNote({ ...noteRow, text: "=1+1" })!], [a], codes)).toContain(",'=1+1\r\n");
  });
  it("leaves attempt_no empty for a note with no attempt or one we do not hold", () => {
    expect(notesCsv([parseNote({ ...noteRow, attempt_id: null })!], [a], codes)).toContain("chest-pa-erect,,,2026");
    expect(notesCsv([parseNote({ ...noteRow, attempt_id: "other" })!], [a], codes)).toContain("chest-pa-erect,,other,2026");
  });
});

describe("toCsv / csvFileName", () => {
  it("is just a header plus rows", () => expect(toCsv(["a", "b"], [[1, "x,y"]])).toBe("﻿a,b\r\n1,\"x,y\"\r\n"));
  it("uses the local date in the file name", () => expect(csvFileName("attempts", new Date(2026, 9, 6))).toBe("radlab-attempts-2026-10-06.csv"));
});
