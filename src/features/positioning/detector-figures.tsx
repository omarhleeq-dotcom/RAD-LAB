"use client";

/**
 * Detector-view figure registry (S14-0). `DetectorWorkspace` is the interactive detector view (central ray, collimation,
 * marker); what is drawn on it — the patient figure, its text alternative, the midline label and the orientation labels —
 * is a `DetectorFigure` looked up here, so a new exam's figure is added as an entry, not as a branch in the workspace.
 * Moved verbatim from the former `figure === "chest-lateral"` branches: the rendered output of every figure is unchanged.
 */
import type { ComponentType } from "react";
import { useTranslations } from "next-intl";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { FrontalFigure } from "./FrontalFigure";
import { LateralFigure } from "./LateralFigure";
import { SceneLabel } from "./SceneParts";
import { LABEL_SIZE } from "./scene-style";
import { rotationVisual, scapulaOffset } from "./visual-model";

/** Drawing scale: SVG units per detector cm (shared with the workspace). */
export const U = 10;

export interface FigureProps {
  radCase: RadCase;
  settings: SimulationSettings;
  showGuides: boolean;
  /** Detector size in drawing units. */
  W: number;
  H: number;
}

export interface OrientationProps {
  W: number;
  showGuides: boolean;
}

export interface DetectorFigure {
  /** Full message path of the SVG's group label and of the midline guide label. */
  altKey: string;
  midlineKey: string;
  /** Text alternative of the drawing, built from the learner's own settings (`scene.alt*`). */
  alt: (ts: (key: string, values?: Record<string, string>) => string, settings: SimulationSettings) => string;
  /** The patient drawing, in detector space (never mirrored by RTL). */
  Drawing: ComponentType<FigureProps>;
  /** The side labels of the orientation row (Head / Feet are drawn by the workspace for every figure). */
  Orientation: ComponentType<OrientationProps>;
}

const chinKey = (s: SimulationSettings) => (s.chinPosition === "tucked" ? "chinTucked" : "chinLifted");

// The chest drawings read the chin / shoulder cues, which every chest exam declares (S14.1b: optional in the settings for a
// limb exam); the ideal values below are only the type-level fallback and never apply to a chest exam.
function PaDrawing({ radCase, settings, H, W }: FigureProps) {
  const a = radCase.requiredAnatomy;
  const rv = rotationVisual(settings.rotationDeg);
  // A projection other than the PA drawn in the frontal figure keeps the narrowed thorax (as before the registry).
  const thoraxScale = settings.projection === "lateral-left" ? 0.45 : rv.thoraxScale;
  const lungY = a.yCm * U, lungH = a.heightCm * U, lungW = (a.widthCm * U) / 2 - 8;
  return <FrontalFigure W={W} H={H} thoraxScale={thoraxScale} rv={rv} lungY={lungY} lungH={lungH} lungW={lungW} scapula={scapulaOffset(settings.shoulderPosition ?? "rolled-forward")} chin={settings.chinPosition ?? "elevated"} />;
}

function PaOrientation({ W, showGuides }: OrientationProps) {
  const ts = useTranslations("scene");
  return (
    showGuides && (
      <>
        <SceneLabel x={-24} y={-22} size={LABEL_SIZE.detector}>{ts("patientRight")}</SceneLabel>
        <SceneLabel x={W + 24} y={-22} size={LABEL_SIZE.detector} anchor="end">{ts("patientLeft")}</SceneLabel>
      </>
    )
  );
}

function LateralDrawing({ radCase, settings, H, W, showGuides }: FigureProps) {
  const a = radCase.requiredAnatomy;
  const lungY = a.yCm * U, lungH = a.heightCm * U;
  return (
    <LateralFigure
      W={W}
      H={H}
      region={{ x: a.xCm * U, y: lungY, w: a.widthCm * U, h: lungH }}
      rotationDeg={settings.rotationDeg}
      chin={settings.chinPosition ?? "elevated"}
      armsRaised={settings.choices?.arms === "raised"}
      showGuides={showGuides}
    />
  );
}

function LateralOrientation({ W }: OrientationProps) {
  const ts = useTranslations("scene");
  return (
    <>
      <SceneLabel x={-24} y={-22} size={LABEL_SIZE.detector}>{ts("anterior")}</SceneLabel>
      <SceneLabel x={W + 24} y={-22} size={LABEL_SIZE.detector} anchor="end">{ts("posterior")}</SceneLabel>
    </>
  );
}

export const CHEST_PA_FIGURE: DetectorFigure = {
  altKey: "positioning.alt",
  midlineKey: "positioning.midline",
  alt: (ts, s) =>
    ts("altFrontal", { chin: ts(chinKey(s)), shoulders: ts(s.shoulderPosition === "rolled-forward" ? "shouldersRolled" : "shouldersRelaxed") }),
  Drawing: PaDrawing,
  Orientation: PaOrientation,
};

export const CHEST_LATERAL_FIGURE: DetectorFigure = {
  altKey: "positioningLateral.alt",
  midlineKey: "positioningLateral.midline",
  alt: (ts, s) => ts("altLateral", { arms: ts(s.choices?.arms === "raised" ? "armsRaised" : "armsLowered"), chin: ts(chinKey(s)) }),
  Drawing: LateralDrawing,
  Orientation: LateralOrientation,
};

/** The registry. The AP supine scene draws the PA frontal figure on the detector view (its own part is the side view). */
export const DETECTOR_FIGURES: Readonly<Record<string, DetectorFigure>> = {
  "chest-pa": CHEST_PA_FIGURE,
  "chest-lateral": CHEST_LATERAL_FIGURE,
};
