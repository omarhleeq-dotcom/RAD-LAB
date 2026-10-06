/**
 * Session 11: the generic mechanisms (marker-rule kinds S11-1, tube angulation S11-2, extra enum controls,
 * per-exam categories, critical-finding detector registry, scene registry, optional landmark groups, per-projection
 * attenuation). They are exercised with a neutral TEST-ONLY fixture derived from Chest PA by adding the optional
 * fields. It is NOT Lateral / AP data: no medical value, rule or scoring here belongs to those exams (Sessions 12 / 13).
 * The other half of the proof — Chest PA unchanged — is the characterisation / golden tests, untouched.
 */
import { describe, expect, it } from "vitest";
import { chestPaAdultDemo, chestPaErect } from "@/data/cases/chest-pa-erect";
import { chestPaErectExam } from "@/data/exams/xray/chest-pa-erect";
import type { CheckRule, RadCase } from "@/domain/case";
import type { CaseDefinition, ExamDefinition } from "@/domain/exam";
import { CATEGORIES, numericSetting, type SimulationSettings } from "@/domain/simulation";
import { CRITICAL_DETECTORS } from "@/features/evaluation/critical";
import { evaluate } from "@/features/evaluation/engine";
import { unregisteredVariants } from "@/features/radiograph/consistency";
import { renderRadiograph } from "@/features/radiograph/pipeline";
import { buildRenderPlan } from "@/features/radiograph/plan";
import { makePhantom, PX_PER_CM, REFERENCE } from "@/features/radiograph/test-utils";
import { SCENES } from "@/features/positioning/scenes";
import { isMarkerWrongSide } from "@/features/simulation/marker-rule";
import { targetMas } from "@/features/technique/model";
import { composeCase } from "./compose";
import { validateCase, validateExam } from "./validate";

const t = (en: string) => ({ en, ar: `${en} (ar)` });
const fb = { pass: t("ok"), fail: t("bad") };
const ev = { status: "provisional", reference: "test fixture" } as const;

const sideControl = { id: "side", label: t("Side"), options: [{ id: "L", label: t("Left") }, { id: "R", label: t("Right") }] };
const extraRules: CheckRule[] = [
  { kind: "equals", id: "side-choice", category: "positioning", label: t("side"), feedback: fb, evidence: ev, setting: "choices.side", expected: "L" },
  { kind: "range", id: "angulation", category: "centering", label: t("angulation"), feedback: { ...fb, low: t("low"), high: t("high") }, evidence: ev, setting: "tubeAngulationDeg", ideal: [3, 7], acceptable: [0, 10], unit: "°" },
];

const fixtureExam: ExamDefinition = {
  ...chestPaErectExam,
  id: "fixture-mechanisms",
  controls: { ...chestPaErectExam.controls, tubeAngulationDeg: { min: -15, max: 15, step: 1 } },
  choiceControls: [sideControl],
  rules: [...chestPaErectExam.rules, ...extraRules],
  positioning: { ...chestPaErectExam.positioning, markerRule: { kind: "detector-side", choiceId: "side" } },
};
const fixtureCaseDef: CaseDefinition = {
  ...chestPaAdultDemo,
  examId: fixtureExam.id,
  initialSettings: { ...chestPaAdultDemo.initialSettings, tubeAngulationDeg: 0, choices: { side: "L" } },
};
const fixture: RadCase = composeCase(fixtureExam, fixtureCaseDef);
const withS = (patch: Partial<SimulationSettings>): SimulationSettings => ({ ...REFERENCE, ...patch });

describe("Chest PA declares none of the optional mechanisms (so its behaviour cannot change)", () => {
  it("no optional control, choice, marker rule, per-projection attenuation or optional setting", () => {
    expect(chestPaErectExam.controls.tubeAngulationDeg).toBeUndefined();
    expect(chestPaErectExam.choiceControls).toBeUndefined();
    expect(chestPaErectExam.positioning.markerRule).toBeUndefined();
    expect(chestPaAdultDemo.patientTechnique.attenuationByProjection).toBeUndefined();
    expect("tubeAngulationDeg" in chestPaAdultDemo.initialSettings).toBe(false);
    expect("choices" in chestPaAdultDemo.initialSettings).toBe(false);
    expect(Object.keys(chestPaErectExam.scoring.categoryWeights)).toEqual([...CATEGORIES]);
  });

  it("the PA result state carries no angulation or choices", () => {
    const r = evaluate(chestPaErect, REFERENCE);
    expect("tubeAngulationDeg" in r.resultState.geometry).toBe(false);
    expect("choices" in r.resultState.patient).toBe(false);
  });

  it("the default marker rule is the anatomical-side rule, identical to the viewer-half formula", () => {
    const pos = chestPaErect.positioning;
    for (const side of ["L", "R"] as const) {
      for (const x of [-0.8, -0.1, 0, 0.1, 0.8]) {
        const old = (x < 0 ? "viewer-left" : x > 0 ? "viewer-right" : null) !== pos.markerSide[side];
        expect(isMarkerWrongSide(pos, { side, position: { x, y: 0.5 } }, undefined)).toBe(old);
      }
    }
  });
});

describe("fixture exam / case validate with the new optional data", () => {
  it("is structurally valid", () => {
    expect(validateExam(fixtureExam)).toEqual([]);
    expect(validateCase(fixtureExam, fixtureCaseDef)).toEqual([]);
  });

  it("rejects undeclared references", () => {
    expect(validateExam({ ...fixtureExam, positioning: { ...fixtureExam.positioning, markerRule: { kind: "detector-side", choiceId: "nope" } } }).join()).toMatch(/not declared/);
    expect(validateExam({ ...fixtureExam, rules: [...chestPaErectExam.rules, { ...extraRules[0]!, expected: "X" } as CheckRule, extraRules[1]!] }).join()).toMatch(/not an option/);
    expect(validateExam({ ...fixtureExam, rules: [...chestPaErectExam.rules, { ...extraRules[0]!, setting: "choices.zzz" } as CheckRule, extraRules[1]!] }).join()).toMatch(/not a declared choice control/);
    expect(validateExam({ ...chestPaErectExam, rules: [...chestPaErectExam.rules, extraRules[1]!] }).join()).toMatch(/not a declared numeric control/);
    expect(validateExam({ ...fixtureExam, scoring: { ...fixtureExam.scoring, criticalFindings: [{ ...fixtureExam.scoring.criticalFindings[0]!, id: "unknown-finding" }] } }).join()).toMatch(/no detector is registered/);
    expect(validateCase(fixtureExam, { ...fixtureCaseDef, initialSettings: { ...fixtureCaseDef.initialSettings, choices: { side: "Q" } } }).join()).toMatch(/must be one of its options/);
    expect(validateCase(fixtureExam, { ...fixtureCaseDef, initialSettings: { ...fixtureCaseDef.initialSettings, tubeAngulationDeg: 99 } }).join()).toMatch(/outside the control range/);
    expect(validateCase(chestPaErectExam, { ...chestPaAdultDemo, initialSettings: { ...chestPaAdultDemo.initialSettings, tubeAngulationDeg: 0 } }).join()).toMatch(/exactly when the exam declares/);
  });

  it("a category outside the core six needs a bilingual label; with one the exam is valid", () => {
    const weights = { ...fixtureExam.scoring.categoryWeights, positioning: 15, arms: 10 };
    expect(validateExam({ ...fixtureExam, scoring: { ...fixtureExam.scoring, categoryWeights: weights } }).join()).toMatch(/needs a bilingual label/);
    expect(validateExam({ ...fixtureExam, scoring: { ...fixtureExam.scoring, categoryWeights: weights, categoryLabels: { arms: t("Arms") } } })).toEqual([]);
  });

  it("registries: PA names only registered variants; scene ids and registry agree", () => {
    expect(unregisteredVariants(chestPaErectExam)).toEqual([]);
    expect(unregisteredVariants({ rules: [], possibleErrors: [{ id: "x", variant: "never-registered", description: t("x") }] })).toEqual(["never-registered"]);
    expect(Object.keys(SCENES).sort()).toEqual(["chest-pa-frontal"]);
    expect(Object.keys(CRITICAL_DETECTORS).sort()).toEqual(["missing-marker", "patient-motion", "wrong-projection", "wrong-side-marker"]);
  });
});

describe("S11-1 detector-side marker rule", () => {
  const pos = fixtureExam.positioning;
  const right = { x: 0.6, y: 0.6 }; // viewer-right half = "L" in the display convention data
  it("letter must match the side against the detector (and sit on its display half)", () => {
    expect(isMarkerWrongSide(pos, { side: "L", position: right }, { side: "L" })).toBe(false);
    expect(isMarkerWrongSide(pos, { side: "L", position: right }, { side: "R" })).toBe(true); // wrong letter, right half
    expect(isMarkerWrongSide(pos, { side: "R", position: { x: -0.6, y: 0.6 } }, { side: "R" })).toBe(false);
    expect(isMarkerWrongSide(pos, { side: "L", position: { x: -0.6, y: 0.6 } }, { side: "L" })).toBe(true); // right letter, wrong half
  });
  it("score, critical finding, result state and render plan agree", () => {
    for (const [letter, choice, wrong] of [["L", "L", false], ["L", "R", true], ["R", "R", false]] as const) {
      const s = withS({ choices: { side: choice }, tubeAngulationDeg: 5, sideMarker: letter, markerPosition: { ...fixture.positioning.defaultMarkerPosition[letter] } }); // the letter's own lateral margin: no overlap / field issue
      const r = evaluate(fixture, s);
      const marker = r.checks.find((k) => k.ruleId === "side-marker")!;
      expect(marker.outcome === "partial", `${letter}/${choice}`).toBe(wrong);
      expect(r.criticalFindings.some((f) => f.id === "wrong-side-marker"), `${letter}/${choice}`).toBe(wrong);
      expect(buildRenderPlan(r.resultState, fixture).marker!.wrongSide, `${letter}/${choice}`).toBe(wrong);
    }
  });
});

describe("S11-2 tube angulation and extra enum controls", () => {
  it("an undeclared angulation reads 0", () => {
    expect(numericSetting(REFERENCE, "tubeAngulationDeg")).toBe(0);
  });
  it("scored by a range rule, carried in the result state", () => {
    const at = (a: number) => evaluate(fixture, withS({ choices: { side: "L" }, tubeAngulationDeg: a }));
    expect(at(5).checks.find((k) => k.ruleId === "angulation")!.outcome).toBe("pass");
    expect(at(9).checks.find((k) => k.ruleId === "angulation")!.outcome).toBe("partial");
    expect(at(-3).checks.find((k) => k.ruleId === "angulation")!.outcome).toBe("fail");
    expect(at(5).resultState.geometry.tubeAngulationDeg).toBe(5);
  });
  it("a choice control is scored with equals and reported as a choice", () => {
    const ok = evaluate(fixture, withS({ choices: { side: "L" }, tubeAngulationDeg: 5 })).checks.find((k) => k.ruleId === "side-choice")!;
    const bad = evaluate(fixture, withS({ choices: { side: "R" }, tubeAngulationDeg: 5 })).checks.find((k) => k.ruleId === "side-choice")!;
    expect([ok.outcome, bad.outcome]).toEqual(["pass", "fail"]);
    expect(bad.observedChoice).toBe("side");
    expect(bad.observedKind).toBeUndefined();
  });
});

describe("per-exam categories", () => {
  it("score categories follow the keys / order of categoryWeights, not a fixed list", () => {
    const weights = { arms: 40, positioning: 60 };
    const rules = [
      { ...extraRules[0]!, id: "arm-rule", category: "arms" } as CheckRule,
      { ...extraRules[0]!, id: "pos-rule" } as CheckRule,
    ];
    const exam: ExamDefinition = { ...fixtureExam, rules, scoring: { ...fixtureExam.scoring, categoryWeights: weights, categoryLabels: { arms: t("Arms") } } };
    expect(validateExam(exam)).toEqual([]);
    const r = evaluate(composeCase(exam, { ...fixtureCaseDef, examId: exam.id }), withS({ choices: { side: "L" }, tubeAngulationDeg: 5 }));
    expect(r.score.categories.map((c) => c.category)).toEqual(["arms", "positioning"]);
    expect(r.score.total).toBe(100);
  });
});

describe("per-projection attenuation", () => {
  const p = chestPaErect.technique;
  const heavy = { ...p, patient: { ...p.patient, attenuationByProjection: { "lateral-left": 2 } as const } };
  it("falls back to the scalar for a projection without its own value (PA unchanged)", () => {
    expect(targetMas(heavy, { kvp: 120, sidCm: 180, projection: "pa-erect" })).toBe(targetMas(p, { kvp: 120, sidCm: 180 }));
    expect(targetMas(p, { kvp: 120, sidCm: 180, projection: "lateral-left" })).toBe(targetMas(p, { kvp: 120, sidCm: 180 }));
  });
  it("uses the per-projection value when present", () => {
    expect(targetMas(heavy, { kvp: 120, sidCm: 180, projection: "lateral-left" })).toBeCloseTo(2 * targetMas(p, { kvp: 120, sidCm: 180 }), 10);
  });
});

describe("optional landmark groups", () => {
  it("an asset without scapulae / jaw / dense zones / midline still renders every PA effect without throwing", () => {
    const spec = { ...chestPaErect.radiograph, scapulae: undefined, jaw: undefined, denseZones: undefined, midlineU: undefined };
    const bare: RadCase = { ...chestPaErect, radiograph: spec };
    const r = evaluate(bare, withS({ rotationDeg: 10, chinPosition: "tucked", shoulderPosition: "relaxed", kvp: 60, mas: 1, motionInstruction: "none", breathing: "no-instruction" }));
    const plan = buildRenderPlan(r.resultState, bare);
    expect(plan.positioning).toEqual({ scapulaeOverlap: false, jawOverlap: false });
    const out = renderRadiograph(plan, spec, makePhantom(), PX_PER_CM);
    expect(out.luma.length).toBeGreaterThan(0);
  });
});
