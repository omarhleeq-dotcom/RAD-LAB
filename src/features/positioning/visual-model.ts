/**
 * Educational visual model for the patient figure. These numbers only drive drawing; scoring uses the
 * internal rotation state (`rotationDeg`) directly. The medical reference warns that clavicle/spinous
 * process appearance depends on body morphology, so nothing here maps pixel distances to clinical degrees.
 */
import type { ChinPositionId, ProjectionId, ShoulderPositionId } from "@/domain/simulation";

const toRad = (deg: number) => (deg * Math.PI) / 180;

export interface RotationVisual {
  /** Overall thorax width scale as the chest turns away from the detector (never below 0.55). */
  thoraxScale: number;
  /**
   * Per-lung width scale, named by the VIEWER's side of the displayed image (PA display: the viewer's left is the
   * patient's right). The drawing is symmetric and unlabelled. S11c-1: positive rotationDeg = patient LEFT side toward the receptor = viewer-right lung drawn larger (the Bontrager note is silent on which lung looks larger; educational approximation).
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

/**
 * Plan-view (top-down, SVG: +x toward the detector, +y = detector-left-to-right = the patient's left in a PA) rotation
 * of the patient figure, in SVG degrees (positive = clockwise). S11c-1 / S12-2: positive `rotationDeg` = the SAME physical
 * turn about the patient's vertical axis in every projection: the patient's LEFT side swings toward the receptor as in a PA.
 * PA and lateral: the patient is drawn facing +x (PA) or with the left side toward +x (left lateral, base angle −90° in
 * `PlanView`), and that turn is counter-clockwise in the SVG, so the sign flips. AP: the patient faces the tube (−x), the
 * left side is at −y and the same turn is clockwise, so the value is used as is.
 */
export function planRotationDeg(projection: ProjectionId, rotationDeg: number): number {
  return projection === "ap-erect" ? rotationDeg : -rotationDeg;
}

/** Geometry of the AP side view (drawing units). Not to scale: a schematic of the set-up, never a measurement. */
export const AP_SIDE = {
  /** Detector slab under the patient: its head end, the length of the 43 cm long axis and the surface height. */
  slabX0: 100,
  pxPerCm: 4.4,
  surfaceY: 232,
  /** Hip pivot about which the head end is raised (semi-erect). The raise angle is a drawing value, not a scored or sourced one. */
  pivot: { x: 302, y: 232 },
  semiErectDeg: 30,
  /** Centre of the head, lying at the head end of the detector. */
  head: { x: 80, y: 210 },
  /** SID is drawn at this scale along the beam. */
  sidPxPerCm: 0.62,
} as const;

export interface ApSideLayout {
  /** Rotation (SVG degrees, clockwise) of the patient + detector group: positive raises the head end (the viewer's left). */
  raiseDeg: number;
  /** Where the central ray meets the detector, and the ends of the collimated field along it (after the raise). */
  target: { x: number; y: number };
  fieldA: { x: number; y: number };
  fieldB: { x: number; y: number };
  /** Where the "Detector" label sits: just below the slab, following the raise. */
  detectorLabel: { x: number; y: number };
  /** The head (centre of the skull) after the raise. */
  head: { x: number; y: number };
  /** The tube focal spot and the rotation of its housing (its axis points along the beam). */
  tube: { x: number; y: number };
  tubeRotDeg: number;
  /** Source-to-detector distance drawn along the beam. */
  sidPx: number;
}

const rotateAbout = (p: { x: number; y: number }, c: { x: number; y: number }, deg: number) => {
  const r = toRad(deg);
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return { x: c.x + dx * Math.cos(r) - dy * Math.sin(r), y: c.y + dx * Math.sin(r) + dy * Math.cos(r) };
};

/**
 * Layout of the AP side view from the learner's settings. `tubeAngleDeg` is + = caudad (the beam leaves the tube toward the
 * feet, the viewer's right), measured here from the vertical (the reference for a raised head end is an open question for the
 * educator, see REVIEW_PACKAGE). The tube housing rotates by −angle so that its axis lies along the drawn beam.
 */
export function apSideLayout(a: {
  tubeAngleDeg: number;
  sidCm: number;
  semiErect: boolean;
  /** Detector long-axis length (cm) and, along it from the head end, the central ray and the field ends (cm). */
  detectorHeightCm: number;
  rayCm: number;
  fieldFromCm: number;
  fieldToCm: number;
}): ApSideLayout {
  const raiseDeg = a.semiErect ? AP_SIDE.semiErectDeg : 0;
  const onSlab = (cm: number) => rotateAbout({ x: AP_SIDE.slabX0 + cm * AP_SIDE.pxPerCm, y: AP_SIDE.surfaceY }, AP_SIDE.pivot, raiseDeg);
  const target = onSlab(a.rayCm);
  const sidPx = a.sidCm * AP_SIDE.sidPxPerCm;
  const rad = toRad(a.tubeAngleDeg);
  return {
    raiseDeg,
    target,
    fieldA: onSlab(a.fieldFromCm),
    fieldB: onSlab(a.fieldToCm),
    detectorLabel: rotateAbout({ x: AP_SIDE.slabX0 + (a.detectorHeightCm * AP_SIDE.pxPerCm) / 2, y: AP_SIDE.surfaceY + 36 }, AP_SIDE.pivot, raiseDeg),
    head: rotateAbout(AP_SIDE.head, AP_SIDE.pivot, raiseDeg),
    tube: { x: target.x - Math.sin(rad) * sidPx, y: target.y - Math.cos(rad) * sidPx },
    tubeRotDeg: -a.tubeAngleDeg,
    sidPx,
  };
}
