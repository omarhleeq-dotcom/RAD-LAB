import { describe, expect, it } from "vitest";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import type { SimulationSettings } from "@/domain/simulation";
import type { TechniqueProfile } from "@/domain/technique";
import {
  classifyPenetration,
  classifyTendency,
  computeDetectorExposure,
  inverseSquareFactor,
  manualExposureRatio,
  targetMas,
} from "./model";

const profile = chestPaErect.technique;
const ref = profile.manual.reference;
const base: SimulationSettings = {
  ...chestPaErect.initialSettings,
  kvp: ref.kvp,
  mas: ref.mas,
  sidCm: ref.sidCm,
  centralRay: { x: 0, y: -0.07 },
  collimation: { width: 0.94, height: 0.84 },
};
const run = (patch: Partial<SimulationSettings> = {}, p: TechniqueProfile = profile) =>
  computeDetectorExposure(p, { ...base, ...patch }, chestPaErect.detector);

describe("detector-exposure model (manual)", () => {
  it("is exactly on target (DI 0) at the profile's reference technique", () => {
    const r = run();
    expect(r.exposureRatio).toBeCloseTo(1, 12);
    expect(r.deviationIndex).toBeCloseTo(0, 10);
    expect(r.tendency).toBe("target-range");
    expect(r.doseAwareness).toBe("optimized");
  });

  it("scales linearly with mAs (more quanta) and is not rewarded for being larger", () => {
    expect(run({ mas: ref.mas * 2 }).exposureRatio).toBeCloseTo(2, 10);
    expect(run({ mas: ref.mas / 2 }).exposureRatio).toBeCloseTo(0.5, 10);
    expect(run({ mas: ref.mas * 2 }).deviationIndex).toBeCloseTo(3.01, 2);
    expect(run({ mas: ref.mas * 8 }).tendency).toBe("excessive");
    expect(run({ mas: ref.mas * 8 }).doseAwareness).toBe("dose-creep-risk");
  });

  it("raises receptor exposure with kVp at fixed mAs, but exposes no brightness/darkness value", () => {
    expect(run({ kvp: ref.kvp + 20 }).exposureRatio).toBeGreaterThan(1);
    expect(run({ kvp: ref.kvp - 20 }).exposureRatio).toBeLessThan(1);
    const keys = Object.keys(run());
    expect(keys.some((k) => /bright|dark|density|contrast/i.test(k))).toBe(false);
  });

  it("is deterministic: same settings, identical result", () => {
    expect(run({ kvp: 98, mas: 2.5, sidCm: 150 })).toEqual(run({ kvp: 98, mas: 2.5, sidCm: 150 }));
  });

  it("computes the target mAs that gives DI 0 at any kVp / SID", () => {
    for (const [kvp, sidCm] of [[100, 180], [140, 150], [120, 200]] as const) {
      const m = targetMas(profile, { kvp, sidCm });
      expect(manualExposureRatio(profile, { kvp, sidCm, mas: m })).toBeCloseTo(1, 10);
    }
  });
});

describe("SID integration (single shared SID state, inverse square)", () => {
  it("applies (SID_ref / SID)² to receptor exposure in manual mode", () => {
    expect(inverseSquareFactor(180, 90)).toBe(4);
    expect(run({ sidCm: 150 }).exposureRatio).toBeCloseTo((180 / 150) ** 2, 10);
    expect(run({ sidCm: 200 }).exposureRatio).toBeCloseTo((180 / 200) ** 2, 10);
    expect(run({ sidCm: 120 }).sid.inverseSquareFactor).toBeCloseTo(2.25, 10);
  });

  it("reports the SID it was given (no second SID anywhere)", () => {
    const r = run({ sidCm: 165 });
    expect(r.sid.sidCm).toBe(165);
    expect(r.sid.referenceCm).toBe(ref.sidCm);
    expect(r.sid.compensatedByAec).toBe(false);
  });

  it("is compensated by the educational AEC: receptor exposure stays on target as SID changes", () => {
    const aec = { exposureMode: "aec" as const, aecChambers: ["left", "right"] as ("left" | "right")[] };
    const a = run({ ...aec, sidCm: 140 });
    const b = run({ ...aec, sidCm: 200 });
    expect(a.exposureRatio).toBeCloseTo(1, 10);
    expect(b.exposureRatio).toBeCloseTo(1, 10);
    expect(a.sid.compensatedByAec).toBe(true);
    // What changes is the mAs the AEC delivers (more mAs at a longer SID).
    expect(b.deliveredMas).toBeGreaterThan(a.deliveredMas);
  });
});

describe("tendencies are target-relative and use the profile's bands", () => {
  it("classifies DI against the configured bands", () => {
    expect(classifyTendency(0, profile)).toBe("target-range");
    expect(classifyTendency(-1, profile)).toBe("target-range");
    expect(classifyTendency(-2, profile)).toBe("below-target");
    expect(classifyTendency(-4, profile)).toBe("insufficient");
    expect(classifyTendency(2, profile)).toBe("above-target");
    expect(classifyTendency(5, profile)).toBe("excessive");
  });

  it("changes classification when the profile bands change (configurable, not hard-coded)", () => {
    const strict: TechniqueProfile = { ...profile, deviation: { ...profile.deviation, ideal: [-0.2, 0.2] } };
    expect(classifyTendency(0.8, profile)).toBe("target-range");
    expect(classifyTendency(0.8, strict)).toBe("above-target");
  });

  it("links noise to exposure by photon statistics (∝ 1/√exposure)", () => {
    expect(run({ mas: ref.mas / 4 }).quantumNoise.relative).toBeCloseTo(2, 10);
    expect(run({ mas: ref.mas / 4 }).quantumNoise.level).toBe("marked");
    expect(run({ mas: ref.mas * 4 }).quantumNoise.relative).toBeCloseTo(0.5, 10);
    expect(run().quantumNoise.level).toBe("target");
  });

  it("derives penetration tendency from kVp vs the common reference range", () => {
    expect(classifyPenetration(80, profile)).toBe("low");
    expect(classifyPenetration(100, profile)).toBe("within-reference-range");
    expect(classifyPenetration(150, profile)).toBe("within-reference-range");
    expect(classifyPenetration(151, profile)).toBe("high");
  });

  it("does not let extra mAs repair penetration", () => {
    const r = run({ kvp: 70, mas: targetMas(profile, { kvp: 70, sidCm: ref.sidCm }) });
    expect(r.exposureRatio).toBeCloseTo(1, 10); // exposure target met…
    expect(r.penetration).toBe("low"); // …penetration is still a separate concern
  });
});

describe("future protocol inputs (patient / system) are data, not code", () => {
  it("a more attenuating patient receives less exposure at equal technique (manual)", () => {
    const large: TechniqueProfile = { ...profile, patient: { ...profile.patient, attenuation: 2 } };
    expect(run({}, large).exposureRatio).toBeCloseTo(0.5, 10);
  });

  it("AEC compensates for patient attenuation by delivering more mAs, staying on target", () => {
    const large: TechniqueProfile = { ...profile, patient: { ...profile.patient, attenuation: 2 } };
    const patch = { exposureMode: "aec" as const, aecChambers: ["left", "right"] as ("left" | "right")[] };
    const small = run(patch);
    const big = run(patch, large);
    expect(big.exposureRatio).toBeCloseTo(small.exposureRatio, 10);
    expect(big.deliveredMas).toBeCloseTo(small.deliveredMas * 2, 10);
  });

  it("detector response shifts the manual technique that lands on target", () => {
    const sensitive: TechniqueProfile = { ...profile, system: { ...profile.system, relativeResponse: 2 } };
    expect(targetMas(sensitive, base)).toBeCloseTo(targetMas(profile, base) / 2, 10);
  });
});
