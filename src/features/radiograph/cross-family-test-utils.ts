/** Test/audit fixtures only. Console values are engineering probes, not medical recommendations. */
import { CASES } from "@/data/cases";
import type { RadCase, NumericControlSpec } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { evaluate } from "@/features/evaluation/engine";
import { targetMas } from "@/features/technique/model";
import { resultPxPerCm } from "./RadiographCanvas";
import { buildRenderPlan, type RenderPlan } from "./plan";

export const WITNESS_SEED = 0x52414431;
export const WITNESS_CASES = CASES;
/** Diagnostic plan hash only. Math.pow is implementation-approximated (Node 22/24 differ by one ULP).
 * Keep raw plans for rendering: no rounding of inputs, Float32 intermediates or output luma. */
export function witnessPlanJson(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) => {
    if (typeof item === "number") {
      if (!Number.isFinite(item)) throw Error("Non-finite witness plan number");
      return Number(item.toPrecision(12));
    }
    if (item && typeof item === "object" && !Array.isArray(item)) {
      return Object.fromEntries(Object.keys(item).sort().map(key => [key, (item as Record<string, unknown>)[key]]));
    }
    return item;
  });
}
export interface PixelProbe {
  id: string;
  effect: string;
  patch: Partial<SimulationSettings>;
  plan: RenderPlan;
  solo: RenderPlan;
}

/** Neutral acquisition; full detector avoids incidental clipping. Annotation glyphs are never rendered. */
export function witnessReference(c: RadCase): SimulationSettings {
  const rotation = c.rules.find(r => r.kind === "range" && r.setting === "rotationDeg");
  const s: SimulationSettings = {
    ...c.initialSettings, ...c.technique.manual.reference,
    projection: c.requiredProjection, exposureMode: "manual", aecChambers: [],
    rotationDeg: rotation?.kind === "range" ? (rotation.ideal[0] + rotation.ideal[1]) / 2 : 0,
    centralRay: { x: 0, y: 0 }, collimation: { width: 1, height: 1 },
    sideMarker: null, motionInstruction: "remain-still",
    ...(c.initialSettings.chinPosition === undefined ? {} : { chinPosition: "elevated" as const }),
    ...(c.initialSettings.shoulderPosition === undefined ? {} : { shoulderPosition: "rolled-forward" as const }),
    ...(c.availableBreathing?.length ? { breathing: c.availableBreathing[0] } : {}),
  };
  s.mas = targetMas(c.technique, s);
  return s;
}

const stations = (r: NumericControlSpec) => r.stations ?? Array.from(
  { length: Math.round((r.max - r.min) / r.step) + 1 }, (_, i) => Number((r.min + i * r.step).toFixed(10)),
);

/** Keep the whole evaluated plan as a separate witness; isolate the requested pixel operation as well. */
function isolate(base: RenderPlan, p: RenderPlan, effect: string): RenderPlan {
  const out = structuredClone(base);
  out.effects = p.effects.filter(e => e.id === effect);
  if (effect === "rotation") {
    out.anatomy.rotation = p.anatomy.rotation;
    if (p.limb) out.limb = p.limb;
  }
  if (effect === "inspiration") out.anatomy.inspiration = p.anatomy.inspiration;
  if (effect === "scapulae") out.positioning.scapulaeOverlap = p.positioning.scapulaeOverlap;
  if (effect === "chin") out.positioning.jawOverlap = p.positioning.jawOverlap;
  if (effect === "motion") out.motion = p.motion;
  if (effect === "low-penetration") out.technique.penetrationContrastKept = p.technique.penetrationContrastKept;
  if (effect === "low-exposure") {
    out.technique.noiseSigma = p.technique.noiseSigma;
    out.technique.detailGain = p.technique.detailGain;
  }
  if (["collimation-clipping", "centering", "excess-field"].includes(effect)) out.fieldCm = p.fieldCm;
  if (effect === "marker") { out.marker = p.marker; if (p.view) out.view = p.view; }
  return out;
}

export function witnessProbes(c: RadCase): PixelProbe[] {
  const reference = witnessReference(c);
  const make = (patch: Partial<SimulationSettings>) => {
    const p = buildRenderPlan(evaluate(c, { ...reference, ...patch }).resultState, c);
    p.technique.noiseSeed = WITNESS_SEED;
    return p;
  };
  const base = make({});
  const probes: PixelProbe[] = [{ id: "baseline", effect: "baseline", patch: {}, plan: base, solo: base }];
  const add = (id: string, effect: string, patch: Partial<SimulationSettings>) => {
    const p = make(patch);
    probes.push({ id, effect, patch, plan: p, solo: isolate(base, p, effect) });
  };
  const numeric = (effect: string, name: string, values: number[], ref: number, patch: (v: number) => Partial<SimulationSettings>,
    // Boundary of the SCORED finding where it differs from the drawn effect (D-R1: an asset may not express it).
    finding?: (v: number) => boolean) => {
    add(`${name}/min`, effect, patch(values[0]!));
    add(`${name}/max`, effect, patch(values.at(-1)!));
    // Closest selectable active value on either side, plus its inactive neighbour (exact gating witness).
    for (const [side, vs] of [["low", values.filter(v => v < ref).reverse()], ["high", values.filter(v => v > ref)]] as const) {
      const index = vs.findIndex(v => finding ? finding(v) : make(patch(v)).effects.some(e => e.id === effect));
      if (index < 0) continue;
      add(`${name}/threshold-${side}`, effect, patch(vs[index]!));
      add(`${name}/before-${side}`, effect, patch(index === 0 ? ref : vs[index - 1]!));
    }
  };
  numeric("rotation", "rotation", stations(c.controls.rotationDeg), reference.rotationDeg, v => ({ rotationDeg: v }));
  numeric("low-penetration", "penetration", stations(c.controls.kvp), reference.kvp, v => ({ kvp: v }),
    v => evaluate(c, { ...reference, kvp: v }).resultState.exposure.penetration === "low");
  numeric("low-exposure", "exposure", stations(c.controls.mas), reference.mas, v => ({ mas: v }));
  numeric("excess-exposure", "excess-exposure", stations(c.controls.mas), reference.mas, v => ({ mas: v }));
  for (const axis of ["width", "height"] as const) {
    const values = stations({ min: c.positioning.minCollimation, max: 1, step: 0.01 });
    numeric("collimation-clipping", `field-${axis}`, values, 1, v => ({ collimation: { ...reference.collimation, [axis]: v } }));
    numeric("excess-field", `excess-${axis}`, values, values[0]!, v => ({ collimation: { ...reference.collimation, [axis]: v } }));
  }
  for (const axis of ["x", "y"] as const) numeric("centering", `centering-${axis}`, stations({ min: -1, max: 1, step: 0.01 }), 0,
    v => ({ centralRay: { ...reference.centralRay, [axis]: v } }));
  // Also bracket these multi-driver effects from a neutral context: the other axis must not activate the card.
  const target = c.positioning.centering.target;
  for (const axis of ["x", "y"] as const) numeric("centering", `centered-${axis}`, stations({ min: -1, max: 1, step: 0.01 }), target[axis],
    v => ({ centralRay: { ...target, [axis]: v } }));
  const req = c.requiredAnatomy, detector = c.detector;
  const fitted = { width: req.widthCm / detector.widthCm, height: req.heightCm / detector.heightCm };
  const center = { x: 2 * (req.xCm + req.widthCm / 2) / detector.widthCm - 1, y: 2 * (req.yCm + req.heightCm / 2) / detector.heightCm - 1 };
  for (const axis of ["width", "height"] as const) numeric("excess-field", `fitted-excess-${axis}`,
    stations({ min: c.positioning.minCollimation, max: 1, step: 0.01 }), fitted[axis],
    v => ({ centralRay: center, collimation: { ...fitted, [axis]: v } }));
  // Enums have no numeric threshold: pin every declared state, including the neutral endpoint.
  for (const value of c.availableProjections) add(`projection/${value}`, "projection", { projection: value });
  for (const value of ["none", "remain-still", "relax-and-move"] as const) add(`motion/${value}`, "motion", { motionInstruction: value });
  if (c.radiograph.lungApexV !== undefined && c.radiograph.diaphragmDomeV !== undefined) {
    for (const value of c.availableBreathing ?? []) add(`inspiration/${value}`, "inspiration", { breathing: value });
  }
  if (c.radiograph.jaw) for (const value of ["elevated", "tucked"] as const) add(`chin/${value}`, "chin", { chinPosition: value });
  if (c.radiograph.scapulae) for (const value of ["rolled-forward", "relaxed"] as const) add(`scapulae/${value}`, "scapulae", { shoulderPosition: value });
  for (const value of [null, "L", "R"] as const) add(`marker/${value}`, "marker", { sideMarker: value });
  const patch: Partial<SimulationSettings> = {
    rotationDeg: c.controls.rotationDeg.max, kvp: c.controls.kvp.min, mas: c.controls.mas.min,
    collimation: { width: c.positioning.minCollimation, height: c.positioning.minCollimation },
    motionInstruction: "relax-and-move",
  };
  const combo = make(patch);
  probes.push({ id: "combination", effect: "combination", patch, plan: combo, solo: combo });
  return probes;
}

export function witnessResolution(p: RenderPlan, c: RadCase): number {
  return resultPxPerCm(c.radiograph, (p.view ? (p.view.x2 - p.view.x1) * (p.view.y2 - p.view.y1) : p.detector.widthCm * p.detector.heightCm));
}
