/**
 * Pure description of what a rendered radiograph shows, for its text alternative (EN + AR via messages).
 * Derived from the render plan only — never from pixels — so the alt text, the effect cards, the feedback and the
 * score all describe the same findings. Left/right here are the VIEWER's left/right of the displayed image.
 */
import type { EffectId, RenderPlan } from "./plan";

export type AltSide = "top" | "bottom" | "left" | "right";

export interface AltDescription {
  /** Visible effects in plan order (baseline / marker / centering-only effects are described separately or not at all). */
  findings: Exclude<EffectId, "baseline" | "marker">[];
  clippedSides: AltSide[];
  /** No simulated fault is visible: the reference appearance. */
  reference: boolean;
  marker:
    | { kind: "none" }
    | { kind: "hidden"; side: "L" | "R" }
    | { kind: "placed"; side: "L" | "R"; viewerSide: "left" | "right" | "midline"; wrongSide: boolean; partlyCut: boolean };
}

export function describeRadiograph(plan: RenderPlan): AltDescription {
  const findings = plan.effects.map((e) => e.id).filter((id): id is AltDescription["findings"][number] => id !== "baseline" && id !== "marker");
  const m = plan.marker;
  const marker: AltDescription["marker"] = !m
    ? { kind: "none" }
    : m.visibleFraction <= 0
      ? { kind: "hidden", side: m.side }
      : {
          kind: "placed",
          side: m.side,
          viewerSide: m.viewerSide === "viewer-left" ? "left" : m.viewerSide === "viewer-right" ? "right" : "midline",
          wrongSide: m.wrongSide,
          partlyCut: m.visibleFraction < 1,
        };
  return { findings, clippedSides: [...plan.clippedSides], reference: plan.effects.some((e) => e.id === "baseline"), marker };
}
