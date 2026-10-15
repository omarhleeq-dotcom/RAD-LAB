import { pelvisAnchors } from "@/features/pelvis-model/pelvis-model";
import { shoulderAnchors, shoulderValue } from "@/features/shoulder-model/shoulder-model";
/**
 * Limb rotation effect (S14.1c, the first registered `EffectDefinition`): the wrist's true-PA / true-lateral criteria drawn from
 * ONE baseline image. Pure: it only reads the result state and the case; the pixel step lives in `pipeline.ts`, every size in
 * `tuning.ts`. Reuses the effect id "rotation" (rule id "rotation", variant "rotated"), so the score, the feedback, the
 * consistency registry and the picture keep describing the same finding; the exam's result wording namespace
 * (`radiograph.wrist-pa.*` / `radiograph.wrist-lateral.*`) supplies the wrist text, and the core chest rotation effect stays off
 * for an asset that declares `limbRotation` (see `buildRenderPlan`).
 *
 * WHAT IS DRAWN (EDUCATIONAL VISUAL APPROXIMATION, not a kinematic model; BONTRAGER-9 p.156 / p.158 criteria):
 *  - wrist PA / lateral (S-VIS-1b, closes O45): the displacements come from the 2.5D wrist model (`features/wrist-model`), also drawn by the
 *    scene, through the elbow's pixel steps: PA = the metacarpal column anchors warp the whole image (the spaces between the proximal shafts
 *    become unequal) and the ulna and radius layers of the forearm rows move separately; lateral = a far-side and a near-side copy of the
 *    structures that must be superimposed (proximal metacarpals, ulnar head over the radius), one outline at the base pose.
 *  - elbow AP / lateral (S14.3): the displacements come from the elbow model (`features/elbow-model`, also drawn by the scene): AP = the
 *    column anchors warp the whole image (the epicondyles narrow for either sign) and the ulna and radius layers of the forearm rows move
 *    separately (apart, or toward each other until superimposed); lateral = a lateral-side copy and a medial-side copy of the condyle outlines
 *    and of the radial head / coronoid region (one at the base pose; 40 % / 60 % so the picture carries a sign). Educational approximations.
 *  - hand PA / lateral (S14.2b-FIX): the displacements come from the 2.5D hand model (`features/hand-model`), the same one the scene
 *    draws: PA = a smooth piecewise-linear warp of the phalangeal and metacarpal bands through the digits' projected positions; lateral
 *    (extension) = one copy per digit (and per forearm bone) of the structures that must be superimposed, drawn at their projected
 *    positions (all coincide at the base pose, so the picture changes continuously).
 * SIGN (S14.1c-2, refined per model, S-VIS-1b-2): defined by the RESULT IMAGE, as for the chest exams (S11c-1, S13-6) and never mirrored by RTL;
 * each model's header says what a positive value does (wrist: PA = ulna toward the left and radius toward the right; lateral = the far-side copy toward the right).
 * Feedback is magnitude-only. Pinned by a renderer test (a synthetic stripe moves right for +θ, left for −θ).
 */
import type { LimbRotationLandmarks, LowerLimbModelId } from "@/domain/radiograph";
import type { Evidence } from "@/domain/technique";
import type { EffectDefinition, LimbRotationPlan } from "./plan";
import { elbowApShifts, elbowLateralCopies } from "@/features/elbow-model/elbow-model";
import { handLateralShifts, handPaAnchors, oddPart } from "@/features/hand-model/hand-model";
import { ankleApAnchors, ankleLateralCopies, footAnchors, footValue, kneeApShifts, kneeLateralCopies, oddPart as lowerOddPart } from "@/features/lower-limb-model/lower-limb-model";
import { wristLateralCopies, wristPaShifts } from "@/features/wrist-model/wrist-model";
import { TUNING } from "./tuning";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Concept records of the four lower-limb models (S14.4). */
const lowerLimbConcept = (model: LowerLimbModelId): Evidence =>
  model === "shoulder-grashey"
    ? { status: "common-reference", reference: "BONTRAGER-9 p.196 (AP oblique glenoid, Grashey)", note: "Glenoid in profile without humeral-head superimposition and an open joint space; the body is turned 35°–45° toward the affected side. One-image educational cue only: the joint space closes outside the 35°–45° band; the glenoid rims, head overlap and arm posture are not drawn. Provisional pending O5." }
    : model === "pelvis-ap"
    ? { status: "common-reference", reference: "BONTRAGER-9 p.279; docs/DECISIONS.md S-PELVIS-1-1/4", note: "Pelvic rotation changes the symmetry of iliac wings and obturator foramina. One-image educational warp only; femoral-neck foreshortening and hidden lesser trochanters are not synthesized. Provisional pending O5." }
    : model === "foot-ap"
    ? {
        status: "common-reference",
        reference: "BONTRAGER-9 p.232 (true AP foot)",
        note: "No rotation = nearly equal spacing of metatarsals 2–5; the bases of the 1st and 2nd metatarsals are generally separated and the bases of 2–5 overlap. Provisional until the educator review (O5).",
      }
    : model === "foot-oblique"
    ? {
        status: "common-reference",
        reference: "BONTRAGER-9 p.233 (AP medial oblique foot)",
        note: "Plantar surface 30°–40° to the detector (40° recommended): metatarsals 3–5 free of superimposition, the 5th metatarsal tuberosity in profile. Provisional until the educator review (O5).",
      }
    : model === "ankle-ap"
    ? {
        status: "common-reference",
        reference: "BONTRAGER-9 p.239 (true AP ankle)",
        note: "No rotation = medial mortise open, lateral mortise closed, some overlap of the distal fibula by the tibia and the talus. The effect is one smooth warp of the leg and ankle from one baseline image; the overlap of the distal fibula is not drawn. Provisional until the educator review (O5).",
      }
    : model === "ankle-lateral"
    ? {
        status: "common-reference",
        reference: "BONTRAGER-9 p.242 (true lateral ankle)",
        note: "True lateral: the distal fibula over the posterior half of the tibia, the lateral malleolus seen through the distal tibia and talus, the tibiotalar joint open with a uniform space. The effect is a ghosting of two windows from one baseline image. Provisional until the educator review (O5).",
      }
    : model === "knee-ap"
    ? {
        status: "common-reference",
        reference: "BONTRAGER-9 p.246 (true AP knee)",
        note: "No rotation = symmetric femoral condyles and joint space, about the medial half of the fibular head superimposed by the tibia, intercondylar eminence centred in the fossa. Provisional until the educator review (O5).",
      }
    : {
        status: "common-reference",
        reference: "BONTRAGER-9 p.249 (true lateral knee)",
        note: "True lateral: the posterior borders of the femoral condyles superimposed; over-rotation = less fibular-head superimposition by the tibia, under-rotation = more. Provisional until the educator review (O5).",
      };

export const limbRotationConcept = (kind: LimbRotationLandmarks["kind"], model?: LowerLimbModelId): Evidence =>
  model !== undefined && (kind === "limb-warp" || kind === "limb-layers" || kind === "limb-copies")
    ? lowerLimbConcept(model)
    : kind === "hand-pa"
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
  // The foot oblique's console value is the absolute plantar angle; its model value is the deviation from the 40° reference (S14.4).
  // The shoulder Grashey console value is the absolute body obliquity; its model value is the distance to the 35°–45° band (S-SHOULDER-2-6).
  const value = landmarks && "model" in landmarks && landmarks.model === "foot-oblique" ? footValue("oblique", deg) : landmarks && "model" in landmarks && landmarks.model === "shoulder-grashey" ? shoulderValue(deg) : deg;
  if (!landmarks || !failed || value === 0) return null;
  const d = clamp(value, -TUNING.limbRotation.maxDeg, TUNING.limbRotation.maxDeg);
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
  if (landmarks.kind === "limb-warp") {
    if (landmarks.model === "shoulder-grashey") {
      // One closing warp, the same for either sign of the deviation (S-SHOULDER-2-6); shiftU = the closure of the head side (never negative).
      const anchors = shoulderAnchors(d);
      return { kind: "limb-warp", degrees: d, shiftU: anchors[3]!.du, overlapShiftU: 0, hand: { anchors: [anchors] } };
    }
    if (landmarks.model === "pelvis-ap") {
      const anchors = pelvisAnchors(d);
      return { kind: "limb-warp", degrees: d, shiftU: anchors[3]!.du, overlapShiftU: 0, hand: { anchors: [anchors] } };
    }
    // Foot (S14.4): bands in the order of the asset's landmarks [toes, metatarsals]. shiftU = the odd part of (metatarsal 5 − metatarsal 1) shift, the sign carrier.
    if (landmarks.model === "ankle-ap") {
      // AP ankle (S14.5): one band; shiftU = the odd part of (lateral malleolus − medial malleolus) shift, the sign carrier.
      const rel = (r: number) => {
        const m = ankleApAnchors(r);
        return (m[m.length - 1]?.du ?? 0) - (m[0]?.du ?? 0);
      };
      return { kind: "limb-warp", degrees: d, shiftU: lowerOddPart(rel, d), overlapShiftU: 0, hand: { anchors: [ankleApAnchors(d)] } };
    }
    const kind = landmarks.model === "foot-oblique" ? "oblique" : "ap";
    const a = footAnchors(kind, d);
    const rel = (r: number) => {
      const m = footAnchors(kind, r).metatarsal;
      return (m[m.length - 1]?.du ?? 0) - (m[0]?.du ?? 0);
    };
    return { kind: "limb-warp", degrees: d, shiftU: lowerOddPart(rel, d), overlapShiftU: 0, hand: { anchors: [a.toes, a.metatarsal] } };
  }
  if (landmarks.kind === "limb-layers") {
    // AP knee (S14.4): the whole-image anchors warp the image; the fibula layer and the tibia layer of the rows below the joint move separately. shiftU = the odd part of (tibia - fibula) shift.
    const a = kneeApShifts(d);
    return { kind: "limb-layers", degrees: d, shiftU: lowerOddPart((r) => kneeApShifts(r).tibia - kneeApShifts(r).fibula, d), overlapShiftU: 0, elbow: { anchors: a.anchors, layers: { ulna: a.fibulaAnchors, radius: a.tibiaAnchors } } };
  }
  if (landmarks.kind === "limb-copies") {
    if (landmarks.model === "ankle-lateral") {
      // Lateral ankle (S14.5): bands in the order of the asset's landmarks [distal fibula / posterior tibia, tibiotalar joint]. shiftU = the far-side copy's shift (sign).
      const a = ankleLateralCopies(d);
      return { kind: "limb-copies", degrees: d, shiftU: a.malleolus[0]?.du ?? 0, overlapShiftU: 0, elbow: { copies: [a.malleolus, a.joint] } };
    }
    // Lateral knee (S14.4): bands in the order of the asset's landmarks [condyle outlines, fibular head / tibia]. shiftU = the far-side copy's shift (sign).
    const c = kneeLateralCopies(d);
    return { kind: "limb-copies", degrees: d, shiftU: c.condyles[0]?.du ?? 0, overlapShiftU: 0, elbow: { copies: [c.condyles, c.head] } };
  }
  if (landmarks.kind === "wrist-pa") {
    // The wrist model (S-VIS-1b): the metacarpal column anchors warp the whole image; the ulna and radius layers of the forearm rows move separately. shiftU = the odd part of the relative shift (radius − ulna), the sign carrier.
    const a = wristPaShifts(d);
    return { kind: "wrist-pa", degrees: d, shiftU: oddPart((r) => wristPaShifts(r).radius - wristPaShifts(r).ulna, d), overlapShiftU: 0, elbow: { anchors: a.anchors, layers: { ulna: a.ulnaAnchors, radius: a.radiusAnchors } } };
  }
  // Wrist lateral: bands in the order of the asset's landmarks [proximal metacarpals, ulnar head / distal radius]. shiftU = the far-side copy's shift (sign).
  const c = wristLateralCopies(d);
  return { kind: "wrist-lateral", degrees: d, shiftU: c.metacarpals[0]?.du ?? 0, overlapShiftU: 0, elbow: { copies: [c.metacarpals, c.head] } };
}

const failedRotation = (findings: { ruleId: string }[]) => findings.some((f) => f.ruleId === "rotation");

/** One definition for the wrist and hand exams: the asset's landmark group says which drawing applies. */
export const LIMB_ROTATION_EFFECT: EffectDefinition = {
  id: "rotation",
  drivers: ["geometry.rotationDeg"],
  // The concept record shown on the effect card follows the asset, so it is resolved in `buildRenderPlan` through `conceptOf`.
  concept: limbRotationConcept("wrist-pa"),
  conceptOf: (radCase) => {
    const lm = radCase.radiograph.limbRotation;
    return limbRotationConcept(lm?.kind ?? "wrist-pa", lm && "model" in lm ? lm.model : undefined);
  },
  magnitude: {
    kind: "educational-visual-approximation",
    note: "Limb rotation cues are drawn from one baseline image by shifting / doubling image bands by an amount that grows with the internal value; not a kinematic model and not a measurement of degrees.",
  },
  changesPixels: true,
  fault: true,
  active: (state, radCase) => limbRotationPlan(state.geometry.rotationDeg, failedRotation(state.findings), radCase.radiograph.limbRotation) !== null,
  limb: (state, radCase) => limbRotationPlan(state.geometry.rotationDeg, failedRotation(state.findings), radCase.radiograph.limbRotation),
};
