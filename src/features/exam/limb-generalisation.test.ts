/**
 * S14.1b: a limb-shaped exam (no chin / shoulder cues, no breathing, no AEC, no lung landmarks) goes through the generalised
 * code. The exam and case are the TEST-ONLY synthetic fixture (`__fixtures__/synthetic-limb.ts`): not registered, not routed,
 * no medical content. The chest exams stay byte-identical (`qa/characterisation.test.ts`, `qa/scene-dom.test.ts`); this file
 * only ADDS coverage for the optional shapes.
 */
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "../../../messages/en.json";
import { CASES } from "@/data/cases";
import { EXAMS } from "@/data/exams";
import { isRegisteredBodyPart } from "@/data/modalities";
import { SCENE_IDS } from "@/domain/exam";
import type { SimulationSettings } from "@/domain/simulation";
import { evaluate } from "@/features/evaluation/engine";
import { derivePatientResponse } from "@/features/patient/response";
import { PatientInstructionsPanel } from "@/features/patient/PatientInstructionsPanel";
import { PositioningView } from "@/features/positioning/PositioningView";
import { CHEST_PA_LAYOUT } from "@/features/positioning/scene-layouts";
import { SCENES } from "@/features/positioning/scenes";
import { renderRadiograph, type LumaImage } from "@/features/radiograph/pipeline";
import { buildRenderPlan, EXTRA_EFFECTS, type EffectDefinition } from "@/features/radiograph/plan";
import { assessReadiness } from "@/features/technique/readiness";
import { computeDetectorExposure } from "@/features/technique/model";
import { evaluateAec } from "@/features/technique/aec";
import { composeCase } from "./compose";
import { syntheticLimbCase, syntheticLimbExam, syntheticRegistries } from "./__fixtures__/synthetic-limb";
import { PLATFORM_REGISTRIES, validateCase, validateExam } from "./validate";

/** A small deterministic source image (diagonal gradient with a bright bar), enough to exercise the pipeline. */
function syntheticLimbImage(): LumaImage {
  const width = 120, height = 160;
  const data = new Float32Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) data[y * width + x] = 40 + (x / width) * 60 + (x > 50 && x < 70 ? 90 : 0);
  return { width, height, data };
}

const limb = composeCase(syntheticLimbExam, syntheticLimbCase);
const initial = syntheticLimbCase.initialSettings;
const ok: SimulationSettings = { ...initial, rotationDeg: 0, centralRay: { x: 0, y: 0 }, collimation: { width: 1, height: 1 }, sideMarker: "L", markerPosition: { x: 0.8, y: -0.8 } };

describe("synthetic limb fixture: definitions", () => {
  it("validates with the fixture's own registries (no chin / shoulder / breathing / AEC / lung fields)", () => {
    expect(validateExam(syntheticLimbExam, syntheticRegistries)).toEqual([]);
    expect(validateCase(syntheticLimbExam, syntheticLimbCase)).toEqual([]);
  });

  it("is not part of the platform: the real registries reject its ids, and it is in no catalogue", () => {
    const problems = validateExam(syntheticLimbExam);
    expect(problems.some((p) => p.includes("synthetic-scene"))).toBe(true);
    expect(problems.some((p) => p.includes("synthetic-limb"))).toBe(true);
    expect(problems.some((p) => p.includes("synthetic-ap"))).toBe(true);
    expect(EXAMS.some((e) => e.id === syntheticLimbExam.id)).toBe(false);
    expect(CASES.some((c) => c.id.startsWith(syntheticLimbExam.id))).toBe(false);
    expect(isRegisteredBodyPart("synthetic-limb")).toBe(false);
  });

  it("composes without the chest-only keys", () => {
    expect(limb.bodyPart).toBe("synthetic-limb");
    expect("availableBreathing" in limb).toBe(false);
    expect("chinPosition" in limb.initialSettings).toBe(false);
    expect("shoulderPosition" in limb.initialSettings).toBe(false);
    expect("breathing" in limb.initialSettings).toBe(false);
    expect(limb.technique.aec).toBeUndefined();
    expect(limb.radiograph.lungApexV).toBeUndefined();
  });

  it("validateExam / validateCase flag the chest-only leftovers a limb must not carry", () => {
    const withBreathingWeight = { ...syntheticLimbExam, scoring: { ...syntheticLimbExam.scoring, categoryWeights: { positioning: 20, rotation: 25, centering: 15, exposure: 20, sid: 10, breathing: 10 } } };
    expect(validateExam(withBreathingWeight, syntheticRegistries).some((p) => p.includes("breathing"))).toBe(true);
    const breathingInitial = { ...syntheticLimbCase, initialSettings: { ...initial, breathing: "no-instruction" as const } };
    expect(validateCase(syntheticLimbExam, breathingInitial).some((p) => p.includes("breathing"))).toBe(true);
    const aecRule = { ...syntheticLimbExam, rules: [...syntheticLimbExam.rules, { ...syntheticLimbExam.rules.find((r) => r.id === "kvp")!, id: "aec-chambers", check: "aec-chambers" as const }] } as never;
    expect(validateExam(aecRule, syntheticRegistries).some((p) => p.includes("aec"))).toBe(true);
  });

  it("every registered exam names a registered body part and scene, and still validates with the platform registries", () => {
    for (const e of EXAMS) {
      expect(isRegisteredBodyPart(e.bodyPart), e.id).toBe(true);
      expect(PLATFORM_REGISTRIES.scene(e.scene.id), e.id).toBe(true);
      expect(validateExam(e), e.id).toEqual([]);
    }
  });

  it("the platform scene registries agree (the pure id list and the components)", () => {
    expect([...SCENE_IDS].sort()).toEqual(Object.keys(SCENES).sort());
    expect(PLATFORM_REGISTRIES.scene("chest-pa-frontal")).toBe(true);
  });
});

describe("synthetic limb fixture: engine", () => {
  const r = evaluate(limb, ok);

  it("scores without a breathing category, chin or shoulder check", () => {
    expect(r.score.categories.map((c) => c.category).sort()).toEqual(["centering", "exposure", "positioning", "rotation", "sid"]);
    expect(r.checks.some((c) => c.category === "breathing")).toBe(false);
    expect(Number.isFinite(r.score.total)).toBe(true);
  });

  it("the result state carries no chin / shoulders / breathing and the patient response is neutral", () => {
    const p = r.resultState.patient;
    expect("chin" in p || "shoulders" in p || "breathing" in p).toBe(false);
    expect(r.resultState.patientResponse.inspiration).toBe("adequate");
    expect("breathing" in r.resultState.patientResponse.instructions).toBe(false);
    expect(derivePatientResponse(limb.patientCooperation, { motionInstruction: "relax-and-move" })).toMatchObject({ inspiration: "adequate", motion: "motion" });
  });

  it("a deliberate error still scores lower (rotation 15°)", () => {
    expect(evaluate(limb, { ...ok, rotationDeg: 15 }).score.total).toBeLessThan(r.score.total);
  });

  it("manual-only protocol: no AEC outcome, an 'aec' setting is read as manual, readiness never asks for chambers", () => {
    expect(evaluateAec(limb.technique, ["left"], { x1: 0, y1: 0, x2: 18, y2: 24 }, limb.detector)).toEqual({ chambers: [], terminatedOnChambers: false, chamberRelativeExposure: null });
    const x = computeDetectorExposure(limb.technique, { ...ok, exposureMode: "aec", aecChambers: ["left"] }, limb.detector);
    expect(x.mode).toBe("manual");
    expect(x.aec).toBeNull();
    expect(x.deliveredMas).toBe(ok.mas);
    const ready = assessReadiness(limb, { ...ok, exposureMode: "aec" });
    expect(ready.items.some((i) => i.category === "aec")).toBe(false);
  });
});

describe("synthetic limb fixture: renderer", () => {
  const src = syntheticLimbImage();
  const draw = (patch: Partial<SimulationSettings> = {}, extra?: readonly EffectDefinition[]) => {
    const state = evaluate(limb, { ...ok, ...patch }).resultState;
    const plan = buildRenderPlan(state, limb, extra);
    return { plan, out: renderRadiograph(plan, limb.radiograph, src, 4) };
  };

  it("builds a plan and renders deterministically for an asset without lung / scapula / jaw / midline landmarks", () => {
    const a = draw({ mas: 0.5, rotationDeg: 10 }), b = draw({ mas: 0.5, rotationDeg: 10 });
    expect(a.out.width).toBe(72);
    expect(a.out.height).toBe(96);
    expect(Buffer.from(a.out.luma).equals(Buffer.from(b.out.luma))).toBe(true);
    expect(a.plan.representative).toBe(true);
    const ids = a.plan.effects.map((e) => e.id);
    for (const chestOnly of ["scapulae", "chin", "inspiration"]) expect(ids).not.toContain(chestOnly);
    expect(a.plan.positioning).toEqual({ scapulaeOverlap: false, jawOverlap: false });
    expect(a.plan.anatomy.inspiration).toBeNull();
  });

  it("a baseline without lung landmarks never builds the inspiration warp, even if a response said so", () => {
    const state = evaluate(limb, ok).resultState;
    const forced = { ...state, patientResponse: { ...state.patientResponse, inspiration: "reduced" as const } };
    expect(buildRenderPlan(forced, limb).anatomy.inspiration).toBeNull();
  });

  it("effect registry hook: nothing is registered today; a registered effect joins the plan and a fault drops the baseline card", () => {
    expect(EXTRA_EFFECTS).toHaveLength(0);
    expect(draw().plan.effects.map((e) => e.id)).toEqual(["baseline", "marker"]);
    const fault: EffectDefinition = {
      id: "synthetic-effect",
      drivers: ["geometry.rotationDeg"],
      concept: { status: "provisional", reference: "none" },
      magnitude: { kind: "none", note: "test" },
      changesPixels: false,
      fault: true,
      active: (s) => s.geometry.rotationDeg !== 0,
    };
    expect(draw({ rotationDeg: 0 }, [fault]).plan.effects.map((e) => e.id)).not.toContain("synthetic-effect");
    const withFault = draw({ rotationDeg: 6 }, [fault]).plan.effects.map((e) => e.id);
    expect(withFault).toContain("synthetic-effect");
    expect(withFault).not.toContain("baseline");
  });
});

describe("synthetic limb fixture: UI pieces that used to assume a chest", () => {
  const html = (settings: SimulationSettings, c = limb) =>
    renderToStaticMarkup(
      createElement(NextIntlClientProvider as ComponentType<Record<string, unknown>>, { locale: "en", messages: en, timeZone: "UTC" },
        createElement(PatientInstructionsPanel, { radCase: c, settings, onChange: () => {}, disabled: false })),
    );

  it("the patient-instructions panel shows no breathing control for an exam without one, but the keep-still control", () => {
    const out = html(ok);
    expect(out).not.toContain("breathing-instruction");
    expect(out).toContain("motion-instruction");
  });

  it("the chest exam still shows both controls", () => {
    const chest = CASES[0]!;
    const out = html(chest.initialSettings, chest as never);
    expect(out).toContain("breathing-instruction");
    expect(out).toContain("motion-instruction");
  });
});

describe("synthetic limb fixture: positioning view", () => {
  const view = (c: typeof limb, settings: SimulationSettings, layout = { ...CHEST_PA_LAYOUT, Cues: undefined }) =>
    renderToStaticMarkup(
      createElement(NextIntlClientProvider as ComponentType<Record<string, unknown>>, { locale: "en", messages: en, timeZone: "UTC" },
        createElement(PositioningView, { radCase: c, settings, mode: "practice", onChange: () => {}, disabled: false, layout })),
    );

  it("a layout without a cues panel renders for settings with no chin / shoulder values, and shows neither choice", () => {
    const out = view(limb, ok);
    expect(out).toContain("pos-heading");
    expect(out).not.toContain(`>${en.positioning.chinLegend}</legend>`);
    expect(out).not.toContain(`>${en.positioning.shoulderLegend}</legend>`);
  });

  it("the chest layout still shows both cue choices", () => {
    const chest = CASES[0]!;
    const out = view(chest as never, chest.initialSettings, CHEST_PA_LAYOUT as never);
    expect(out).toContain(`>${en.positioning.chinLegend}</legend>`);
    expect(out).toContain(`>${en.positioning.shoulderLegend}</legend>`);
  });
});
