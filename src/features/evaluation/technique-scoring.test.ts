import { describe, expect, it } from "vitest";
import { CASES } from "@/data/cases";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import type { TechniqueRule } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { EVIDENCE_CLASSES } from "@/domain/technique";
import { targetMas } from "@/features/technique/model";
import { evaluate } from "./engine";

const profile = chestPaErect.technique;
const ok: SimulationSettings = {
  projection: "pa-erect",
  rotationDeg: 0,
  centralRay: { x: 0, y: -0.07 },
  collimation: { width: 0.94, height: 0.84 },
  chinPosition: "elevated",
  shoulderPosition: "rolled-forward",
  sideMarker: "L",
  markerPosition: { x: -0.84, y: 0.68 },
  sidCm: 180,
  kvp: 120,
  mas: 3.2,
  exposureMode: "manual",
  aecChambers: [],
  breathing: "deep-inspiration-hold",
};
const run = (patch: Partial<SimulationSettings> = {}) => evaluate(chestPaErect, { ...ok, ...patch });
const check = (r: ReturnType<typeof run>, id: string) => r.checks.find((c) => c.ruleId === id);
const exposureCat = (r: ReturnType<typeof run>) => r.score.categories.find((c) => c.category === "exposure")!;

describe("global scoring architecture is preserved", () => {
  it("keeps the 25/20/15/20/10/10 weights summing to 100", () => {
    expect(chestPaErect.scoring.categoryWeights).toEqual({
      positioning: 25, rotation: 20, centering: 15, exposure: 20, sid: 10, breathing: 10,
    });
  });

  it("scores a fully on-target manual setup 100", () => {
    expect(run().score.total).toBe(100);
  });
});

describe("technique subchecks", () => {
  it("evaluates kVp against the reference range (partial) and the provisional protocol band (full)", () => {
    expect(check(run({ kvp: 118 }), "kvp")?.outcome).toBe("pass");
    expect(check(run({ kvp: 105 }), "kvp")?.outcome).toBe("partial"); // inside 100–150, outside target band
    expect(check(run({ kvp: 140 }), "kvp")?.outcome).toBe("partial");
    expect(check(run({ kvp: 70 }), "kvp")?.outcome).toBe("fail");
    expect(run({ kvp: 70 }).variants).toContain("low-penetration");
  });

  it("does not map high kVp to a darker/lighter image finding", () => {
    const r = run({ kvp: 150, mas: targetMas(profile, { kvp: 150, sidCm: 180 }) });
    expect(r.variants.every((v) => v !== "excess-exposure" && v !== "low-exposure")).toBe(true);
  });

  it("separates adequacy (noise side) from dose optimization (excess side)", () => {
    const low = run({ mas: 1 });
    expect(check(low, "exposure-adequacy")?.outcome).not.toBe("pass");
    expect(check(low, "dose-optimization")?.outcome).toBe("pass");
    const high = run({ mas: 16 });
    expect(check(high, "exposure-adequacy")?.outcome).toBe("pass"); // plenty of signal…
    expect(check(high, "dose-optimization")?.outcome).not.toBe("pass"); // …but not optimized
  });

  it("does NOT reward simply increasing mAs: the score peaks near target then falls", () => {
    const scoreAt = (mas: number) => exposureCat(run({ mas })).ratio;
    const target = scoreAt(3.2);
    expect(scoreAt(0.5)).toBeLessThan(target);
    expect(scoreAt(40)).toBeLessThan(target);
    expect(scoreAt(16)).toBeLessThan(scoreAt(4));
  });

  it("scores the same exposure identically whether reached by mAs, SID or kVp (target-relative)", () => {
    // 2× the exposure via mAs…
    const viaMas = run({ mas: 6.3 });
    // …and via a shorter SID that gives a comparable ratio.
    const viaSid = run({ sidCm: 130 });
    expect(check(viaMas, "dose-optimization")?.outcome).toBe(check(viaSid, "dose-optimization")?.outcome);
  });

  it("makes SID affect exposure in manual mode (inverse square) but not in AEC mode", () => {
    expect(check(run({ sidCm: 120 }), "dose-optimization")?.outcome).not.toBe("pass");
    const aec = run({ exposureMode: "aec", aecChambers: ["left", "right"], sidCm: 120 });
    expect(check(aec, "dose-optimization")?.outcome).toBe("pass");
    expect(check(aec, "exposure-adequacy")?.outcome).toBe("pass");
    // The SID rule itself (geometry/magnification) is still scored in its own category.
    expect(check(aec, "sid")?.outcome).not.toBe("pass");
  });
});

describe("AEC scoring", () => {
  const aec = (chambers: SimulationSettings["aecChambers"], patch: Partial<SimulationSettings> = {}) =>
    run({ exposureMode: "aec", aecChambers: chambers, ...patch });

  it("omits the chamber check in manual mode and lists it in AEC mode", () => {
    expect(check(run(), "aec-chambers")).toBeUndefined();
    expect(check(aec(["left", "right"]), "aec-chambers")?.outcome).toBe("pass");
  });

  it("scores the AEC consequence once (chamber check is explanatory, weight 0)", () => {
    const r = aec(["center"]);
    expect(check(r, "aec-chambers")?.scored).toBe(false);
    expect(check(r, "aec-chambers")?.outcome).toBe("partial");
    expect(check(r, "dose-optimization")?.outcome).toBe("partial");
  });

  it("explains a mediastinal-chamber selection and an out-of-field selection with the right cause", () => {
    expect(check(aec(["center"]), "aec-chambers")?.feedback.en).toMatch(/central anatomy/);
    const out = aec(["left", "right"], { collimation: { width: 0.3, height: 0.84 } });
    expect(check(out, "aec-chambers")?.outcome).toBe("fail");
    expect(check(out, "aec-chambers")?.feedback.en).toMatch(/backup limit/);
    expect(check(out, "dose-optimization")?.outcome).toBe("fail");
  });

  it("does not declare any chamber combination universally correct: all feedback names the vendor/protocol caveat", () => {
    const rule = chestPaErect.rules.find((r) => r.id === "aec-chambers")!;
    expect(rule.evidence.status).toBe("vendor-protocol-dependent");
    expect(rule.feedback.pass.en).toMatch(/vendor-neutral/);
    expect(rule.feedback.high?.en).toMatch(/vendor|protocol/);
  });

  it("does not let the manual mAs influence an AEC result", () => {
    expect(aec(["left", "right"], { mas: 0.5 }).score.total).toBe(aec(["left", "right"], { mas: 40 }).score.total);
  });
});

describe("every scored technique rule is fully evidenced and bilingual", () => {
  const rules = chestPaErect.rules.filter((r): r is TechniqueRule => r.kind === "technique");

  it("has the four technique subchecks", () => {
    expect(rules.map((r) => r.check).sort()).toEqual(["aec-chambers", "dose-optimization", "exposure-adequacy", "kvp-band"]);
  });

  it.each(rules.map((r) => [r.id, r] as const))("%s has status, reference, classification, and EN+AR explanation", (_id, r) => {
    expect(EVIDENCE_CLASSES).toContain(r.evidence.status);
    expect(r.evidence.reference.length).toBeGreaterThan(0);
    expect(r.evidence.note?.length ?? 0).toBeGreaterThan(0);
    for (const text of Object.values(r.feedback)) {
      expect(text.en.length).toBeGreaterThan(10);
      expect(text.ar.length).toBeGreaterThan(10);
    }
    expect(r.feedback.pass).toBeDefined();
    expect(r.feedback.fail).toBeDefined();
  });

  it("never classifies unsupported technique values as validated", () => {
    for (const r of rules) expect(r.evidence.status).not.toBe("validated");
  });

  it("carries the rule's evidence through to every result check", () => {
    for (const k of run().checks) expect(EVIDENCE_CLASSES).toContain(k.evidence.status);
  });
});

describe("technique profile separates range / target / tolerance / evidence", () => {
  it("keeps selectable range (controls), protocol target and tolerances in different places", () => {
    expect(chestPaErect.controls.kvp.min).toBeLessThan(profile.kvp.referenceRange[0]);
    expect(chestPaErect.controls.kvp.max).toBeGreaterThanOrEqual(profile.kvp.referenceRange[1]);
    expect(profile.kvp.targetBand[0]).toBeGreaterThanOrEqual(profile.kvp.referenceRange[0]);
    expect(profile.kvp.targetBand[1]).toBeLessThanOrEqual(profile.kvp.referenceRange[1]);
    expect(profile.deviation.ideal[0]).toBeGreaterThanOrEqual(profile.deviation.acceptable[0]);
    expect(profile.deviation.ideal[1]).toBeLessThanOrEqual(profile.deviation.acceptable[1]);
  });

  it("classifies the evidence of every protocol group, never as validated clinical truth", () => {
    expect(profile.evidence.status).toBe("provisional");
    expect(profile.manual.evidence.status).toBe("provisional");
    expect(profile.kvp.evidence.referenceRange.status).toBe("common-reference");
    expect(profile.kvp.evidence.targetBand.status).toBe("provisional");
    expect(profile.deviation.evidence.status).toBe("provisional");
    expect(profile.aec.evidence.status).toBe("vendor-protocol-dependent");
    expect(profile.system.evidence.status).toBe("vendor-protocol-dependent");
  });

  it("does not hard-code a universal EIT: no numeric EI/EIT anywhere in the profile", () => {
    const keys = new Set<string>();
    const walk = (v: unknown) => {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object") {
        for (const [k, x] of Object.entries(v)) {
          keys.add(k);
          walk(x);
        }
      }
    };
    walk(profile);
    for (const k of keys) expect(k, k).not.toMatch(/^(eit|ei|targetei|exposureindex.*|deviationlimit.*)$/i);
  });

  it("classifies SID 180 as a common reference (technique reference §3.1), with provisional bands", () => {
    expect(chestPaErect.rules.find((r) => r.id === "sid")?.evidence.status).toBe("common-reference");
    expect(chestPaErect.rules.find((r) => r.id === "sid")?.evidence.note).toMatch(/PROVISIONAL/);
  });

  it("every assumption listed to the learner has a bilingual label/value and an evidence class", () => {
    expect(profile.assumptions.length).toBeGreaterThan(8);
    for (const a of profile.assumptions) {
      expect(EVIDENCE_CLASSES).toContain(a.evidence.status);
      expect(a.label.en && a.label.ar && a.value.en && a.value.ar).toBeTruthy();
    }
    const classes = new Set(profile.assumptions.map((a) => a.evidence.status));
    for (const c of EVIDENCE_CLASSES) expect(classes.has(c), c).toBe(true);
  });

  it("applies to every registered case", () => {
    for (const c of CASES) expect(c.technique.id.length).toBeGreaterThan(0);
  });
});
