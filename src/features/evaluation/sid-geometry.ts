import type { CheckRule } from "@/domain/case";
import type { CheckOutcome } from "./types";

/**
 * Pure geometry for the SID "Why?" explainer (owner option C, DECISIONS.md#radiograph-geometry-diagram-owner-2026-11-04).
 * Applies D-R3: the explanation is a separate schematic and never touches the patient radiograph, scoring or feedback.
 *
 * Only two inputs come from data: the student's SID and the exam's full-credit SID band (`RangeRule.ideal`).
 * Everything else below is a DRAWING CONVENTION of this illustration, not exam data and not a clinical value:
 * it is never shown as a number, and the diagram is labelled "not to scale".
 */

/** Drawing convention: the object sits this fraction of the reference SID above the detector (exaggerated so the effect is visible). */
const OBJECT_GAP_OF_REFERENCE = 0.35;
/** Drawing convention: guard so the object always stays clearly below the focal spot, even at the control minimum. */
const MAX_OBJECT_GAP_OF_SID = 0.6;
/** Drawing convention (viewBox units): panel size, margins, object and focal-spot widths. */
const VIEW = { width: 120, height: 150, top: 14, detectorY: 136, objectWidth: 30, objectHeight: 7, focalWidth: 8 } as const;

export interface Segment { x1: number; y1: number; x2: number; y2: number }
export interface Span { x1: number; x2: number }

export interface SidDiagramPanel {
  focalSpot: Span & { y: number };
  object: { x: number; y: number; width: number; height: number };
  detector: Span & { y: number };
  /** Rays from each focal-spot edge past each object edge to the detector: [outer left, outer right, inner left, inner right]. */
  rays: [Segment, Segment, Segment, Segment];
  /** Full (sharp) shadow, the umbra. */
  umbra: Span;
  /** The blurred edges either side of the umbra (penumbra): wider means less sharp. */
  penumbra: [Span, Span];
}

export interface SidDiagram {
  width: number;
  height: number;
  /** Relation of the student's SID to the reference SID. */
  relation: "shorter" | "longer";
  yours: SidDiagramPanel;
  reference: SidDiagramPanel;
}

export interface SidExplainerInput { sidCm: number; referenceSidCm: number }

/**
 * The explainer is shown only for a range rule on `sidCm` whose data already declares the geometric-magnification
 * variant, and only when the check missed full credit (the SID is outside the `ideal` band). The reference SID is
 * the nearest edge of that full-credit band: the closest setting that would have earned full credit.
 */
export function sidExplainerInput(rule: CheckRule | undefined, sidCm: number, outcome: CheckOutcome): SidExplainerInput | undefined {
  if (!rule || rule.kind !== "range" || rule.setting !== "sidCm" || rule.variantOnLow !== "magnified-geometry") return undefined;
  if (outcome === "pass" || !Number.isFinite(sidCm)) return undefined;
  const [lo, hi] = rule.ideal;
  if (sidCm >= lo && sidCm <= hi) return undefined;
  return { sidCm, referenceSidCm: sidCm < lo ? lo : hi };
}

function panel(sidCm: number, gapCm: number, cmToView: number): SidDiagramPanel {
  const { width, detectorY, objectWidth, objectHeight, focalWidth } = VIEW;
  const cx = width / 2;
  const tubeY = detectorY - sidCm * cmToView;
  const objectY = detectorY - gapCm * cmToView;
  // Magnification of the object plane on the detector: SID / (SID − object gap). Similar triangles, nothing else.
  const m = sidCm / (sidCm - gapCm);
  const hw = objectWidth / 2, hf = focalWidth / 2;
  const outer = hw * m + hf * (m - 1);
  const inner = hw * m - hf * (m - 1);
  const ray = (fromX: number, toX: number): Segment => ({ x1: cx + fromX, y1: tubeY, x2: cx + toX, y2: detectorY });
  return {
    focalSpot: { x1: cx - hf, x2: cx + hf, y: tubeY },
    object: { x: cx - hw, y: objectY - objectHeight / 2, width: objectWidth, height: objectHeight },
    detector: { x1: 4, x2: width - 4, y: detectorY },
    rays: [ray(hf, -outer), ray(-hf, outer), ray(-hf, -inner), ray(hf, inner)],
    umbra: { x1: cx - inner, x2: cx + inner },
    penumbra: [{ x1: cx - outer, x2: cx - inner }, { x1: cx + inner, x2: cx + outer }],
  };
}

/** Both panels share one vertical scale (the longer SID fills the panel) and one object gap, so only the SID differs. */
export function sidGeometryDiagram({ sidCm, referenceSidCm }: SidExplainerInput): SidDiagram {
  if (!(sidCm > 0) || !(referenceSidCm > 0) || sidCm === referenceSidCm) throw new RangeError("SID and reference SID must be positive and different");
  const gapCm = Math.min(OBJECT_GAP_OF_REFERENCE * referenceSidCm, MAX_OBJECT_GAP_OF_SID * Math.min(sidCm, referenceSidCm));
  const cmToView = (VIEW.detectorY - VIEW.top) / Math.max(sidCm, referenceSidCm);
  return {
    width: VIEW.width,
    height: VIEW.height,
    relation: sidCm < referenceSidCm ? "shorter" : "longer",
    yours: panel(sidCm, gapCm, cmToView),
    reference: panel(referenceSidCm, gapCm, cmToView),
  };
}
