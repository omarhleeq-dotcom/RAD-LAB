import { describe, expect, it } from "vitest";
import { CASES } from "@/data/cases";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import { CATEGORIES, type SimulationSettings } from "@/domain/simulation";
import { evaluate } from "./engine";

const ideal: SimulationSettings = {
  projection: "pa-erect",
  rotationDeg: 0,
  centerXCm: 0,
  centerYCm: 20,
  collimationWidthCm: 33,
  collimationHeightCm: 36,
  sidCm: 180,
  kvp: 115,
  mas: 3,
  breathing: "deep-inspiration-hold",
};

const withChange = (patch: Partial<SimulationSettings>) => evaluate(chestPaErect, { ...ideal, ...patch });
const category = (r: ReturnType<typeof evaluate>, id: (typeof CATEGORIES)[number]) =>
  r.score.categories.find((c) => c.category === id);

describe("case data integrity", () => {
  it.each(CASES.map((c) => [c.id, c] as const))("%s has weights summing to 100 and unique rule ids", (_id, c) => {
    const sum = Object.values(c.scoring.categoryWeights).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
    const ids = c.rules.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("evaluate — Adult Chest PA Erect", () => {
  it("scores 100 and returns the correct variant for ideal settings", () => {
    const r = evaluate(chestPaErect, ideal);
    expect(r.score.total).toBe(100);
    expect(r.score.passed).toBe(true);
    expect(r.variants).toEqual(["correct"]);
    expect(r.checks.every((c) => c.outcome === "pass")).toBe(true);
  });

  it("scores the shipped initial settings as a failing attempt", () => {
    const r = evaluate(chestPaErect, chestPaErect.initialSettings);
    expect(r.score.total).toBeLessThan(chestPaErect.scoring.passThreshold);
    expect(r.score.passed).toBe(false);
  });

  it("penalises the wrong projection in the positioning category only", () => {
    const r = withChange({ projection: "ap-erect" });
    expect(r.primaryVariant).toBe("wrong-projection");
    expect(category(r, "positioning")?.ratio).toBeCloseTo(1 / 3);
    expect(category(r, "rotation")?.ratio).toBe(1);
  });

  it("gives half credit for acceptable rotation and none for marked rotation", () => {
    expect(category(withChange({ rotationDeg: 4 }), "rotation")?.ratio).toBe(0.5);
    const marked = withChange({ rotationDeg: -12 });
    expect(category(marked, "rotation")?.ratio).toBe(0);
    expect(marked.variants).toContain("rotated");
  });

  it("flags clipped anatomy when the field is too small", () => {
    const r = withChange({ collimationHeightCm: 25 });
    expect(r.checks.find((c) => c.ruleId === "collimation")?.outcome).toBe("fail");
    expect(r.variants).toContain("clipped");
  });

  it("flags clipping when the centering point shifts the field off the anatomy", () => {
    const r = withChange({ centerYCm: 30 });
    expect(r.variants).toContain("clipped");
    expect(r.checks.find((c) => c.ruleId === "centering-vertical")?.outcome).toBe("fail");
  });

  it("only gives partial credit for an excessively open field", () => {
    const r = withChange({ collimationWidthCm: 35, collimationHeightCm: 43, centerYCm: 21.5 });
    const check = r.checks.find((c) => c.ruleId === "collimation");
    expect(check?.outcome).toBe("partial");
    expect(r.variants).toEqual(["correct"]);
  });

  it("maps low and high technique to under/overexposure with direction-specific feedback", () => {
    const low = withChange({ mas: 0.5 });
    const high = withChange({ mas: 30 });
    expect(low.primaryVariant).toBe("underexposed");
    expect(high.primaryVariant).toBe("overexposed");
    expect(low.checks.find((c) => c.ruleId === "mas")?.feedback.en).toMatch(/too low/);
    expect(high.checks.find((c) => c.ruleId === "mas")?.feedback.en).toMatch(/too high/);
  });

  it("fails breathing for any instruction other than deep inspiration hold", () => {
    const r = withChange({ breathing: "expiration-hold" });
    expect(category(r, "breathing")?.ratio).toBe(0);
    expect(r.primaryVariant).toBe("poor-inspiration");
  });

  it("respects configurable category weights", () => {
    const heavy = {
      ...chestPaErect,
      scoring: {
        ...chestPaErect.scoring,
        categoryWeights: { positioning: 0, rotation: 100, centering: 0, exposure: 0, sid: 0, breathing: 0 },
      },
    };
    expect(evaluate(heavy, { ...ideal, rotationDeg: 15 }).score.total).toBe(0);
    expect(evaluate(heavy, { ...ideal, mas: 30 }).score.total).toBe(100);
  });

  it("is deterministic", () => {
    expect(evaluate(chestPaErect, chestPaErect.initialSettings)).toEqual(
      evaluate(chestPaErect, chestPaErect.initialSettings),
    );
  });
});

describe("conflicting exposure findings", () => {
  it("never reports both under- and overexposure", () => {
    const r = withChange({ kvp: 70, mas: 30 });
    expect(r.variants.filter((v) => v === "underexposed" || v === "overexposed")).toHaveLength(1);
  });
});
