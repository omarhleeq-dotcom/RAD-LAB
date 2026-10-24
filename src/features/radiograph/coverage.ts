import type { DetectorRegion, DetectorSpec } from "@/domain/case";
import type { RadiographAssetSpec } from "@/domain/radiograph";
import { fitAnatomyBox } from "@/features/simulation/geometry";

/**
 * Share of the detector area (0–1) the reference image covers, from the existing fit (`fitAnatomyBox`): the image rectangle laid
 * on the detector, clipped to it. Never a hard-coded figure; the rest of the field is the "no reference data" hatch.
 */
export function detectorCoverage(spec: Pick<RadiographAssetSpec, "widthPx" | "heightPx" | "anatomyBox">, req: DetectorRegion, detector: DetectorSpec): number {
  const { image } = fitAnatomyBox(spec, req);
  const w = Math.min(image.x1 + image.widthCm, detector.widthCm) - Math.max(image.x1, 0);
  const h = Math.min(image.y1 + image.heightCm, detector.heightCm) - Math.max(image.y1, 0);
  return Math.max(0, w) * Math.max(0, h) / (detector.widthCm * detector.heightCm);
}
