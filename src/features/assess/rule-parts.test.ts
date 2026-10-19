import { describe, expect, it } from "vitest";
import { CASES } from "@/data/cases";
import type { CheckRule } from "@/domain/case";
import { assertReusablePart, ruleParts } from "./rule-parts";

describe("Assess rule inventory (not content approval)", () => {
  it("maps every current rule without dropping a rule or treating zero weight as no criterion", () => {
    const seen = new Set<string>();
    for (const c of CASES) for (const rule of c.rules) {
      seen.add(rule.kind);
      const parts = ruleParts(rule);
      expect(parts.length).toBeGreaterThan(0);
      for (const part of parts) {
        expect(part.ruleId).toBe(rule.id);
        expect(part.inputs.length).toBeGreaterThan(0);
        if (rule.kind === "marker") expect(() => assertReusablePart(part)).toThrow(/reviewed adapter/);
        else expect(() => assertReusablePart(part)).not.toThrow();
      }
    }
    expect([...seen].sort()).toEqual(["centering", "coverage", "equals", "marker", "range", "technique"]);
  });
  it("SID/kVp do not inherit unrelated inputs, gates or Practice weights", () => {
    for (const c of CASES) for (const rule of c.rules) {
      if (rule.kind === "range" && rule.setting === "sidCm") expect(ruleParts(rule)[0]?.inputs).toEqual(["sidCm"]);
      if (rule.kind === "technique" && rule.check === "kvp-band") expect(ruleParts(rule)[0]?.inputs).toEqual(["kvp"]);
      if (rule.kind === "technique" && rule.check !== "kvp-band") {
        // Projection changes patient attenuation; the light field changes AEC chamber exposure.
        expect(ruleParts(rule)[0]?.inputs).toEqual(expect.arrayContaining(["projection", "centralRay", "collimation"]));
      }
      if (rule.kind === "marker") expect(ruleParts(rule).map((p) => p.part)).toEqual(["marker-side", "marker-placement"]);
    }
    expect(() => ruleParts({ kind: "future-rule" } as unknown as CheckRule)).toThrow(/Unsupported/);
  });
});
