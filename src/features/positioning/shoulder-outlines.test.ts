import { describe, expect, it } from "vitest";
import shoulder from "./shoulder-outlines.json";

type Pt = [number, number];
interface Structure { id: string; group: string; closed: boolean; follows: string | null; drawn?: boolean; points: Pt[] }
interface Doc { views: Record<string, { widthPx: number; heightPx: number; structures: Structure[] }> }

const inPolygon = ([x, y]: Pt, poly: Pt[]) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [x1, y1] = poly[i]!, [x2, y2] = poly[j]!;
    if (y1 > y !== y2 > y && x < x1 + ((y - y1) * (x2 - x1)) / (y2 - y1)) inside = !inside;
  }
  return inside;
};

const view = (shoulder as unknown as Doc).views.grashey!;

/** Traced shoulder outlines (RAD-072 2c, Phase A): data only, not yet drawn by any scene. */
describe("traced shoulder outlines (RAD-072 2c)", () => {
  it("no soft-tissue point lies inside any bone outline", () => {
    const softs = view.structures.filter((s) => s.group === "soft");
    expect(softs.length).toBeGreaterThan(0);
    // open bone outlines (the humerus is cut by the bottom of the frame) are closed by the chord between their ends; points along each soft segment are sampled too
    const bones = view.structures.filter((s) => s.group !== "soft" && s.group !== "joints" && s.points.length > 2);
    const samples: Pt[] = [];
    for (const soft of softs) {
      soft.points.forEach((p, i) => {
        const q = soft.points[i + 1];
        if (!q) return void samples.push(p);
        const n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 2));
        for (let k = 0; k < n; k++) samples.push([p[0] + ((q[0] - p[0]) * k) / n, p[1] + ((q[1] - p[1]) * k) / n]);
      });
    }
    const bad = samples.flatMap((p) => bones.filter((b) => inPolygon(p, b.points)).map((b) => `${p.map(Math.round).join(",")} in ${b.id}`));
    expect(bad).toEqual([]);
  });

  it("every structure has a unique id and stays inside the A-038 frame", () => {
    const ids = view.structures.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([view.widthPx, view.heightPx]).toEqual([1193, 1800]);
    for (const s of view.structures) {
      for (const [x, y] of s.points) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(view.widthPx);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(view.heightPx);
      }
    }
  });

  it("carries the structures the owner asked for, the inseparable ones as one named outline", () => {
    const ids = view.structures.map((s) => s.id);
    for (const id of ["soft-tissue", "humerus-proximal", "humeral-head-arc", "greater-tuberosity-line", "glenoid-neck", "glenohumeral-joint-space", "acromion", "coracoid", "clavicle-distal", "ac-joint", "scapular-border-inner", "scapular-border-outer"]) expect(ids).toContain(id);
    expect(view.structures.find((s) => s.id === "humerus-proximal")!.closed).toBe(false);
  });
});
