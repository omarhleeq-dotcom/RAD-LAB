import type { CenteringSpec } from "@/domain/case";
import type { NormPoint } from "@/domain/simulation";

export type Axis = "x" | "y";
export type CenteringState = "ideal" | "acceptable" | "off";

export interface AxisCentering {
  state: CenteringState;
  /** Signed offset from the target (normalized). Negative = toward left (x) / top (y). */
  offset: number;
  /** Direction of the error; null when within the ideal region. */
  direction: "low" | "high" | null;
}

/** Classify one axis of the central-ray position against the educational target region. */
export function centeringOnAxis(ray: NormPoint, spec: CenteringSpec, axis: Axis): AxisCentering {
  const offset = ray[axis] - spec.target[axis];
  const abs = Math.abs(offset);
  // Small epsilon so values exactly on a tolerance boundary are not lost to float error.
  const eps = 1e-9;
  if (abs <= spec.idealTolerance[axis] + eps) return { state: "ideal", offset, direction: null };
  const direction = offset < 0 ? "low" : "high";
  return { state: abs <= spec.acceptableTolerance[axis] + eps ? "acceptable" : "off", offset, direction };
}

export function centeringStatus(ray: NormPoint, spec: CenteringSpec) {
  return { x: centeringOnAxis(ray, spec, "x"), y: centeringOnAxis(ray, spec, "y") };
}
