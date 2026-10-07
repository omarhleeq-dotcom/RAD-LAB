/**
 * Limb rotation effect (S14.1c, the first registered `EffectDefinition`): the wrist's true-PA / true-lateral criteria drawn from
 * ONE baseline image. Pure: it only reads the result state and the case; the pixel step lives in `pipeline.ts`, every size in
 * `tuning.ts`. Reuses the effect id "rotation" (rule id "rotation", variant "rotated"), so the score, the feedback, the
 * consistency registry and the picture keep describing the same finding; the exam's result wording namespace
 * (`radiograph.wrist-pa.*` / `radiograph.wrist-lateral.*`) supplies the wrist text, and the core chest rotation effect stays off
 * for an asset that declares `limbRotation` (see `buildRenderPlan`).
 *
 * WHAT IS DRAWN (EDUCATIONAL VISUAL APPROXIMATION, not a kinematic model; BONTRAGER-9 p.156 / p.158 criteria):
 *  - wrist PA: the spaces between the proximal metacarpal shafts become unequal (a smooth horizontal bump over the band, sign =
 *    the sign of the value), and an offset copy of the ulna is blended over the radius so the distal radius and ulna are no longer
 *    separated (grows with |value|; no direction of turn is claimed).
 *  - wrist lateral: the bands that must be superimposed (proximal metacarpals, ulnar head over the distal radius) are drawn twice,
 *    the second copy offset by an amount that grows with the value (sign = the sign of the value): "not superimposed".
 *  - hand PA (S14.2b): the same smooth horizontal bump as the wrist PA, over the metacarpal and phalangeal bands (the spaces between
 *    the digits become unequal; bone and soft tissue move together); no radioulnar term (not a hand criterion).
 *  - hand lateral, extension (S14.2b): as the wrist lateral over the bands that must be superimposed in Bontrager p.153.
 * SIGN (S14.1c-2): defined by the RESULT IMAGE, as for the chest exams (S11c-1, S13-6): a positive value displaces the second
 * copy / the metacarpal bump toward the viewer's RIGHT in the displayed image (never mirrored by RTL); a negative value to the left.
 * Feedback is magnitude-only. Pinned by a renderer test (a synthetic stripe moves right for +θ, left for −θ).
 */
import type { LimbRotationLandmarks } from "@/domain/radiograph";
import type { Evidence } from "@/domain/technique";
import type { EffectDefinition, LimbRotationPlan } from "./plan";
import { TUNING } from "./tuning";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const limbRotationConcept = (kind: LimbRotationLandmarks["kind"]): Evidence =>
  kind === "hand-pa"
    ? {
        status: "common-reference",
        reference: "BONTRAGER-9 p.150 (true PA hand)",
        note: "True PA: symmetric concavities of the metacarpal shafts and phalanges of digits 2–5 and equal soft tissue on each side of the phalanges. Provisional until the educator review (O5).",
      }
    : kind === "hand-lateral"
    ? {
        status: "common-reference",
        reference: "BONTRAGER-9 p.153 (true lateral hand, extension)",
        note: "True lateral (extension): metacarpals and phalanges superimposed and the distal radius and ulna superimposed. Provisional until the educator review (O5).",
      }
    : kind === "wrist-pa"
    ? {
        status: "common-reference",
        reference: "BONTRAGER-9 p.156 (true PA wrist)",
        note: "True PA: equal concavity on both sides of the proximal metacarpal shafts, near-equal distances between the proximal metacarpals, distal radius and ulna separated (only minimal superimposition). Provisional until the educator review (O5).",
      }
    : {
        status: "common-reference",
        reference: "BONTRAGER-9 p.158 (true lateral wrist)",
        note: "True lateral: the ulnar head superimposed over the distal radius and the proximal 2nd–5th metacarpals superimposed. Provisional until the educator review (O5).",
      };

/** The plan of the active limb rotation effect, or null (pure; shared by the effect predicate and the plan builder). */
export function limbRotationPlan(
  deg: number,
  failed: boolean,
  landmarks: LimbRotationLandmarks | undefined,
): LimbRotationPlan | null {
  if (!landmarks || !failed || deg === 0) return null;
  const d = clamp(deg, -TUNING.limbRotation.maxDeg, TUNING.limbRotation.maxDeg);
  if (landmarks.kind === "hand-pa") return { kind: "hand-pa", degrees: d, shiftU: d * TUNING.limbRotation.handPaSpacingShiftPerDeg, overlapShiftU: 0 };
  if (landmarks.kind === "hand-lateral") return { kind: "hand-lateral", degrees: d, shiftU: d * TUNING.limbRotation.handLateralShiftPerDeg, overlapShiftU: 0 };
  return landmarks.kind === "wrist-pa"
    ? { kind: "wrist-pa", degrees: d, shiftU: d * TUNING.limbRotation.paSpacingShiftPerDeg, overlapShiftU: Math.abs(d) * TUNING.limbRotation.paRadioulnarShiftPerDeg }
    : { kind: "wrist-lateral", degrees: d, shiftU: d * TUNING.limbRotation.lateralShiftPerDeg, overlapShiftU: 0 };
}

const failedRotation = (findings: { ruleId: string }[]) => findings.some((f) => f.ruleId === "rotation");

/** One definition for the wrist and hand exams: the asset's landmark group says which drawing applies. */
export const LIMB_ROTATION_EFFECT: EffectDefinition = {
  id: "rotation",
  drivers: ["geometry.rotationDeg"],
  // The concept record shown on the effect card follows the asset, so it is resolved in `buildRenderPlan` through `conceptOf`.
  concept: limbRotationConcept("wrist-pa"),
  conceptOf: (radCase) => limbRotationConcept(radCase.radiograph.limbRotation?.kind ?? "wrist-pa"),
  magnitude: {
    kind: "educational-visual-approximation",
    note: "Limb rotation cues are drawn from one baseline image by shifting / doubling image bands by an amount that grows with the internal value; not a kinematic model and not a measurement of degrees.",
  },
  changesPixels: true,
  fault: true,
  active: (state, radCase) => limbRotationPlan(state.geometry.rotationDeg, failedRotation(state.findings), radCase.radiograph.limbRotation) !== null,
  limb: (state, radCase) => limbRotationPlan(state.geometry.rotationDeg, failedRotation(state.findings), radCase.radiograph.limbRotation),
};
