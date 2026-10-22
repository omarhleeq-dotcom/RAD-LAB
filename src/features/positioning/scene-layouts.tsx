"use client";
import { PELVIS_FIGURE } from "./PelvisFigure";
import { PelvisSideView } from "./PelvisSideView";
import { SHOULDER_FIGURE } from "./ShoulderFigure";
import { ShoulderSideView } from "./ShoulderSideView";

/**
 * Scene layouts (S14-0). `PositioningView` is the shared interactive positioning view (detector view + side/plan view +
 * patient cues + rotation / marker / fine-adjust controls). What differs per exam — the detector figure, the second view,
 * the cues panel and four texts — is a `SceneLayout`, registered here against the scene id, so a new exam adds an entry
 * (or its own scene component in `scenes.tsx`) instead of a flag and a branch in the shared components.
 * The three chest layouts are the former `variant="pa" | "lateral" | "ap"` branches moved verbatim: output unchanged.
 */
import type { ComponentType } from "react";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { ApSupineView } from "./ApSupineView";
import { ElbowSideView } from "./ElbowSideView";
import { ANKLE_AP_FIGURE, ANKLE_LATERAL_FIGURE, CHEST_LATERAL_FIGURE, CHEST_PA_FIGURE, ELBOW_AP_FIGURE, ELBOW_LATERAL_FIGURE, FOOT_AP_FIGURE, FOOT_OBLIQUE_FIGURE, HAND_LATERAL_FIGURE, HAND_PA_FIGURE, KNEE_AP_FIGURE, KNEE_LATERAL_FIGURE, WRIST_LATERAL_FIGURE, WRIST_PA_FIGURE, type DetectorFigure } from "./detector-figures";
import { HandSideView } from "./HandSideView";
import { LowerLimbSideView } from "./LowerLimbSideView";
import { ApPatientCues, LateralPatientCues, PatientCues, type CuesProps } from "./PatientCues";
import { PlanView } from "./PlanView";
import { WristSideView } from "./WristSideView";

/** The second view beside the detector view (plan view from above, or a side view of the set-up). */
export interface SecondViewProps {
  radCase: RadCase;
  settings: SimulationSettings;
  showGuides: boolean;
}

/** Full message paths (`namespace.key`) of the texts that differ between scenes. */
export interface SceneTexts {
  /** Caption under the detector view. */
  detectorCaption: string;
  /** Caption under the second view. */
  secondViewCaption: string;
  schematicNote: string;
  rotationHelp: string;
  /** Marker-convention note (shown with the guides ON). */
  markerConvention: string;
  /** Optional (S14.1c): the marker hint and the rotation label when the common (chest-worded) ones do not fit, e.g. a limb. Absent = `positioning.markerHint` / `positioning.rotation`. */
  markerHint?: string;
  rotationLabel?: string;
}

export interface SceneLayout {
  figure: DetectorFigure;
  SecondView: ComponentType<SecondViewProps>;
  /** Phone scene switch label: the second view is a plan view from above (else a side view). */
  secondViewIsTop?: boolean;
  /** The patient-cues panel (chin / shoulders). Absent (S14.1b) for a scene without those cues, e.g. a limb. */
  Cues?: ComponentType<CuesProps>;
  texts: SceneTexts;
}

export const CHEST_PA_LAYOUT: SceneLayout = {
  figure: CHEST_PA_FIGURE,
  SecondView: PlanView,
  secondViewIsTop: true,
  Cues: PatientCues,
  texts: {
    detectorCaption: "positioning.frontView",
    secondViewCaption: "positioning.topView",
    schematicNote: "positioning.schematicNote",
    rotationHelp: "positioning.rotationHelp",
    markerConvention: "positioning.markerConvention",
  },
};

export const CHEST_LATERAL_LAYOUT: SceneLayout = {
  figure: CHEST_LATERAL_FIGURE,
  SecondView: PlanView,
  secondViewIsTop: true,
  Cues: LateralPatientCues,
  texts: {
    detectorCaption: "positioningLateral.sideView",
    secondViewCaption: "positioning.topView",
    schematicNote: "positioningLateral.schematicNote",
    rotationHelp: "positioningLateral.rotationHelp",
    markerConvention: "positioningLateral.markerConvention",
  },
};

export const CHEST_AP_SUPINE_LAYOUT: SceneLayout = {
  figure: CHEST_PA_FIGURE,
  SecondView: ApSupineView,
  Cues: ApPatientCues,
  texts: {
    detectorCaption: "positioningAp.frontView",
    secondViewCaption: "positioningAp.sideViewCaption",
    schematicNote: "positioningAp.schematicNote",
    rotationHelp: "positioningAp.rotationHelp",
    markerConvention: "positioningAp.markerConvention",
  },
};

/** Wrist (S14.1c): the detector view draws the wrist; the second view is a SIDE view of the table set-up (not the chest plan view); no patient-cue panel. */
const wristLayout = (figure: DetectorFigure, kind: "Pa" | "Lateral"): SceneLayout => ({
  figure,
  SecondView: WristSideView,
  texts: {
    detectorCaption: `positioningWrist.detectorCaption${kind}`,
    secondViewCaption: "positioningWrist.sideViewCaption",
    schematicNote: "positioningWrist.schematicNote",
    rotationHelp: `positioningWrist.rotationHelp${kind}`,
    markerConvention: "positioningWrist.markerConvention",
    markerHint: "positioningWrist.markerHint",
    rotationLabel: "positioningWrist.rotation",
  },
});

export const WRIST_PA_LAYOUT: SceneLayout = wristLayout(WRIST_PA_FIGURE, "Pa");
export const WRIST_LATERAL_LAYOUT: SceneLayout = wristLayout(WRIST_LATERAL_FIGURE, "Lateral");

/** Hand (S14.2b): as the wrist, the detector view draws the hand and the second view is a SIDE view of the table set-up (no chest plan view, no patient-cue panel). */
const handLayout = (figure: DetectorFigure, kind: "Pa" | "Lateral"): SceneLayout => ({
  figure,
  SecondView: HandSideView,
  texts: {
    detectorCaption: `positioningHand.detectorCaption${kind}`,
    secondViewCaption: "positioningHand.sideViewCaption",
    schematicNote: "positioningHand.schematicNote",
    rotationHelp: `positioningHand.rotationHelp${kind}`,
    markerConvention: "positioningHand.markerConvention",
    markerHint: "positioningHand.markerHint",
    rotationLabel: "positioningHand.rotation",
  },
});

export const HAND_PA_LAYOUT: SceneLayout = handLayout(HAND_PA_FIGURE, "Pa");
export const HAND_LATERAL_LAYOUT: SceneLayout = handLayout(HAND_LATERAL_FIGURE, "Lateral");

/** Elbow (S14.3): as the wrist and hand, the detector view draws the elbow and the second view is a SIDE view of the table set-up (no chest plan view, no patient-cue panel). */
const elbowLayout = (figure: DetectorFigure, kind: "Ap" | "Lateral"): SceneLayout => ({
  figure,
  SecondView: ElbowSideView,
  texts: {
    detectorCaption: `positioningElbow.detectorCaption${kind}`,
    secondViewCaption: "positioningElbow.sideViewCaption",
    schematicNote: "positioningElbow.schematicNote",
    rotationHelp: `positioningElbow.rotationHelp${kind}`,
    markerConvention: "positioningElbow.markerConvention",
    markerHint: "positioningElbow.markerHint",
    rotationLabel: "positioningElbow.rotation",
  },
});

export const ELBOW_AP_LAYOUT: SceneLayout = elbowLayout(ELBOW_AP_FIGURE, "Ap");
export const ELBOW_LATERAL_LAYOUT: SceneLayout = elbowLayout(ELBOW_LATERAL_FIGURE, "Lateral");

/** Knee and foot (S14.4): the detector view draws the right limb and the second view is a SIDE view of the table set-up with the tilted tube (no chest plan view, no patient-cue panel). */
const lowerLimbLayout = (figure: DetectorFigure, ns: "Knee" | "Foot" | "Ankle", kind: "Ap" | "Lateral" | "Oblique"): SceneLayout => ({
  figure,
  SecondView: LowerLimbSideView,
  texts: {
    detectorCaption: `positioning${ns}.detectorCaption${kind}`,
    secondViewCaption: `positioning${ns}.sideViewCaption`,
    schematicNote: `positioning${ns}.schematicNote`,
    rotationHelp: `positioning${ns}.rotationHelp${kind}`,
    markerConvention: `positioning${ns}.markerConvention`,
    markerHint: `positioning${ns}.markerHint`,
    rotationLabel: `positioning${ns}.rotation${kind}`,
  },
});

export const KNEE_AP_LAYOUT: SceneLayout = lowerLimbLayout(KNEE_AP_FIGURE, "Knee", "Ap");
export const KNEE_LATERAL_LAYOUT: SceneLayout = lowerLimbLayout(KNEE_LATERAL_FIGURE, "Knee", "Lateral");
export const FOOT_AP_LAYOUT: SceneLayout = lowerLimbLayout(FOOT_AP_FIGURE, "Foot", "Ap");
export const FOOT_OBLIQUE_LAYOUT: SceneLayout = lowerLimbLayout(FOOT_OBLIQUE_FIGURE, "Foot", "Oblique");
/** Ankle (S14.5): the same layout (detector view of the LEFT ankle + the side view of the table set-up). */
export const ANKLE_AP_LAYOUT: SceneLayout = lowerLimbLayout(ANKLE_AP_FIGURE, "Ankle", "Ap");
export const ANKLE_LATERAL_LAYOUT: SceneLayout = lowerLimbLayout(ANKLE_LATERAL_FIGURE, "Ankle", "Lateral");

export const PELVIS_LAYOUT: SceneLayout = { figure: PELVIS_FIGURE, SecondView: PelvisSideView, texts: { detectorCaption: "positioningPelvis.detectorCaption", secondViewCaption: "positioningPelvis.sideViewCaption", schematicNote: "positioningPelvis.schematicNote", rotationHelp: "positioningPelvis.rotationHelp", markerConvention: "positioningPelvis.markerConvention", markerHint: "positioningPelvis.markerHint", rotationLabel: "positioningPelvis.rotation" } };

/** Shoulder Grashey (S-SHOULDER-3): detector view of the right shoulder + a plan view of the erect set-up (body turn and the arm choice). */
export const SHOULDER_LAYOUT: SceneLayout = { figure: SHOULDER_FIGURE, SecondView: ShoulderSideView, secondViewIsTop: true, texts: { detectorCaption: "positioningShoulder.detectorCaption", secondViewCaption: "positioningShoulder.sideViewCaption", schematicNote: "positioningShoulder.schematicNote", rotationHelp: "positioningShoulder.rotationHelp", markerConvention: "positioningShoulder.markerConvention", markerHint: "positioningShoulder.markerHint", rotationLabel: "positioningShoulder.rotation" } };
