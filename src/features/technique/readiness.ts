/**
 * Exposure readiness: is the WORKFLOW complete and safe to proceed? It is deliberately NOT a correctness
 * check — it never says whether a value is right, so Practice Mode guides without solving the case and the
 * same function is safe in a future Assessment Mode (it only reports workflow gaps / hard blocks).
 *
 * Workflow: positioning → central ray → collimation → rotation → SID → technique → manual/AEC → readiness → expose.
 * Geometry values always exist (they have defaults), so they cannot be "missing"; what can be missing or
 * unsafe is: a breathing instruction, a side marker, an AEC chamber, or an exposure that was already made.
 */
import type { RadCase } from "@/domain/case";
import type { SimulationPhase, SimulationSettings } from "@/domain/simulation";
import { collimatedField } from "@/features/simulation/geometry";
import { evaluateAec } from "./aec";

export type ReadinessLevel = "ready" | "caution" | "blocked";
export type ReadinessItemId =
  | "exposure-done"
  | "technique-invalid"
  | "aec-no-chamber"
  | "aec-chambers-outside-field"
  | "breathing-not-instructed"
  | "motion-not-instructed"
  | "marker-missing";
export type ReadinessCategory = "system" | "technique" | "aec" | "patient" | "positioning";

export interface ReadinessItem {
  id: ReadinessItemId;
  category: ReadinessCategory;
  level: Exclude<ReadinessLevel, "ready">;
}

export interface ExposureReadiness {
  level: ReadinessLevel;
  canExpose: boolean;
  items: ReadinessItem[];
}

const finiteIn = (v: number, min: number, max: number) => Number.isFinite(v) && v >= min && v <= max;

export function assessReadiness(
  radCase: RadCase,
  s: SimulationSettings,
  phase: SimulationPhase = "setup",
): ExposureReadiness {
  const items: ReadinessItem[] = [];
  const { controls } = radCase;

  if (phase === "result") items.push({ id: "exposure-done", category: "system", level: "blocked" });

  const techniqueOk =
    finiteIn(s.kvp, controls.kvp.min, controls.kvp.max) &&
    finiteIn(s.sidCm, controls.sidCm.min, controls.sidCm.max) &&
    (s.exposureMode === "aec" || finiteIn(s.mas, controls.mas.min, controls.mas.max));
  if (!techniqueOk) items.push({ id: "technique-invalid", category: "technique", level: "blocked" });

  if (s.exposureMode === "aec") {
    if (s.aecChambers.length === 0) {
      items.push({ id: "aec-no-chamber", category: "aec", level: "blocked" });
    } else {
      const aec = evaluateAec(radCase.technique, s.aecChambers, collimatedField(s, radCase.detector), radCase.detector);
      if (!aec.terminatedOnChambers) items.push({ id: "aec-chambers-outside-field", category: "aec", level: "caution" });
    }
  }

  if (s.breathing === "no-instruction") items.push({ id: "breathing-not-instructed", category: "patient", level: "caution" });
  if (s.motionInstruction === "none") items.push({ id: "motion-not-instructed", category: "patient", level: "caution" });
  if (!s.sideMarker) items.push({ id: "marker-missing", category: "positioning", level: "caution" });

  const blocked = items.some((i) => i.level === "blocked");
  const level: ReadinessLevel = blocked ? "blocked" : items.length ? "caution" : "ready";
  return { level, canExpose: !blocked, items };
}
