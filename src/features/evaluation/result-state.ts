import type { RadCase } from "@/domain/case";
import type { PatientResponse } from "@/domain/patient";
import type { RadiographResultState } from "@/domain/result-state";
import type { ImageVariantId, SimulationSettings } from "@/domain/simulation";
import type { DetectorExposureResult } from "@/domain/technique";
import { clippedSides, collimatedField, coverageMargins, regionToRect } from "@/features/simulation/geometry";
import type { CheckResult } from "./types";

/**
 * Pure builder of the renderer-facing result state. The future image renderer consumes this object; the score
 * comes from the checks, never from rendered pixels. No React, no DOM, serialisable.
 */
export function buildResultState(
  c: RadCase,
  s: SimulationSettings,
  exposure: DetectorExposureResult,
  patientResponse: PatientResponse,
  checks: CheckResult[],
  variants: ImageVariantId[],
): RadiographResultState {
  const field = collimatedField(s, c.detector);
  const clipped = clippedSides(coverageMargins(field, regionToRect(c.requiredAnatomy)));
  return {
    schemaVersion: 2,
    caseId: c.id,
    geometry: {
      projection: s.projection,
      rotationDeg: s.rotationDeg,
      ...(s.tubeAngulationDeg !== undefined ? { tubeAngulationDeg: s.tubeAngulationDeg } : {}),
      sidCm: s.sidCm,
      centralRay: { ...s.centralRay },
      fieldCm: { x1: field.x1, y1: field.y1, x2: field.x2, y2: field.y2 },
      clippedSides: clipped,
      anatomyFullyIncluded: clipped.length === 0,
    },
    patient: {
      ...(s.chinPosition !== undefined ? { chin: s.chinPosition } : {}),
      ...(s.shoulderPosition !== undefined ? { shoulders: s.shoulderPosition } : {}),
      ...(s.breathing !== undefined ? { breathing: s.breathing } : {}),
      marker: s.sideMarker ? { side: s.sideMarker, position: { ...s.markerPosition } } : null,
      ...(s.choices ? { choices: { ...s.choices } } : {}),
    },
    technique: {
      mode: s.exposureMode,
      kvp: s.kvp,
      manualMas: s.mas,
      aecChambers: [...s.aecChambers],
    },
    exposure,
    patientResponse,
    variants,
    findings: checks.flatMap((k) =>
      k.outcome === "pass" ? [] : [{ ruleId: k.ruleId, category: k.category, outcome: k.outcome, variant: k.variant }],
    ),
  };
}
