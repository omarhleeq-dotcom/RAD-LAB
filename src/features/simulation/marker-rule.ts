/**
 * Marker laterality rule (S11-1): ONE pure function shared by scoring (`evalMarker`), the critical finding, and the
 * renderer's render plan, so score, feedback and picture can never disagree.
 *
 * The rule kind is exam data (`PositioningSpec.markerRule`); no per-exam logic lives here.
 *  - anatomical-side (default; Chest PA, later AP): the letter is the patient's own side. Wrong when the marker sits on
 *    the viewer half that `markerSide` does not assign to that letter.
 *  - detector-side (later Lateral): the letter is the side of the patient against the detector, read from the exam's
 *    choice control. Wrong when the letter differs from that side, or the half disagrees with `markerSide`.
 * Display orientation (which half a letter belongs to) is always `markerSide` data, never mirrored by UI direction.
 */
import type { PositioningSpec } from "@/domain/case";
import type { NormPoint, SideMarkerId, ViewerSide } from "@/domain/simulation";
import { viewerSideOf } from "./geometry";

export interface PlacedMarker {
  side: SideMarkerId;
  position: NormPoint;
}

/** The letter the marker must carry under a detector-side rule; undefined under the anatomical rule or when unset. */
export function requiredMarkerLetter(
  positioning: Pick<PositioningSpec, "markerRule">,
  choices: Record<string, string> | undefined,
): SideMarkerId | undefined {
  const rule = positioning.markerRule;
  if (rule?.kind !== "detector-side") return undefined;
  const v = choices?.[rule.choiceId];
  return v === "L" || v === "R" ? v : undefined;
}

/** The viewer half the marker should be on for its letter (display-convention data). */
export const expectedViewerSide = (positioning: Pick<PositioningSpec, "markerSide">, side: SideMarkerId): ViewerSide =>
  positioning.markerSide[side];

/** True when the placed marker is on the wrong side under the exam's rule kind. */
export function isMarkerWrongSide(
  positioning: Pick<PositioningSpec, "markerSide" | "markerRule">,
  marker: PlacedMarker,
  choices: Record<string, string> | undefined,
): boolean {
  if (viewerSideOf(marker.position) !== expectedViewerSide(positioning, marker.side)) return true;
  const required = requiredMarkerLetter(positioning, choices);
  return required !== undefined && marker.side !== required;
}

/** True when no side marker was placed (S11b-1: a missing marker gates the pass mark like a wrong-side one). */
export const isMarkerMissing = (side: SideMarkerId | null): boolean => side === null;
