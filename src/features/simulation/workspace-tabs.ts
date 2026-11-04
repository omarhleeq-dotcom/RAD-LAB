/**
 * Phone simulator steps (UI-3 F3/F4, RAD-101 D3): the four control groups in their order and which of them hold an unready
 * readiness item. Pure and React-free; the readiness itself stays a workflow check (`features/technique/readiness.ts`).
 */
import type { ExposureReadiness, ReadinessCategory } from "@/features/technique/readiness";

/** D3: 1 Position → 2 Detector → 3 Technique → 4 Patient instructions (given right before the exposure). */
export const WORKSPACE_TABS = ["positioning", "centring", "technique", "patient"] as const;
export type WorkspaceTab = (typeof WORKSPACE_TABS)[number];

/** The tab that holds the control a readiness category is about. `system` (exposure already made) belongs to none. */
const CATEGORY_TAB: Record<ReadinessCategory, WorkspaceTab | null> = {
  positioning: "positioning",
  patient: "patient",
  technique: "technique",
  aec: "technique",
  system: null,
};

/** Tabs that get the "not ready" dot (Practice: free navigation, the dot only points at the missing step). */
export function tabsNeedingAttention(readiness: ExposureReadiness): Set<WorkspaceTab> {
  const tabs = new Set<WorkspaceTab>();
  for (const item of readiness.items) {
    const tab = CATEGORY_TAB[item.category];
    if (tab) tabs.add(tab);
  }
  return tabs;
}

/** A step chip's state (D3): an unready item ("note") wins over "done" (opened before); otherwise "todo" (not started). */
export type StepState = "done" | "note" | "todo";
export function stepState(tab: WorkspaceTab, attention: ReadonlySet<WorkspaceTab>, visited: ReadonlySet<WorkspaceTab>): StepState {
  return attention.has(tab) ? "note" : visited.has(tab) ? "done" : "todo";
}

/** The step after `tab`, or null on the last one ("Next" in the bottom bar). */
export const followingTab = (tab: WorkspaceTab): WorkspaceTab | null => WORKSPACE_TABS[WORKSPACE_TABS.indexOf(tab) + 1] ?? null;

/** Arrow-key target in a horizontal tablist; ArrowRight moves backwards in RTL so it always follows the visual order. */
export function nextTab(current: WorkspaceTab, key: string, rtl: boolean): WorkspaceTab | null {
  const i = WORKSPACE_TABS.indexOf(current);
  const n = WORKSPACE_TABS.length;
  const forward = rtl ? "ArrowLeft" : "ArrowRight";
  const back = rtl ? "ArrowRight" : "ArrowLeft";
  if (key === forward) return WORKSPACE_TABS[(i + 1) % n]!;
  if (key === back) return WORKSPACE_TABS[(i - 1 + n) % n]!;
  if (key === "Home") return WORKSPACE_TABS[0];
  if (key === "End") return WORKSPACE_TABS[n - 1]!;
  return null;
}
