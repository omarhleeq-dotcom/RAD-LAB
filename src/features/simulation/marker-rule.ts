/**
 * Marker laterality rule (S11-1): ONE pure function shared by scoring (`evalMarker`), the critical finding, and the
 * renderer's render plan, so score, feedback and picture can never disagree.
 *
 * The rule kind is exam data (`PositioningSpec.markerRule`); no per-exam logic lives here.
 *  - anatomical-side (default; Chest PA, later AP): the letter is the patient's own side. Wrong when the marker sits on
 *    the viewer half that `markerSide` does not assign to that letter.
 *  - detector-side (later Lateral): the letter is the side of the patient against the detector, read from the exam's
 *    choice control. Wrong only when the letter differs from that side. The letter's display half is a department-dependent
 *    convention (S3 option D, owner 2026-10-22): a half that disagrees with `markerSide` is a non-critical display note
 *    (`isMarkerDisplayHalfNote`), never a wrong marker.
 *  - fixed-side (single limb, S14.1c): the letter must be the side the exam examines; no viewer-half check.
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
  // S14.1c (single limb, O21 option A): only the letter is judged; the source gives no viewer-half convention for one limb.
  if (positioning.markerRule?.kind === "fixed-side") return marker.side !== positioning.markerRule.side;
  if (positioning.markerRule?.kind === "detector-side") {
    const required = requiredMarkerLetter(positioning, choices);
    return required !== undefined && marker.side !== required;
  }
  return viewerSideOf(marker.position) !== expectedViewerSide(positioning, marker.side);
}

/**
 * True when a detector-side marker names the right side but sits in the other display half. That half is a convention that
 * varies by department (BONTRAGER-9 p.36), so it is only noted: no fail, no deduction, no critical finding. Other rule kinds
 * never report it (their half or letter is judged by `isMarkerWrongSide`).
 */
export function isMarkerDisplayHalfNote(
  positioning: Pick<PositioningSpec, "markerSide" | "markerRule">,
  marker: PlacedMarker,
  choices: Record<string, string> | undefined,
): boolean {
  return positioning.markerRule?.kind === "detector-side"
    && !isMarkerWrongSide(positioning, marker, choices)
    && viewerSideOf(marker.position) !== expectedViewerSide(positioning, marker.side);
}

/** True when no side marker was placed (S11b-1: a missing marker gates the pass mark like a wrong-side one). */
export const isMarkerMissing = (side: SideMarkerId | null): boolean => side === null;
