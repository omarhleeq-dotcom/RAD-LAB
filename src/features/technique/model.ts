/**
 * Deterministic EDUCATIONAL detector-exposure model.
 *
 *   attenuation + kVp + mAs|AEC + SID + collimation/positioning
 *     → detector-exposure tendency (EI/EIT ratio)
 *     → DI-like (target-relative) value → noise / penetration / dose-awareness tendencies
 *
 * Evidence map (see docs/session-3-technique.md):
 *  - Inverse-square distance–intensity relation ........ VALIDATED physics
 *  - More mAs → more X-ray quantity .................... VALIDATED physics
 *  - Quantum noise ∝ 1/√(receptor exposure) ............ VALIDATED physics
 *  - kVp changes spectrum/penetration/output ........... VALIDATED physics (the exponent below is NOT validated)
 *  - How these combine into one number ................. EDUCATIONAL SIMPLIFICATION
 *  - Reference point, DI bands, kVp target band ........ PROVISIONAL / LOCAL-PROTOCOL (from the case profile)
 *
 * It does NOT predict a real detector's EI or any patient dose, and it has no notion of displayed brightness:
 * on DR the image is processed to a normalised display, so brightness is not an exposure meter.
 */
import type { DetectorSpec } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import type {
  DetectorExposureResult,
  DoseAwareness,
  ExposureTendency,
  NoiseLevel,
  PenetrationTendency,
  TechniqueProfile,
} from "@/domain/technique";
import { collimatedField } from "@/features/simulation/geometry";
import { evaluateAec } from "./aec";
import { deviationIndexFromRatio } from "./di";

const EPS = 1e-9;

/** Inverse-square factor relative to the reference distance: >1 closer than reference, <1 farther. */
export const inverseSquareFactor = (referenceCm: number, sidCm: number) => (referenceCm / sidCm) ** 2;

/** Attenuation of this patient for the selected projection (S11): the per-projection value, else the scalar. */
export function attenuationFor(profile: TechniqueProfile, projection: SimulationSettings["projection"] | undefined): number {
  const { attenuation, attenuationByProjection } = profile.patient;
  return (projection && attenuationByProjection?.[projection]) || attenuation;
}

/** Manual mAs that would land exactly on the target at this kVp / SID for this patient and system. */
export function targetMas(profile: TechniqueProfile, s: Pick<SimulationSettings, "kvp" | "sidCm"> & Partial<Pick<SimulationSettings, "projection">>): number {
  const { reference, kvpExponent } = profile.manual;
  const kvpGain = Math.pow(s.kvp / reference.kvp, kvpExponent);
  const geometry = inverseSquareFactor(reference.sidCm, s.sidCm);
  return (
    (reference.mas * attenuationFor(profile, s.projection)) / (kvpGain * geometry * profile.system.relativeResponse)
  );
}

/** Manual-mode receptor exposure relative to the target (EI/EIT). */
export function manualExposureRatio(
  profile: TechniqueProfile,
  s: Pick<SimulationSettings, "kvp" | "mas" | "sidCm"> & Partial<Pick<SimulationSettings, "projection">>,
): number {
  return s.mas / targetMas(profile, s);
}

export function classifyTendency(di: number, p: TechniqueProfile): ExposureTendency {
  const { ideal, acceptable } = p.deviation;
  if (di < acceptable[0] - EPS) return "insufficient";
  if (di < ideal[0] - EPS) return "below-target";
  if (di <= ideal[1] + EPS) return "target-range";
  if (di <= acceptable[1] + EPS) return "above-target";
  return "excessive";
}

const NOISE_BY_TENDENCY: Record<ExposureTendency, NoiseLevel> = {
  insufficient: "marked",
  "below-target": "increased",
  "target-range": "target",
  "above-target": "reduced",
  excessive: "reduced",
};

const DOSE_BY_TENDENCY: Record<ExposureTendency, DoseAwareness> = {
  insufficient: "below-target",
  "below-target": "below-target",
  "target-range": "optimized",
  "above-target": "above-target",
  excessive: "dose-creep-risk",
};

export function classifyPenetration(kvp: number, p: TechniqueProfile): PenetrationTendency {
  const [lo, hi] = p.kvp.referenceRange;
  if (kvp < lo) return "low";
  if (kvp > hi) return "high";
  return "within-reference-range";
}

/**
 * Pure, deterministic: the same settings and profile always give the same result.
 * `detector` is only needed to place the collimated light field over the AEC chambers.
 */
export function computeDetectorExposure(
  profile: TechniqueProfile,
  settings: SimulationSettings,
  detector: DetectorSpec,
): DetectorExposureResult {
  // A protocol without AEC (S14.1b) is manual-only whatever the settings say.
  const mode = settings.exposureMode === "aec" && !profile.aec ? "manual" : settings.exposureMode;
  const tMas = targetMas(profile, settings);
  let ratio: number;
  let deliveredMas: number;
  let aec: DetectorExposureResult["aec"] = null;

  if (mode === "aec") {
    aec = evaluateAec(profile, settings.aecChambers, collimatedField(settings, detector), detector);
    // Educational AEC: re-terminates at the target for any kVp/SID/patient (its validated purpose); what
    // remains is the error from WHERE it senses. With nothing to sense it runs to its backup limit.
    ratio = aec.terminatedOnChambers
      ? (aec.chamberRelativeExposure as number)
      : profile.aec!.backupRelativeExposure;
    deliveredMas = tMas * ratio;
  } else {
    ratio = manualExposureRatio(profile, settings);
    deliveredMas = settings.mas;
  }

  const di = deviationIndexFromRatio(ratio);
  const tendency = classifyTendency(di, profile);
  return {
    mode,
    exposureRatio: ratio,
    deviationIndex: di,
    tendency,
    quantumNoise: { relative: 1 / Math.sqrt(ratio), level: NOISE_BY_TENDENCY[tendency] },
    penetration: classifyPenetration(settings.kvp, profile),
    doseAwareness: DOSE_BY_TENDENCY[tendency],
    deliveredMas,
    targetMas: tMas,
    sid: {
      sidCm: settings.sidCm,
      referenceCm: profile.manual.reference.sidCm,
      inverseSquareFactor: inverseSquareFactor(profile.manual.reference.sidCm, settings.sidCm),
      compensatedByAec: mode === "aec",
    },
    aec,
    profileId: profile.id,
  };
}
