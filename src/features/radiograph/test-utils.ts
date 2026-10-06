/**
 * Test-only helpers: a deterministic synthetic "phantom" image with the same landmark layout as the real
 * baseline (lung fields, bright spine column, diaphragm step, high-frequency texture inside the dense zones),
 * so the pure pipeline can be tested in Node without decoding a JPEG. Not shipped to the app.
 */
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import type { SimulationSettings } from "@/domain/simulation";
import { evaluate } from "@/features/evaluation/engine";
import { renderRadiograph, type LumaImage } from "./pipeline";
import { buildRenderPlan } from "./plan";

export const PHANTOM_W = 200;
export const PHANTOM_H = 229;
export const PX_PER_CM = 6;

export function makePhantom(): LumaImage {
  const data = new Float32Array(PHANTOM_W * PHANTOM_H);
  const spec = chestPaErect.radiograph;
  for (let y = 0; y < PHANTOM_H; y++) {
    for (let x = 0; x < PHANTOM_W; x++) {
      const u = x / (PHANTOM_W - 1), v = y / (PHANTOM_H - 1);
      let value = 70;
      const inThorax = u > 0.08 && u < 0.92;
      if (inThorax && v > 0.8) value = 130; // abdomen below the diaphragm: a sharp horizontal edge at the dome
      const lung = (cu: number) => ((u - cu) / 0.19) ** 2 + ((v - 0.47) / 0.33) ** 2 < 1;
      if (v <= 0.8 && (lung(0.29) || lung(0.69))) value = 45;
      if (u > 0.475 && u < 0.505 && v > 0.05 && v < 0.95) value = 200; // spine column at the midline
      // High-frequency texture inside the dense zones (what low penetration should wash out).
      for (const z of spec.denseZones) {
        if (((u - z.cu) / z.ru) ** 2 + ((v - z.cv) / z.rv) ** 2 < 0.6) value += x % 4 < 2 ? 30 : -30;
      }
      data[y * PHANTOM_W + x] = value;
    }
  }
  return { width: PHANTOM_W, height: PHANTOM_H, data };
}

/** A reference acquisition: every learner choice appropriate (settings, not an assertion about scoring). */
export const REFERENCE: SimulationSettings = {
  ...chestPaErect.initialSettings,
  projection: "pa-erect",
  rotationDeg: 0,
  centralRay: { x: 0, y: -0.14 },
  collimation: { width: 1, height: 1 },
  chinPosition: "elevated",
  shoulderPosition: "rolled-forward",
  sideMarker: "L",
  markerPosition: { x: -0.4, y: 0.6 },
  sidCm: 180,
  kvp: 120,
  mas: 3.2,
  exposureMode: "manual",
  aecChambers: [],
  breathing: "deep-inspiration-hold",
  motionInstruction: "remain-still",
};

const phantom = makePhantom();

export function plan(patch: Partial<SimulationSettings> = {}) {
  return buildRenderPlan(evaluate(chestPaErect, { ...REFERENCE, ...patch }).resultState, chestPaErect);
}

export function render(patch: Partial<SimulationSettings> = {}) {
  const p = plan(patch);
  return { plan: p, out: renderRadiograph(p, chestPaErect.radiograph, phantom, PX_PER_CM) };
}

/** Pixel helpers on a rendered output. */
export const at = (o: { width: number; luma: Uint8ClampedArray }, x: number, y: number) => o.luma[y * o.width + x]!;
export const cmToPx = (cm: number) => Math.round(cm * PX_PER_CM);
export function meanRect(o: { width: number; luma: Uint8ClampedArray }, x1: number, y1: number, x2: number, y2: number) {
  let s = 0, n = 0;
  for (let y = y1; y < y2; y++) for (let x = x1; x < x2; x++) { s += at(o, x, y); n++; }
  return s / n;
}
export function stdRect(o: { width: number; luma: Uint8ClampedArray }, x1: number, y1: number, x2: number, y2: number) {
  const m = meanRect(o, x1, y1, x2, y2);
  let s = 0, n = 0;
  for (let y = y1; y < y2; y++) for (let x = x1; x < x2; x++) { s += (at(o, x, y) - m) ** 2; n++; }
  return Math.sqrt(s / n);
}
