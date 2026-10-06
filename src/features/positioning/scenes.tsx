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
import { PositioningView as ChestPaFrontalScene } from "./PositioningView";

export interface SceneProps {
  radCase: RadCase;
  settings: SimulationSettings;
  mode: SimulationMode;
  onChange: <K extends keyof SimulationSettings>(key: K, value: SimulationSettings[K]) => void;
  disabled: boolean;
}

export const SCENES: Record<SceneId, ComponentType<SceneProps>> = {
  "chest-pa-frontal": ChestPaFrontalScene,
};

/** The scene an (composed) case draws: its exam's `scene.id`. The exam id is the part of the public case id before "/". */
export const sceneIdOf = (radCase: RadCase): SceneId | undefined => getExam(radCase.id.split("/")[0]!)?.scene.id;

export function PositioningScene(props: SceneProps) {
  const id = sceneIdOf(props.radCase);
  const Scene = id ? SCENES[id] : undefined;
  return Scene ? <Scene {...props} /> : null;
}
