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
import { fitAnatomyBox, regionToRect } from "@/features/simulation/geometry";
import { FrontalFigure } from "./FrontalFigure";
import { LateralFigure } from "./LateralFigure";
import { LowerLimbDrawing } from "./LowerLimbFigure";
import { ElbowDrawing } from "./ElbowFigure";
import { HandDrawing } from "./HandFigure";
import { WristDrawing } from "./WristFigure";
import { SceneLabel } from "./SceneParts";
import { LABEL_SIZE } from "./scene-style";
import { rotationVisual, scapulaOffset } from "./visual-model";

/** Drawing scale: SVG units per detector cm (shared with the workspace). */
export const U = 10;

export interface FigureProps {
  /** Only the existing drawing geometry, never a grading rule or target. */
  radCase: Pick<RadCase, "detector" | "requiredAnatomy" | "requiredProjection"> & Partial<Pick<RadCase, "radiograph">>;
  settings: SimulationSettings;
  showGuides: boolean;
  /** Detector size in drawing units. */
  W: number;
  H: number;
}

export interface OrientationProps {
  W: number;
  showGuides: boolean;
  /** The selected projection, for the figures whose drawing follows it (RAD-072 1b, T1: the chest lateral exam). Others ignore it. */
  projection?: string;
}

export interface DetectorFigure {
  /** Full message path of the SVG's group label and of the midline guide label. */
  altKey: string;
  midlineKey: string;
  /** Text alternative of the drawing, built from the learner's own settings (`scene.alt*`). */
  alt: (ts: (key: string, values?: Record<string, string>) => string, settings: SimulationSettings) => string;
  /** The patient drawing, in detector space (never mirrored by RTL). */
  Drawing: ComponentType<FigureProps>;
  /** The side labels of the orientation row (Head / Feet are drawn by the workspace for every figure unless `axis` replaces them). */
  Orientation: ComponentType<OrientationProps>;
  /**
   * Optional (S14.1c): full message paths of the labels at the TOP and the BOTTOM of the detector view when "Head / Feet" is not the
   * patient's axis along it (a wrist: fingers toward the top, forearm toward the bottom). Absent = Head / Feet, as before.
   */
  axis?: { top: string; bottom: string };
  /**
   * Optional (S-VIS-1-1): draw the side marker as a small, crisp plate (one thin outline, no heavy stroke) so it does not read as a
   * doubled shadow on a small limb drawing. Visual only: the hit area, the position and the scoring are unchanged. Absent = the
   * shared marker of the chest scenes (byte-identical).
   */
  crispMarker?: boolean;
  /**
   * Optional (S-VIS-1-4): draw the midline and target-region guide labels small, in the free top margin band (right-aligned),
   * instead of inside the detector where they can sit on the anatomy, the crosshair or the field edge. Absent = the shared
   * placement of the chest scenes (byte-identical).
   */
  marginGuideLabels?: boolean;
}

const chinKey = (s: SimulationSettings) => (s.chinPosition === "tucked" ? "chinTucked" : "chinLifted");

// The chest drawings read the chin / shoulder cues, which every chest exam declares (S14.1b: optional in the settings for a
// limb exam); the ideal values below are only the type-level fallback and never apply to a chest exam.
function PaDrawing({ radCase, settings, H, W, showGuides, hands }: FigureProps & { hands?: "hips" }) {
  // Practice supplies the reference fit. Frame-only drawing callers retain their explicitly supplied frame.
  const a = radCase.radiograph ? fitAnatomyBox(radCase.radiograph, radCase.requiredAnatomy).landmarkCm : regionToRect(radCase.requiredAnatomy);
  const rv = rotationVisual(settings.rotationDeg);
  // A projection other than the PA drawn in the frontal figure keeps the narrowed thorax (as before the registry).
  const thoraxScale = settings.projection === "lateral-left" ? 0.45 : rv.thoraxScale;
  const lungY = a.y1 * U, lungH = (a.y2 - a.y1) * U, lungW = ((a.x2 - a.x1) * U) / 2 - 8;
  return <FrontalFigure W={W} H={H} thoraxScale={thoraxScale} rv={rv} lungY={lungY} lungH={lungH} lungW={lungW} scapula={scapulaOffset(settings.shoulderPosition ?? "rolled-forward")} chin={settings.chinPosition ?? "elevated"} showGuides={showGuides} hands={hands} />;
}

/** The erect PA chest: hands on the hips (RAD-072 part 3b). The AP and the chest lateral's frontal fallback keep `PaDrawing` (arms at the sides). */
const PaHipsDrawing = (props: FigureProps) => <PaDrawing {...props} hands="hips" />;

function PaOrientation({ W, showGuides }: OrientationProps) {
  const ts = useTranslations("scene");
  return (
    showGuides && (
      <>
        <SceneLabel x={-24} y={-22} size={LABEL_SIZE.detector}>{ts("patientRight")}</SceneLabel>
        <SceneLabel x={W + 22} y={-22} size={LABEL_SIZE.detector} anchor="end">{ts("patientLeft")}</SceneLabel>
      </>
    )
  );
}

function LateralDrawing(props: FigureProps) {
  const { radCase, settings, H, W, showGuides } = props;
  // RAD-072 1b (T1): a projection other than the lateral is drawn as the frontal figure, the same projection check the PA figure
  // already makes (it narrows its thorax for a lateral); the detector view then matches the plan view of the selected projection.
  if (settings.projection !== "lateral-left") return <PaDrawing {...props} />;
  // Practice supplies the reference fit. Frame-only drawing callers retain their explicitly supplied frame.
  const a = radCase.radiograph ? fitAnatomyBox(radCase.radiograph, radCase.requiredAnatomy).landmarkCm : regionToRect(radCase.requiredAnatomy);
  const lungY = a.y1 * U, lungH = (a.y2 - a.y1) * U;
  return (
    <LateralFigure
      W={W}
      H={H}
      region={{ x: a.x1 * U, y: lungY, w: (a.x2 - a.x1) * U, h: lungH }}
      rotationDeg={settings.rotationDeg}
      chin={settings.chinPosition ?? "elevated"}
      armsRaised={settings.choices?.arms === "raised"}
      showGuides={showGuides}
    />
  );
}

function LateralOrientation(props: OrientationProps) {
  const { W, projection } = props;
  const ts = useTranslations("scene");
  // RAD-072 1b (T1): the edge labels follow the figure drawn. A projection other than the lateral draws the frontal figure
  // (`LateralDrawing`), so it gets the frontal labels (patient's right / left, practice guides only, as in the PA exam).
  if (projection !== undefined && projection !== "lateral-left") return <PaOrientation {...props} />;
  return (
    <>
      <SceneLabel x={-24} y={-22} size={LABEL_SIZE.detector}>{ts("anterior")}</SceneLabel>
      <SceneLabel x={W + 22} y={-22} size={LABEL_SIZE.detector} anchor="end">{ts("posterior")}</SceneLabel>
    </>
  );
}

export const CHEST_PA_FIGURE: DetectorFigure = {
  altKey: "positioning.alt",
  midlineKey: "positioning.midline",
  alt: (ts, s) =>
    ts("altFrontal", { chin: ts(chinKey(s)), shoulders: ts(s.shoulderPosition === "rolled-forward" ? "shouldersRolled" : "shouldersRelaxed") }),
  Drawing: PaHipsDrawing,
  Orientation: PaOrientation,
};

/** The supine / semi-erect AP chest detector view: the PA frontal figure with the arms at the sides (Bontrager: arms away from the chest, along the body). */
export const CHEST_AP_FIGURE: DetectorFigure = { ...CHEST_PA_FIGURE, Drawing: PaDrawing };

export const CHEST_LATERAL_FIGURE: DetectorFigure = {
  altKey: "positioningLateral.alt",
  midlineKey: "positioningLateral.midline",
  alt: (ts, s) =>
    s.projection === "lateral-left"
      ? ts("altLateral", { arms: ts(s.choices?.arms === "raised" ? "armsRaised" : "armsLowered"), chin: ts(chinKey(s)) })
      : CHEST_PA_FIGURE.alt(ts, s),
  Drawing: LateralDrawing,
  Orientation: LateralOrientation,
};

function WristPaOrientation({ W, showGuides }: OrientationProps) {
  const ts = useTranslations("sceneWrist");
  return (
    showGuides && (
      <>
        <SceneLabel x={-24} y={-22} size={LABEL_SIZE.detector}>{ts("ulnarSide")}</SceneLabel>
        <SceneLabel x={W + 24} y={-22} size={LABEL_SIZE.detector} anchor="end">{ts("thumbSide")}</SceneLabel>
      </>
    )
  );
}

const NoOrientation = () => null;

const wristAlt = (ts: (key: string, values?: Record<string, string>) => string, s: SimulationSettings) =>
  ts(s.projection === "wrist-lateral" ? "altWristLateral" : "altWristPa", { deg: String(s.rotationDeg) });

export const WRIST_PA_FIGURE: DetectorFigure = {
  altKey: "positioningWrist.alt",
  midlineKey: "positioningWrist.midline",
  alt: wristAlt,
  Drawing: WristDrawing,
  Orientation: WristPaOrientation,
  axis: { top: "sceneWrist.fingers", bottom: "sceneWrist.forearm" },
  crispMarker: true,
  marginGuideLabels: true,
};

export const WRIST_LATERAL_FIGURE: DetectorFigure = {
  altKey: "positioningWrist.alt",
  midlineKey: "positioningWrist.midline",
  alt: wristAlt,
  Drawing: WristDrawing,
  Orientation: NoOrientation,
  axis: { top: "sceneWrist.fingers", bottom: "sceneWrist.forearm" },
  crispMarker: true,
  marginGuideLabels: true,
};

// Hand (S14.2b): the figure draws the left hand; the PA labels the ulnar and thumb sides (guides ON), the lateral labels nothing at the sides.
function HandPaOrientation({ W, showGuides }: OrientationProps) {
  const ts = useTranslations("sceneHand");
  return (
    showGuides && (
      <>
        <SceneLabel x={-24} y={-22} size={LABEL_SIZE.detector}>{ts("ulnarSide")}</SceneLabel>
        <SceneLabel x={W + 24} y={-22} size={LABEL_SIZE.detector} anchor="end">{ts("thumbSide")}</SceneLabel>
      </>
    )
  );
}

const handAlt = (ts: (key: string, values?: Record<string, string>) => string, s: SimulationSettings) =>
  ts(s.projection === "hand-lateral" ? "altHandLateral" : "altHandPa", { deg: String(s.rotationDeg) });

export const HAND_PA_FIGURE: DetectorFigure = {
  altKey: "positioningHand.alt",
  midlineKey: "positioningHand.midline",
  alt: handAlt,
  Drawing: HandDrawing,
  Orientation: HandPaOrientation,
  axis: { top: "sceneHand.fingers", bottom: "sceneHand.forearm" },
  crispMarker: true,
  marginGuideLabels: true,
};

export const HAND_LATERAL_FIGURE: DetectorFigure = {
  altKey: "positioningHand.alt",
  midlineKey: "positioningHand.midline",
  alt: handAlt,
  Drawing: HandDrawing,
  Orientation: NoOrientation,
  axis: { top: "sceneHand.fingers", bottom: "sceneHand.forearm" },
  crispMarker: true,
  marginGuideLabels: true,
};

// Elbow (S14.3): the figure draws the left elbow; the AP labels the medial and lateral sides (guides ON), the lateral labels the forearm side (guides ON).
function ElbowApOrientation({ W, showGuides }: OrientationProps) {
  const ts = useTranslations("sceneElbow");
  return (
    showGuides && (
      <>
        <SceneLabel x={-24} y={-22} size={LABEL_SIZE.detector}>{ts("medialSide")}</SceneLabel>
        <SceneLabel x={W + 24} y={-22} size={LABEL_SIZE.detector} anchor="end">{ts("lateralSide")}</SceneLabel>
      </>
    )
  );
}

function ElbowLateralOrientation({ showGuides }: OrientationProps) {
  const ts = useTranslations("sceneElbow");
  return (
    showGuides && (
      <>
        <SceneLabel x={-24} y={-22} size={LABEL_SIZE.detector}>{ts("forearmSide")}</SceneLabel>
      </>
    )
  );
}

const elbowAlt = (ts: (key: string, values?: Record<string, string>) => string, s: SimulationSettings) =>
  ts(s.projection === "elbow-lateral" ? "altElbowLateral" : "altElbowAp", { deg: String(s.rotationDeg) });

export const ELBOW_AP_FIGURE: DetectorFigure = {
  altKey: "positioningElbow.alt",
  midlineKey: "positioningElbow.midline",
  alt: elbowAlt,
  Drawing: ElbowDrawing,
  Orientation: ElbowApOrientation,
  axis: { top: "sceneElbow.upperArm", bottom: "sceneElbow.forearm" },
  crispMarker: true,
  marginGuideLabels: true,
};

export const ELBOW_LATERAL_FIGURE: DetectorFigure = {
  altKey: "positioningElbow.alt",
  midlineKey: "positioningElbow.midlineLateral",
  alt: elbowAlt,
  Drawing: ElbowDrawing,
  Orientation: ElbowLateralOrientation,
  axis: { top: "sceneElbow.upperArm", bottom: "sceneElbow.elbowPoint" },
  crispMarker: true,
  marginGuideLabels: true,
};

// Knee and foot (S14.4): the figure draws the RIGHT limb. Knee AP labels the lateral side (the fibula, the viewer's left) and the medial side; the knee lateral
// labels the front and the back of the knee; the foot labels the medial (big toe) and lateral sides (all guides ON).
function KneeApOrientation({ W, showGuides }: OrientationProps) {
  const ts = useTranslations("sceneKnee");
  return (
    showGuides && (
      <>
        <SceneLabel x={-24} y={-22} size={LABEL_SIZE.detector}>{ts("lateralSide")}</SceneLabel>
        <SceneLabel x={W + 24} y={-22} size={LABEL_SIZE.detector} anchor="end">{ts("medialSide")}</SceneLabel>
      </>
    )
  );
}

function KneeLateralOrientation({ W, showGuides }: OrientationProps) {
  const ts = useTranslations("sceneKnee");
  return (
    showGuides && (
      <>
        <SceneLabel x={-24} y={-22} size={LABEL_SIZE.detector}>{ts("front")}</SceneLabel>
        <SceneLabel x={W + 24} y={-22} size={LABEL_SIZE.detector} anchor="end">{ts("back")}</SceneLabel>
      </>
    )
  );
}

function FootOrientation({ W, showGuides }: OrientationProps) {
  const ts = useTranslations("sceneFoot");
  return (
    showGuides && (
      <>
        <SceneLabel x={-24} y={-22} size={LABEL_SIZE.detector}>{ts("medialSide")}</SceneLabel>
        <SceneLabel x={W + 24} y={-22} size={LABEL_SIZE.detector} anchor="end">{ts("lateralSide")}</SceneLabel>
      </>
    )
  );
}

const kneeAlt = (ts: (key: string, values?: Record<string, string>) => string, s: SimulationSettings) =>
  ts(s.projection === "knee-lateral" ? "altKneeLateral" : "altKneeAp", { deg: String(s.rotationDeg) });
const footAlt = (ts: (key: string, values?: Record<string, string>) => string, s: SimulationSettings) =>
  ts(s.projection === "foot-oblique" ? "altFootOblique" : "altFootAp", { deg: String(s.rotationDeg) });

export const KNEE_AP_FIGURE: DetectorFigure = {
  altKey: "positioningKnee.alt",
  midlineKey: "positioningKnee.midline",
  alt: kneeAlt,
  Drawing: LowerLimbDrawing,
  Orientation: KneeApOrientation,
  axis: { top: "sceneKnee.femur", bottom: "sceneKnee.tibia" },
  crispMarker: true,
  marginGuideLabels: true,
};

export const KNEE_LATERAL_FIGURE: DetectorFigure = {
  altKey: "positioningKnee.alt",
  midlineKey: "positioningKnee.midlineLateral",
  alt: kneeAlt,
  Drawing: LowerLimbDrawing,
  Orientation: KneeLateralOrientation,
  axis: { top: "sceneKnee.femur", bottom: "sceneKnee.tibia" },
  crispMarker: true,
  marginGuideLabels: true,
};

export const FOOT_AP_FIGURE: DetectorFigure = {
  altKey: "positioningFoot.alt",
  midlineKey: "positioningFoot.midline",
  alt: footAlt,
  Drawing: LowerLimbDrawing,
  Orientation: FootOrientation,
  axis: { top: "sceneFoot.toes", bottom: "sceneFoot.heel" },
  crispMarker: true,
  marginGuideLabels: true,
};

export const FOOT_OBLIQUE_FIGURE: DetectorFigure = { ...FOOT_AP_FIGURE };

// Ankle (S14.5): the figure draws the LEFT ankle (inferred, O76). AP labels the lateral side (the fibula, the viewer's RIGHT for a left ankle) and the medial side; the lateral
// labels the front of the foot (the viewer's left) and the back (the heel, the viewer's right) (all guides ON).
function AnkleApOrientation({ W, showGuides }: OrientationProps) {
  const ts = useTranslations("sceneAnkle");
  return (
    showGuides && (
      <>
        <SceneLabel x={-24} y={-22} size={LABEL_SIZE.detector}>{ts("medialSide")}</SceneLabel>
        <SceneLabel x={W + 24} y={-22} size={LABEL_SIZE.detector} anchor="end">{ts("lateralSide")}</SceneLabel>
      </>
    )
  );
}

function AnkleLateralOrientation({ W, showGuides }: OrientationProps) {
  const ts = useTranslations("sceneAnkle");
  return (
    showGuides && (
      <>
        <SceneLabel x={-24} y={-22} size={LABEL_SIZE.detector}>{ts("front")}</SceneLabel>
        <SceneLabel x={W + 24} y={-22} size={LABEL_SIZE.detector} anchor="end">{ts("back")}</SceneLabel>
      </>
    )
  );
}

const ankleAlt = (ts: (key: string, values?: Record<string, string>) => string, s: SimulationSettings) =>
  ts(s.projection === "ankle-lateral" ? "altAnkleLateral" : "altAnkleAp", { deg: String(s.rotationDeg) });

export const ANKLE_AP_FIGURE: DetectorFigure = {
  altKey: "positioningAnkle.alt",
  midlineKey: "positioningAnkle.midline",
  alt: ankleAlt,
  Drawing: LowerLimbDrawing,
  Orientation: AnkleApOrientation,
  axis: { top: "sceneAnkle.tibia", bottom: "sceneAnkle.foot" },
  crispMarker: true,
  marginGuideLabels: true,
};

export const ANKLE_LATERAL_FIGURE: DetectorFigure = {
  altKey: "positioningAnkle.alt",
  midlineKey: "positioningAnkle.midlineLateral",
  alt: ankleAlt,
  Drawing: LowerLimbDrawing,
  Orientation: AnkleLateralOrientation,
  axis: { top: "sceneAnkle.tibia", bottom: "sceneAnkle.foot" },
  crispMarker: true,
  marginGuideLabels: true,
};

/** The registry. The AP supine scene draws the PA frontal figure on the detector view (its own part is the side view). */
export const DETECTOR_FIGURES: Readonly<Record<string, DetectorFigure>> = {
  "chest-pa": CHEST_PA_FIGURE,
  "chest-ap-supine": CHEST_AP_FIGURE,
  "chest-lateral": CHEST_LATERAL_FIGURE,
  "wrist-pa": WRIST_PA_FIGURE,
  "wrist-lateral": WRIST_LATERAL_FIGURE,
  "hand-pa": HAND_PA_FIGURE,
  "hand-lateral": HAND_LATERAL_FIGURE,
  "elbow-ap": ELBOW_AP_FIGURE,
  "elbow-lateral": ELBOW_LATERAL_FIGURE,
  "foot-ap": FOOT_AP_FIGURE,
  "foot-oblique": FOOT_OBLIQUE_FIGURE,
  "knee-ap": KNEE_AP_FIGURE,
  "knee-lateral": KNEE_LATERAL_FIGURE,
  "ankle-ap": ANKLE_AP_FIGURE,
  "ankle-lateral": ANKLE_LATERAL_FIGURE,
};
