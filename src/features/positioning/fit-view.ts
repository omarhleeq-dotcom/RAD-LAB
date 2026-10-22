/**
 * Phone "fit to the anatomy and the field" view of the detector scene (UI-3, owner phone check 3). Only the SVG viewBox changes:
 * the scene is the same drawing, and pointer → stored coordinates still go through `clientToNorm` with the viewBox in use, so a
 * drag gives the same stored value at either zoom level. Pure and React-free.
 */
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { normToView, type Box } from "@/features/simulation/coords";
import { collimatedField } from "@/features/simulation/geometry";
import { U } from "./detector-figures";

/** The whole-detector view with its label bands (the unchanged desktop viewBox). */
export function detectorViewBox(W: number, H: number, marginGuideLabels: boolean): Box {
  const top = marginGuideLabels ? 148 : 90;
  const bottom = marginGuideLabels ? 38 : 30;
  return { x: -30, y: -top, width: W + 60, height: H + bottom + top };
}

const MARGIN_MIN = 24; // scene units around the field
const MARGIN_RATIO = 0.12;
const MIN_FRACTION = 0.4; // never zoom to less than this share of the detector (a tiny field would be unusably magnified)
const MARKER_REACH = 30; // half the marker box
const RAY_REACH = 26; // the crosshair arms
const BEZEL = 6;
/** The fit only counts when it is clearly tighter than the whole view. */
const MEANINGFUL_AREA = 0.85;

export interface PhoneFit {
  box: Box;
  /** True when the fit is clearly smaller than the whole detector view (otherwise the toggle has nothing to show). */
  meaningful: boolean;
}

export function phoneFit(radCase: RadCase, settings: SimulationSettings, marginGuideLabels: boolean): PhoneFit {
  const W = radCase.detector.widthCm * U;
  const H = radCase.detector.heightCm * U;
  const frame = { x: 0, y: 0, width: W, height: H };
  const field = collimatedField(settings, radCase.detector);
  let x1 = field.x1 * U, y1 = field.y1 * U, x2 = field.x2 * U, y2 = field.y2 * U;
  const include = (cx: number, cy: number, reach: number) => {
    x1 = Math.min(x1, cx - reach);
    y1 = Math.min(y1, cy - reach);
    x2 = Math.max(x2, cx + reach);
    y2 = Math.max(y2, cy + reach);
  };
  const ray = normToView(settings.centralRay, frame);
  include(ray.x, ray.y, RAY_REACH);
  if (settings.sideMarker) {
    const m = normToView(settings.markerPosition, frame);
    include(m.x, m.y, MARKER_REACH);
  }
  const margin = Math.max(MARGIN_MIN, MARGIN_RATIO * Math.max(x2 - x1, y2 - y1));
  x1 -= margin; y1 -= margin; x2 += margin; y2 += margin;
  // Not smaller than a share of the detector, centred on the content, and inside the detector with its bezel.
  const grow = (lo: number, hi: number, min: number): [number, number] => (hi - lo >= min ? [lo, hi] : [(lo + hi) / 2 - min / 2, (lo + hi) / 2 + min / 2]);
  [x1, x2] = grow(x1, x2, MIN_FRACTION * W);
  [y1, y2] = grow(y1, y2, MIN_FRACTION * H);
  const fit = (lo: number, hi: number, max: number): [number, number] => {
    const size = Math.min(hi - lo, max + 2 * BEZEL);
    const start = Math.min(Math.max(lo, -BEZEL), max + BEZEL - size);
    return [start, start + size];
  };
  const [fx1, fx2] = fit(x1, x2, W);
  const [fy1, fy2] = fit(y1, y2, H);
  const box: Box = { x: fx1, y: fy1, width: fx2 - fx1, height: fy2 - fy1 };
  const full = detectorViewBox(W, H, marginGuideLabels);
  return { box, meaningful: box.width * box.height < MEANINGFUL_AREA * full.width * full.height };
}
