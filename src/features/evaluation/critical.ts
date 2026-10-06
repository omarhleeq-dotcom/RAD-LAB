/**
 * Critical findings (Session 5 fix pass). Pure and deterministic.
 *
 * A critical finding is one that would get a radiograph rejected / repeated in practice (concept: a COMMON QUALITY
 * CRITERION). Each one that is present forces "below the educational pass mark", REGARDLESS of the numeric score.
 * They are a gate on `score.passed` only: the numeric total, the checks' credits and every category weight
 * (25/20/15/20/10/10) are unchanged. The gating itself is a PROVISIONAL / educational implementation.
 *
 *  - wrong-projection : the selected projection is not the one requested on the exam order.
 *  - patient-motion   : the simulated patient moved (loss of sharpness) — from the patient-response model.
 *  - wrong-side-marker: a placed marker sits on the wrong side for the case's laterality convention (an EDUCATIONAL
 *                       display convention, PA: patient left = viewer right). Same flag as the marker check's
 *                       "wrong side" feedback and the renderer's `marker.wrongSide`, so score, feedback and picture agree.
 *                       No marker placed is a MISSING marker (reported by the marker check), not a wrong side.
 */
import type { CriticalFindingId, RadCase } from "@/domain/case";
import type { PatientResponse } from "@/domain/patient";
import type { SimulationSettings } from "@/domain/simulation";
import { viewerSideOf } from "@/features/simulation/geometry";
import type { CriticalFinding } from "./types";

function isPresent(id: CriticalFindingId, c: RadCase, s: SimulationSettings, response: PatientResponse): boolean {
  switch (id) {
    case "wrong-projection":
      return s.projection !== c.requiredProjection;
    case "patient-motion":
      return response.motion === "motion";
    case "wrong-side-marker":
      return s.sideMarker !== null && viewerSideOf(s.markerPosition) !== c.positioning.markerSide[s.sideMarker];
  }
}

export function detectCriticalFindings(c: RadCase, s: SimulationSettings, response: PatientResponse): CriticalFinding[] {
  return c.scoring.criticalFindings
    .filter((r) => isPresent(r.id, c, s, response))
    .map(({ id, label, reason, concept, evidence }) => ({ id, label, reason, concept, evidence }));
}
