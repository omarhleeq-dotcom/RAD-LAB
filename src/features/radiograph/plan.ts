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
import type { Evidence } from "@/domain/technique";
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

/** One visible (or deliberately invisible) effect, with the state that drives it and its evidence class. */
export interface PlanEffect {
  id: EffectId;
  /** Result-state fields that drive the effect (documentation + tests; never pixels). */
  drivers: string[];
  /** Class of the clinical PRINCIPLE. The visual mapping is always an educational approximation. */
  principle: Evidence;
  /** False for effects that intentionally change nothing in the picture (excess exposure). */
  changesPixels: boolean;
}

export interface RenderPlan {
  schemaVersion: 1;
  caseId: string;
  assetId: string;
  detector: { widthCm: number; heightCm: number };
  /** Where the source image sits on the detector (cm); the anatomy landmark box is mapped onto the required region. */
  image: { x1: number; y1: number; widthCm: number; heightCm: number };
  fieldCm: CmRect;
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
  marker: { side: "L" | "R"; centerCm: { x: number; y: number }; sizeCm: number; visibleFraction: number } | null;
  effects: PlanEffect[];
}

const REF = "Image-quality ref";
const ev = (status: Evidence["status"], section: string, note: string): Evidence => ({
  status,
  reference: `${REF} — ${section}`,
  note,
});

/** Principles behind each effect. Statuses follow the Image-quality reference's own classification. */
export const EFFECT_PRINCIPLES: Record<EffectId, Evidence> = {
  baseline: ev("educational-simplification", "Asset requirements", "Educational appearance baseline, not clinical ground truth."),
  rotation: ev("common-reference", "Rotation", "Spinous processes ≈ midway between medial clavicle ends (WHO); direction supported, magnitude body-habitus dependent and educational."),
  "collimation-clipping": ev("validated", "Anatomical coverage and collimation", "Anatomy outside the field is not imaged (geometry); cropping implementation is educational."),
  "excess-field": ev("educational-simplification", "Anatomical coverage and collimation", "Larger exposed region only; exact scatter/contrast penalty is provisional and not drawn."),
  centering: ev("validated", "Anatomical coverage and collimation", "The field follows the central ray (geometry)."),
  scapulae: ev("common-reference", "Scapular positioning", "IAEA: medial scapular borders outside the lung fields; the overlap drawn is a schematic approximation."),
  chin: ev("educational-simplification", "Chin / upper-chest positioning", "Overlap of lower-jaw/soft tissue is an educational approximation; the control is not an anatomical angle."),
  inspiration: ev("common-reference", "Inspiration", "Deep/full inspiration is a common quality criterion; reduced expansion / higher diaphragm is directional, magnitude educational; no rib-count rule."),
  motion: ev("validated", "Motion", "Motion → loss of sharpness is validated; blur magnitude is educational."),
  "low-exposure": ev("validated", "Low detector exposure / quantum noise", "Insufficient detector exposure increases noise and impairs low-contrast information; noise amplitude is educational."),
  "excess-exposure": ev("validated", "Excess detector exposure", "DR can look acceptable across a broad exposure range (dose creep); the image is deliberately not darkened."),
  "low-penetration": ev("common-reference", "Penetration and anatomical visibility", "IAEA: retrocardiac lung and mediastinum should be visualised; the visibility change is an educational approximation."),
  marker: ev("educational-simplification", "Side marker and annotations", "Learner-selected marker at its detector-relative position; patient-side correctness is unscored."),
  projection: ev("educational-simplification", "Scope", "Only the PA appearance exists; AP/lateral are not simulated."),
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
  return (w * h) / (sizeCm * sizeCm);
}

export function buildRenderPlan(state: RadiographResultState, radCase: RadCase): RenderPlan {
  const { radiograph: spec, detector, requiredAnatomy: req, positioning } = radCase;
  const { geometry, patient, exposure, patientResponse } = state;
  const box = spec.anatomyBox;
  // Map the anatomy landmark box onto the required-anatomy region so field cuts and drawn anatomy agree.
  const widthCm = req.widthCm / (box.u2 - box.u1);
  const heightCm = req.heightCm / (box.v2 - box.v1);
  const image = { x1: req.xCm - box.u1 * widthCm, y1: req.yCm - box.v1 * heightCm, widthCm, heightCm };

  const deg = clamp(geometry.rotationDeg, -TUNING.rotation.maxDeg, TUNING.rotation.maxDeg);
  const rotation =
    deg === 0
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
        return { side: patient.marker.side, centerCm: center, sizeCm, visibleFraction: markerVisibleFraction(center, sizeCm, fieldCm) };
      })()
    : null;

  const has = (ruleId: string) => state.findings.some((f) => f.ruleId === ruleId);
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
    .map(([id, , drivers, changesPixels]) => ({ id, drivers, principle: EFFECT_PRINCIPLES[id], changesPixels }));
  if (!effects.some((e) => faults.has(e.id))) {
    effects.unshift({ id: "baseline", drivers: [], principle: EFFECT_PRINCIPLES.baseline, changesPixels: false });
  }

  return {
    schemaVersion: 1,
    caseId: state.caseId,
    assetId: spec.id,
    detector: { widthCm: detector.widthCm, heightCm: detector.heightCm },
    image,
    fieldCm,
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
