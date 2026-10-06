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

export type ChinPositionId = "tucked" | "elevated";
export type ShoulderPositionId = "relaxed" | "rolled-forward";
export type SideMarkerId = "L" | "R";

/**
 * A point in normalized detector coordinates, independent of rendering size and UI direction.
 * x: -1 = left edge of the detector as displayed (viewer's left), +1 = right edge. Never mirrored by RTL.
 * y: -1 = top edge, +1 = bottom edge.
 */
export interface NormPoint {
  x: number;
  y: number;
}

/**
 * Collimated field size as a fraction of the detector (1 = full detector width/height).
 * The light field is centred on the central ray, as on a real collimator.
 */
export interface CollimationSize {
  width: number;
  height: number;
}

/** Everything the student can configure before pressing Expose. */
export interface SimulationSettings {
  projection: ProjectionId;
  /** Patient rotation about the long axis, degrees. 0 = true (un-rotated) position. */
  rotationDeg: number;
  /** Central-ray position on the detector, normalized (see NormPoint). */
  centralRay: NormPoint;
  collimation: CollimationSize;
  chinPosition: ChinPositionId;
  shoulderPosition: ShoulderPositionId;
  /** Radiographic side marker; null = none placed yet. */
  sideMarker: SideMarkerId | null;
  /** Marker centre on the detector, normalized. Only meaningful once a marker is placed. */
  markerPosition: NormPoint;
  sidCm: number;
  kvp: number;
  mas: number;
  breathing: BreathingId;
}

/** Settings that take one of a fixed set of string ids. */
export type EnumSettingKey = "projection" | "breathing" | "chinPosition" | "shoulderPosition";

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
  | "chin-overlap"
  | "scapulae-overlap"
  | "poor-inspiration"
  | "underexposed"
  | "overexposed"
  | "magnified-geometry";
