/**
 * Patient-instruction → simulated patient response vocabulary (Session 4).
 *
 *   learner action (instruction)  →  assumed patient response  →  simulated image-quality state
 *
 * RAD-LAB does NOT measure patient inspiration or movement. The mapping from instruction to outcome is a
 * deterministic EDUCATIONAL ASSUMPTION held in a `PatientCooperationProfile` (case data), so later cases can
 * supply other patients (needs reinforcement, difficulty following breathing instructions) without any
 * engine change. There is no randomness anywhere in this model.
 */
import type { LocalizedText } from "./localized";
import type { BreathingId, MotionInstructionId } from "./simulation";
import type { Evidence } from "./technique";

/** Educational inspiration outcome. Never a rib count or any other measured value. */
export type InspirationQuality = "adequate" | "reduced";
/** Educational motion outcome. `motion` renders as a loss of sharpness, with no claimed blur distance. */
export type MotionState = "none" | "motion";

export interface PatientCooperationProfile {
  id: string;
  label: LocalizedText;
  /** Assumed deterministic response of THIS patient to each breathing instruction. */
  inspirationResponse: Record<BreathingId, InspirationQuality>;
  /** Assumed deterministic response of THIS patient to each remain-still instruction. */
  motionResponse: Record<MotionInstructionId, MotionState>;
  /** Always an educational assumption, never a measurement. */
  evidence: Evidence;
}

export interface PatientResponse {
  profileId: string;
  /** The learner's actions, echoed so the result is traceable. */
  instructions: { breathing: BreathingId; motion: MotionInstructionId };
  /** Simulated outcome of the breathing instruction. Independent of `motion`. */
  inspiration: InspirationQuality;
  /** Simulated outcome of the remain-still instruction. Independent of `inspiration`. */
  motion: MotionState;
}
