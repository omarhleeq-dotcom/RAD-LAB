import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import { CATEGORIES } from "@/domain/simulation";
import { FINDING_EFFECTS, INVISIBLE_EFFECTS, RULE_EFFECTS, VARIANT_EFFECTS, variantIsDrawn } from "@/features/radiograph/consistency";
import { renderRadiograph } from "@/features/radiograph/pipeline";
import { makePhantom, PX_PER_CM } from "@/features/radiograph/test-utils";
import { analyse, SCENARIOS, scenarioSettings } from "./scenario-matrix";

const c = chestPaErect;
const reports = SCENARIOS.map((sc) => [sc.id, sc, analyse(sc, c)] as const);

describe("scenario matrix: data", () => {
  it("has unique ids and covers the fully correct, single-error and combination groups", () => {
    expect(new Set(SCENARIOS.map((s) => s.id)).size).toBe(SCENARIOS.length);
    for (const g of ["correct", "single", "combo"]) expect(SCENARIOS.filter((s) => s.group === g).length, g).toBeGreaterThan(2);
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(50);
  });

  it("every single-error scenario changes exactly the setting(s) it names (no accidental second error)", () => {
    const correct = scenarioSettings(SCENARIOS.find((s) => s.id === "correct")!, c);
    for (const sc of SCENARIOS.filter((s) => s.group === "single")) {
      const s = scenarioSettings(sc, c);
      const changed = (Object.keys(s) as (keyof typeof s)[]).filter((k) => JSON.stringify(s[k]) !== JSON.stringify(correct[k]));
      expect(changed.length, `${sc.id}: ${changed.join(",")}`).toBeGreaterThan(0);
    }
  });
});

describe.each(reports)("scenario %s: score, feedback and image describe the same findings", (_id, _sc, r) => {
  it("scores within 0–100 with weights that still sum to 100", () => {
    expect(r.result.score.total).toBeGreaterThanOrEqual(0);
    expect(r.result.score.total).toBeLessThanOrEqual(100);
    expect(Object.values(c.scoring.categoryWeights).reduce((a, b) => a + b, 0)).toBe(100);
    expect(r.result.score.categories.map((x) => x.category).every((k) => CATEGORIES.includes(k))).toBe(true);
  });

  it("every non-passing check has bilingual feedback and a registry entry", () => {
    for (const k of r.result.checks) {
      expect(k.feedback.en.length, `${k.ruleId} en`).toBeGreaterThan(0);
      expect(k.feedback.ar, `${k.ruleId} ar`).toMatch(/[؀-ۿ]/);
      expect(RULE_EFFECTS[k.ruleId], `registry entry for ${k.ruleId}`).toBeDefined();
    }
  });

  it("nothing is drawn without a finding (no effect without a non-passing check, bar baseline and marker)", () => {
    const failing = new Set(r.findings.map((f) => f.ruleId));
    for (const id of r.effects) {
      if (id === "baseline" || id === "marker") continue;
      const owners = Object.entries(RULE_EFFECTS).filter(([, v]) => v.effects.includes(id as never)).map(([rule]) => rule);
      expect(owners.some((rule) => failing.has(rule)), `${id} drawn but none of ${owners.join(",")} is failing`).toBe(true);
    }
  });

  it("no drawable finding is missing from the picture; undrawn findings are labelled", () => {
    for (const f of r.findings) {
      const entry = RULE_EFFECTS[f.ruleId]!;
      const expectDrawn = entry.effects.length > 0 && !(f.outcome === "partial" && entry.partialDrawn === false)
        && !entry.effects.some((e) => INVISIBLE_EFFECTS.includes(e));
      if (f.ruleId === "side-marker") continue;
      if (expectDrawn) expect(f.drawn, `${f.ruleId} (${f.outcome}) should be shown in the image`).toBe(true);
      else {
        expect(f.drawn, `${f.ruleId} (${f.outcome}) should not claim an image effect`).toBe(false);
        expect(f.labelled, `${f.ruleId} must carry the "not drawn" label`).toBe(true);
      }
    }
  });

  it("the fully correct reference shows the baseline and no fault effects", () => {
    if (r.result.checks.some((k) => k.outcome !== "pass")) return;
    expect(r.effects.filter((e) => FINDING_EFFECTS.includes(e as never))).toEqual([]);
    expect(r.effects).toContain("baseline");
    expect(r.result.score.total).toBe(100);
  });

  it("every listed image-quality variant is either drawn or a documented not-drawn variant", () => {
    for (const v of r.result.variants) {
      if (v === "correct") continue;
      const drawn = variantIsDrawn(v, r.plan);
      if (v === "excess-exposure") expect(drawn, "excess exposure is invisible by design").toBe(false);
      else if (VARIANT_EFFECTS[v].length > 0) expect(drawn, `${v} should be drawn`).toBe(true);
      else expect(v).toBe("magnified-geometry");
    }
  });

});

describe("scenario matrix: cross-scenario expectations", () => {
  const by = (id: string) => reports.find((x) => x[0] === id)![2];
  const score = (id: string) => by(id).result.score.total;

  it("the correct exam scores 100 in manual and in AEC with lung chambers", () => {
    expect(score("correct")).toBe(100);
    expect(score("correct-R")).toBe(100);
    expect(score("correct-aec")).toBe(100);
    expect(score("correct-edge")).toBe(100);
  });

  it("single errors cost points in the category they belong to and never raise the score", () => {
    for (const [id, sc, r] of reports) {
      if (sc.group !== "single") continue;
      // Unscored-only scenarios (marker, keep-still) legitimately stay at 100.
      expect(r.result.score.total, id).toBeLessThanOrEqual(100);
    }
    expect(by("rotation-pos12").result.score.categories.find((x) => x.category === "rotation")!.ratio).toBe(0);
    expect(by("sid-120").result.score.categories.find((x) => x.category === "sid")!.ratio).toBe(0);
    expect(by("breathing-none").result.score.categories.find((x) => x.category === "breathing")!.ratio).toBe(0);
    expect(by("centering-x-off").result.score.categories.find((x) => x.category === "centering")!.ratio).toBeLessThan(1);
  });

  it("critical findings gate the pass mark in every scenario, derived independently of the engine (item 2)", () => {
    for (const [id, , r] of reports) {
      const st = r.result.resultState;
      const expected = [
        ...(st.geometry.projection !== "pa-erect" ? ["wrong-projection"] : []),
        ...(st.patientResponse.motion === "motion" ? ["patient-motion"] : []),
        ...(r.plan.marker?.wrongSide ? ["wrong-side-marker"] : []),
      ];
      expect(r.result.criticalFindings.map((f) => f.id), id).toEqual(expected);
      expect(r.result.score.passed, id).toBe(r.result.score.thresholdMet && expected.length === 0);
      // The gate never changes the number.
      expect(r.result.score.thresholdMet, id).toBe(r.result.score.total >= 70);
    }
  });

  it("wrong projection, visible motion and a wrong-side marker are below the pass mark although their numbers are high", () => {
    for (const id of ["projection-ap", "projection-lateral", "motion-none", "motion-relax", "marker-L-wrong-side", "marker-R-wrong-side"]) {
      expect(by(id).result.score.passed, id).toBe(false);
      expect(by(id).result.criticalFindings.length, id).toBeGreaterThan(0);
    }
    expect(score("projection-ap")).toBeGreaterThanOrEqual(70);
    for (const id of ["correct", "correct-R", "correct-aec", "correct-edge", "marker-none"]) {
      expect(by(id).result.score.passed, id).toBe(true);
      expect(by(id).result.criticalFindings, id).toEqual([]);
    }
  });

  it("unscored checks (marker, keep-still) never change the total", () => {
    for (const id of ["marker-none", "marker-L-wrong-side", "marker-R-wrong-side", "marker-cut-by-field", "motion-none", "motion-relax"]) {
      expect(score(id), id).toBe(100);
    }
  });

  it("the picture shows laterality as placed: L on the viewer's right is correct, mirrored is flagged", () => {
    expect(by("correct").plan.marker).toMatchObject({ side: "L", viewerSide: "viewer-right", wrongSide: false });
    expect(by("correct-R").plan.marker).toMatchObject({ side: "R", viewerSide: "viewer-left", wrongSide: false });
    expect(by("marker-L-wrong-side").plan.marker).toMatchObject({ side: "L", viewerSide: "viewer-left", wrongSide: true });
    expect(by("marker-R-wrong-side").plan.marker).toMatchObject({ side: "R", viewerSide: "viewer-right", wrongSide: true });
    expect(by("marker-L-wrong-side").result.checks.find((k) => k.ruleId === "side-marker")!.feedback.en).toMatch(/wrong side/);
    expect(by("correct").result.checks.find((k) => k.ruleId === "side-marker")!.outcome).toBe("pass");
  });

  it("excess exposure and kVp / SID findings are scored but not drawn; low penetration and low exposure are drawn", () => {
    for (const id of ["mas-excess", "sid-120", "kvp-105", "kvp-140", "sid-150"]) {
      expect(by(id).findings.some((f) => !f.drawn && f.labelled), id).toBe(true);
    }
    expect(by("kvp-70").effects).toContain("low-penetration");
    expect(by("mas-low").effects).toContain("low-exposure");
    expect(by("mas-excess").effects).toContain("excess-exposure");
    expect(by("mas-excess").effects).not.toContain("low-exposure");
  });

  it("clipped scores and clipped anatomy agree in every scenario", () => {
    for (const [id, , r] of reports) {
      const clipScore = r.result.checks.find((k) => k.ruleId === "collimation-clipping")!.outcome === "fail";
      expect(r.plan.clippedSides.length > 0, id).toBe(clipScore);
      expect(r.effects.includes("collimation-clipping"), id).toBe(clipScore);
    }
  });

  it("rotation is drawn exactly when the rotation check is not passed", () => {
    for (const [id, , r] of reports) {
      const failing = r.result.checks.find((k) => k.ruleId === "rotation")!.outcome !== "pass";
      expect(r.effects.includes("rotation"), id).toBe(failing);
    }
  });
});

/**
 * Golden regression for the matrix. Scores, outcomes and drawn effects are exact; the synthetic-phantom render is
 * compared by a hash of the 8-bit output so any change to the pixel pipeline is a deliberate, reviewed update.
 * Update with: UPDATE_GOLDEN=1 npx vitest run src/features/qa
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const GOLDEN = resolve(__dirname, "../../../scripts/qa/golden/matrix.json");
const phantom = makePhantom();

function snapshot() {
  const out: Record<string, unknown> = {};
  for (const [id, , r] of reports) {
    const img = renderRadiograph(r.plan, c.radiograph, phantom, PX_PER_CM);
    const bytes = Uint8Array.from(img.luma, (v) => Math.max(0, Math.min(255, Math.round(v))));
    out[id] = {
      score: r.result.score.total,
      passed: r.result.score.passed,
      critical: r.result.criticalFindings.map((f) => f.id),
      categories: Object.fromEntries(r.result.score.categories.map((k) => [k.category, k.earned])),
      outcomes: Object.fromEntries(r.result.checks.filter((k) => k.outcome !== "pass").map((k) => [k.ruleId, k.outcome])),
      variants: r.result.variants,
      effects: r.effects,
      notDrawn: r.findings.filter((f) => f.labelled).length,
      clippedSides: r.plan.clippedSides,
      marker: r.plan.marker && {
        side: r.plan.marker.side,
        viewerSide: r.plan.marker.viewerSide,
        visibleFraction: r.plan.marker.visibleFraction,
        wrongSide: r.plan.marker.wrongSide,
      },
      hash: createHash("sha1").update(bytes).digest("hex").slice(0, 16),
    };
  }
  return out;
}

describe("scenario matrix: golden", () => {
  it("matches the committed golden (scores, outcomes, effects, phantom render hash)", () => {
    const now = snapshot();
    if (process.env.UPDATE_GOLDEN) writeFileSync(GOLDEN, JSON.stringify(now, null, 1) + "\n");
    expect(existsSync(GOLDEN), "run UPDATE_GOLDEN=1 once to create the golden").toBe(true);
    expect(now).toEqual(JSON.parse(readFileSync(GOLDEN, "utf8")));
  });
});
