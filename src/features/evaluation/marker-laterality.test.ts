import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import type { SideMarkerId, SimulationSettings } from "@/domain/simulation";
import { buildRenderPlan } from "@/features/radiograph/plan";
import { viewerSideOf } from "@/features/simulation/geometry";
import { evaluate } from "./engine";

/**
 * Laterality convention shared by marker scoring AND rendering: PA display, patient left = viewer right.
 * L belongs on the viewer's right half of the image (the cardiac side in the baseline), R on the viewer's left.
 * x < 0 is always the viewer's left, whatever the UI language / direction.
 */
const base: SimulationSettings = {
  ...chestPaErect.initialSettings,
  projection: "pa-erect",
  centralRay: { x: 0, y: -0.14 },
  collimation: { width: 0.94, height: 0.84 },
};
const pos = chestPaErect.positioning;
const run = (side: SideMarkerId | null, x: number, patch: Partial<SimulationSettings> = {}) =>
  evaluate(chestPaErect, { ...base, sideMarker: side, markerPosition: { x, y: -0.44 }, ...patch });
const marker = (r: ReturnType<typeof run>) => r.checks.find((c) => c.ruleId === "side-marker")!;

describe("marker laterality convention (single source of truth in case data)", () => {
  it("L belongs on the viewer's right, R on the viewer's left", () => {
    expect(pos.markerSide).toEqual({ L: "viewer-right", R: "viewer-left" });
  });

  it("the convention agrees with the baseline image: L is on the same side as the cardiac silhouette", () => {
    const spec = chestPaErect.radiograph;
    const heart = spec.denseZones![1]!; // heart + retrocardiac zone
    expect(heart.cu).toBeGreaterThan(spec.midlineU!); // heart on the viewer's right = patient's left
    expect(pos.markerSide.L).toBe("viewer-right");
  });

  it("each marker's default position lies on its own side", () => {
    expect(viewerSideOf(pos.defaultMarkerPosition.L)).toBe(pos.markerSide.L);
    expect(viewerSideOf(pos.defaultMarkerPosition.R)).toBe(pos.markerSide.R);
    expect(pos.defaultMarkerPosition.L.x).toBeGreaterThan(0);
    expect(pos.defaultMarkerPosition.R.x).toBeLessThan(0);
  });

  it("viewerSideOf follows x only (never mirrored); the midline belongs to neither side", () => {
    expect(viewerSideOf({ x: -0.5, y: 0 })).toBe("viewer-left");
    expect(viewerSideOf({ x: 0.5, y: 0 })).toBe("viewer-right");
    expect(viewerSideOf({ x: 0, y: 0 })).toBeNull();
  });
});

describe("marker scoring: correct side passes, wrong side is flagged", () => {
  it("L on the viewer's right and R on the viewer's left pass", () => {
    expect(marker(run("L", 0.84)).outcome).toBe("pass");
    expect(marker(run("R", -0.84)).outcome).toBe("pass");
  });

  it("the default placement of each marker passes", () => {
    for (const side of ["L", "R"] as const) {
      expect(marker(run(side, pos.defaultMarkerPosition[side].x)).outcome, side).toBe("pass");
    }
  });

  it("L on the viewer's left (patient's right) and R on the viewer's right are flagged as the wrong side", () => {
    for (const [side, x] of [["L", -0.84], ["R", 0.84]] as const) {
      const c = marker(run(side, x));
      expect(c.outcome, side).toBe("partial");
      expect(c.feedback.en, side).toMatch(/wrong side of the image/);
      expect(c.feedback.en, side).toMatch(/patient's left appears on the viewer's right/);
      expect(c.feedback.ar, side).toMatch(/[؀-ۿ]/);
      expect(c.feedback.ar, side).toMatch(/الجانب الخطأ/);
      // S3 option D: still a wrong-side finding, but the text says the letter sits over the other side's anatomy.
      expect(c.feedback.en, side).toMatch(/over the anatomy of the opposite side, even if the letter itself is the correct one/);
      expect(c.feedback.ar, side).toMatch(/فوق تشريح الجانب المقابل/);
    }
  });

  it("a marker exactly on the midline is not on either side, so it is flagged too", () => {
    expect(marker(run("L", 0)).feedback.en).toMatch(/wrong side/);
  });

  it("wrong side is never hidden by another remark: both are reported", () => {
    const c = marker(run("L", -0.84, { collimation: { width: 0.5, height: 0.84 } })); // also outside the field
    expect(c.outcome).toBe("partial");
    expect(c.feedback.en).toMatch(/wrong side/);
    expect(c.feedback.en).toMatch(/outside the collimated field/);
  });

  it("no marker placed is still a failed (unscored) check", () => {
    expect(marker(run(null, 0.84)).outcome).toBe("fail");
  });

  it("stays unscored: weight 0, so no marker side can change the score", () => {
    const ok = run("L", 0.84), wrong = run("L", -0.84), none = run(null, 0.84);
    expect(marker(wrong).scored).toBe(false);
    expect(marker(wrong).weight).toBe(0);
    expect(wrong.score).toEqual(ok.score);
    expect(none.score).toEqual(ok.score);
    expect(chestPaErect.scoring.categoryWeights).toEqual({ positioning: 25, rotation: 20, centering: 15, exposure: 20, sid: 10, breathing: 10 });
  });

  it("the verdict is language-independent: EN and AR text come from the same check", () => {
    const a = run("L", -0.84), b = run("L", -0.84);
    expect(marker(a)).toEqual(marker(b));
    expect(Object.keys(marker(a).feedback).sort()).toEqual(["ar", "en"]);
    expect(marker(a).feedback.ar).not.toBe(marker(a).feedback.en);
  });
});

describe("marker rendering uses the same convention and never corrects or mirrors the learner's marker", () => {
  const planOf = (side: SideMarkerId, x: number) => buildRenderPlan(run(side, x).resultState, chestPaErect);

  it("a correct-side L is drawn on the viewer's right half, R on the left half", () => {
    const l = planOf("L", 0.84).marker!, r = planOf("R", -0.84).marker!;
    expect(l.centerCm.x).toBeGreaterThan(chestPaErect.detector.widthCm / 2);
    expect(r.centerCm.x).toBeLessThan(chestPaErect.detector.widthCm / 2);
    expect(l.viewerSide).toBe("viewer-right");
    expect(r.viewerSide).toBe("viewer-left");
    expect(l.wrongSide || r.wrongSide).toBe(false);
  });

  it("a wrong-side marker is still drawn exactly where it was placed (and reported as wrong), never moved or mirrored", () => {
    const m = planOf("L", -0.84).marker!;
    expect(m.side).toBe("L");
    expect(m.centerCm.x).toBeCloseTo(((-0.84 + 1) / 2) * chestPaErect.detector.widthCm, 9);
    expect(m.viewerSide).toBe("viewer-left");
    expect(m.expectedViewerSide).toBe("viewer-right");
    expect(m.wrongSide).toBe(true);
  });

  it("rendering and scoring agree about every position: wrongSide ⇔ the check flags it", () => {
    for (const side of ["L", "R"] as const) for (const x of [-0.9, -0.5, -0.05, 0, 0.05, 0.5, 0.9]) {
      const flagged = /wrong side/.test(marker(run(side, x)).feedback.en);
      expect(planOf(side, x).marker!.wrongSide, `${side} ${x}`).toBe(flagged);
    }
  });

  it("neither scoring, geometry nor the renderer knows about UI language or direction", () => {
    const root = path.resolve(import.meta.dirname, "..");
    for (const f of ["evaluation/engine.ts", "simulation/geometry.ts", "radiograph/plan.ts", "radiograph/pipeline.ts"]) {
      const code = readFileSync(path.join(root, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
      expect(code, f).not.toMatch(/useLocale|useTranslations|next-intl|getLocale|\brtl\b|\bdir=|["']ltr["']/i);
    }
  });
});
