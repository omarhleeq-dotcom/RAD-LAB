import type { AssessHistoryRow, AssessmentVersion, AttemptPolicy } from "./contracts";
import type { FinalResult } from "./server-contracts";

/** Operational ceilings, NOT product constants. Revisit with B/C load measurements. */
export const FOUNDATION_LIMITS = Object.freeze({ pageSize: 100, items: 200, options: 50, commandBytes: 65_536 });

export function assertAttemptPolicy(policy: AttemptPolicy): void {
  if (policy.durationSeconds !== null && (!Number.isSafeInteger(policy.durationSeconds) || policy.durationSeconds <= 0)) {
    throw new Error("Duration must be null or positive whole server seconds");
  }
  if (!Number.isSafeInteger(policy.maxAttempts) || policy.maxAttempts <= 0) throw new Error("Invalid attempt limit");
  if (policy.gradeVisibility !== "hidden" && policy.gradeVisibility !== "after-submission") throw new Error("Invalid visibility");
}

/** Called after JSON shape decoding by a future service; reject unsupported versions/types, never fall back. */
export function assertAssessmentVersion(value: AssessmentVersion): void {
  const reference = (ref: { id: string; version: string }) => {
    if (!ref.id?.trim() || !ref.version?.trim()) throw new Error("Missing immutable reference");
  };
  if (value.schemaVersion !== 1) throw new Error("Unsupported Assess schema");
  reference(value.ref);
  assertAttemptPolicy(value.policy);
  if (decimalPoints(value.maximum).numerator <= 0n) throw new Error("Maximum must be positive");
  if (value.track !== "mixed" && value.track !== "full-practical") throw new Error("Unsupported track");
  if (!value.items.length || value.items.length > FOUNDATION_LIMITS.items) throw new Error("Invalid item count");
  const ids = new Set<string>();
  for (const item of value.items) {
    if (item.schemaVersion !== 1 || item.contentLanguage !== "en" || !item.prompt.trim()) throw new Error("Invalid item contract");
    reference(item.ref);
    if (ids.has(item.ref.id)) throw new Error("Duplicate item identity");
    ids.add(item.ref.id);
    if (value.track === "full-practical") {
      if (item.type !== "full-practical") throw new Error("Mixed tracks");
      reference(item.caseRef);
    } else if (item.type === "single-choice") {
      if (item.options.length < 2 || item.options.length > FOUNDATION_LIMITS.options ||
        new Set(item.options.map((o) => o.id)).size !== item.options.length ||
        item.options.some((o) => !o.id.trim() || !o.text.trim())) throw new Error("Invalid options");
    } else if (item.type !== "simulator-part") throw new Error("Unsupported mixed item type");
  }
}

function utcDate(value: string): Date {
  // Canonical UTC instants only; reject Date's silent normalisation of invalid days.
  const d = new Date(value);
  if (!Number.isFinite(d.getTime()) || d.toISOString() !== value) throw new Error("Expected canonical UTC instant");
  return d;
}

/** Preserve UTC time-of-day; clamp day to destination month, not overflow into the next. */
export function resultExpiresAt(submittedAt: string): string {
  const d = utcDate(submittedAt);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + 6);
  const end = new Date(d);
  end.setUTCMonth(end.getUTCMonth() + 1);
  end.setUTCDate(0);
  d.setUTCDate(Math.min(day, end.getUTCDate()));
  return d.toISOString();
}

/** At the deadline even a newly received save/expose is late. Duplicates are looked up BEFORE this check. */
export function acceptsMutation(serverNow: string, deadline: string | null, state: string): boolean {
  const now = utcDate(serverNow).getTime();
  return state === "active" && (deadline === null || now < utcDate(deadline).getTime());
}

/** Explicit whitelist: never spread a private result into a student response. Caller authorises ownership first. */
export function historyRow(result: FinalResult, serverNow: string): AssessHistoryRow | null {
  if (utcDate(serverNow).getTime() >= utcDate(result.expiresAt).getTime()) return null;
  return {
    name: result.name, track: result.track, submittedAt: result.submittedAt,
    grade: result.gradeVisibility === "after-submission"
      ? { visibility: "shown", earned: displayPoints({ numerator: BigInt(result.earned.numerator), denominator: BigInt(result.earned.denominator) }), maximum: displayPoints(decimalPoints(result.maximum)) }
      : { visibility: "hidden" },
  };
}

export interface Fraction { numerator: bigint; denominator: bigint }

/** Bounded decimal text → exact rational. At most six configured decimal places; no floating intermediate. */
export function decimalPoints(value: string): Fraction {
  if (!/^(0|[1-9]\d{0,8})(\.\d{1,6})?$/.test(value)) throw new Error("Invalid decimal points");
  const [whole, decimal = ""] = value.split(".");
  return { numerator: BigInt(whole! + decimal), denominator: 10n ** BigInt(decimal.length) };
}

function validFraction(f: Fraction): void {
  if (f.denominator <= 0n || f.numerator < 0n) throw new Error("Invalid fraction");
}

/** Each entry is a selected criterion's own configured points and unrounded credit, not Practice total. */
export function earnedPoints(criteria: readonly { maximum: string; credit: Fraction }[]): Fraction {
  if (!criteria.length || criteria.length > FOUNDATION_LIMITS.items) throw new Error("Invalid criteria count");
  return criteria.reduce<Fraction>((sum, criterion) => {
    validFraction(criterion.credit);
    if (criterion.credit.numerator > criterion.credit.denominator) throw new Error("Credit outside 0..1");
    const max = decimalPoints(criterion.maximum);
    const n = max.numerator * criterion.credit.numerator;
    const d = max.denominator * criterion.credit.denominator;
    const numerator = sum.numerator * d + n * sum.denominator;
    const denominator = sum.denominator * d;
    const gcd = (a: bigint, b: bigint): bigint => b === 0n ? a : gcd(b, a % b);
    const g = gcd(numerator, denominator);
    return { numerator: numerator / g, denominator: denominator / g };
  }, { numerator: 0n, denominator: 1n });
}

export function scalePoints(earned: Fraction, available: string, finalMaximum: string): Fraction {
  validFraction(earned);
  const from = decimalPoints(available);
  const to = decimalPoints(finalMaximum);
  if (!from.numerator || !to.numerator || earned.numerator * from.denominator > from.numerator * earned.denominator) {
    throw new Error("Invalid scale or earned points");
  }
  return {
    numerator: earned.numerator * from.denominator * to.numerator,
    denominator: earned.denominator * from.numerator * to.denominator,
  };
}

/** Integer half-up rounding once, at display/storage boundary; exact fraction remains server-temporary. */
export function displayPoints(value: Fraction, places = 2): string {
  validFraction(value);
  if (!Number.isInteger(places) || places < 0 || places > 6) throw new Error("Invalid display precision");
  const scale = 10n ** BigInt(places);
  const rounded = (2n * value.numerator * scale + value.denominator) / (2n * value.denominator);
  if (!places) return String(rounded);
  return `${rounded / scale}.${String(rounded % scale).padStart(places, "0")}`;
}
