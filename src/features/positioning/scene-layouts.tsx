"use client";

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
import { CHEST_LATERAL_FIGURE, CHEST_PA_FIGURE, type DetectorFigure } from "./detector-figures";
import { ApPatientCues, LateralPatientCues, PatientCues, type CuesProps } from "./PatientCues";
import { PlanView } from "./PlanView";

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
}

export interface SceneLayout {
  figure: DetectorFigure;
  SecondView: ComponentType<SecondViewProps>;
  Cues: ComponentType<CuesProps>;
  texts: SceneTexts;
}

export const CHEST_PA_LAYOUT: SceneLayout = {
  figure: CHEST_PA_FIGURE,
  SecondView: PlanView,
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
