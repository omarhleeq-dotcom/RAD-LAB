import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { getCase } from "@/data/cases";
import { evaluate } from "@/features/evaluation/engine";
import type { ProfileStatus } from "./account-state";
import { createAttemptLogger, type Snapshot } from "./attempt-logger";

const c = getCase("chest-pa-erect") ?? (() => { throw new Error("case missing"); })();
const base: Snapshot = { activeCase: c, settings: { ...c.initialSettings }, phase: "setup", result: null, attempt: 1 };

function rig(status: ProfileStatus | null, failAttempts = false) {
  const reports: unknown[] = [];
  const writes: { table: string; row: Record<string, unknown> }[] = [];
  const client = { from: (table: string) => ({ insert: async (row: Record<string, unknown>) => { writes.push({ table, row }); return { error: failAttempts && table === "attempts" ? { message: "x" } : null }; } }) } as unknown as SupabaseClient;
  let n = 0;
  const logger = createAttemptLogger({ getClient: async () => client, getStatus: async () => status, locale: () => "ar", device: () => ({ w: 1, h: 1, touch: false }), uuid: () => `id-${++n}`, report: (a) => reports.push(a) });
  const flush = () => new Promise((r) => setTimeout(r, 20));
  return { writes, logger, flush, reports };
}

const flow = (logger: ReturnType<typeof rig>["logger"]) => {
  logger.onState(base);
  logger.onState({ ...base, settings: { ...base.settings!, kvp: base.settings!.kvp + 2 } });
  const settings = { ...base.settings!, kvp: base.settings!.kvp + 2 };
  logger.onState({ ...base, settings: { ...settings, mas: settings.mas + 1 } }); // second change: no second attempt_started
  const done = { ...base, settings, phase: "result" as const, result: evaluate(c, settings) };
  logger.onState(done);
  logger.onState({ ...done, phase: "setup", result: null, attempt: 2 });
};

describe("attempt logger", () => {
  it("writes the usage events in order and one attempt row for an approved participant", async () => {
    const { writes, logger, flush } = rig("approved");
    flow(logger);
    await flush();
    expect(writes.filter((w) => w.table === "events").map((w) => w.row.type)).toEqual(["exam_opened", "attempt_started", "attempt_submitted", "attempt_retry"]);
    const attempts = writes.filter((w) => w.table === "attempts");
    expect(attempts).toHaveLength(1);
    expect(attempts[0]?.row).toMatchObject({ attempt_no: 1, exam_id: "chest-pa-erect", locale: "ar" });
    expect(attempts[0]?.row.user_id).toBeUndefined();
    const submitted = writes.find((w) => w.row.type === "attempt_submitted");
    expect((submitted?.row.payload as { attempt_id: string }).attempt_id).toBe(attempts[0]?.row.id);
  });

  it.each(["pending", "suspended", null] as const)("writes nothing for status %s", async (status) => {
    const { writes, logger, flush } = rig(status);
    flow(logger);
    await flush();
    expect(writes).toHaveLength(0);
  });

  it("does not count an identical reload of the same case as a learner change", async () => {
    const { writes, logger, flush } = rig("approved");
    logger.onState(base);
    logger.onState({ ...base, settings: { ...base.settings! } });
    await flush();
    expect(writes.map((w) => w.row.type)).toEqual(["exam_opened"]);
  });

  it("never throws when the network fails", async () => {
    const logger = createAttemptLogger({ getClient: async () => { throw new Error("offline"); }, getStatus: async () => "approved", locale: () => "en", device: () => ({ w: 1, h: 1, touch: false }) });
    expect(() => flow(logger)).not.toThrow();
    await new Promise((r) => setTimeout(r, 20));
  });

  const toResult = (logger: ReturnType<typeof rig>["logger"]) => {
    logger.onState(base);
    const settings = { ...base.settings!, kvp: base.settings!.kvp + 2 };
    logger.onState({ ...base, settings });
    const done = { ...base, settings, phase: "result" as const, result: evaluate(c, settings) };
    logger.onState(done);
    return done;
  };

  it("reports the saved attempt to the feedback box, and clears it on retry", async () => {
    const { logger, flush, reports } = rig("approved");
    const done = toResult(logger);
    await flush();
    expect(reports).toEqual([null, { id: "id-2", status: "pending" }, { id: "id-2", status: "saved" }]);
    logger.onState({ ...done, phase: "setup", result: null, attempt: 2 });
    expect(reports.at(-1)).toBeNull();
  });

  it.each([["pending"], ["suspended"], [null]] as const)("never reports a saved attempt for status %s", async (status) => {
    const { logger, flush, reports } = rig(status);
    toResult(logger);
    await flush();
    expect(reports).not.toContainEqual(expect.objectContaining({ status: "saved" }));
    expect(reports.at(-1)).toEqual({ id: "id-2", status: "unavailable" });
  });

  it("reports unavailable when the database refuses the attempt", async () => {
    const { logger, flush, reports } = rig("approved", true);
    toResult(logger);
    await flush();
    expect(reports.at(-1)).toEqual({ id: "id-2", status: "unavailable" });
  });
});
