import type { Evidence, TechniqueProfile } from "./technique";
import type {
  CheckRule,
  ChoiceControlSpec,
  DetectorRegion,
  DetectorSpec,
  ImageCriterion,
  NumericControls,
  PatientProfile,
  PositioningSpec,
  PossibleError,
  ScoringRules,
} from "./case";
import type { LocalizedText } from "./localized";
import type { PatientCooperationProfile } from "./patient";
import type { RadiographAssetSpec } from "./radiograph";
import type {
  BodyPartId,
  BreathingId,
  MotionInstructionId,
  ProjectionId,
  SimulationSettings,
} from "./simulation";

/**
 * Session 7: the former `RadCase` is split into what an EXAM is and what one CASE on that exam is
 * (docs/PLATFORM_ARCHITECTURE.md §4, ADR-0004).
 *
 *   ExamDefinition  — controls, rules, thresholds, scoring categories and weights, critical findings, technique
 *                     PROTOCOL, positioning conventions, scene and render bindings, evidence classification.
 *                     Written once per exam (Chest PA erect, later Chest Lateral, Chest AP …).
 *   CaseDefinition  — one patient scenario on an exam: patient, order text, condition, baseline radiograph asset,
 *                     patient-cooperation profile, patient attenuation, initial state.
 *                     A paediatric / difficult-to-position patient is a NEW CASE, never a new exam.
 *
 * Both are pure, serialisable data. `composeCase(exam, case)` (features/exam/compose.ts) yields the `RadCase`
 * compatibility view that the engine, renderer, store and UI still consume; it is value-identical to the former
 * single object (proved by the Session 7 characterisation snapshot).
 */

/**
 * Open id of a positioning scene (S14.1b, same pattern as `ProjectionId`). Scenes are hand-drawn SVG in
 * `features/positioning` and registered in `SCENES` (`features/positioning/scenes.tsx`); `validateExam` rejects an id
 * that is not registered there.
 */
export type SceneId = string;
/**
 * Scene ids registered so far (the pure half of the registry: `validateExam` is logic and must not import the React
 * scene components). A new scene is added here AND in `SCENES`; `features/exam/registries.test.ts` checks both lists agree.
 */
export const SCENE_IDS: readonly SceneId[] = ["chest-pa-frontal", "chest-lateral", "chest-ap-supine", "wrist-pa", "wrist-lateral"];

/** Result renderers that exist today (`features/radiograph`: plan → pure pipeline → canvas). */
export const RENDERER_IDS = ["radiograph-2d"] as const;
export type RendererId = (typeof RENDERER_IDS)[number];

/**
 * The exam's technique PROTOCOL: a `TechniqueProfile` without the simulated patient's attenuation, which belongs
 * to the case (a larger patient absorbs more at the same technique).
 */
export type AnyExamTechniqueProfile = Omit<TechniqueProfile, "patient">;
/**
 * The chest-shaped protocol (AEC declared). It stays the DEFAULT type argument of `ExamDefinition` so the chest exams, their
 * data and their tests are typed exactly as before; a manual-only limb exam is an `ExamDefinition<AnyExamTechniqueProfile>`
 * whose `technique` has no `aec` (S14.1b).
 */
export type ExamTechniqueProfile = AnyExamTechniqueProfile & { aec: NonNullable<TechniqueProfile["aec"]> };

/** The case's contribution to the technique model: how strongly THIS simulated patient attenuates. */
export type PatientTechniqueModel = TechniqueProfile["patient"];

export interface ExamDefinition<T extends AnyExamTechniqueProfile = ExamTechniqueProfile> {
  schemaVersion: 1;
  /** Stable exam id, e.g. "chest-pa-erect". Also the public id of the exam's default case (routes, noise seed). */
  id: string;
  modality: "general-radiography";
  /** Open id of the examined body part (S14.1b); registered in `src/data/modalities.ts` (`validateExam` checks it). Chest exams: "chest". */
  bodyPart: BodyPartId;
  title: LocalizedText;
  /** True while any clinical value of the exam has not been validated by a subject expert. */
  provisional: boolean;
  /** Exam-level evidence classification. Every rule, tolerance and feedback sentence carries its own class too. */
  evidence: Evidence;
  /** Case whose id the exam keeps as its public id (existing routes and shared links stay valid). */
  defaultCaseId: string;

  /** Projection requested on the exam order. */
  requiredProjection: ProjectionId;
  /** Projections / instructions the learner may choose from (the control option lists). */
  availableProjections: ProjectionId[];
  /** Breathing instructions the learner may give. Absent (S14.1b) = the exam has no breathing control / rule / category. */
  availableBreathing?: BreathingId[];
  availableMotionInstructions: MotionInstructionId[];

  detector: DetectorSpec;
  /** Anatomy that must be demonstrated (drives coverage + schematic drawing). Provisional size. */
  requiredAnatomy: DetectorRegion;
  /** Technically selectable ranges (what the console allows) — not the educational target, not a scoring tolerance. */
  controls: NumericControls;
  /** Extra enum controls (side against the detector, arm position, patient state …). Absent for Chest PA. */
  choiceControls?: ChoiceControlSpec[];
  /** Protocol for the technique / exposure model (target, tolerance, evidence class kept separate). */
  technique: T;
  /** Centering target and tolerances, collimation limit, marker size and laterality convention (`markerSide`). */
  positioning: PositioningSpec;

  rules: CheckRule[];
  /** Category weights (sum 100), pass mark and critical findings. Weights are configuration, never code. */
  scoring: ScoringRules;
  possibleErrors: PossibleError[];
  imageCriteria: ImageCriterion[];

  /**
   * Bindings to the code that draws the exam. `scene.id` is resolved by the scene registry (S11); `render.renderer`
   * still names the one renderer (a second renderer is what would justify a registry for it).
   */
  scene: { id: SceneId };
  render: { renderer: RendererId };
}

/** Any exam, with or without AEC in its protocol: what the platform-level code (compose, validate, registries) accepts. */
export type AnyExamDefinition = ExamDefinition<AnyExamTechniqueProfile>;

export interface CaseDefinition {
  schemaVersion: 1;
  /** Case id, unique within its exam, e.g. "adult-demo". */
  id: string;
  /** The exam this case is a scenario of. */
  examId: string;
  /** True while any value of the case (patient, text, baseline landmarks) has not been validated. */
  provisional: boolean;

  patient: PatientProfile;
  clinicalScenario: LocalizedText;
  /** The order as the patient is referred; shown to the learner. */
  requestedExamination: LocalizedText;
  patientCondition: LocalizedText;
  /** How this simulated patient attenuates the beam (input of the technique model). */
  patientTechnique: PatientTechniqueModel;
  /** Educational baseline radiograph + its asset-specific landmarks. */
  radiograph: RadiographAssetSpec;
  /** Deterministic instruction → patient-response model. */
  patientCooperation: PatientCooperationProfile;
  /** State when the case loads. Intentionally not the ideal answer. */
  initialSettings: SimulationSettings;
}
