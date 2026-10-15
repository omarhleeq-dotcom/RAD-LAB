import { describe, expect, it } from "vitest";
import { getCase } from "@/data/cases";
import { evaluate } from "@/features/evaluation/engine";
import { buildAttemptRow, compactResult, definitionVersion, splitCaseId } from "./attempt-record";

const c = getCase("chest-pa-erect") ?? (() => { throw new Error("case missing"); })();

describe("attempt record", () => {
  it("splits the public case id", () => {
    expect(splitCaseId("chest-pa-erect")).toEqual({ examId: "chest-pa-erect", caseId: "default" });
    expect(splitCaseId("wrist-pa/second")).toEqual({ examId: "wrist-pa", caseId: "second" });
  });

  it("copies the engine result compactly and stays well under the database limits", () => {
    const r = evaluate(c, c.initialSettings);
    const compact = compactResult(r);
    expect(compact.total).toBe(r.score.total);
    expect(compact.checks.length).toBeGreaterThan(0);
    expect(JSON.stringify(compact).length).toBeLessThan(8192);
    expect(JSON.stringify(c.initialSettings).length).toBeLessThan(4096);
  });

  it("builds a row without personal data and with a stable definition fingerprint", async () => {
    const r = evaluate(c, c.initialSettings);
    const v = await definitionVersion(c);
    expect(v).toMatch(/^[0-9a-f]{16}$/);
    expect(await definitionVersion(c)).toBe(v);
    const row = buildAttemptRow({ id: "i", radCase: c, version: v, attemptNo: 2, settings: c.initialSettings, result: r, locale: "ar", device: { w: 390, h: 800, touch: true }, startedAt: new Date(0), finishedAt: new Date(1000) });
    expect(row).toMatchObject({ attempt_no: 2, exam_id: "chest-pa-erect", case_id: "default", locale: "ar", definition_version: v });
    expect(Object.keys(row)).not.toContain("user_id");
  });
});
