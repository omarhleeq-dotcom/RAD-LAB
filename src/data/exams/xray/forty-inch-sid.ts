/**
 * Owner decision 2026-10-30: 100 cm is the practical equivalent of the 40 in
 * reference SID for this simulator. Shared by every current 40-inch exam;
 * future 40-inch exams should reuse this range, not copy numeric bounds.
 * Provisional pending the recorded medical review. Upper 110 cm is unchanged.
 * This grading range does not alter exposure anchors or the portable-chest limit.
 * Authority and original RAD-081 evidence: docs/DECISIONS.md#forty-inch-sid-owner-2026-10-30.
 */
export const FORTY_INCH_SID_IDEAL_CM: [number, number] = [100, 110];
