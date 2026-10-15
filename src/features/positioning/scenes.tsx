"use client";

/**
 * Positioning-scene registry (S11). `ExamDefinition.scene.id` names a hand-drawn scene; this is the one place that
 * resolves it, so a new exam adds a scene here instead of a page or a branch in a component (CLAUDE.md rule 2).
 * Fully generated (SceneSpec-driven) art stays deferred (Needs summary §2): scenes are still hand-drawn components.
 */
import type { ComponentType } from "react";
import { getExam } from "@/data/exams";
import type { RadCase } from "@/domain/case";
import type { SceneId } from "@/domain/exam";
import type { SimulationMode, SimulationSettings } from "@/domain/simulation";
import { PelvisScene } from "./PelvisScene";
import { PositioningView } from "./PositioningView";
import { ANKLE_AP_LAYOUT, ANKLE_LATERAL_LAYOUT, CHEST_AP_SUPINE_LAYOUT, CHEST_LATERAL_LAYOUT, CHEST_PA_LAYOUT, ELBOW_AP_LAYOUT, ELBOW_LATERAL_LAYOUT, HAND_LATERAL_LAYOUT, HAND_PA_LAYOUT, WRIST_LATERAL_LAYOUT, WRIST_PA_LAYOUT, FOOT_AP_LAYOUT, FOOT_OBLIQUE_LAYOUT, KNEE_AP_LAYOUT, KNEE_LATERAL_LAYOUT, type SceneLayout } from "./scene-layouts";

export interface SceneProps {
  radCase: RadCase;
  settings: SimulationSettings;
  mode: SimulationMode;
  onChange: <K extends keyof SimulationSettings>(key: K, value: SimulationSettings[K]) => void;
  disabled: boolean;
}

/**
 * A scene built on the shared interactive positioning view: the exam's `SceneLayout` (S14-0, `scene-layouts.tsx`) names its
 * detector figure, second view, cues panel and texts. An exam whose scene is not a variation of it registers its own
 * component in `SCENES` instead.
 */
const layoutScene = (layout: SceneLayout) => {
  const Scene = (props: SceneProps) => <PositioningView {...props} layout={layout} />;
  return Scene;
};

/** Chest PA (frontal view + plan view), Chest Lateral (S12: lateral figure) and Chest AP supine (S13: side view of the supine patient and the tube angle). */
export const SCENES: Record<SceneId, ComponentType<SceneProps>> = {
  "pelvis-ap-supine": PelvisScene,
  "chest-pa-frontal": layoutScene(CHEST_PA_LAYOUT),
  "chest-lateral": layoutScene(CHEST_LATERAL_LAYOUT),
  "chest-ap-supine": layoutScene(CHEST_AP_SUPINE_LAYOUT),
  "wrist-pa": layoutScene(WRIST_PA_LAYOUT),
  "wrist-lateral": layoutScene(WRIST_LATERAL_LAYOUT),
  "hand-pa": layoutScene(HAND_PA_LAYOUT),
  "hand-lateral": layoutScene(HAND_LATERAL_LAYOUT),
  "elbow-ap": layoutScene(ELBOW_AP_LAYOUT),
  "elbow-lateral": layoutScene(ELBOW_LATERAL_LAYOUT),
  "foot-ap": layoutScene(FOOT_AP_LAYOUT),
  "foot-oblique": layoutScene(FOOT_OBLIQUE_LAYOUT),
  "knee-ap": layoutScene(KNEE_AP_LAYOUT),
  "knee-lateral": layoutScene(KNEE_LATERAL_LAYOUT),
  "ankle-ap": layoutScene(ANKLE_AP_LAYOUT),
  "ankle-lateral": layoutScene(ANKLE_LATERAL_LAYOUT),
};

/** The scene an (composed) case draws: its exam's `scene.id`. The exam id is the part of the public case id before "/". */
export const sceneIdOf = (radCase: RadCase): SceneId | undefined => getExam(radCase.id.split("/")[0]!)?.scene.id;

export function PositioningScene(props: SceneProps) {
  const id = sceneIdOf(props.radCase);
  const Scene = id ? SCENES[id] : undefined;
  return Scene ? <Scene {...props} /> : null;
}
