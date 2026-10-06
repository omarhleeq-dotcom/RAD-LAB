import { create } from "zustand";
import { getCase } from "@/data/cases";
import type { RadCase } from "@/domain/case";
import type { SettingKey, SimulationMode, SimulationPhase, SimulationSettings } from "@/domain/simulation";
import { evaluate } from "@/features/evaluation/engine";
import type { EvaluationResult } from "@/features/evaluation/types";

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
    const { settings, phase } = get();
    if (!settings || phase !== "setup") return;
    set({ settings: { ...settings, [key]: value } });
  },

  expose: () => {
    const { activeCase, settings, phase } = get();
    if (!activeCase || !settings || phase !== "setup") return;
    set({ phase: "result", result: evaluate(activeCase, settings) });
  },

  retry: () => set((s) => ({ phase: "setup", result: null, attempt: s.attempt + 1 })),

  reset: () => {
    const { activeCase } = get();
    if (!activeCase) return;
    set({ settings: { ...activeCase.initialSettings }, phase: "setup", result: null, attempt: 1 });
  },
}));
