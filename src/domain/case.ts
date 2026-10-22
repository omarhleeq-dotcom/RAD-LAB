import type { LocalizedText } from "./localized";
import type { PatientCooperationProfile } from "./patient";
import type { RadiographAssetSpec } from "./radiograph";
import type { Evidence, TechniqueProfile } from "./technique";
import type {
  BodyPartId,
  BreathingId,
  CategoryId,
  ChoiceSettingKey,
  EnumSettingKey,
  NormPoint,
  ImageVariantId,
  MotionInstructionId,
  NumericSettingKey,
  OptionalNumericSettingKey,
  ProjectionId,
  RequiredNumericSettingKey,
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

/** Numeric controls: the four every exam has, plus optional ones an exam adds (tube angulation, S11-2). */
export type NumericControls = Record<RequiredNumericSettingKey, NumericControlSpec> &
  Partial<Record<OptionalNumericSettingKey, NumericControlSpec>>;

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
  /**
   * Optional: this check does not enter its category's weighted average; its credit instead caps the category's ratio
   * (ratio = min(average of the other checks, this credit)). Used by the "stay still" instruction (owner 2026-10-22): a missing
   * instruction leaves half of the breathing category, and a wrong breathing instruction still loses all of it.
   */
  capsCategory?: boolean;
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

/** Setting must equal a specific value (a built-in enum setting, or an exam-declared choice `choices.<id>`). */
export interface EqualsRule extends RuleBase {
  kind: "equals";
  setting: EnumSettingKey | ChoiceSettingKey;
  expected: string;
  variantOnFail?: ImageVariantId;
  /**
   * Optional: setting values (other than `expected`) that earn the engine's partial credit instead of failing, with the same
   * feedback and `variantOnFail`. Absent = any other value fails. Used by the "stay still" instruction (owner 2026-10-22):
   * a missing instruction (`none`) costs half the item, an instruction to move costs all of it.
   */
  partialValues?: string[];
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
  /**
   * Clipping only (S2, owner 2026-10-22). Absent/false = any cut into `requiredAnatomy` fails. True = a cut counts as lost
   * anatomy only on a side where the field also reaches the baseline's landmark box (the anatomy the image shows); a cut that
   * takes only the anatomy-free strip between the region and that box passes, with `feedback.marginOnly` as the remark.
   */
  landmarkBoxOnly?: boolean;
  /**
   * Excess only (S2). Absent/false = the margin is measured beyond `requiredAnatomy`. True = on each side the allowed margin is the
   * larger of `maxMarginCm` and the opening that side actually needs: the smallest field, centred on the actual central ray, that
   * still covers the required anatomy and the placed marker. So an opening the geometry forces (off-centre ray) or the marker
   * needs is not excess, but it is never added on top of `maxMarginCm`: a fully open field stays excess.
   */
  beyondNeeded?: boolean;
  feedback: RuleFeedback & {
    /** Clipping with `landmarkBoxOnly`: the field cuts only the anatomy-free margin. Absent = the pass text. */
    marginOnly?: LocalizedText;
  };
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
  feedback: RuleFeedback & {
    overlap: LocalizedText;
    outsideField: LocalizedText;
    wrongSide: LocalizedText;
    /** Detector-side rule only: non-critical note when the right letter sits in the other display half (S3 option D). Absent = the pass text. */
    displayHalf?: LocalizedText;
  };
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
  /** How the marker letter is judged (S11-1). Absent = anatomical side, the Chest PA rule. */
  markerRule?: MarkerRuleSpec;
  /**
   * Optional (S-PELVIS-3-1): the areas the marker must keep clear of (detector cm). Absent = the whole `requiredAnatomy` box, the
   * original rule. An exam whose anatomy box is much larger than the bones (the pelvis) lists tighter zones so the marker can sit
   * in an empty corner of the box instead of on the detector edge.
   */
  markerKeepOut?: DetectorRegion[];
}

/**
 * An extra enum control an exam declares (S11 generalisation; e.g. which side is against the detector, arm position,
 * patient state). The value lives in `SimulationSettings.choices[id]`; labels are bilingual data, not message keys.
 */
export interface ChoiceControlSpec {
  /** Control id; the setting key is `choices.<id>`. */
  id: string;
  label: LocalizedText;
  hint?: LocalizedText;
  options: { id: string; label: LocalizedText }[];
  /**
   * Optional (S13-6): the label the console and the result show for `projection`, chosen by this control's value (e.g. the
   * AP button reads "AP supine" / "AP semi-erect" by patient position). Absent = the generic projection label.
   */
  projectionLabels?: { projection: ProjectionId; byOption: Record<string, LocalizedText> };
}

/**
 * How the marker LETTER is judged (S11-1). Declared per exam; absent = "anatomical-side" (Chest PA, unchanged).
 *  - "anatomical-side": the letter is the patient's own side (PA, AP). Wrong when the marker sits on the viewer half
 *    that `markerSide` does not assign to that letter.
 *  - "detector-side": the letter is the side of the patient against the detector (Lateral, S10b-21), read from the
 *    exam's choice control `choiceId`. Wrong when the letter differs from that side, or the half disagrees with
 *    `markerSide` (the display orientation stays exam data, ADR-0010).
 *  - "fixed-side" (S14.1c, single limb, O21 option A): the letter must be the side the exam / case examines (`side`); there is
 *    NO viewer-half check, because the source gives no display convention for one limb. Presence and "inside the field, not over
 *    the required anatomy" are still checked by `evalMarker`.
 */
export type MarkerRuleSpec = { kind: "anatomical-side" } | { kind: "detector-side"; choiceId: string } | { kind: "fixed-side"; side: SideMarkerId };

/** Critical findings: each one, when present, forces "below the educational pass mark" whatever the number is. */
export type CoreCriticalFindingId = "wrong-projection" | "patient-motion" | "wrong-side-marker";
/** Open vocabulary: an id is valid once a detector is registered for it (`features/evaluation/critical.ts`). */
export type CriticalFindingId = CoreCriticalFindingId | (string & {});

/**
 * A critical-finding rule (case data). Critical findings GATE the pass mark; they never change the numeric score
 * or any category weight. Detection is a pure function of the settings (`features/evaluation/critical.ts`).
 */
export interface CriticalFindingRule {
  id: CriticalFindingId;
  label: LocalizedText;
  /** Why this forces "below the pass mark" (shown to the learner in both languages). */
  reason: LocalizedText;
  /** The clinical CONCEPT (a common quality criterion: such an image would be an important quality error). */
  concept: Evidence;
  /** The IMPLEMENTATION in this simulator (the gating itself is provisional / educational). */
  evidence: Evidence;
}

export interface ScoringRules {
  /**
   * Category weights, sum 100; the KEYS are the exam's categories and their ORDER is the display / score order.
   * Configurable per exam (Chest PA: positioning, rotation, centering, exposure, sid, breathing).
   */
  categoryWeights: Record<string, number>;
  /** Labels for categories that have no `categories.*` message key (anything beyond the core six). */
  categoryLabels?: Record<string, LocalizedText>;
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
export interface RadCase<T extends TechniqueProfile = TechniqueProfile> {
  id: string;
  modality: "general-radiography";
  bodyPart: BodyPartId;
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
  controls: NumericControls;
  /** Extra enum controls the exam declares (absent for Chest PA). */
  choiceControls?: ChoiceControlSpec[];
  /** Protocol profile for the technique/exposure model. A different case supplies a different profile. */
  technique: T;
  positioning: PositioningSpec;
  /** Educational baseline radiograph + asset-specific landmarks consumed by the Session 4 renderer. */
  radiograph: RadiographAssetSpec;
  /** Deterministic instruction → patient-response model (Session 4). Another case supplies another patient. */
  patientCooperation: PatientCooperationProfile;
  availableProjections: ProjectionId[];
  /** Absent (S14.1b) = the exam has no breathing control. */
  availableBreathing?: BreathingId[];
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
