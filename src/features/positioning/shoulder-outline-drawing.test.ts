import { describe, expect, it } from "vitest";
import outlines from "./shoulder-outlines.json";
import { outlineLayers } from "./outline-layers";
import { polygonArea, type Pt } from "./outline-geometry";
import { shoulderOutlineDrawing, shoulderPointMap, SHOULDER_LIGHT_LINES, type DrawnPart } from "./shoulder-outline-drawing";
import { shoulderShift, shoulderValue } from "@/features/shoulder-model/shoulder-model";
import { SHOULDER_IMAGE } from "@/data/exams/xray/shoulder-geometry";

type S = { id: string; group: string; closed: boolean; points: Pt[] };
const traced = outlines.views.grashey.structures as unknown as S[];
const ANGLES = Array.from({ length: 13 }, (_, i) => i * 5); // 0…60, the console range
const all = (d: ReturnType<typeof shoulderOutlineDrawing>) => [...d.soft, ...d.bones, ...d.joints, ...d.lines];
const inPolygon = ([x, y]: Pt, poly: Pt[]) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [x1, y1] = poly[i]!, [x2, y2] = poly[j]!;
    if (y1 > y !== y2 > y && x < x1 + ((y - y1) * (x2 - x1)) / (y2 - y1)) inside = !inside;
  }
  return inside;
};

describe("shoulder drawing from the traced outlines (RAD-072 2c)", () => {
  it("is exactly the traced outline inside the 35°–45° band (the unchanged baseline)", () => {
    for (const deg of [35, 40, 45]) {
      const byId = new Map(traced.map((s) => [s.id, s]));
      for (const p of all(shoulderOutlineDrawing(deg)))
        p.points.forEach(([x, y], i) => {
          const [tx, ty] = byId.get(p.id)!.points[i]!;
          expect(Math.abs(x - tx) + Math.abs(y - ty), `${deg}° ${p.id} point ${i}`).toBeLessThan(1e-6);
        });
    }
  });

  it("the drawing keeps changing with the angle outside the band (0°, 15°, 20°, 30° differ; 60° differs from 50°) and not inside it", () => {
    const sig = (deg: number) => JSON.stringify(shoulderOutlineDrawing(deg));
    expect(new Set([0, 15, 20, 30].map(sig)).size).toBe(4);
    for (const deg of [0, 15, 20, 30]) expect(sig(deg)).not.toBe(sig(40));
    expect(sig(60)).not.toBe(sig(50));
    expect(sig(35)).toBe(sig(40));
    expect(sig(45)).toBe(sig(40));
  });

  it("moves each point by exactly the model's displacement (the result image's field) and always toward the glenoid line", () => {
    const { widthPx: W, heightPx: H } = SHOULDER_IMAGE;
    for (const deg of [0, 15, 20, 30, 50, 60]) {
      const m = shoulderPointMap(deg);
      const value = shoulderValue(deg);
      for (const s of traced) for (const [x, y] of s.points) {
        const [nx, ny] = m([x, y]);
        expect(ny).toBe(y);
        expect(nx - x).toBeGreaterThanOrEqual(0); // the closing cue has one sign for either side of the band
        expect(nx - x).toBeLessThanOrEqual(shoulderShift(x / W, value) * W + 1e-9);
        if (y / H < 0.08 || y / H > 0.5) expect(nx).toBe(x); // outside the band of rows (and its soft edge) nothing moves
      }
    }
  });

  it("closes the glenohumeral space more with every degree away from the band (to 0° and to 60°), the head staying distinct", () => {
    const gap = (deg: number) => {
      const d = shoulderOutlineDrawing(deg);
      const head = d.bones.find((p) => p.id === "humerus-proximal")!, glenoid = d.bones.find((p) => p.id === "glenoid-neck")!;
      // at row 560: the head's medial edge (largest x of the humerus outline) and the glenoid band's lateral edge
      const near = (p: DrawnPart, pick: (a: number[]) => number) => pick(p.points.filter(([, y]) => Math.abs(y - 560) < 60).map(([x]) => x));
      return near(glenoid, (a) => Math.min(...a)) - near(head, (a) => Math.max(...a));
    };
    for (const [far, near] of [[0, 15], [15, 25], [25, 34], [60, 50], [50, 46]] as const) expect(gap(far), `${far}° vs ${near}°`).toBeLessThan(gap(near));
    expect(gap(0)).toBeGreaterThan(0); // the head never reaches the glenoid band
    // every bone keeps a real size at the extremes (the warp never folds)
    for (const deg of [0, 60]) {
      const b = shoulderOutlineDrawing(40), d = shoulderOutlineDrawing(deg);
      for (const p of d.bones) {
        const a0 = polygonArea(b.bones.find((q) => q.id === p.id)!.fillPoints ?? b.bones.find((q) => q.id === p.id)!.points);
        expect(polygonArea(p.fillPoints ?? p.points) / a0, `${deg}° ${p.id}`).toBeGreaterThan(p.id === "humerus-proximal" ? 0.95 : 0.5); // the glenoid band is the strip the model compresses (to about 60 %); the head is not
      }
    }
  });

  it("keeps the soft-tissue line outside every bone outline at every angle of the console range", () => {
    for (const deg of ANGLES) {
      const d = shoulderOutlineDrawing(deg);
      const samples: Pt[] = d.soft[0]!.points.flatMap((p, i, a) => {
        const q = a[i + 1];
        if (!q) return [p];
        const n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 2));
        return Array.from({ length: n }, (_, k): Pt => [p[0] + ((q[0] - p[0]) * k) / n, p[1] + ((q[1] - p[1]) * k) / n]);
      });
      for (const b of d.bones) expect(samples.filter((s) => inPolygon(s, b.fillPoints ?? b.points)).map((s) => s.map(Math.round).join(",")), `${deg}° ${b.id}`).toEqual([]);
    }
  });

  it("draws the limb style: every bone's edge over all fills, the light lines between; the head arc is not a separate bone", () => {
    const d = shoulderOutlineDrawing(20);
    expect(d.bones.map((p) => p.id).sort()).toEqual(["acromion", "clavicle-distal", "coracoid", "glenoid-neck", "humerus-proximal"]);
    expect(d.lines.map((p) => p.id).sort()).toEqual([...SHOULDER_LIGHT_LINES].sort());
    expect(d.joints.map((p) => p.id).sort()).toEqual(["ac-joint", "glenohumeral-joint-space"]);
    const layers = outlineLayers(d);
    const lastFill = layers.map((l) => l.layer).lastIndexOf("boneFill");
    const firstLine = layers.findIndex((l) => l.layer === "line");
    expect(firstLine).toBeGreaterThan(lastFill);
    for (const p of d.bones) expect(layers.findIndex((l) => l.layer === "edge" && l.part === p)).toBeGreaterThan(layers.map((l) => l.layer).lastIndexOf("line"));
    expect(layers.some((l) => l.part.id === "humeral-head-arc")).toBe(false);
  });
});
