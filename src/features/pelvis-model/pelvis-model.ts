import { TUNING } from "@/features/radiograph/tuning";

/** One-image teaching approximation, not measured depth or a clinical projection.
 * Positive values narrow the patient's RIGHT obturator region (viewer left)
 * and widen the opposite region. No new/hidden bone is drawn. Same anchors
 * drive the scene and the existing limb-warp renderer. Never mirrored by RTL.
 */
export const PELVIS_COLUMNS = [
  { u: 0, z: 0 }, { u: 0.12, z: -0.01 }, { u: 0.25, z: 0.06 },
  { u: 0.35, z: 0.045 }, { u: 0.46, z: -0.045 }, { u: 0.5, z: 0 },
  { u: 0.54, z: -0.045 }, { u: 0.65, z: 0.045 }, { u: 0.75, z: 0.06 },
  { u: 0.88, z: -0.01 }, { u: 1, z: 0 },
] as const;
export function pelvisAnchors(degrees: number) {
  const angle = Math.max(-15, Math.min(15, degrees)) * TUNING.limbRotation.pelvisGainPerDeg * Math.PI / 180;
  return PELVIS_COLUMNS.map(({ u, z }) => ({ u, du: z * Math.sin(angle) }));
}
export function pelvisShift(u: number, degrees: number): number {
  const a = pelvisAnchors(degrees);
  if (u <= 0 || u >= 1) return 0;
  const i = a.findIndex((p) => p.u >= u);
  const lo = a[i - 1]!, hi = a[i]!;
  return lo.du + (hi.du - lo.du) * (u - lo.u) / (hi.u - lo.u);
}
