import { describe, expect, it } from "vitest";
import { CASES } from "@/data/cases";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import { CATEGORIES, type SimulationSettings } from "@/domain/simulation";
import { EVIDENCE_CLASSES } from "@/domain/technique";
import { evaluate } from "./engine";

const ideal: SimulationSettings = {
  projection: "pa-erect",
  rotationDeg: 0,
  centralRay: { x: 0, y: -0.07 }, // ≈ 20 cm from the top of the 43 cm detector
  collimation: { width: 0.94, height: 0.84 }, // ≈ 33 × 36 cm
  chinPosition: "elevated",
  shoulderPosition: "rolled-forward",
  sideMarker: "L",
  markerPosition: { x: 0.84, y: 0.68 },
  sidCm: 180,
  kvp: 115,
  mas: 3,
  exposureMode: "manual",
  aecChambers: [],
  breathing: "deep-inspiration-hold",
  motionInstruction: "remain-still",
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
    expect(category(r, "positioning")?.ratio).toBeCloseTo(5 / 7);
    expect(category(r, "rotation")?.ratio).toBe(1);
  });

  it("gives half credit for acceptable rotation and none for marked rotation", () => {
    expect(category(withChange({ rotationDeg: 4 }), "rotation")?.ratio).toBe(0.5);
    const marked = withChange({ rotationDeg: -12 });
    expect(category(marked, "rotation")?.ratio).toBe(0);
    expect(marked.variants).toContain("rotated");
  });

  it("flags clipped anatomy when the field is too small", () => {
    const r = withChange({ collimation: { width: 0.94, height: 0.58 } });
    expect(r.checks.find((c) => c.ruleId === "collimation-clipping")?.outcome).toBe("fail");
    expect(r.variants).toContain("clipped");
  });

  it("flags clipping when the centering point shifts the field off the anatomy", () => {
    const r = withChange({ centralRay: { x: 0, y: 0.4 } });
    expect(r.variants).toContain("clipped");
    expect(r.checks.find((c) => c.ruleId === "centering-vertical")?.outcome).toBe("fail");
  });

  it("only gives partial credit for an excessively open field", () => {
    const r = withChange({ centralRay: { x: 0, y: -0.07 }, collimation: { width: 1, height: 1 } });
    expect(r.checks.find((c) => c.ruleId === "collimation-excess")?.outcome).toBe("partial");
    expect(r.checks.find((c) => c.ruleId === "collimation-clipping")?.outcome).toBe("pass");
    expect(r.variants).toEqual(["correct"]);
  });

  it("maps low and high detector exposure to direction-specific findings (not brightness)", () => {
    const low = withChange({ mas: 0.5 });
    const high = withChange({ mas: 30 });
    expect(low.primaryVariant).toBe("low-exposure");
    expect(high.primaryVariant).toBe("excess-exposure");
    expect(low.checks.find((c) => c.ruleId === "exposure-adequacy")?.feedback.en).toMatch(/below the target/);
    expect(high.checks.find((c) => c.ruleId === "dose-optimization")?.feedback.en).toMatch(/above the target/);
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

  it("reports clipped anatomy by side with bilingual detail", () => {
    const r = withChange({ collimation: { width: 0.94, height: 0.58 } });
    const fb = r.checks.find((c) => c.ruleId === "collimation-clipping")!.feedback;
    expect(fb.en).toMatch(/apices/);
    expect(fb.en).toMatch(/costophrenic/);
    expect(fb.ar.length).toBeGreaterThan(10);
  });

  it("is deterministic", () => {
    expect(evaluate(chestPaErect, chestPaErect.initialSettings)).toEqual(
      evaluate(chestPaErect, chestPaErect.initialSettings),
    );
  });
});

const check = (r: ReturnType<typeof evaluate>, id: string) => r.checks.find((c) => c.ruleId === id)!;

describe("centering from the central-ray position", () => {
  it("passes inside the target region", () => {
    const r = withChange({ centralRay: { x: 0.05, y: -0.2 } });
    expect(check(r, "centering-lateral").outcome).toBe("pass");
    expect(check(r, "centering-vertical").outcome).toBe("pass");
  });

  it("reports horizontal mis-centering with direction, independent of the vertical axis", () => {
    const left = withChange({ centralRay: { x: -0.4, y: -0.14 } });
    const right = withChange({ centralRay: { x: 0.4, y: -0.14 } });
    expect(check(left, "centering-lateral").outcome).toBe("fail");
    expect(check(left, "centering-lateral").feedback.en).toMatch(/left of the midline/);
    expect(check(right, "centering-lateral").feedback.en).toMatch(/right of the midline/);
    expect(check(left, "centering-vertical").outcome).toBe("pass");
  });

  it("reports vertical mis-centering as too high / too low", () => {
    const high = withChange({ centralRay: { x: 0, y: -0.7 } });
    const low = withChange({ centralRay: { x: 0, y: 0.5 } });
    expect(check(high, "centering-vertical").feedback.en).toMatch(/too high/);
    expect(check(low, "centering-vertical").feedback.en).toMatch(/too low/);
    expect(check(high, "centering-lateral").outcome).toBe("pass");
  });

  it("gives half credit inside the acceptable band", () => {
    const r = withChange({ centralRay: { x: 0.15, y: -0.14 } });
    expect(check(r, "centering-lateral").outcome).toBe("partial");
    expect(category(r, "centering")?.ratio).toBe(0.75);
  });

  it("does not change the centering weights (15 of 100)", () => {
    expect(chestPaErect.scoring.categoryWeights.centering).toBe(15);
  });
});

describe("positioning subchecks", () => {
  it("fails chin and shoulders independently with their own image variants", () => {
    const chin = withChange({ chinPosition: "tucked" });
    expect(check(chin, "chin").outcome).toBe("fail");
    expect(check(chin, "shoulders").outcome).toBe("pass");
    expect(chin.variants).toContain("chin-overlap");
    const sh = withChange({ shoulderPosition: "relaxed" });
    expect(check(sh, "shoulders").outcome).toBe("fail");
    expect(sh.variants).toContain("scapulae-overlap");
  });

  it("keeps the side marker unscored", () => {
    const none = withChange({ sideMarker: null });
    expect(check(none, "side-marker").outcome).toBe("fail");
    expect(check(none, "side-marker").scored).toBe(false);
    expect(none.score.total).toBe(100);
  });

  it("flags a marker over the lung fields or outside the field", () => {
    expect(check(withChange({ markerPosition: { x: 0, y: -0.1 } }), "side-marker").outcome).toBe("partial");
    const outside = withChange({ collimation: { width: 0.94, height: 0.6 }, markerPosition: { x: 0.84, y: 0.68 } });
    expect(check(outside, "side-marker").feedback.en).toMatch(/outside the collimated field/);
    expect(check(withChange({ markerPosition: { x: 0.84, y: 0.68 } }), "side-marker").outcome).toBe("pass");
  });
});

describe("rotation state evaluation", () => {
  it("uses the internal rotation state with symmetric bands", () => {
    for (const deg of [-4, 4]) expect(check(withChange({ rotationDeg: deg }), "rotation").outcome).toBe("partial");
    for (const deg of [-12, 12]) expect(check(withChange({ rotationDeg: deg }), "rotation").outcome).toBe("fail");
    expect(check(withChange({ rotationDeg: 1 }), "rotation").outcome).toBe("pass");
  });
});

describe("medical traceability", () => {
  it("every rule declares evidence with a reference", () => {
    for (const r of chestPaErect.rules) {
      expect(r.evidence.reference.length, r.id).toBeGreaterThan(0);
      expect(EVIDENCE_CLASSES).toContain(r.evidence.status);
    }
  });

  it("never labels unvalidated technique rules as validated", () => {
    for (const id of ["kvp", "exposure-adequacy", "dose-optimization"]) {
      expect(chestPaErect.rules.find((r) => r.id === id)?.evidence.status, id).toBe("provisional");
    }
    expect(chestPaErect.rules.find((r) => r.id === "aec-chambers")?.evidence.status).toBe("vendor-protocol-dependent");
  });
});

describe("conflicting exposure findings", () => {
  it("never reports both low and excess detector exposure", () => {
    for (const mas of [0.5, 3, 30]) {
      const r = withChange({ kvp: 70, mas });
      expect(r.variants.filter((v) => v === "low-exposure" || v === "excess-exposure").length).toBeLessThanOrEqual(1);
    }
  });
});

describe("observed setting labels (regression: observedKind was dropped, so ids showed untranslated)", () => {
  it("enum-valued checks carry the setting kind so the UI can translate the id", () => {
    const r = evaluate(chestPaErect, { ...ideal, motionInstruction: "none", breathing: "no-instruction" });
    const kind = (id: string) => r.checks.find((c) => c.ruleId === id)?.observedKind;
    expect(kind("projection")).toBe("projection");
    expect(kind("chin")).toBe("chinPosition");
    expect(kind("shoulders")).toBe("shoulderPosition");
    expect(kind("breathing")).toBe("breathing");
    expect(kind("motion-instruction")).toBe("motionInstruction");
    expect(kind("rotation")).toBeUndefined(); // numeric checks stay formatted numbers
  });
});
