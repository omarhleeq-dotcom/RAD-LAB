import type { PatientCooperationProfile, PatientResponse } from "@/domain/patient";
import type { SimulationSettings } from "@/domain/simulation";

/**
 * Pure, deterministic derivation of the simulated patient response from the learner's instructions.
 * Inspiration depends ONLY on the breathing instruction and motion ONLY on the remain-still instruction:
 * no technique, geometry or exposure value is read here, so one can never leak into the other.
 */
export function derivePatientResponse(
  profile: PatientCooperationProfile,
  settings: Pick<SimulationSettings, "breathing" | "motionInstruction">,
): PatientResponse {
  return {
    profileId: profile.id,
    instructions: { ...(settings.breathing !== undefined ? { breathing: settings.breathing } : {}), motion: settings.motionInstruction },
    // No breathing instruction (an exam without the control) = nothing to answer: neutral "adequate", never drawn or scored.
    inspiration: settings.breathing !== undefined ? (profile.inspirationResponse?.[settings.breathing] ?? "adequate") : "adequate",
    motion: profile.motionResponse[settings.motionInstruction],
  };
}
