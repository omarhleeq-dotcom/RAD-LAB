import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCase } from "@/data/cases";
import { evaluate } from "@/features/evaluation/engine";
import { PRACTICE_EVALUATION_VERSION } from "@/features/evaluation/version";
import { buildAttemptRow, buildEventRow, buildFeedbackRow, definitionVersion, PILOT_WRITER_VERSION, readRecordContract, recordStamps } from "./attempt-record";
import { recordActivity } from "./activity";
import { createAttemptLogger, type Snapshot } from "./attempt-logger";
import { attemptsCsv, exportOwnerPart, notesCsv, parseAttempt, parseAttempts, parseNote, parseOwnerPage, readOwnerPage, EMPTY_FILTERS, type OwnerPage } from "./owner-data";

const at = "2026-01-01T00:00:00Z";
const original = { id: "a", user_id: "user-not-for-export", participant_code: "P-code", attempt_no: 1, exam_id: "x", case_id: "default", definition_version: "frozen-hash", settings: { kvp: 110 }, result: { total: 82, passed: true, thresholdMet: true, primaryVariant: "ideal", critical: [], categories: [], checks: [] }, locale: "ar", started_at: at, finished_at: at };
const note = { id: "1", user_id: original.user_id, participant_code: "P-code", exam_id: "x", attempt_id: "a", attempt_no: 1, text: "ملاحظة", at };
const attempt = { ...original, settings_format_version: 1, result_format_version: 1, ...recordStamps("attempt"), locale_registered: true };
const describedNote = { ...note, note_format_version: 1, ...recordStamps("feedback") };
const page = (rows: Record<string, unknown>[], described = true): OwnerPage => ({ version: 1, boundary: at, total: rows.length, pending: 0, rows, next: null, ...(described ? { record_contract_version: 1 } : {}) });
const codes = new Map([[original.user_id, "P-code"]]);

describe("v1 record compatibility and explicit contracts", () => {
  it("keeps historical decoding and CSV bytes identical, including after unknown historical stamps are supplied", () => {
    const expectedAttempt = '\uFEFFparticipant_code,attempt_no,attempt_id,exam_id,case_id,definition_version,language,started_at_utc,finished_at_utc,duration_seconds,score_total,passed,threshold_met,primary_variant,critical_findings,category_scores,scored_checks,settings_json\r\nP-code,1,a,x,default,frozen-hash,ar,2026-01-01T00:00:00Z,2026-01-01T00:00:00Z,0,82,true,true,ideal,,,,"{""kvp"":110}"\r\n';
    const expectedNote = "\uFEFFparticipant_code,note_id,exam_id,attempt_no,attempt_id,written_at_utc,note\r\nP-code,1,x,1,a,2026-01-01T00:00:00Z,ملاحظة\r\n";
    const historic = { ...attempt, producer_version: "unknown", engine_version: "unknown" };
    expect(attemptsCsv([parseAttempt(original)!], codes)).toBe(expectedAttempt);
    expect(attemptsCsv([parseAttempt(historic)!], codes)).toBe(expectedAttempt);
    expect(notesCsv([parseNote(note)!], [parseAttempt(original)!], codes)).toBe(expectedNote);
    expect(notesCsv([parseNote({ ...describedNote, producer_version: "unknown" })!], [parseAttempt(historic)!], codes)).toBe(expectedNote);
    expect(exportOwnerPart("attempts", page([original], false)).csv).toBe(expectedAttempt);
    expect(exportOwnerPart("notes", page([note], false)).csv).toBe(expectedNote);
    expect(parseAttempt(historic)!.record).toMatchObject({ producerVersion: "unknown", engineVersion: "unknown" });
  });

  it("preserves a registered locale exactly without admitting an unregistered legacy locale or adding a UI locale", async () => {
    expect(parseAttempt({ ...original, locale: "fr-CA" })).toBeNull();
    expect(parseAttempt({ ...attempt, locale: "fr-CA", locale_registered: false })).toBeNull();
    expect(parseAttempt({ ...attempt, locale: "fr-CA" })?.locale).toBe("fr-CA");
    expect(parseAttempt({ ...attempt, locale: "<script>" })).toBeNull();
    const c = getCase("chest-pa-erect")!;
    const version = await definitionVersion(c);
    const built = buildAttemptRow({ id: "new", radCase: c, version, attemptNo: 1, settings: c.initialSettings, result: evaluate(c, c.initialSettings), locale: "fr-CA", device: { w: 390, h: 844, touch: true }, startedAt: new Date(0), finishedAt: new Date(1000) });
    expect(built).toMatchObject({ locale: "fr-CA", settings_format_version: 1, result_format_version: 1, producer_version: PILOT_WRITER_VERSION, engine_version: PRACTICE_EVALUATION_VERSION, mode: "practice", record_kind: "attempt", definition_version: version });
    expect(built.settings).toBe(c.initialSettings);
    // Keep the exact pre-existing case-definition algorithm, not a writer/engine stamp masquerading as its hash.
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(c)));
    expect(version).toBe([...new Uint8Array(digest).slice(0, 8)].map((b) => b.toString(16).padStart(2, "0")).join(""));
  });

  it("rejects unknown, partial, cross-kind and non-Practice contracts rather than defaulting them to v1", async () => {
    for (const bad of [{ ...attempt, settings_format_version: 2 }, { ...attempt, result_format_version: 2 }, { ...attempt, mode: "assess" }, { ...attempt, record_kind: "event" }, { ...original, mode: "practice" }, { ...attempt, engine_version: null }, { ...attempt, payload_format_version: 1 }]) expect(parseAttempt(bad)).toBeNull();
    expect(parseNote({ ...describedNote, note_format_version: 2 })).toBeNull();
    expect(readRecordContract({ ...buildEventRow("heartbeat"), payload_format_version: 2 }, "event")).toBeNull();
    expect(parseAttempts([attempt, { ...attempt, result_format_version: 2 }]).skipped).toBe(1);
    expect(() => parseOwnerPage({ ...page([]), record_contract_version: 2 })).toThrow();
    await expect(readOwnerPage(async () => ({ data: page([original]), error: null }), "attempts", EMPTY_FILTERS)).rejects.toThrow(/Unsupported/);
    await expect(readOwnerPage(async () => ({ data: page([{ ...attempt, result_format_version: 2 }]), error: null }), "attempts", EMPTY_FILTERS)).rejects.toThrow(/Unsupported/);
  });

  it("keeps the paged CSVv1 bytes for supported records and counts rejected versions explicitly", () => {
    const old = exportOwnerPart("attempts", page([original], false));
    const current = exportOwnerPart("attempts", page([attempt, { ...attempt, id: "future", settings_format_version: 2 }]));
    expect(current.written).toBe(1); expect(current.skipped).toBe(1);
    expect(current.csv).toBe(old.csv);
    expect(exportOwnerPart("notes", page([describedNote])).csv).toBe(exportOwnerPart("notes", page([note], false)).csv);
    expect(current.csv).not.toContain(original.user_id);
    expect(exportOwnerPart("notes", page([])).csv).toBe(exportOwnerPart("notes", page([], false)).csv);
  });
});

describe("every current producer path uses explicit contracts", () => {
  it("stamps sign-in, heartbeat, logout and survey events while preserving status gating", async () => {
    const events: Record<string, unknown>[] = [], rpc: string[] = [];
    const client = { from: () => ({ insert: async (row: Record<string, unknown>) => { events.push(row); return { error: null }; } }), rpc: async (name: string) => { rpc.push(name); } } as unknown as SupabaseClient;
    for (const type of ["signed_in", "heartbeat", "logout", "survey_opened"] as const) await recordActivity(client, "approved", type);
    expect(events.map((e) => e.type)).toEqual(["signed_in", "heartbeat", "logout", "survey_opened"]);
    expect(events.every((e) => readRecordContract(e, "event")?.producerVersion === PILOT_WRITER_VERSION)).toBe(true);
    for (const status of [null, "pending", "suspended"] as const) await recordActivity(client, status, "heartbeat");
    expect(events).toHaveLength(4); expect(rpc).toEqual(["touch_last_seen", "touch_last_seen"]);
  });

  it("stamps logger writes without changing the copied evaluation, and describes feedback/event bodies separately", async () => {
    const writes: { table: string; row: Record<string, unknown> }[] = [];
    const client = { from: (table: string) => ({ insert: async (row: Record<string, unknown>) => { writes.push({ table, row }); return { error: null }; } }) } as unknown as SupabaseClient;
    const c = getCase("chest-pa-erect")!;
    const logger = createAttemptLogger({ getClient: async () => client, getStatus: async () => "approved", locale: () => "ar", device: () => ({ w: 390, h: 844, touch: true }), uuid: () => "synthetic", now: () => new Date(at) });
    const base: Snapshot = { activeCase: c, settings: c.initialSettings, phase: "setup", result: null, attempt: 1 };
    const result = evaluate(c, c.initialSettings);
    logger.onState(base); logger.onState({ ...base, settings: { ...c.initialSettings, kvp: c.initialSettings.kvp + 2 } }); logger.onState({ ...base, phase: "result", result }); logger.onState({ ...base, attempt: 2 });
    await vi.waitFor(() => expect(writes).toHaveLength(5), { timeout: 3000 });
    expect(writes.filter((w) => w.table === "events").map((w) => w.row.type)).toEqual(["exam_opened", "attempt_started", "attempt_submitted", "attempt_retry"]);
    for (const { table, row } of writes) expect(readRecordContract(row, table === "events" ? "event" : "attempt")?.legacy).toBe(false);
    expect(writes.find((w) => w.table === "attempts")?.row.result).toMatchObject({ total: result.score.total, passed: result.score.passed });
    const feedback = buildFeedbackRow("x", "a", "private note");
    const sent = buildEventRow("feedback_sent", { exam_id: "x", attempt_id: "a" });
    expect(readRecordContract(feedback, "feedback")?.producerVersion).toBe(PILOT_WRITER_VERSION);
    expect(readRecordContract(sent, "event")?.legacy).toBe(false);
    expect(JSON.stringify(sent)).not.toContain(feedback.text);
    expect(feedback).not.toHaveProperty("user_id");
  });
});
