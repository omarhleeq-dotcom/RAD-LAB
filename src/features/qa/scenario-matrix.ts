/**
 * Session 5 QA support (test-only; not imported by the app): the scenario matrix as data and the pure analysis that
 * puts the score, the feedback text and the rendered image side by side for each scenario.
 *
 * `scripts/qa/scenarios.json` is the single source of truth: this module reads it for the unit tests and the
 * Playwright runner (`scripts/qa/run-matrix.mjs`) reads the same file to drive the real UI.
 */
import scenarioFile from "../../../scripts/qa/scenarios.json";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { evaluate } from "@/features/evaluation/engine";
import type { EvaluationResult } from "@/features/evaluation/types";
import { checkIsDrawn, needsNotDrawnLabel } from "@/features/radiograph/consistency";
import { buildRenderPlan, type RenderPlan } from "@/features/radiograph/plan";
import { roundTo } from "@/features/simulation/coords";
import { snapToControl } from "@/features/technique/stations";

export interface UiSettings {
  projection: SimulationSettings["projection"];
  rotation: number;
  /** Central ray: lateral offset from the midline, cm. */
  cx: number;
  /** Central ray: distance from the top edge, cm. */
  cy: number;
  /** Field width / height, cm. */
  cw: number;
  ch: number;
  chin: SimulationSettings["chinPosition"];
  shoulders: SimulationSettings["shoulderPosition"];
  marker: "L" | "R" | null;
  /** "default": the marker stays where it first appears; "mirror": moved to the other half of the image. */
  markerPlacement: "default" | "mirror";
  sid: number;
  kvp: number;
  mas: number;
  mode: SimulationSettings["exposureMode"];
  chambers: SimulationSettings["aecChambers"];
  breathing: SimulationSettings["breathing"];
  motion: SimulationSettings["motionInstruction"];
}

export interface Scenario {
  id: string;
  group: "correct" | "single" | "combo";
  title: string;
  set: Partial<UiSettings>;
  /** Use the case's untouched initial settings instead of the UI settings. */
  fromInitial?: boolean;
}

export const UI_DEFAULTS = scenarioFile.defaults as UiSettings;
export const SCENARIOS = scenarioFile.scenarios as Scenario[];

/** What the UI would store after a learner applied these settings (same rounding / snapping as the controls). */
export function scenarioSettings(sc: Scenario, c: RadCase): SimulationSettings {
  if (sc.fromInitial) return { ...c.initialSettings };
  const u = { ...UI_DEFAULTS, ...sc.set };
  const { widthCm: W, heightCm: H } = c.detector;
  const side = u.marker;
  const def = side ? c.positioning.defaultMarkerPosition[side] : c.initialSettings.markerPosition;
  const markerPosition = u.markerPlacement === "mirror" ? { x: -def.x, y: def.y } : { ...def };
  return {
    ...c.initialSettings,
    projection: u.projection,
    rotationDeg: snapToControl(c.controls.rotationDeg, u.rotation),
    centralRay: { x: roundTo(u.cx / (W / 2)), y: roundTo((u.cy / H) * 2 - 1) },
    collimation: { width: roundTo(u.cw / W), height: roundTo(u.ch / H) },
    chinPosition: u.chin,
    shoulderPosition: u.shoulders,
    sideMarker: side,
    markerPosition,
    sidCm: snapToControl(c.controls.sidCm, u.sid),
    kvp: snapToControl(c.controls.kvp, u.kvp),
    mas: snapToControl(c.controls.mas, u.mas),
    exposureMode: u.mode,
    aecChambers: [...u.chambers],
    breathing: u.breathing,
    motionInstruction: u.motion,
  };
}

export interface ScenarioReport {
  id: string;
  result: EvaluationResult;
  plan: RenderPlan;
  /** Non-passing checks and whether the picture shows each. */
  findings: { ruleId: string; outcome: "partial" | "fail"; drawn: boolean; labelled: boolean }[];
  /** Effects the picture shows that stand for a scored finding. */
  effects: string[];
}

export function analyse(sc: Scenario, c: RadCase): ScenarioReport {
  const settings = scenarioSettings(sc, c);
  const result = evaluate(c, settings);
  const plan = buildRenderPlan(result.resultState, c);
  const findings = result.checks.flatMap((k) =>
    k.outcome === "pass"
      ? []
      : [{ ruleId: k.ruleId, outcome: k.outcome, drawn: checkIsDrawn(k.ruleId, k.outcome, plan), labelled: needsNotDrawnLabel(k.ruleId, k.outcome, plan) }],
  );
  return { id: sc.id, result, plan, findings, effects: plan.effects.map((e) => e.id) };
}
