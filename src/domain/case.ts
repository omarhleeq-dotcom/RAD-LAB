import type { LocalizedText } from "./localized";
import type { PatientCooperationProfile } from "./patient";
import type { RadiographAssetSpec } from "./radiograph";
import type { Evidence, EvidenceClass, TechniqueProfile } from "./technique";
import type {
  BreathingId,
  CategoryId,
  EnumSettingKey,
  NormPoint,
  ImageVariantId,
  MotionInstructionId,
  NumericSettingKey,
  ProjectionId,
  SideMarkerId,
  SimulationSettings,
  ViewerSide,
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
  /**
   * Optional discrete console stations (ascending). When present, +/- and the slider walk this list instead
   * of `step` (e.g. a preferred-number mAs series), as real consoles do. Within [min, max].
   */
  stations?: number[];
}

/** Rectangle on the detector, cm from its top-left corner. */
export interface DetectorRegion {
  xCm: number;
  yCm: number;
  widthCm: number;
  heightCm: number;
}

/**
 * How firmly a medical rule is backed by the medical references (docs/RAD-LAB_Medical_Reference_Chest_PA*.md).
 * Session 3 widened this from three to the five classes of the technique reference §2.
 */
export type EvidenceStatus = EvidenceClass;

/** Traceability for a medically meaningful rule. */
export type RuleEvidence = Evidence;

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

/**
 * Technique subchecks, all evaluated from the deterministic technique model (`features/technique`) against
 * the case's `TechniqueProfile`. Each is an independent, evidence-labelled subcheck of the Exposure category:
 * - "kvp-band": kVp vs the common reference range (partial) and the provisional protocol band (full).
 * - "exposure-adequacy": is there enough receptor exposure (quantum-noise side)? Excess never fails this check.
 * - "dose-optimization": is the receptor exposure kept near target (dose-creep side)? Low exposure never fails it.
 * - "aec-chambers": AEC only; explains the AEC consequence. Intended `weight: 0` so the consequence is scored once,
 *   by the two checks above. Not applicable (omitted) in manual mode.
 * Feedback keys: `pass`, `low`, `high`, `fail` (see each check in the engine). For "exposure-adequacy", `high` is
 * the text for a passing check whose exposure is above target (it points to dose optimization).
 */
export interface TechniqueRule extends RuleBase {
  kind: "technique";
  check: "kvp-band" | "exposure-adequacy" | "dose-optimization" | "aec-chambers";
  variantOnLow?: ImageVariantId;
  variantOnHigh?: ImageVariantId;
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
  feedback: RuleFeedback & { overlap: LocalizedText; outsideField: LocalizedText; wrongSide: LocalizedText };
}

export type CheckRule = EqualsRule | RangeRule | CoverageRule | CenteringRule | MarkerRule | TechniqueRule;

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
  /**
   * Laterality convention shared by marker scoring AND rendering (a single source of truth): on which half of the
   * displayed detector each marker belongs. PA display: patient left = viewer right, so L → "viewer-right".
   * Educational convention, never affected by UI language / RTL. TODO(medical-review): confirm with educators.
   */
  markerSide: Record<SideMarkerId, ViewerSide>;
  /** Where each marker appears when first chosen: the lateral margin of ITS side, outside the required anatomy. */
  defaultMarkerPosition: Record<SideMarkerId, NormPoint>;
}

/** Critical findings: each one, when present, forces "below the educational pass mark" whatever the number is. */
export type CriticalFindingId = "wrong-projection" | "patient-motion" | "wrong-side-marker";

/**
 * A critical-finding rule (case data). Critical findings GATE the pass mark; they never change the numeric score
 * or any category weight. Detection is a pure function of the settings (`features/evaluation/critical.ts`).
 */
export interface CriticalFindingRule {
  id: CriticalFindingId;
  label: LocalizedText;
  /** Why this forces "below the pass mark" (shown to the learner in both languages). */
  reason: LocalizedText;
  /** The clinical CONCEPT (a common quality criterion: such an image would be rejected / repeated in practice). */
  concept: Evidence;
  /** The IMPLEMENTATION in this simulator (the gating itself is provisional / educational). */
  evidence: Evidence;
}

export interface ScoringRules {
  /** Category weights; should sum to 100. Configurable per case. */
  categoryWeights: Record<CategoryId, number>;
  /** Total score (0–100) at or above which the attempt counts as acceptable. */
  passThreshold: number;
  /** Findings that force "below the pass mark" regardless of the numeric score (weights are unchanged). */
  criticalFindings: CriticalFindingRule[];
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
 * The compatibility view of one simulation case: an exam plus one patient scenario on it, flattened into the single
 * object the engine, renderer, store and UI consume. Pure data: adding an exam or a case means adding definitions,
 * not a new page.
 *
 * Session 7: no longer hand-written. It is composed by `composeCase(exam, case)` (features/exam/compose.ts) from an
 * `ExamDefinition` (src/data/exams) and a `CaseDefinition` (src/data/cases); see `domain/exam.ts` for which fields
 * belong to which half. The rule / scoring / control TYPES in this file belong to the exam half.
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
  /**
   * Technically selectable ranges (what the console allows). NOT the educational target and NOT a scoring
   * tolerance: those live in `technique`.
   */
  controls: Record<NumericSettingKey, NumericControlSpec>;
  /** Protocol profile for the technique/exposure model. A different case supplies a different profile. */
  technique: TechniqueProfile;
  positioning: PositioningSpec;
  /** Educational baseline radiograph + asset-specific landmarks consumed by the Session 4 renderer. */
  radiograph: RadiographAssetSpec;
  /** Deterministic instruction → patient-response model (Session 4). Another case supplies another patient. */
  patientCooperation: PatientCooperationProfile;
  availableProjections: ProjectionId[];
  availableBreathing: BreathingId[];
  availableMotionInstructions: MotionInstructionId[];
  /** State when the case loads. Intentionally not the ideal answer. */
  initialSettings: SimulationSettings;
  rules: CheckRule[];
  scoring: ScoringRules;
  possibleErrors: PossibleError[];
  imageCriteria: ImageCriterion[];
  /** True while any clinical value in this case has not been validated by a subject expert. */
  provisional: boolean;
}
