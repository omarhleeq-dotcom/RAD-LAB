import type { RadCase } from "@/domain/case";

// Explicit presentation paths/subtrees only. New fields outside these display
// subtrees are retained; no generic stripping by key name or language/shape.
const presentation = [
  "title", "patient", "clinicalScenario", "requestedExamination", "patientCondition", "bodyPart", "modality",
  // Console declarations/defaults select inputs; evaluation reads the saved settings
  // and rules, not control labels, option order, slider layout or the initial UI state.
  "controls", "choiceControls", "availableProjections", "availableBreathing", "availableMotionInstructions", "initialSettings",
  "positioning.defaultMarkerPosition", "positioning.minCollimation",
  "radiograph", "possibleErrors", "imageCriteria", "provisional",
  "rules.*.label", "rules.*.feedback", "rules.*.evidence", "rules.*.unit", "rules.*.clippedSides", "rules.*.excessSides",
  "scoring.categoryLabels", "scoring.criticalFindings.*.label", "scoring.criticalFindings.*.reason",
  "scoring.criticalFindings.*.concept", "scoring.criticalFindings.*.evidence",
  "patientCooperation.label", "patientCooperation.evidence",
  "technique.label", "technique.evidence", "technique.assumptions",
  "technique.patient.label", "technique.patient.evidence", "technique.system.label", "technique.system.evidence",
  "technique.manual.evidence", "technique.kvp.evidence", "technique.deviation.evidence", "technique.aec.evidence",
  "technique.aec.chambers.*.label",
].map((path) => path.split("."));

function project(value: unknown, path: string[] = []): unknown {
  if (Array.isArray(value)) return value.map((v) => project(v, [...path, "*"]));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value)
    .filter(([key, v]) => v !== undefined && !presentation.some((p) => p.length === path.length + 1
      && p.every((part, i) => part === [...path, key][i])))
    // Object insertion order is presentation; array/rule order remains significant.
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([key, v]) => [key, project(v, [...path, key])]));
  return value;
}

/** Independent identity; never replaces or edits definitionVersion. No historical inference.
 * /1 versions this projection. Evaluator semantics are a separate required input.
 * This is descriptive client metadata, not an authentication or Assess claim.
 */
export async function comparisonVersion(c: RadCase, engine: string): Promise<string | null> {
  if (!engine || engine === "unknown") return null;
  const bytes = new TextEncoder().encode(JSON.stringify([engine, project(c)]));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return `radlab-comparison/1:${[...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}
