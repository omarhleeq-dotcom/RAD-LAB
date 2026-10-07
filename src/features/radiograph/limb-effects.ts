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
 *  - elbow AP / lateral (S14.3): the displacements come from the elbow model (`features/elbow-model`, also drawn by the scene): AP = the
 *    column anchors warp the whole image (the epicondyles narrow for either sign) and the ulna and radius layers of the forearm rows move
 *    separately (apart, or toward each other until superimposed); lateral = a lateral-side copy and a medial-side copy of the condyle outlines
 *    and of the radial head / coronoid region (one at the base pose; 40 % / 60 % so the picture carries a sign). Educational approximations.
 *  - hand PA / lateral (S14.2b-FIX): the displacements come from the 2.5D hand model (`features/hand-model`), the same one the scene
 *    draws: PA = a smooth piecewise-linear warp of the phalangeal and metacarpal bands through the digits' projected positions; lateral
 *    (extension) = one copy per digit (and per forearm bone) of the structures that must be superimposed, drawn at their projected
 *    positions (all coincide at the base pose, so the picture changes continuously).
 * SIGN (S14.1c-2): defined by the RESULT IMAGE, as for the chest exams (S11c-1, S13-6): a positive value displaces the second
 * copy / the metacarpal bump toward the viewer's RIGHT in the displayed image (never mirrored by RTL); a negative value to the left.
 * Feedback is magnitude-only. Pinned by a renderer test (a synthetic stripe moves right for +θ, left for −θ).
 */
import type { LimbRotationLandmarks } from "@/domain/radiograph";
import type { Evidence } from "@/domain/technique";
import type { EffectDefinition, LimbRotationPlan } from "./plan";
import { elbowApShifts, elbowLateralCopies } from "@/features/elbow-model/elbow-model";
import { handLateralShifts, handPaAnchors, oddPart } from "@/features/hand-model/hand-model";
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
    : kind === "elbow-ap"
    ? {
        status: "common-reference",
        reference: "BONTRAGER-9 p.166 (true AP elbow)",
        note: "True AP: the epicondyles in profile; the radial head, neck and tubercle separated from, or only slightly superimposed by, the ulna. Provisional until the educator review (O5).",
      }
    : kind === "elbow-lateral"
    ? {
        status: "common-reference",
        reference: "BONTRAGER-9 p.172 (true lateral elbow, 90° flexion)",
        note: "True lateral: the epicondyles superimposed and about half of the radial head covered by the coronoid process (the concentric arcs of the trochlear sulcus are not drawn). Provisional until the educator review (O5).",
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
  if (landmarks.kind === "hand-pa") {
    // The 2.5D hand model (S14.2b-FIX): bands in the order of the asset's landmarks [phalanges, metacarpals, thumb]. shiftU = minus the ODD part of the thumb's shift (the sign carrier: rotating narrows the hand for either sign, only the depth term Z·sinθ is odd).
    const a = handPaAnchors(d);
    return { kind: "hand-pa", degrees: d, shiftU: -oddPart((r) => handPaAnchors(r).thumb[0]?.du ?? 0, d), overlapShiftU: 0, hand: { anchors: [a.phalanx, a.metacarpal, a.thumb] } };
  }
  if (landmarks.kind === "hand-lateral") {
    // Bands in the order of the asset's landmarks [finger / metacarpal column, distal forearm]. shiftU = the odd part of digit 5's shift (sign).
    const s = handLateralShifts(d);
    return { kind: "hand-lateral", degrees: d, shiftU: oddPart((r) => handLateralShifts(r).column[0] ?? 0, d), overlapShiftU: 0, hand: { shifts: [s.column, s.forearm] } };
  }
  if (landmarks.kind === "elbow-ap") {
    // The elbow model (S14.3): the column anchors warp the whole image; the ulna and radius layers of the forearm rows move separately (each with its own anchors). shiftU = the odd part of the relative shift (radius − ulna), the sign carrier.
    const a = elbowApShifts(d);
    return { kind: "elbow-ap", degrees: d, shiftU: oddPart((r) => elbowApShifts(r).radius - elbowApShifts(r).ulna, d), overlapShiftU: 0, elbow: { anchors: a.anchors, layers: { ulna: a.ulnaAnchors, radius: a.radiusAnchors } } };
  }
  if (landmarks.kind === "elbow-lateral") {
    // Bands in the order of the asset's landmarks [distal humerus condyle outlines, radial head / coronoid]. shiftU = the lateral-side copy's shift (sign).
    const c = elbowLateralCopies(d);
    return { kind: "elbow-lateral", degrees: d, shiftU: c.condyles[0]?.du ?? 0, overlapShiftU: 0, elbow: { copies: [c.condyles, c.head] } };
  }
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
