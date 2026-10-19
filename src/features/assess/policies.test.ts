import { describe, expect, it } from "vitest";
import type { AssessmentVersion } from "./contracts";
import type { FinalResult } from "./server-contracts";
import { acceptsMutation, assertAssessmentVersion, assertAttemptPolicy, decimalPoints, displayPoints, earnedPoints, historyRow, resultExpiresAt, scalePoints } from "./policies";

const policy = { durationSeconds: 60, maxAttempts: 2, gradeVisibility: "hidden" } as const;
const assessment: AssessmentVersion = {
  schemaVersion: 1, ref: { id: "synthetic", version: "1" }, name: "Synthetic contract only",
  track: "mixed", maximum: "7.5", policy,
  items: [{ schemaVersion: 1, ref: { id: "q", version: "1" }, type: "single-choice", contentLanguage: "en",
    prompt: "Choose a letter (non-medical fixture)", options: [{ id: "a", text: "A" }, { id: "b", text: "B" }] }],
};

describe("Assess version and policy boundaries", () => {
  it("allows configured marks/attempts/untimed policy and rejects unsupported versions, tracks and item types", () => {
    expect(() => assertAssessmentVersion(assessment)).not.toThrow();
    expect(() => assertAttemptPolicy({ ...policy, durationSeconds: null })).not.toThrow();
    for (const update of [{ schemaVersion: 2 }, { track: "future" }, { maximum: "0" }, { items: [] },
      { items: [{ ...assessment.items[0], type: "multi-response" }] },
      { items: [assessment.items[0], assessment.items[0]] },
      { track: "full-practical" },
    ]) expect(() => assertAssessmentVersion({ ...assessment, ...update } as AssessmentVersion)).toThrow();
    for (const count of [0, -1, 1.5, Infinity]) expect(() => assertAttemptPolicy({ ...policy, maxAttempts: count })).toThrow();
    for (const seconds of [0, -1, 0.5, NaN]) expect(() => assertAttemptPolicy({ ...policy, durationSeconds: seconds })).toThrow();
  });
  it("accepts writes only before the server deadline, and only in active state", () => {
    const deadline = "2026-10-19T12:01:00.000Z";
    expect(acceptsMutation("2026-10-19T12:00:59.999Z", deadline, "active")).toBe(true);
    expect(acceptsMutation(deadline, deadline, "active")).toBe(false);
    expect(acceptsMutation("2026-10-19T12:01:00.001Z", deadline, "active")).toBe(false);
    for (const state of ["grading", "graded", "grading-failed", "unknown"]) expect(acceptsMutation(deadline, null, state)).toBe(false);
    expect(acceptsMutation(deadline, null, "active")).toBe(true);
  });
});

describe("Assess exact points", () => {
  it("sums thirds before rounding, scales once, and counts unanswered as zero without negative marks", () => {
    const thirds = Array.from({ length: 3 }, () => ({ maximum: "1", credit: { numerator: 1n, denominator: 3n } }));
    const total = earnedPoints([...thirds, { maximum: "1", credit: { numerator: 0n, denominator: 1n } }]);
    expect(total).toEqual({ numerator: 1n, denominator: 1n });
    expect(displayPoints(scalePoints(total, "4", "7.5"))).toBe("1.88");
    expect(displayPoints(decimalPoints("0.005"))).toBe("0.01");
    expect(displayPoints(decimalPoints("0"))).toBe("0.00");
    for (const invalid of ["NaN", "-1", "1e2", "0.0000001", "01", "Infinity"])
      expect(() => decimalPoints(invalid)).toThrow();
    expect(() => earnedPoints([{ maximum: "1", credit: { numerator: 2n, denominator: 1n } }])).toThrow();
    expect(() => earnedPoints([{ maximum: "1", credit: { numerator: 0n, denominator: 0n } }])).toThrow();
    expect(() => scalePoints(total, "0", "10")).toThrow();
  });
});

describe("Assess minimal result retention and response", () => {
  it.each([
    ["2026-08-31T12:34:56.789Z", "2027-02-28T12:34:56.789Z"],
    ["2027-08-31T12:34:56.789Z", "2028-02-29T12:34:56.789Z"],
    ["2026-12-31T23:59:59.999Z", "2027-06-30T23:59:59.999Z"],
    ["2026-10-19T00:00:00.000Z", "2027-04-19T00:00:00.000Z"],
  ])("adds six UTC calendar months with end-of-month clamping: %s", (submitted, expiry) => {
    expect(resultExpiresAt(submitted)).toBe(expiry);
  });
  it("rejects invalid/ambiguous dates and projects hidden grades without private fields", () => {
    for (const date of ["2026-02-30T00:00:00.000Z", "2026-10-19", "2026-10-19T03:00:00+03:00"])
      expect(() => resultExpiresAt(date)).toThrow();
    const result: FinalResult = { schemaVersion: 1, userId: "u", assessment: { id: "a", version: "1" }, assignmentId: "as",
      attemptId: "at", name: "Original name", track: "mixed", submittedAt: "2026-10-19T00:00:00.000Z",
      expiresAt: "2027-04-19T00:00:00.000Z", earned: { numerator: "7", denominator: "1" }, maximum: "10.00", gradeVisibility: "hidden" };
    const before = "2027-04-18T23:59:59.999Z";
    expect(historyRow(result, before)).toEqual({ name: "Original name", track: "mixed", submittedAt: result.submittedAt, grade: { visibility: "hidden" } });
    expect(historyRow({ ...result, gradeVisibility: "after-submission" }, before)?.grade).toEqual({ visibility: "shown", earned: "7.00", maximum: "10.00" });
    expect(historyRow(result, result.expiresAt)).toBeNull();
  });
});
