/**
 * Pure, deterministic render plan: `RadiographResultState` (+ case data) → everything the pixel pipeline needs.
 *
 *   state → plan → pixels         (never the other way: nothing here, or in the pipeline, scores anything,
 *                                  and nothing reads rendered pixels back into the state)
 *
 * Layer order is fixed and documented in `pipeline.ts`. The plan holds no pixels, no DOM and no randomness
 * (the noise seed is derived from the case id), so the same state always yields the same plan.
 */
import type { RadCase } from "@/domain/case";
import type { RadiographResultState } from "@/domain/result-state";
import type { ViewerSide } from "@/domain/simulation";
import type { Evidence } from "@/domain/technique";
import { viewerSideOf } from "@/features/simulation/geometry";
import { TUNING } from "./tuning";

export interface CmRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type EffectId =
  | "baseline"
  | "rotation"
  | "collimation-clipping"
  | "excess-field"
  | "centering"
  | "scapulae"
  | "chin"
  | "inspiration"
  | "motion"
  | "low-exposure"
  | "excess-exposure"
  | "low-penetration"
  | "marker"
  | "projection";

/**
 * How big the drawn effect is. Kept SEPARATE from the clinical concept: a concept can be validated while the
 * amount drawn is only ever an educational approximation, and nothing drawn may read as validated appearance.
 */
export interface VisualMagnitude {
  kind: "educational-visual-approximation" | "none";
  note: string;
}

/** One visible (or deliberately invisible) effect, with the state that drives it and its two evidence records. */
export interface PlanEffect {
  id: EffectId;
  /** Result-state fields that drive the effect (documentation + tests; never pixels). */
  drivers: string[];
  /** Evidence class of the clinical CONCEPT (what is true in radiography). */
  concept: Evidence;
  /** Status of the RENDERED MAGNITUDE (how it is drawn). Never "validated". */
  magnitude: VisualMagnitude;
  /** False for effects that intentionally change nothing in the picture (excess exposure). */
  changesPixels: boolean;
}

export interface RenderPlan {
  schemaVersion: 1;
  caseId: string;
  assetId: string;
  detector: { widthCm: number; heightCm: number };
  /** Where the source image sits on the detector (cm); uniform scale, landmark box centred inside the required region. */
  image: { x1: number; y1: number; widthCm: number; heightCm: number };
  fieldCm: CmRect;
  /** Sides on which the field cuts the required anatomy (same value the score uses; for the text alternative). */
  clippedSides: ("left" | "right" | "top" | "bottom")[];
  /**
   * Session 5 fix pass 2. The score clips against the provisional required REGION (case data); the picture can only
   * show lungs / ribs / costophrenic angles inside the baseline's landmark box. `landmarkClippedSides` = the clipped
   * sides on which the field also cuts into that box (visible loss of drawn lung); `marginOnlySides` = clipped sides
   * on which the field cuts only the margin between the region and the box (neck / upper abdomen in the baseline).
   * The score is never adapted to this; the UI uses it to say so instead of staying silent.
   */
  landmarkClippedSides: ("left" | "right" | "top" | "bottom")[];
  marginOnlySides: ("left" | "right" | "top" | "bottom")[];
  /** False for projections that are not simulated (AP / lateral): the PA appearance is shown for layout only. */
  representative: boolean;
  anatomy: {
    rotation: { degrees: number; spineShiftU: number; thoraxShiftU: number; transradiancy: number } | null;
    inspiration: { extentReduction: number } | null;
  };
  positioning: { scapulaeOverlap: boolean; jawOverlap: boolean };
  /** Motion = loss of sharpness (blur extents in detector cm). Null when the simulated patient did not move. */
  motion: { verticalCm: number; horizontalCm: number } | null;
  technique: {
    /** Grey levels of added quantum-noise-like texture (0 = none). Never a brightness change. */
    noiseSigma: number;
    noiseSeed: number;
    /** Gain applied to fine low-contrast detail (1 = unchanged). */
    detailGain: number;
    /** Fraction of local structure contrast kept in the dense zones (null = low penetration not present). */
    penetrationContrastKept: number | null;
  };
  /**
   * `viewerSide` is the image half the marker lies on; `expectedViewerSide` comes from the case's laterality
   * convention (PA display: patient left = viewer right). The glyph is ALWAYS drawn where the learner placed it
   * (never corrected, never mirrored by UI language / RTL); `wrongSide` only reports the mismatch.
   */
  marker: {
    side: "L" | "R";
    centerCm: { x: number; y: number };
    sizeCm: number;
    visibleFraction: number;
    viewerSide: ViewerSide | null;
    expectedViewerSide: ViewerSide;
    wrongSide: boolean;
  } | null;
  effects: PlanEffect[];
}

const REF = "Image-quality ref";
const ev = (status: Evidence["status"], section: string, note: string): Evidence => ({
  status,
  reference: `${REF} — ${section}`,
  note,
});

/** Clinical CONCEPT behind each effect (never the drawn magnitude). Statuses follow the Image-quality reference. */
export const EFFECT_CONCEPTS: Record<EffectId, Evidence> = {
  baseline: ev("educational-simplification", "Asset requirements", "Educational appearance baseline, not clinical ground truth."),
  rotation: ev("common-reference", "Rotation", "Spinous processes ≈ midway between medial clavicle ends (WHO); rotation changes that relationship and the hemithoracic projection. Direction evidence-supported; body morphology changes the appearance."),
  "collimation-clipping": ev("validated", "Anatomical coverage and collimation", "Anatomy outside the field is not imaged (geometry)."),
  "excess-field": ev("educational-simplification", "Anatomical coverage and collimation", "Larger exposed region only; exact scatter/contrast penalty is provisional and not drawn."),
  centering: ev("validated", "Anatomical coverage and collimation", "The field follows the central ray (geometry)."),
  scapulae: ev("common-reference", "Scapular positioning", "IAEA: medial scapular borders outside the lung fields; incorrect preparation gives more superimposition."),
  chin: ev("validated", "Chin / upper-chest positioning", "Chin elevated / clear of the upper chest is the validated positioning rule (Positioning ref §2, §5.8). The jaw overlap drawn is only a schematic; the control is not an anatomical angle."),
  inspiration: ev("common-reference", "Inspiration", "Deep/full inspiration is a common quality criterion; reduced inspiration tends to show reduced expansion and higher diaphragms (evidence-supported direction). No rib-count rule."),
  motion: ev("validated", "Motion", "Patient / respiratory motion reduces sharpness (validated principle)."),
  "low-exposure": ev("validated", "Low detector exposure / quantum noise", "Insufficient detector exposure increases noise and impairs low-contrast information (AAPM / ACR)."),
  "excess-exposure": ev("validated", "Excess detector exposure", "DR can look acceptable across a broad exposure range (dose creep); the image is deliberately not darkened."),
  "low-penetration": ev("common-reference", "Penetration and anatomical visibility", "IAEA: retrocardiac lung and mediastinum should be visualised; insufficient penetration reduces visibility through dense regions."),
  marker: ev("educational-simplification", "Side marker and annotations", "Learner-selected marker at its detector-relative position; patient-side correctness is checked separately (scored subcheck + critical finding)."),
  projection: ev("educational-simplification", "Scope", "Only the PA appearance exists; AP/lateral are not simulated."),
};

const APPROX = (note: string): VisualMagnitude => ({ kind: "educational-visual-approximation", note });
const NO_MAGNITUDE = (note: string): VisualMagnitude => ({ kind: "none", note });

/**
 * Rendered magnitude of each effect. Always an EDUCATIONAL VISUAL APPROXIMATION where something is drawn
 * (amounts in tuning.ts), whatever the class of the concept. Effects that draw nothing say so.
 */
export const EFFECT_MAGNITUDES: Record<EffectId, VisualMagnitude> = {
  baseline: NO_MAGNITUDE("Reference appearance only; no effect applied."),
  rotation: APPROX("Spine / interior shift and transradiancy tilt scale with the internal value; not a measurement of degrees of rotation."),
  "collimation-clipping": APPROX("The field edge is exact geometry; where the anatomy lies under it follows an approximate landmark mapping."),
  "excess-field": NO_MAGNITUDE("Only a larger exposed region; no scatter / contrast penalty is drawn."),
  centering: NO_MAGNITUDE("The field simply follows the central ray."),
  scapulae: APPROX("Schematic scapula shape, position and density."),
  chin: APPROX("Schematic jaw / soft-tissue shape, position and density."),
  inspiration: APPROX("Lung fields shortened by a fixed fraction and the diaphragm raised; no rib count."),
  motion: APPROX("Fixed blur size; not a movement distance."),
  "low-exposure": APPROX("Deterministic noise amplitude and detail loss; not a real detector's noise or an EI / dose."),
  "excess-exposure": NO_MAGNITUDE("No visible change by design; the image is not darkened."),
  "low-penetration": APPROX("Fixed fraction of local contrast kept in dense zones; not a penetration measurement."),
  marker: APPROX("Drawn as a glyph at the detector-relative position."),
  projection: NO_MAGNITUDE("The PA appearance is shown for layout only."),
};

/** Stable seed from the case id (FNV-1a), so the noise pattern is fixed per case and never random. */
export function noiseSeedFor(caseId: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < caseId.length; i++) h = Math.imul(h ^ caseId.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Fraction (0–1) of a square marker that lies inside the field (the marker is only recorded where exposed). */
export function markerVisibleFraction(center: { x: number; y: number }, sizeCm: number, field: CmRect): number {
  const x1 = center.x - sizeCm / 2, x2 = center.x + sizeCm / 2, y1 = center.y - sizeCm / 2, y2 = center.y + sizeCm / 2;
  const w = Math.max(0, Math.min(x2, field.x2) - Math.max(x1, field.x1));
  const h = Math.max(0, Math.min(y2, field.y2) - Math.max(y1, field.y1));
  // Rounded so floating-point noise never turns a fully recorded marker into 0.9999999999999997.
  return Math.round(((w * h) / (sizeCm * sizeCm)) * 1e6) / 1e6;
}

export function buildRenderPlan(state: RadiographResultState, radCase: RadCase): RenderPlan {
  const { radiograph: spec, detector, requiredAnatomy: req, positioning } = radCase;
  const { geometry, patient, exposure, patientResponse } = state;
  const box = spec.anatomyBox;
  // Fit the anatomy landmark box INSIDE the required-anatomy region with ONE uniform scale ("contain": no
  // anisotropic distortion of anatomical proportions), centred on the region. The clinical region comes from the
  // case/references and is never adapted to the picture; whatever of the region or detector the baseline does not
  // cover is drawn as the "no reference data" hatch by the pipeline.
  const boxWpx = (box.u2 - box.u1) * spec.widthPx;
  const boxHpx = (box.v2 - box.v1) * spec.heightPx;
  const cmPerPx = Math.min(req.widthCm / boxWpx, req.heightCm / boxHpx);
  const widthCm = spec.widthPx * cmPerPx;
  const heightCm = spec.heightPx * cmPerPx;
  const boxLeft = req.xCm + (req.widthCm - boxWpx * cmPerPx) / 2;
  const boxTop = req.yCm + (req.heightCm - boxHpx * cmPerPx) / 2;
  const image = { x1: boxLeft - box.u1 * widthCm, y1: boxTop - box.v1 * heightCm, widthCm, heightCm };

  // The baseline's landmark box (apices → costophrenic angles, lateral lung margins) on the detector, in cm.
  const landmarkCm = {
    x1: image.x1 + box.u1 * widthCm,
    x2: image.x1 + box.u2 * widthCm,
    y1: image.y1 + box.v1 * heightCm,
    y2: image.y1 + box.v2 * heightCm,
  };
  // Tolerance 1e-6 cm: the box is fitted flush to the region on the limiting axis (floating-point noise only).
  const EPS = 1e-6;
  const landmarkCut = (side: "left" | "right" | "top" | "bottom") =>
    side === "left" ? geometry.fieldCm.x1 > landmarkCm.x1 + EPS
    : side === "right" ? geometry.fieldCm.x2 < landmarkCm.x2 - EPS
    : side === "top" ? geometry.fieldCm.y1 > landmarkCm.y1 + EPS
    : geometry.fieldCm.y2 < landmarkCm.y2 - EPS;
  const landmarkClippedSides = geometry.clippedSides.filter(landmarkCut);
  const marginOnlySides = geometry.clippedSides.filter((side) => !landmarkCut(side));

  const has = (ruleId: string) => state.findings.some((f) => f.ruleId === ruleId);
  const deg = clamp(geometry.rotationDeg, -TUNING.rotation.maxDeg, TUNING.rotation.maxDeg);
  // Session 5 consistency rule: rotation is drawn only when the rotation check is not passed. Within the case's
  // "no meaningful rotation" tolerance the thorax is drawn symmetric, so the picture, the score and the feedback
  // always describe the same finding (the tolerance band itself is provisional case data).
  const rotation =
    deg === 0 || !has("rotation")
      ? null
      : {
          degrees: deg,
          spineShiftU: deg * TUNING.rotation.spineShiftPerDeg,
          thoraxShiftU: deg * TUNING.rotation.thoraxShiftPerDeg,
          transradiancy: deg * TUNING.rotation.transradiancyPerDeg,
        };

  const reducedInspiration = patientResponse.inspiration === "reduced";
  const moved = patientResponse.motion === "motion";
  const rel = exposure.quantumNoise.relative;
  const noisy = exposure.quantumNoise.level === "increased" || exposure.quantumNoise.level === "marked";
  const excessNoise = Math.sqrt(Math.max(0, rel * rel - 1));
  const lowPenetration = exposure.penetration === "low";
  const scapulaeOverlap = patient.shoulders !== "rolled-forward";
  const jawOverlap = patient.chin === "tucked";
  const representative = geometry.projection === "pa-erect";
  const fieldCm = { ...geometry.fieldCm };

  const marker = patient.marker
    ? (() => {
        const center = {
          x: ((patient.marker.position.x + 1) / 2) * detector.widthCm,
          y: ((patient.marker.position.y + 1) / 2) * detector.heightCm,
        };
        const sizeCm = positioning.markerSizeCm;
        const viewerSide = viewerSideOf(patient.marker.position);
        const expectedViewerSide = positioning.markerSide[patient.marker.side];
        return {
          side: patient.marker.side,
          centerCm: center,
          sizeCm,
          visibleFraction: markerVisibleFraction(center, sizeCm, fieldCm),
          viewerSide,
          expectedViewerSide,
          wrongSide: viewerSide !== expectedViewerSide,
        };
      })()
    : null;

  const active: [EffectId, boolean, string[], boolean][] = [
    ["projection", !representative, ["geometry.projection"], false],
    ["rotation", rotation !== null, ["geometry.rotationDeg"], true],
    ["collimation-clipping", geometry.clippedSides.length > 0, ["geometry.fieldCm", "geometry.clippedSides"], true],
    ["excess-field", has("collimation-excess"), ["geometry.fieldCm"], false],
    ["centering", has("centering-lateral") || has("centering-vertical"), ["geometry.centralRay", "geometry.fieldCm"], false],
    ["scapulae", scapulaeOverlap, ["patient.shoulders"], true],
    ["chin", jawOverlap, ["patient.chin"], true],
    ["inspiration", reducedInspiration, ["patientResponse.inspiration"], true],
    ["motion", moved, ["patientResponse.motion"], true],
    ["low-exposure", noisy, ["exposure.quantumNoise"], true],
    ["excess-exposure", exposure.tendency === "above-target" || exposure.tendency === "excessive", ["exposure.tendency", "exposure.doseAwareness"], false],
    ["low-penetration", lowPenetration, ["exposure.penetration"], true],
    ["marker", marker !== null, ["patient.marker"], true],
  ];
  const faults = new Set<EffectId>(["projection", "rotation", "collimation-clipping", "scapulae", "chin", "inspiration", "motion", "low-exposure", "low-penetration"]);
  const effects: PlanEffect[] = active
    .filter(([, on]) => on)
    .map(([id, , drivers, changesPixels]) => ({ id, drivers, concept: EFFECT_CONCEPTS[id], magnitude: EFFECT_MAGNITUDES[id], changesPixels }));
  if (!effects.some((e) => faults.has(e.id))) {
    effects.unshift({ id: "baseline", drivers: [], concept: EFFECT_CONCEPTS.baseline, magnitude: EFFECT_MAGNITUDES.baseline, changesPixels: false });
  }

  return {
    schemaVersion: 1,
    caseId: state.caseId,
    assetId: spec.id,
    detector: { widthCm: detector.widthCm, heightCm: detector.heightCm },
    image,
    fieldCm,
    clippedSides: [...geometry.clippedSides],
    landmarkClippedSides,
    marginOnlySides,
    representative,
    anatomy: {
      rotation,
      inspiration: reducedInspiration ? { extentReduction: TUNING.inspiration.extentReduction } : null,
    },
    positioning: { scapulaeOverlap, jawOverlap },
    motion: moved ? { ...TUNING.motion } : null,
    technique: {
      noiseSigma: noisy ? TUNING.noise.sigmaPerUnit * excessNoise : 0,
      noiseSeed: noiseSeedFor(state.caseId),
      detailGain: noisy ? 1 / (1 + TUNING.noise.detailLoss * (rel * rel - 1)) : 1,
      penetrationContrastKept: lowPenetration ? TUNING.penetration.contrastKept : null,
    },
    marker,
    effects,
  };
}
