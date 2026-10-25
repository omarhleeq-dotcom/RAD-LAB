import { describe, expect, it } from "vitest";
import { CASES } from "@/data/cases";
import { evaluate } from "./engine";
import { comparisonVersion } from "./comparison-version";
import { PRACTICE_EVALUATION_VERSION } from "./version";

const limbParts = new Set(["wrist", "hand", "elbow", "knee", "ankle", "foot"]);
const limbs = CASES.filter(c => limbParts.has(c.bodyPart));
const other = CASES.filter(c => !limbParts.has(c.bodyPart));

describe("RAD-081 owner SID boundary and confinement", () => {
  it.each(limbs)("$id changes credit only from 100 through 101.99 cm", async c => {
    const previous = { ...c, rules: c.rules.map(rule => rule.id === "sid" && rule.kind === "range"
      ? { ...rule, ideal: [102, 110] as [number, number] } : rule) };
    for (const sidCm of [80, 94, 95, 99, 99.99, 100, 101, 101.99, 102, 110, 111, 130, 131, 200]) {
      const settings = { ...c.initialSettings, sidCm };
      const before = evaluate(previous, settings), after = evaluate(c, settings);
      if (sidCm >= 100 && sidCm <= 101.99) {
        expect(before.checks.find(x => x.ruleId === "sid")?.outcome).toBe("partial");
        expect(after.checks.find(x => x.ruleId === "sid")?.outcome).toBe("pass");
        expect(after.score.total - before.score.total).toBeCloseTo(5.5, 6);
        expect(after.exposure).toEqual(before.exposure);
        expect(after.checks.filter(x => x.ruleId !== "sid")).toEqual(before.checks.filter(x => x.ruleId !== "sid"));
      } else {
        // Same copy/evidence on the reference object isolates numeric grading, variants and geometry.
        expect(after).toEqual(before);
      }
    }
    const sid = c.rules.find(rule => rule.id === "sid");
    expect(sid).toMatchObject({ ideal: [100, 110], acceptable: [95, 130] });
    expect(sid?.evidence.status).toBe("provisional");
    expect(JSON.stringify(sid)).not.toContain("102");
    expect(await comparisonVersion(c, PRACTICE_EVALUATION_VERSION)).not.toBe(await comparisonVersion(previous, PRACTICE_EVALUATION_VERSION));
  });

  it.each(other)("$id retains its SID rules", c => {
    expect(c.rules.find(rule => rule.id === "sid")).toMatchObject({ ideal: c.bodyPart === "chest" ? [180, 185] : [102, 110] });
  });
});
