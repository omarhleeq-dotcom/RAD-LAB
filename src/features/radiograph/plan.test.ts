import { describe, expect, it } from "vitest";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import type { SimulationSettings } from "@/domain/simulation";
import { evaluate } from "@/features/evaluation/engine";
import { buildRenderPlan, markerVisibleFraction, noiseSeedFor } from "./plan";
import { EFFECT_CONCEPTS, EFFECT_MAGNITUDES } from "./plan";
import { plan } from "./test-utils";

const ids = (p: ReturnType<typeof plan>) => p.effects.map((e) => e.id);

describe("render plan from RadiographResultState", () => {
  it("correct baseline: reference appearance, no simulated faults", () => {
    const p = plan({ collimation: { width: 0.94, height: 0.84 } });
    expect(ids(p)).toEqual(["baseline", "marker"]);
    expect(p.representative).toBe(true);
    expect(p.anatomy.rotation).toBeNull();
    expect(p.anatomy.inspiration).toBeNull();
    expect(p.motion).toBeNull();
    expect(p.positioning).toEqual({ scapulaeOverlap: false, jawOverlap: false });
    expect(p.technique).toMatchObject({ noiseSigma: 0, detailGain: 1, penetrationContrastKept: null });
  });

  it("maps the baseline's anatomy box onto the required-anatomy region (so field cuts and drawn anatomy agree)", () => {
    const p = plan();
    const b = chestPaErect.radiograph.anatomyBox, r = chestPaErect.requiredAnatomy;
    expect(p.image.x1 + b.u1 * p.image.widthCm).toBeCloseTo(r.xCm, 6);
    expect(p.image.x1 + b.u2 * p.image.widthCm).toBeCloseTo(r.xCm + r.widthCm, 6);
    expect(p.image.y1 + b.v1 * p.image.heightCm).toBeCloseTo(r.yCm, 6);
    expect(p.image.y1 + b.v2 * p.image.heightCm).toBeCloseTo(r.yCm + r.heightCm, 6);
  });

  it("Session 5: the mapping is aspect-preserving (no anisotropic distortion of anatomical proportions)", () => {
    const p = plan();
    const spec = chestPaErect.radiograph;
    const sx = p.image.widthCm / spec.widthPx, sy = p.image.heightCm / spec.heightPx;
    expect(Math.abs(sx / sy - 1), `x/y scale ratio ${sx / sy}`).toBeLessThan(0.005);
    // Cardiothoracic-style proportion of the drawn lung box equals that of the source box.
    const b = spec.anatomyBox;
    const drawn = ((b.u2 - b.u1) * p.image.widthCm) / ((b.v2 - b.v1) * p.image.heightCm);
    const source = ((b.u2 - b.u1) * spec.widthPx) / ((b.v2 - b.v1) * spec.heightPx);
    expect(Math.abs(drawn / source - 1)).toBeLessThan(0.005);
  });

  it("Session 5: the image covers the detector from its top edge (no hatch sliver above the anatomy)", () => {
    expect(plan().image.y1).toBeLessThanOrEqual(0.05);
  });

  it("Session 5: rotation inside the full-credit band is drawn symmetric; outside it is drawn (picture agrees with the score)", () => {
    for (const deg of [-2, -1, 1, 2]) {
      expect(plan({ rotationDeg: deg }).anatomy.rotation, `${deg}°`).toBeNull();
      expect(ids(plan({ rotationDeg: deg })), `${deg}°`).not.toContain("rotation");
    }
    for (const deg of [-5, -3, 3, 5, 12]) expect(plan({ rotationDeg: deg }).anatomy.rotation, `${deg}°`).not.toBeNull();
  });

  it("rotation: coordinated cues scaled by the internal value, sign preserved, clamped to the console range", () => {
    expect(plan({ rotationDeg: 0 }).anatomy.rotation).toBeNull();
    const a = plan({ rotationDeg: 5 }).anatomy.rotation!, b = plan({ rotationDeg: 10 }).anatomy.rotation!, n = plan({ rotationDeg: -10 }).anatomy.rotation!;
    expect(b.spineShiftU).toBeCloseTo(2 * a.spineShiftU, 9);
    expect(n.spineShiftU).toBeCloseTo(-b.spineShiftU, 9);
    expect(n.thoraxShiftU).toBeCloseTo(-b.thoraxShiftU, 9);
    const max = plan({ rotationDeg: 20 }).anatomy.rotation!;
    expect(plan({ rotationDeg: 20 }).anatomy.rotation).toEqual(max);
    expect(ids(plan({ rotationDeg: 6 }))).toContain("rotation");
  });

  it("the plan contains no whole-image rotation / angle transform", () => {
    expect(JSON.stringify(plan({ rotationDeg: 12 }))).not.toMatch(/\b(angle|rotate|matrix|transform)\b/i);
  });

  it("centering: the field follows the central ray and the anatomy placement does not move", () => {
    const a = plan({ centralRay: { x: 0, y: -0.14 }, collimation: { width: 0.6, height: 0.6 } });
    const b = plan({ centralRay: { x: 0.3, y: 0.2 }, collimation: { width: 0.6, height: 0.6 } });
    expect(b.image).toEqual(a.image);
    const w = (p: typeof a) => p.fieldCm.x2 - p.fieldCm.x1;
    expect(w(b)).toBeCloseTo(w(a), 6);
    expect(b.fieldCm.x1).toBeGreaterThan(a.fieldCm.x1);
    expect(b.fieldCm.y1).toBeGreaterThan(a.fieldCm.y1);
    expect(ids(b)).toContain("centering");
    expect(ids(plan({ centralRay: { x: 0, y: -0.14 } }))).not.toContain("centering");
  });

  it.each([
    ["top", { centralRay: { x: 0, y: 0.3 }, collimation: { width: 0.94, height: 0.5 } }],
    ["bottom", { centralRay: { x: 0, y: -0.7 }, collimation: { width: 0.94, height: 0.5 } }],
    ["left", { centralRay: { x: 0.5, y: -0.14 }, collimation: { width: 0.6, height: 0.9 } }],
    ["right", { centralRay: { x: -0.5, y: -0.14 }, collimation: { width: 0.6, height: 0.9 } }],
  ] as const)("collimation clipping (%s) is reported by the effect and the clipped side", (side, patch) => {
    const st = evaluate(chestPaErect, { ...chestPaErect.initialSettings, ...patch, projection: "pa-erect" }).resultState;
    expect(st.geometry.clippedSides).toContain(side);
    expect(ids(buildRenderPlan(st, chestPaErect))).toContain("collimation-clipping");
  });

  it("excess field: larger exposed region only, no invented scatter/contrast penalty", () => {
    const p = plan({ collimation: { width: 1, height: 1 } });
    expect(ids(p)).toContain("excess-field");
    expect(p.technique).toMatchObject({ noiseSigma: 0, detailGain: 1, penetrationContrastKept: null });
    expect(p.effects.find((e) => e.id === "excess-field")?.changesPixels).toBe(false);
  });

  it("shoulders and chin: schematic overlays only for the not-forward / tucked states", () => {
    expect(plan({ shoulderPosition: "relaxed" }).positioning.scapulaeOverlap).toBe(true);
    expect(plan({ shoulderPosition: "rolled-forward" }).positioning.scapulaeOverlap).toBe(false);
    expect(plan({ chinPosition: "tucked" }).positioning.jawOverlap).toBe(true);
    expect(plan({ chinPosition: "elevated" }).positioning.jawOverlap).toBe(false);
    expect(ids(plan({ shoulderPosition: "relaxed", chinPosition: "tucked" }))).toEqual(expect.arrayContaining(["scapulae", "chin"]));
  });

  it("inspiration and motion come from the simulated patient response, not from technique", () => {
    expect(plan({ breathing: "expiration-hold" }).anatomy.inspiration).not.toBeNull();
    expect(plan({ breathing: "deep-inspiration-hold" }).anatomy.inspiration).toBeNull();
    expect(plan({ motionInstruction: "none" }).motion).not.toBeNull();
    expect(plan({ motionInstruction: "remain-still" }).motion).toBeNull();
    // Technique extremes never create motion or reduced inspiration.
    for (const patch of [{ kvp: 50 }, { kvp: 150 }, { mas: 0.5 }, { mas: 40 }, { sidCm: 100 }, { rotationDeg: 20 }]) {
      const p = plan(patch);
      expect(p.motion, JSON.stringify(patch)).toBeNull();
      expect(p.anatomy.inspiration, JSON.stringify(patch)).toBeNull();
    }
  });

  it("low detector exposure → noise + detail loss (not brightness); excess exposure → nothing visible", () => {
    const low = plan({ mas: 1 });
    expect(low.technique.noiseSigma).toBeGreaterThan(0);
    expect(low.technique.detailGain).toBeLessThan(1);
    expect(ids(low)).toContain("low-exposure");
    expect(plan({ mas: 0.5 }).technique.noiseSigma).toBeGreaterThan(low.technique.noiseSigma);
    const excess = plan({ mas: 12.5 });
    expect(ids(excess)).toContain("excess-exposure");
    expect(excess.technique).toEqual(plan({}).technique);
    expect(excess.effects.find((e) => e.id === "excess-exposure")?.changesPixels).toBe(false);
    // No brightness / density / gamma parameter exists anywhere in the plan.
    expect(JSON.stringify(low)).not.toMatch(/bright|darken|lighten|gamma|density|level|window/i);
  });

  it("low penetration is separate from detector exposure", () => {
    const lowKvNoNoise = plan({ kvp: 70, mas: 14 });
    expect(lowKvNoNoise.technique.penetrationContrastKept).not.toBeNull();
    expect(lowKvNoNoise.technique.noiseSigma).toBe(0);
    expect(ids(lowKvNoNoise)).toContain("low-penetration");
    expect(ids(lowKvNoNoise)).not.toContain("low-exposure");
    const lowMasOnly = plan({ mas: 1 });
    expect(lowMasOnly.technique.penetrationContrastKept).toBeNull();
    // More mAs does not repair penetration.
    expect(plan({ kvp: 70, mas: 40 }).technique.penetrationContrastKept).not.toBeNull();
  });

  it("motion (blur) and low exposure (noise) are distinct, independent effects", () => {
    const m = plan({ motionInstruction: "none" });
    expect(m.motion).not.toBeNull();
    expect(m.technique.noiseSigma).toBe(0);
    const n = plan({ mas: 1 });
    expect(n.motion).toBeNull();
    expect(n.technique.noiseSigma).toBeGreaterThan(0);
    const both = plan({ mas: 1, motionInstruction: "none" });
    expect(both.motion).toEqual(m.motion);
    expect(both.technique).toEqual(n.technique);
  });

  it("marker: learner's marker and detector-relative placement are carried unchanged and never auto-corrected", () => {
    const p = plan({ sideMarker: "R", markerPosition: { x: 0.2, y: -0.3 }, collimation: { width: 0.94, height: 0.84 } });
    expect(p.marker?.side).toBe("R");
    expect(p.marker?.centerCm.x).toBeCloseTo(((0.2 + 1) / 2) * 35, 9);
    expect(p.marker?.centerCm.y).toBeCloseTo(((-0.3 + 1) / 2) * 43, 9);
    expect(p.marker?.sizeCm).toBe(chestPaErect.positioning.markerSizeCm);
    expect(plan({ sideMarker: "L" }).marker?.side).toBe("L");
    expect(plan({ sideMarker: null }).marker).toBeNull();
    expect(ids(plan({ sideMarker: null }))).not.toContain("marker");
  });

  it("marker is recorded only inside the field", () => {
    const f = { x1: 5, y1: 5, x2: 30, y2: 40 };
    expect(markerVisibleFraction({ x: 15, y: 20 }, 3, f)).toBe(1);
    expect(markerVisibleFraction({ x: 2, y: 20 }, 3, f)).toBe(0);
    expect(markerVisibleFraction({ x: 5, y: 20 }, 3, f)).toBeCloseTo(0.5, 9);
    const clipped = plan({ sideMarker: "L", markerPosition: { x: -0.84, y: 0.68 }, collimation: { width: 0.6, height: 1 } });
    expect(clipped.marker?.visibleFraction).toBe(0);
  });

  it("non-PA projections are flagged as not representative (no AP/lateral simulation)", () => {
    for (const projection of ["ap-erect", "lateral-left"] as const) {
      const p = plan({ projection });
      expect(p.representative).toBe(false);
      expect(ids(p)).toContain("projection");
    }
    expect(plan({ projection: "pa-erect" }).representative).toBe(true);
  });

  it("combined errors compose: every effect appears together, in one plan", () => {
    const st: Partial<SimulationSettings> = {
      rotationDeg: 8, centralRay: { x: 0.4, y: -0.14 }, collimation: { width: 0.6, height: 0.9 },
      mas: 1, kvp: 80, shoulderPosition: "relaxed", chinPosition: "tucked", breathing: "no-instruction", motionInstruction: "none",
    };
    const p = plan(st);
    expect(ids(p)).toEqual(
      expect.arrayContaining(["rotation", "collimation-clipping", "centering", "low-exposure", "low-penetration", "scapulae", "chin", "inspiration", "motion", "marker"]),
    );
    expect(ids(p)).not.toContain("baseline");
  });

  it("is deterministic and serialisable; the noise seed is derived from the case, never random", () => {
    const a = plan({ mas: 1, motionInstruction: "none", rotationDeg: 7 });
    const b = plan({ mas: 1, motionInstruction: "none", rotationDeg: 7 });
    expect(a).toEqual(b);
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
    expect(a.technique.noiseSeed).toBe(noiseSeedFor("chest-pa-erect"));
    expect(noiseSeedFor("chest-pa-erect")).not.toBe(noiseSeedFor("other-case"));
  });

  it("every effect carries an evidence class and drivers from the state (never pixels)", () => {
    const p = plan({ rotationDeg: 8, mas: 1, shoulderPosition: "relaxed", motionInstruction: "none", kvp: 70 });
    for (const e of p.effects) {
      expect(["validated", "common-reference", "vendor-protocol-dependent", "educational-simplification", "provisional"]).toContain(e.concept.status);
      expect(e.concept.reference).toMatch(/Image-quality ref/);
    }
    expect(p.effects.find((e) => e.id === "rotation")?.drivers).toEqual(["geometry.rotationDeg"]);
    expect(p.effects.find((e) => e.id === "motion")?.drivers).toEqual(["patientResponse.motion"]);
  });
});

describe("concept and rendered magnitude are classified separately; nothing drawn reads as validated appearance", () => {
  const all = Object.keys(EFFECT_CONCEPTS) as (keyof typeof EFFECT_CONCEPTS)[];

  it("every effect has a clinical concept record AND a magnitude record", () => {
    expect(Object.keys(EFFECT_MAGNITUDES).sort()).toEqual(all.slice().sort());
    for (const id of all) {
      expect(EFFECT_CONCEPTS[id].reference, id).toMatch(/Image-quality ref/);
      expect(EFFECT_MAGNITUDES[id].note.length, id).toBeGreaterThan(10);
    }
  });

  it("the rendered magnitude is never 'validated': it is an educational visual approximation, or nothing is drawn", () => {
    for (const id of all) {
      expect(["educational-visual-approximation", "none"], id).toContain(EFFECT_MAGNITUDES[id].kind);
      expect(JSON.stringify(EFFECT_MAGNITUDES[id]), id).not.toMatch(/validated/i);
    }
  });

  it("validated / evidence-supported concepts still carry an approximate magnitude (motion, noise, penetration, rotation, scapulae, jaw, inspiration)", () => {
    const expected = { motion: "validated", "low-exposure": "validated", "low-penetration": "common-reference", rotation: "common-reference", scapulae: "common-reference", chin: "validated", inspiration: "common-reference" } as const;
    for (const [id, status] of Object.entries(expected) as [keyof typeof EFFECT_CONCEPTS, string][]) {
      expect(EFFECT_CONCEPTS[id].status, id).toBe(status);
      expect(EFFECT_MAGNITUDES[id].kind, id).toBe("educational-visual-approximation");
    }
  });

  it("effects that draw nothing say so (excess exposure, excess field, centering)", () => {
    for (const id of ["excess-exposure", "excess-field", "centering", "baseline", "projection"] as const) expect(EFFECT_MAGNITUDES[id].kind, id).toBe("none");
  });

  it("plan effects carry both records", () => {
    const p = plan({ rotationDeg: 8, motionInstruction: "none", mas: 1, shoulderPosition: "relaxed", chinPosition: "tucked", breathing: "no-instruction", kvp: 70 });
    for (const e of p.effects) {
      expect(e.concept).toEqual(EFFECT_CONCEPTS[e.id]);
      expect(e.magnitude).toEqual(EFFECT_MAGNITUDES[e.id]);
    }
  });
});

describe("default marker (regression: complete inside a typical correct field, on the correct image side)", () => {
  const pos = chestPaErect.positioning;
  const sides = ["L", "R"] as const;
  const fields = [
    { collimation: { width: 0.94, height: 0.84 } },
    { collimation: { width: 0.95, height: 0.86 } },
    { collimation: { width: 0.97, height: 0.9 } },
    { collimation: { width: 1, height: 0.9 } },
    { collimation: { width: 0.94, height: 0.8 } },
  ];
  const rays = [{ x: 0, y: -0.14 }, { x: 0, y: -0.07 }, { x: 0.02, y: -0.1 }, { x: -0.02, y: -0.05 }];

  it("the initial marker position is the L default (a marker is placed at ITS side's default when chosen)", () => {
    expect(chestPaErect.initialSettings.markerPosition).toEqual(pos.defaultMarkerPosition.L);
  });

  it("is completely inside every typical correct field and recorded in full, for L and R", () => {
    for (const f of fields) for (const ray of rays) for (const side of sides) {
      const patch = { ...f, centralRay: ray, sideMarker: side, markerPosition: pos.defaultMarkerPosition[side] };
      const r = evaluate(chestPaErect, { ...chestPaErect.initialSettings, projection: "pa-erect", ...patch });
      const m = plan(patch).marker!;
      expect(m.visibleFraction, JSON.stringify(patch)).toBe(1);
      expect(m.wrongSide, JSON.stringify(patch)).toBe(false);
      expect(r.checks.find((c) => c.ruleId === "side-marker")?.outcome, JSON.stringify(patch)).toBe("pass");
    }
  });

  it("stays outside the required-anatomy region, so it never sits over the lungs", () => {
    for (const side of sides) {
      const c = pos.defaultMarkerPosition[side], a = chestPaErect.requiredAnatomy, d = chestPaErect.detector;
      const cx = ((c.x + 1) / 2) * d.widthCm, cy = ((c.y + 1) / 2) * d.heightCm, h = pos.markerSizeCm / 2;
      const overlaps = cx + h > a.xCm && cx - h < a.xCm + a.widthCm && cy + h > a.yCm && cy - h < a.yCm + a.heightCm;
      expect(overlaps, side).toBe(false);
    }
  });

  it("is still genuinely clipped / dropped when the field is narrowed over it (behaviour kept)", () => {
    for (const side of sides) {
      const at = pos.defaultMarkerPosition[side];
      const narrow = plan({ sideMarker: side, markerPosition: at, collimation: { width: 0.7, height: 0.84 } }).marker!;
      expect(narrow.visibleFraction, side).toBe(0);
      const edge = plan({ sideMarker: side, markerPosition: at, collimation: { width: 0.9, height: 0.84 } }).marker!;
      expect(edge.visibleFraction, side).toBeLessThan(1);
      const r = evaluate(chestPaErect, { ...chestPaErect.initialSettings, projection: "pa-erect", sideMarker: side, markerPosition: at, centralRay: { x: 0, y: -0.14 }, collimation: { width: 0.7, height: 0.84 } });
      expect(r.checks.find((c) => c.ruleId === "side-marker")?.outcome, side).toBe("partial");
    }
  });
});
