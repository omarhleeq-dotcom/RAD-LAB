/**
 * Modality-agnostic-ish simulation vocabulary. The first implementation targets
 * general radiography (chest). Other exams reuse the same rule engine by
 * supplying their own settings keys and rules.
 */

export type ProjectionId = "pa-erect" | "ap-erect" | "lateral-left";
export type BreathingId =
  | "deep-inspiration-hold"
  | "expiration-hold"
  | "normal-breathing"
  | "no-instruction";

/** Everything the student can configure before pressing Expose. */
export interface SimulationSettings {
  projection: ProjectionId;
  /** Patient rotation about the long axis, degrees. 0 = true (un-rotated) position. */
  rotationDeg: number;
  /** Central-ray position, cm lateral of the detector midline. */
  centerXCm: number;
  /** Central-ray position, cm below the top edge of the detector. */
  centerYCm: number;
  collimationWidthCm: number;
  collimationHeightCm: number;
  sidCm: number;
  kvp: number;
  mas: number;
  breathing: BreathingId;
}

export type SettingKey = keyof SimulationSettings;
export type NumericSettingKey = {
  [K in SettingKey]: SimulationSettings[K] extends number ? K : never;
}[SettingKey];

export type SimulationMode = "practice" | "assessment";
export type SimulationPhase = "setup" | "result";

/** Scoring categories (see docs/RAD-LAB_Project_Specification.md §10). */
export const CATEGORIES = [
  "positioning",
  "rotation",
  "centering",
  "exposure",
  "sid",
  "breathing",
] as const;
export type CategoryId = (typeof CATEGORIES)[number];

/** Result image variants. Real variants will be added once validated imagery exists. */
export type ImageVariantId =
  | "correct"
  | "rotated"
  | "wrong-projection"
  | "clipped"
  | "poor-inspiration"
  | "underexposed"
  | "overexposed"
  | "magnified-geometry";
