/**
 * Exposure-index / Deviation-Index mathematics (technique reference §6).
 *
 *   DI = 10 × log10(EI / EIT)
 *
 * VALIDATED: the equation, DI = 0 at EI = EIT, ≈ +3 for twice the target, ≈ −3 for half.
 * NOT modelled: a universal numeric EIT for Chest PA (it is body-part/view/site/vendor specific) and any
 * universal DI pass/fail limit. RAD-LAB works target-relative: EI/EIT is the ratio of receptor exposure
 * to the protocol target, so no numeric EI/EIT is ever invented. EI is NOT patient dose.
 */

/** DI from an exposure index and its target. Both must be positive, in the same units. */
export function deviationIndex(ei: number, eit: number): number {
  if (!(ei > 0) || !(eit > 0)) throw new RangeError("EI and EIT must be positive numbers");
  return 10 * Math.log10(ei / eit);
}

/** DI from the target-relative ratio EI/EIT. */
export function deviationIndexFromRatio(ratio: number): number {
  if (!(ratio > 0)) throw new RangeError("exposure ratio must be positive");
  return 10 * Math.log10(ratio);
}

/** Inverse of {@link deviationIndexFromRatio}: DI = +3 → ≈ 2×, DI = −3 → ≈ 0.5×. */
export function exposureRatioFromDI(di: number): number {
  return Math.pow(10, di / 10);
}

/** Rounded for display only (one decimal, normalising −0). Never use for scoring. */
export function formatDI(di: number): string {
  const r = Math.round(di * 10) / 10;
  const v = r === 0 ? 0 : r;
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}`;
}
