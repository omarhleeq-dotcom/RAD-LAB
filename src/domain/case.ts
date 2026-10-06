import type { LocalizedText } from "./localized";
import type {
  BreathingId,
  CategoryId,
  ImageVariantId,
  NumericSettingKey,
  ProjectionId,
  SimulationSettings,
} from "./simulation";

export interface PatientProfile {
  age: number;
  sex: "female" | "male";
  description: LocalizedText;
}

/** Detector geometry; centering/collimation coordinates are relative to it. */
export interface DetectorSpec {
  widthCm: number;
  heightCm: number;
}

/** Slider bounds for numeric controls on the console / positioning view. */
export interface NumericControlSpec {
  min: number;
  max: number;
  step: number;
}

/** Rectangle on the detector, cm from its top-left corner. */
export interface DetectorRegion {
  xCm: number;
  yCm: number;
  widthCm: number;
  heightCm: number;
}

export interface RuleFeedback {
  pass: LocalizedText;
  /** Used for a failed/partial result when no direction-specific text exists. */
  fail: LocalizedText;
  low?: LocalizedText;
  high?: LocalizedText;
}

interface RuleBase {
  id: string;
  category: CategoryId;
  /** Relative weight inside its category. Defaults to 1. */
  weight?: number;
  /** Short name of what is being checked. */
  label: LocalizedText;
  feedback: RuleFeedback;
}

/** Setting must equal a specific value. */
export interface EqualsRule extends RuleBase {
  kind: "equals";
  setting: "projection" | "breathing";
  expected: ProjectionId | BreathingId;
  variantOnFail?: ImageVariantId;
}

/** Numeric setting inside an ideal band (full credit) or acceptable band (half credit). */
export interface RangeRule extends RuleBase {
  kind: "range";
  setting: NumericSettingKey;
  ideal: [number, number];
  acceptable: [number, number];
  unit: string;
  variantOnLow?: ImageVariantId;
  variantOnHigh?: ImageVariantId;
}

/**
 * The collimated field (centered on the central ray, clamped to the detector)
 * must cover the required anatomy without being opened excessively wide.
 */
export interface CoverageRule extends RuleBase {
  kind: "coverage";
  /** The case's `requiredAnatomy` is the region that must be covered. */
  maxMarginCm: number;
  variantOnClipped?: ImageVariantId;
}

export type CheckRule = EqualsRule | RangeRule | CoverageRule;

export interface ScoringRules {
  /** Category weights; should sum to 100. Configurable per case. */
  categoryWeights: Record<CategoryId, number>;
  /** Total score (0–100) at or above which the attempt counts as acceptable. */
  passThreshold: number;
}

export interface PossibleError {
  id: string;
  variant: ImageVariantId;
  description: LocalizedText;
}

export interface ImageCriterion {
  id: string;
  description: LocalizedText;
}

/**
 * A simulation case. Pure data: adding an exam means adding an object like this,
 * not a new page.
 */
export interface RadCase {
  id: string;
  modality: "general-radiography";
  bodyPart: "chest";
  title: LocalizedText;
  patient: PatientProfile;
  clinicalScenario: LocalizedText;
  requestedExamination: LocalizedText;
  /** Projection requested on the exam order. */
  requiredProjection: ProjectionId;
  patientCondition: LocalizedText;
  detector: DetectorSpec;
  /** Anatomy that must be demonstrated (drives coverage + schematic drawing). */
  requiredAnatomy: DetectorRegion;
  controls: Record<NumericSettingKey, NumericControlSpec>;
  availableProjections: ProjectionId[];
  availableBreathing: BreathingId[];
  /** State when the case loads. Intentionally not the ideal answer. */
  initialSettings: SimulationSettings;
  rules: CheckRule[];
  scoring: ScoringRules;
  possibleErrors: PossibleError[];
  imageCriteria: ImageCriterion[];
  /** True while any clinical value in this case has not been validated by a subject expert. */
  provisional: boolean;
}
