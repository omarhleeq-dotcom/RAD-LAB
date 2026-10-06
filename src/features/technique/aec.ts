/**
 * Educational, vendor-neutral Automatic Exposure Control model.
 *
 * VALIDATED (technique reference §4): the PURPOSE of AEC — consistent, reproducible receptor exposure over a
 * range of tube potentials, compensating for differences in anatomical thickness.
 * VENDOR / LOCAL-PROTOCOL DEPENDENT: chamber shape, number, position, selection logic, termination behaviour
 * and target. The layout and factors below come from `TechniqueProfile.aec` (data), are labelled as such in
 * the UI, and never claim to represent every system. No chamber combination is declared "universally correct".
 *
 * Model: the AEC terminates when the average SIGNAL of the active chambers reaches the target. A chamber under
 * denser anatomy sees less signal per unit exposure, so the AEC runs longer and the lung fields end up above
 * target; a chamber under thin/air regions terminates early and leaves the lungs below target. Multiple active
 * chambers are combined as the mean sensed signal (a simplification — real combination rules vary).
 */
import type { TechniqueProfile, AecChamberId, AecOutcome } from "@/domain/technique";
import { AEC_CHAMBER_IDS } from "@/domain/technique";
import type { DetectorSpec } from "@/domain/case";
import type { Rect } from "@/features/simulation/geometry";

const normToCm = (v: number, size: number) => ((v + 1) / 2) * size;

/** Fraction (0–1) of a chamber's area that lies inside the collimated field. */
export function chamberFieldCoverage(
  region: { x1: number; y1: number; x2: number; y2: number },
  field: Rect,
  detector: DetectorSpec,
): number {
  const c = {
    x1: normToCm(region.x1, detector.widthCm),
    x2: normToCm(region.x2, detector.widthCm),
    y1: normToCm(region.y1, detector.heightCm),
    y2: normToCm(region.y2, detector.heightCm),
  };
  const area = (c.x2 - c.x1) * (c.y2 - c.y1);
  if (area <= 0) return 0;
  const w = Math.max(0, Math.min(c.x2, field.x2) - Math.max(c.x1, field.x1));
  const h = Math.max(0, Math.min(c.y2, field.y2) - Math.max(c.y1, field.y1));
  return (w * h) / area;
}

/** Toggle a chamber, keeping canonical order and no duplicates so equal selections are always equal arrays. */
export function toggleChamber(current: readonly AecChamberId[], id: AecChamberId): AecChamberId[] {
  const set = new Set(current);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  return AEC_CHAMBER_IDS.filter((c) => set.has(c));
}

/** Evaluate which selected chambers are active and what the AEC would terminate on. */
export function evaluateAec(
  profile: TechniqueProfile,
  selected: readonly AecChamberId[],
  field: Rect,
  detector: DetectorSpec,
): AecOutcome {
  const { chambers, minChamberCoverage, anatomyRelativeExposure } = profile.aec;
  const outcomes = chambers.map((spec) => {
    const isSelected = selected.includes(spec.id);
    const fieldCoverage = chamberFieldCoverage(spec.region, field, detector);
    return {
      id: spec.id,
      selected: isSelected,
      fieldCoverage,
      active: isSelected && fieldCoverage >= minChamberCoverage,
      anatomy: spec.anatomy,
    };
  });
  const active = outcomes.filter((o) => o.active);
  if (active.length === 0) {
    return { chambers: outcomes, terminatedOnChambers: false, chamberRelativeExposure: null };
  }
  // Lung exposure = target / mean(sensed signal relative to lung). A chamber with relative lung exposure ρ
  // senses 1/ρ of the lung signal, so the result is the harmonic mean of ρ over the active chambers.
  const meanSignal = active.reduce((sum, o) => sum + 1 / anatomyRelativeExposure[o.anatomy], 0) / active.length;
  return { chambers: outcomes, terminatedOnChambers: true, chamberRelativeExposure: 1 / meanSignal };
}
