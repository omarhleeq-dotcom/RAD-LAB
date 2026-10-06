/**
 * Case-data description of the educational baseline radiograph (Session 4).
 *
 * The baseline is an EDUCATIONAL APPEARANCE REFERENCE, not clinical ground truth for any simulated error and
 * not an image of the case patient. All asset-specific landmarks live here (cases are data); the renderer in
 * `features/radiograph` contains no per-case literals. Image coordinates are normalised to the source image:
 * u: 0 = left edge, 1 = right edge (as displayed, never mirrored by RTL); v: 0 = top, 1 = bottom.
 */
import type { LocalizedText } from "./localized";
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
  /** Thoracic midline (spinous-process line) in the baseline. */
  midlineU: number;
  /** Vertical landmarks used by the reduced-inspiration warp. */
  lungApexV: number;
  /** Highest point of the diaphragmatic domes in the baseline. */
  diaphragmDomeV: number;

  /** Schematic scapula overlays shown when the shoulders are not rolled forward (one blade per side). */
  scapulae: { left: ImageEllipse; right: ImageEllipse };
  /** Schematic mandible overlay shown when the chin is tucked: bottom border of the jaw as a polyline. */
  jaw: { border: { u: number; v: number }[]; softTissueRect: ImageRect };
  /** Dense / mediastinal / retrocardiac regions that low penetration makes less visible. */
  denseZones: ImageEllipse[];
}
