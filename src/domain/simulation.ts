import type { AecChamberId, ExposureMode } from "./technique";

export type { ExposureMode };

/**
 * Modality-agnostic-ish simulation vocabulary. The first implementation targets
 * general radiography (chest). Other exams reuse the same rule engine by
 * supplying their own settings keys and rules.
 */

/**
 * Open id of a projection (S14-0). Known ids are registered in `src/data/projections.ts` (validated by `validateExam`);
 * the engine never switches exhaustively on it. Chest: "pa-erect" | "ap-erect" | "lateral-left".
 */
export type ProjectionId = string;
export type BreathingId =
  | "deep-inspiration-hold"
  | "expiration-hold"
  | "normal-breathing"
  | "no-instruction";

/**
 * What the radiographer tells the patient about keeping still (Session 4). The learner chooses the INSTRUCTION,
 * never the resulting image defect; the simulated patient's response is derived in `features/patient`.
 */
export type MotionInstructionId = "none" | "remain-still" | "relax-and-move";

export type ChinPositionId = "tucked" | "elevated";
export type ShoulderPositionId = "relaxed" | "rolled-forward";
export type SideMarkerId = "L" | "R";
/**
 * Which half of the displayed detector / radiograph, as the viewer sees it (never mirrored by UI language / RTL).
 * DISPLAY CONVENTION (educational): the PA radiograph is displayed as if the viewer faces the patient, so the
 * patient's LEFT is on the viewer's RIGHT. Detector x < 0 is the viewer's left half, x > 0 the viewer's right half.
 */
export type ViewerSide = "viewer-left" | "viewer-right";

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
  /** The single SID state, shared by the positioning view and the exposure model (never duplicated). */
  sidCm: number;
  kvp: number;
  /** Manual-mode mAs. Kept (not cleared) while AEC is active so switching back restores it. */
  mas: number;
  /** Manual vs AEC. In AEC the system terminates the exposure; `mas` is not used. */
  exposureMode: ExposureMode;
  /** Selected AEC sensing chambers, canonical order (see toggleChamber). Only used in AEC mode. */
  aecChambers: AecChamberId[];
  /** Breathing instruction given to the patient (what is said, not what the patient then does). */
  breathing: BreathingId;
  /** Instruction about keeping still given to the patient (what is said, not what the patient then does). */
  motionInstruction: MotionInstructionId;
  /**
   * Tube angulation about the transverse axis, degrees; positive = caudad, negative = cephalad (S11-2). Optional: only
   * exams that declare the control (`ExamDefinition.controls.tubeAngulationDeg`) carry it; absent = 0° (the PA default).
   */
  tubeAngulationDeg?: number;
  /**
   * Values of the exam's extra enum controls (`ExamDefinition.choiceControls`), keyed by control id, e.g. which side is
   * against the detector. Optional: absent for exams without such controls (Chest PA).
   */
  choices?: Record<string, string>;
}

/** Numeric settings every exam has, and the optional ones an exam adds by declaring a control (S11-2). */
export type RequiredNumericSettingKey = "rotationDeg" | "sidCm" | "kvp" | "mas";
export type OptionalNumericSettingKey = "tubeAngulationDeg";
/** Value of an optional numeric setting when the exam does not declare it (the PA behaviour). */
export const OPTIONAL_NUMERIC_DEFAULTS: Record<OptionalNumericSettingKey, number> = { tubeAngulationDeg: 0 };

/** Reads a numeric setting; an undeclared optional one reads as its default. */
export const numericSetting = (s: SimulationSettings, key: NumericSettingKey): number =>
  key === "tubeAngulationDeg" ? (s.tubeAngulationDeg ?? OPTIONAL_NUMERIC_DEFAULTS.tubeAngulationDeg) : s[key];

/** An enum setting an exam declares itself: the key is `choices.<control id>`. */
export type ChoiceSettingKey = `choices.${string}`;
/** Reads an enum setting (a built-in enum or an exam-declared choice); undefined when unset. */
export const enumSetting = (s: SimulationSettings, key: EnumSettingKey | ChoiceSettingKey): string | undefined =>
  key.startsWith("choices.") ? s.choices?.[key.slice("choices.".length)] : (s[key as EnumSettingKey] as string);

/** Settings that take one of a fixed set of string ids. */
export type EnumSettingKey = "projection" | "breathing" | "chinPosition" | "shoulderPosition" | "motionInstruction";

export type SettingKey = keyof SimulationSettings;
export type NumericSettingKey = RequiredNumericSettingKey | OptionalNumericSettingKey;

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
/** The six Chest PA categories (message keys `categories.*` exist for these). */
export type CoreCategoryId = (typeof CATEGORIES)[number];
/**
 * An exam declares its own categories as the keys of `ScoringRules.categoryWeights` (S11 generalisation); a category
 * outside the core six brings its label in `ScoringRules.categoryLabels`.
 */
export type CategoryId = CoreCategoryId | (string & {});

/** Result image variants. Real variants will be added once validated imagery exists. */
export type CoreImageVariantId =
  | "correct"
  | "rotated"
  | "wrong-projection"
  | "clipped"
  | "chin-overlap"
  | "scapulae-overlap"
  | "poor-inspiration"
  | "motion"
  // Technique findings are about DETECTOR exposure / penetration, never about displayed brightness.
  | "low-exposure"
  | "excess-exposure"
  | "low-penetration"
  | "magnified-geometry";

/**
 * Open vocabulary: an exam may produce variants beyond Chest PA's. A variant is only drawable / explainable once it is
 * registered in `features/radiograph/consistency.ts` (`VARIANT_EFFECTS`) and has message keys; `validateExam` checks it.
 */
export type ImageVariantId = CoreImageVariantId | (string & {});
