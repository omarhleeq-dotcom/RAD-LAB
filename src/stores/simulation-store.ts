import { create } from "zustand";
import { getCase } from "@/data/cases";
import type { RadCase } from "@/domain/case";
import type { NumericSettingKey, SettingKey, SimulationMode, SimulationPhase, SimulationSettings } from "@/domain/simulation";
import { evaluate } from "@/features/evaluation/engine";
import type { EvaluationResult } from "@/features/evaluation/types";
import { assessReadiness } from "@/features/technique/readiness";
import { snapToControl } from "@/features/technique/stations";

interface SimulationState {
  activeCase: RadCase | null;
  mode: SimulationMode;
  phase: SimulationPhase;
  settings: SimulationSettings | null;
  result: EvaluationResult | null;
  attempt: number;

  loadCase: (caseId: string) => void;
  setSetting: <K extends SettingKey>(key: K, value: SimulationSettings[K]) => void;
  expose: () => void;
  /** Back to setup for another attempt, keeping the student's last settings so they can correct them. */
  retry: () => void;
  /** Back to setup with the case's initial settings. */
  reset: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  activeCase: null,
  // Only practice mode exists so far; the evaluation result is always fully shown.
  mode: "practice",
  phase: "setup",
  settings: null,
  result: null,
  attempt: 1,

  loadCase: (caseId) => {
    const c = getCase(caseId);
    if (!c) return;
    set({ activeCase: c, settings: { ...c.initialSettings }, phase: "setup", result: null, attempt: 1 });
  },

  setSetting: (key, value) => {
    const { activeCase, settings, phase } = get();
    // Controls are locked once the exposure is made, until Retry / Restart.
    if (!activeCase || !settings || phase !== "setup") return;
    // Numeric console values (kVp, mAs, SID, rotation) are always snapped to what the console can select.
    const spec = typeof value === "number" ? activeCase.controls[key as NumericSettingKey] : undefined;
    const next = spec && typeof value === "number" ? snapToControl(spec, value) : value;
    set({ settings: { ...settings, [key]: next } });
  },

  expose: () => {
    const { activeCase, settings, phase } = get();
    if (!activeCase || !settings || phase !== "setup") return;
    // Hard workflow blocks (e.g. AEC with no chamber) prevent the exposure; advisories do not.
    if (!assessReadiness(activeCase, settings, phase).canExpose) return;
    set({ phase: "result", result: evaluate(activeCase, settings) });
  },

  retry: () => set((s) => ({ phase: "setup", result: null, attempt: s.attempt + 1 })),

  reset: () => {
    const { activeCase } = get();
    if (!activeCase) return;
    set({ settings: { ...activeCase.initialSettings }, phase: "setup", result: null, attempt: 1 });
  },
}));
