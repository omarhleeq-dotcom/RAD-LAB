/**
 * Educational visual model for the patient figure. These numbers only drive drawing; scoring uses the
 * internal rotation state (`rotationDeg`) directly. The medical reference warns that clavicle/spinous
 * process appearance depends on body morphology, so nothing here maps pixel distances to clinical degrees.
 */
import type { ChinPositionId, ShoulderPositionId } from "@/domain/simulation";

const toRad = (deg: number) => (deg * Math.PI) / 180;

export interface RotationVisual {
  /** Overall thorax width scale as the chest turns away from the detector (never below 0.55). */
  thoraxScale: number;
  /**
   * Per-lung width scale, named by the VIEWER's side of the displayed image (PA display: the viewer's left is the
   * patient's right). The drawing is symmetric and unlabelled; which sign means which patient side is not interpreted.
   */
  viewerLeftLungScale: number;
  viewerRightLungScale: number;
  /** Horizontal shift of the spinous-process line relative to the thorax centre, in drawing units. */
  spineShift: number;
}

const SPINE_SHIFT_UNITS = 55;
const LUNG_ASYMMETRY = 0.22;

export function rotationVisual(rotationDeg: number): RotationVisual {
  const rad = toRad(rotationDeg);
  return {
    thoraxScale: Math.max(0.55, Math.cos(rad)),
    viewerLeftLungScale: 1 - LUNG_ASYMMETRY * Math.sin(rad),
    viewerRightLungScale: 1 + LUNG_ASYMMETRY * Math.sin(rad),
    spineShift: Math.sin(rad) * SPINE_SHIFT_UNITS,
  };
}

/** Horizontal offset (drawing units) of each scapula from its resting position over the lung field. */
export function scapulaOffset(shoulders: ShoulderPositionId, unit = 1): number {
  return (shoulders === "rolled-forward" ? 34 : 0) * unit;
}

/** Whether the chin is drawn over the lung apices. */
export const chinOverlapsApices = (chin: ChinPositionId) => chin === "tucked";
