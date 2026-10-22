/**
 * Critical findings (Session 5 fix pass). Pure and deterministic.
 *
 * A critical finding is an important error that must be corrected in training (concept: a COMMON QUALITY
 * CRITERION). Each one that is present forces "below the educational pass mark", REGARDLESS of the numeric score.
 * They are a gate on `score.passed` only: the numeric total, the checks' credits and every category weight
 * (set per exam in its scoring categories) are unchanged. The gating itself is a PROVISIONAL / educational implementation.
 *
 *  - wrong-projection : the selected projection is not the one requested on the exam order.
 *  - patient-motion   : the simulated patient moved (loss of sharpness) — from the patient-response model.
 *  - wrong-side-marker: a placed marker sits on the wrong side for the case's laterality convention (an EDUCATIONAL
 *                       display convention, PA: patient left = viewer right). Same flag as the marker check's
 *                       "wrong side" feedback and the renderer's `marker.wrongSide`, so score, feedback and picture agree.
 *  - missing-marker  : no marker placed (S11b-1); a separate finding with the same gate severity as wrong-side-marker.
 *  - arms-over-lungs : Chest Lateral (S12): the arms are not raised, so their soft tissue overlies the upper lung fields.
 */
import type { CriticalFindingId, RadCase } from "@/domain/case";
import type { PatientResponse } from "@/domain/patient";
import type { SimulationSettings } from "@/domain/simulation";
import { isMarkerMissing, isMarkerWrongSide } from "@/features/simulation/marker-rule";
import type { CriticalFinding } from "./types";

type Detector = (c: RadCase, s: SimulationSettings, response: PatientResponse) => boolean;

/**
 * Detector registry (S11): a critical-finding id is valid only if a pure detector is registered here, so an exam
 * declares WHICH findings gate its pass mark (data) and the code decides WHETHER one is present. A new exam that needs a
 * new finding adds its detector here in the same commit (validated by `validateExam`). The marker detector follows the
 * exam's marker-rule kind (S11-1).
 */
export const CRITICAL_DETECTORS: Record<string, Detector> = {
  "wrong-projection": (c, s) => s.projection !== c.requiredProjection,
  "patient-motion": (_c, _s, response) => response.motion === "motion",
  "missing-marker": (_c, s) => isMarkerMissing(s.sideMarker),
  // S12 (S10b-13, BONTRAGER-9 p.84-85, 94): Lateral only; present when the exam's `arms` choice is not "raised".
  "arms-over-lungs": (_c, s) => s.choices?.arms !== undefined && s.choices.arms !== "raised",
  "wrong-side-marker": (c, s) =>
    s.sideMarker !== null && isMarkerWrongSide(c.positioning, { side: s.sideMarker, position: s.markerPosition }, s.choices),
};

function isPresent(id: CriticalFindingId, c: RadCase, s: SimulationSettings, response: PatientResponse): boolean {
  return CRITICAL_DETECTORS[id]?.(c, s, response) ?? false;
}

export function detectCriticalFindings(c: RadCase, s: SimulationSettings, response: PatientResponse): CriticalFinding[] {
  return c.scoring.criticalFindings
    .filter((r) => isPresent(r.id, c, s, response))
    .map(({ id, label, reason, concept, evidence }) => ({ id, label, reason, concept, evidence }));
}
