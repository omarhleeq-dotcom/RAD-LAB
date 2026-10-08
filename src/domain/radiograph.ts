/**
 * Case-data description of the educational baseline radiograph (Session 4).
 *
 * The baseline is an EDUCATIONAL APPEARANCE REFERENCE, not clinical ground truth for any simulated error and
 * not an image of the case patient. All asset-specific landmarks live here (cases are data); the renderer in
 * `features/radiograph` contains no per-case literals. Image coordinates are normalised to the source image:
 * u: 0 = left edge, 1 = right edge (as displayed, never mirrored by RTL); v: 0 = top, 1 = bottom.
 */
import type { LocalizedText } from "./localized";
import type { ProjectionId } from "./simulation";
import type { Evidence } from "./technique";

export interface ImageRect {
  u1: number;
  v1: number;
  u2: number;
  v2: number;
}

/** Axis-aligned ellipse in image coordinates. */
export interface ImageEllipse {
  cu: number;
  cv: number;
  ru: number;
  rv: number;
}

export interface RadiographAssetSpec {
  id: string;
  /** Served path of the web-resolution derivative (see docs/ASSET_PROVENANCE_AND_LICENSES.md). */
  src: string;
  widthPx: number;
  heightPx: number;
  /**
   * Projection the baseline depicts (S12). Optional: absent = "pa-erect" (the Chest PA baseline, unchanged). The result
   * image is "representative" only when the simulated projection equals it; an asset with no `midlineU` also draws the
   * rotation effect as a posterior-rib separation instead of a frontal spine shift.
   */
  projection?: ProjectionId;
  /** Registry entries (docs/ASSET_PROVENANCE_AND_LICENSES.md) this asset derives from. */
  registryIds: string[];
  /** Voluntary attribution line (the licence does not require it). */
  credit: LocalizedText;
  evidence: Evidence;

  /**
   * Landmark box of the anatomy the case requires (lung apices, lateral lung/rib margins, costophrenic angles)
   * in the source image. The renderer maps this box onto `RadCase.requiredAnatomy` so that a field edge that
   * cuts the required region also cuts the drawn anatomy. The (small) anisotropy this implies is documented.
   */
  anatomyBox: ImageRect;
  /**
   * Thoracic midline (spinous-process line) in the baseline. Optional (S11): a lateral has no frontal midline; without
   * it the rotation effect has no spine / hemithorax cue and is not drawn.
   */
  midlineU?: number;
  /**
   * Vertical landmarks used by the reduced-inspiration warp. Optional (S14.1b): a limb baseline has no lung fields; the
   * warp runs only when both exist (and the exam declares breathing).
   */
  lungApexV?: number;
  /** Highest point of the diaphragmatic domes in the baseline. Optional, see `lungApexV`. */
  diaphragmDomeV?: number;

  /**
   * Landmark groups are OPTIONAL per asset (S11): an exam / baseline declares only the groups its projection has, and
   * the renderer draws only the effects whose group exists. Chest PA declares all three (unchanged).
   */
  /** Schematic scapula overlays shown when the shoulders are not rolled forward (one blade per side). */
  scapulae?: { left: ImageEllipse; right: ImageEllipse };
  /** Schematic mandible overlay shown when the chin is tucked: bottom border of the jaw as a polyline. */
  jaw?: { border: { u: number; v: number }[]; softTissueRect: ImageRect };
  /** Dense / mediastinal / retrocardiac regions that low penetration makes less visible. */
  denseZones?: ImageEllipse[];
  /**
   * Landmark group of a limb's rotation effect (S14.1c). Optional: only a limb baseline declares it; chest assets do not (the
   * core chest rotation effect is then unchanged). The asset's `kind` names which drawing the pipeline applies.
   */
  limbRotation?: LimbRotationLandmarks;
  /**
   * Optional render options (S14.2b-FIX). Absent = the shared defaults (24 px per detector cm, the whole detector).
   *  - `pxPerCm`: working resolution of the result canvas for a baseline that has far more detail than 24 px/cm shows
   *    (the hand baselines have ≈ 88 px/cm). The canvas caps it so the pixel count stays bounded on a phone.
   *  - `viewMarginCm`: draw only the part of the detector that holds the required anatomy and the marker, padded by this
   *    many cm (clipped to the detector), so a narrow baseline is not a thin strip in a large canvas. Display only: field,
   *    collimation, marker position and scoring are unchanged.
   */
  render?: { pxPerCm?: number; viewMarginCm?: number };
}

/** Horizontal band of the image, as fractions of its height (v: 0 = top). */
export interface ImageBand {
  v1: number;
  v2: number;
}

/**
 * Rotation cues of a wrist baseline, read from the image by eye (approximate; TODO(medical-review)). Since S-VIS-1b the displacements come
 * from the 2.5D wrist model (`features/wrist-model`), drawn by the scene and applied to the picture by the elbow's pixel steps:
 *  - "wrist-pa": the forearm rows (`forearm`, from `v1` to the image bottom) where the ulna layer (source u < `splitU`) and the radius layer
 *    (u >= `splitU`) move separately; the whole image is also warped by the model's metacarpal column anchors.
 *  - "wrist-lateral": the bands whose structures must be superimposed in a true lateral (proximal metacarpals, ulnar head over the radius),
 *    each limited to a horizontal window `u1`..`u2` of the source (default: the whole width).
 */
export type LimbRotationLandmarks =
  | { kind: "wrist-pa"; forearm: ImageBand & { splitU: number } }
  | { kind: "wrist-lateral"; bands: (ImageBand & { u1?: number; u2?: number })[] }
  // Hand (S14.2b): PA = the bands the 2.5D hand model warps [phalanges, metacarpals, thumb] (each may carry a horizontal window
  // `u1`..`u2`); lateral (extension) = the bands that must be superimposed (metacarpals + phalanges,
  // distal radius / ulna). A band may carry a horizontal window `u1`..`u2` (the finger / metacarpal column, so the separated thumb is not duplicated).
  | { kind: "hand-pa"; bands: (ImageBand & { u1?: number; u2?: number })[] }
  | { kind: "hand-lateral"; bands: (ImageBand & { u1?: number; u2?: number })[] }
  // Elbow (S14.3): AP = the forearm rows (`forearm`, from `v1` to the image bottom) where the ULNA layer (source u < `splitU`) and the RADIUS
  // layer (u >= `splitU`) are displaced separately and may overlap, the contact line between the two bones at `splitU`; the whole image is
  // also warped by the elbow model's column anchors. Lateral = the bands whose structures must be superimposed (distal humerus condyle
  // outlines; radial head / coronoid), each limited to a horizontal window `u1`..`u2` of the source.
  | { kind: "elbow-ap"; forearm: ImageBand & { splitU: number } }
  | { kind: "elbow-lateral"; bands: (ImageBand & { u1: number; u2: number })[] }
  // Lower limb (S14.4): three GENERIC drawings that reuse the hand / elbow pixel steps (`limb-warp` = the hand PA band warp, `limb-layers` = the
  // elbow AP two-layer forearm rows, `limb-copies` = the elbow lateral copies of the structures that must be superimposed). `model` names the exam
  // whose model (`features/lower-limb-model`) supplies the displacements, and selects the Bontrager criterion shown on the effect card.
  | { kind: "limb-warp"; model: LowerLimbModelId; bands: (ImageBand & { u1?: number; u2?: number })[] }
  | { kind: "limb-layers"; model: LowerLimbModelId; forearm: ImageBand & { splitU: number } }
  | { kind: "limb-copies"; model: LowerLimbModelId; bands: (ImageBand & { u1: number; u2: number })[] };

/** The lower-limb rotation models (S14.4 knee / foot, S14.5 ankle). */
export type LowerLimbModelId = "foot-ap" | "foot-oblique" | "knee-ap" | "knee-lateral" | "ankle-ap" | "ankle-lateral";
