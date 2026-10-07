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
}

/** Horizontal band of the image, as fractions of its height (v: 0 = top). */
export interface ImageBand {
  v1: number;
  v2: number;
}

/**
 * Rotation cues of a wrist baseline, read from the image by eye (approximate; TODO(medical-review)).
 *  - "wrist-pa": the proximal metacarpal band (spacing / concavity cue; `u1`..`u2` = the metacarpal bases' extent) and the
 *    distal radioulnar band (the ulna lies at `ulnaU1`..`ulnaU2`, the radius to its right in the displayed PA).
 *  - "wrist-lateral": the bands that must be superimposed in a true lateral (proximal metacarpals, ulnar head over the radius).
 */
export type LimbRotationLandmarks =
  | { kind: "wrist-pa"; spacing: ImageBand & { u1: number; u2: number }; radioulnar: ImageBand & { ulnaU1: number; ulnaU2: number } }
  | { kind: "wrist-lateral"; bands: ImageBand[] }
  // Hand (S14.2b): PA = the bands over which the spaces between the metacarpal shafts / phalanges are made unequal (each with the
  // horizontal extent `u1`..`u2` of the bump); lateral (extension) = the bands that must be superimposed (metacarpals + phalanges,
  // distal radius / ulna). A band may carry a horizontal window `u1`..`u2` (the finger / metacarpal column, so the separated thumb is not duplicated).
  | { kind: "hand-pa"; bands: (ImageBand & { u1: number; u2: number })[] }
  | { kind: "hand-lateral"; bands: (ImageBand & { u1?: number; u2?: number })[] };
