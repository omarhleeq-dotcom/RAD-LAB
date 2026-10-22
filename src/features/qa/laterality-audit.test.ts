/**
 * Session 5 laterality audit (PA display: patient's left = viewer's right). Cross-cutting checks that no layer
 * (case data, feedback text, scoring, geometry, renderer, UI language) disagrees about which side is which.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { chestPaErect as c } from "@/data/cases/chest-pa-erect";
import { evaluate } from "@/features/evaluation/engine";
import { buildRenderPlan } from "@/features/radiograph/plan";
import { viewerSideOf } from "@/features/simulation/geometry";
import { SCENARIOS, scenarioSettings } from "./scenario-matrix";
import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";

const root = resolve(__dirname, "../..");
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

describe("laterality audit", () => {
  it("one convention in case data: L on the viewer's right, R on the viewer's left, and the baseline agrees (heart / dense zone on the viewer's right)", () => {
    expect(c.positioning.markerSide).toEqual({ L: "viewer-right", R: "viewer-left" });
    expect(c.positioning.defaultMarkerPosition.L.x).toBeGreaterThan(0);
    expect(c.positioning.defaultMarkerPosition.R.x).toBeLessThan(0);
    expect(c.radiograph.denseZones![1]!.cu).toBeGreaterThan(c.radiograph.midlineU!);
    // The scapula schematic is symmetric about the midline, so it cannot imply a patient side.
    const { left, right } = c.radiograph.scapulae!;
    expect(Math.abs(left.cu + right.cu - 2 * c.radiograph.midlineU!)).toBeLessThan(0.05);
  });

  it("scoring, rendering and feedback agree on the marker side in every matrix scenario", () => {
    for (const sc of SCENARIOS) {
      const s = scenarioSettings(sc, c);
      if (!s.sideMarker) continue;
      const r = evaluate(c, s);
      const plan = buildRenderPlan(r.resultState, c);
      const expected = c.positioning.markerSide[s.sideMarker];
      const placed = viewerSideOf(s.markerPosition);
      const flagged = /wrong side of the image/.test(r.checks.find((k) => k.ruleId === "side-marker")!.feedback.en);
      expect(plan.marker!.viewerSide, sc.id).toBe(placed);
      expect(plan.marker!.wrongSide, sc.id).toBe(placed !== expected);
      expect(flagged, sc.id).toBe(placed !== expected);
    }
  });

  it("feedback never names a PATIENT side; left / right always mean the detector view or the viewer (EN + AR)", () => {
    for (const rule of c.rules) {
      for (const f of Object.values(rule.feedback)) {
        const text = (f as { en: string; ar: string });
        const en = text.en.toLowerCase();
        const mentions = [...en.matchAll(/\b(left|right)\b/g)];
        if (mentions.length === 0) continue;
        if (rule.id === "side-marker") continue; // explains the convention explicitly
        expect(en, rule.id).toMatch(/detector view|viewer/);
        expect(text.ar, rule.id).toMatch(/عرض الكاشف|المشاهد/);
        expect(en, rule.id).not.toMatch(/patient'?s? (left|right)/);
      }
    }
  });

  it("UI text states the convention (EN + AR) and no UI string says 'from the tube'", () => {
    expect(en.positioning.markerConvention).toMatch(/patient's left appears on the viewer's right/);
    expect(ar.positioning.markerConvention).toMatch(/يسار المريض على يمين المشاهد/);
    expect(JSON.stringify(en)).not.toMatch(/from the tube/i);
  });

  it("no source file branches on the UI locale or text direction when placing anatomy, markers or fields", () => {
    const guarded = ["features/radiograph", "features/simulation/geometry.ts", "features/simulation/coords.ts", "features/evaluation/engine.ts", "features/scoring"];
    for (const rel of guarded) {
      const files = statSync(join(root, rel)).isDirectory() ? walk(join(root, rel)) : [join(root, rel)];
      for (const f of files.filter((p) => /\.(ts|tsx)$/.test(p) && !/\.test\./.test(p))) {
        const src = readFileSync(f, "utf8");
        expect(src, f).not.toMatch(/\buseLocale\b|\bdir\s*===|\bisRtl\b|\bdirFor\b|getComputedStyle/);
      }
    }
  });

  it("the interactive workspace and the radiograph canvas are direction: ltr (anatomy is never mirrored by RTL)", () => {
    const ws = readFileSync(join(root, "features/positioning/DetectorWorkspace.tsx"), "utf8");
    const cv = readFileSync(join(root, "features/radiograph/RadiographCanvas.tsx"), "utf8");
    expect(ws).toMatch(/direction: "ltr"/);
    expect(cv).toMatch(/direction: "ltr"/);
  });
});
