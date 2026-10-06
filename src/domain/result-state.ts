/**
 * Renderer-facing result of one exposure (Session 3 → input for the Session 4 image renderer).
 *
 * Contract: a renderer CONSUMES this state; it must never derive a medical score by inspecting rendered
 * pixels. Everything here is plain serialisable data produced by pure functions (no React, no DOM).
 * Displayed brightness is deliberately absent: DR display processing is a renderer concern and is not
 * an exposure meter (technique reference §5).
 */
import type { CategoryId, ChinPositionId, ImageVariantId, NormPoint, ProjectionId, ShoulderPositionId, SideMarkerId, BreathingId } from "./simulation";
import type { PatientResponse } from "./patient";
import type { AecChamberId, DetectorExposureResult, ExposureMode } from "./technique";

export interface ResultFinding {
  ruleId: string;
  category: CategoryId;
  outcome: "partial" | "fail";
  variant?: ImageVariantId;
}

export interface RadiographResultState {
  schemaVersion: 2;
  caseId: string;
  geometry: {
    projection: ProjectionId;
    rotationDeg: number;
    sidCm: number;
    centralRay: NormPoint;
    /** Collimated light field on the detector, cm from the top-left corner. */
    fieldCm: { x1: number; y1: number; x2: number; y2: number };
    /** Which sides of the required anatomy fall outside the field (empty = fully included). */
    clippedSides: ("left" | "right" | "top" | "bottom")[];
    anatomyFullyIncluded: boolean;
  };
  patient: {
    chin: ChinPositionId;
    shoulders: ShoulderPositionId;
    breathing: BreathingId;
    marker: { side: SideMarkerId; position: NormPoint } | null;
  };
  technique: {
    mode: ExposureMode;
    kvp: number;
    /** The mAs the learner dialled (manual mode). In AEC see `exposure.deliveredMas`. */
    manualMas: number;
    aecChambers: AecChamberId[];
  };
  exposure: DetectorExposureResult;
  /**
   * Simulated patient response to the learner's instructions (Session 4): learner action → assumed response →
   * educational image-quality state. NOT a measurement of real inspiration or motion.
   */
  patientResponse: PatientResponse;
  /** Image-quality findings implied by non-passing checks (positioning, technique, …). */
  variants: ImageVariantId[];
  /** Non-passing checks with their category, for annotating the rendered result. */
  findings: ResultFinding[];
}
