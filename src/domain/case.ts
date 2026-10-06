import type { LocalizedText } from "./localized";
import type {
  BreathingId,
  CategoryId,
  EnumSettingKey,
  NormPoint,
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

/** How firmly a medical rule is backed by docs/RAD-LAB_Medical_Reference_Chest_PA.md. */
export type EvidenceStatus = "validated" | "educational-simplification" | "provisional";

/** Traceability for a medically meaningful rule. */
export interface RuleEvidence {
  status: EvidenceStatus;
  /** Section of the medical reference (or "none" when provisional). */
  reference: string;
  /** What exactly is validated vs simplified/provisional. */
  note?: string;
}

export interface RuleFeedback {
  pass: LocalizedText;
  /** Used for a failed/partial result when no direction-specific text exists. */
  fail: LocalizedText;
  /** Numeric rules: value below the ideal band. Centering: toward the left (x) / top (y) of the detector. */
  low?: LocalizedText;
  /** Numeric rules: value above the ideal band. Centering: toward the right (x) / bottom (y) of the detector. */
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
  evidence: RuleEvidence;
}

/** Setting must equal a specific value. */
export interface EqualsRule extends RuleBase {
  kind: "equals";
  setting: EnumSettingKey;
  expected: string;
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
 * The collimated field (centered on the central ray, clamped to the detector) is checked against
 * the case's `requiredAnatomy`. Two independent subchecks of the Positioning category:
 * - "clipping": any required anatomy outside the field fails.
 * - "excess": a field opened more than `maxMarginCm` beyond the anatomy earns partial credit.
 */
export interface CoverageRule extends RuleBase {
  kind: "coverage";
  check: "clipping" | "excess";
  maxMarginCm: number;
  variantOnClipped?: ImageVariantId;
  /** Clipping only: which anatomy is lost when the field cuts off this side of the required region. */
  clippedSides?: Record<"left" | "right" | "top" | "bottom", LocalizedText>;
}

/**
 * Central-ray position on one axis against `RadCase.positioning.centering`.
 * Feedback `low` = toward the left (x) / top (y) of the detector, `high` = right / bottom.
 */
export interface CenteringRule extends RuleBase {
  kind: "centering";
  axis: "x" | "y";
}

/**
 * Side-marker placement. Educational only: give it `weight: 0` until a validated scoring rule exists.
 * TODO(medical-review): rule for marker side vs. patient side is not defined in the medical reference.
 */
export interface MarkerRule extends RuleBase {
  kind: "marker";
  /** `fail` = nothing placed. */
  feedback: RuleFeedback & { overlap: LocalizedText; outsideField: LocalizedText };
}

export type CheckRule = EqualsRule | RangeRule | CoverageRule | CenteringRule | MarkerRule;

/** Educational centering target region, normalized (see NormPoint). Provisional tolerances. */
export interface CenteringSpec {
  /** Midline (x = 0) and mid-thoracic / T7 teaching region (y). */
  target: NormPoint;
  /** Half-extent of the full-credit region. */
  idealTolerance: NormPoint;
  /** Half-extent of the half-credit region. */
  acceptableTolerance: NormPoint;
}

export interface PositioningSpec {
  centering: CenteringSpec;
  /** Smallest collimation size (fraction of detector) the UI allows. */
  minCollimation: number;
  /** Side-marker size on the detector, used for overlap/bounds checks. */
  markerSizeCm: number;
  /** Where a marker appears when first chosen (outside the required anatomy). */
  defaultMarkerPosition: NormPoint;
}

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
  positioning: PositioningSpec;
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
