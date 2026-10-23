import { describe, expect, it } from "vitest";
import outlines from "./hand-outlines.json";

type Pt = [number, number];
interface Structure { id: string; group: string; closed: boolean; points: Pt[] }

const inPolygon = ([x, y]: Pt, poly: Pt[]) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [x1, y1] = poly[i]!, [x2, y2] = poly[j]!;
    if (y1 > y !== y2 > y && x < x1 + ((y - y1) * (x2 - x1)) / (y2 - y1)) inside = !inside;
  }
  return inside;
};

describe("traced hand outlines (RAD-072 2a)", () => {
  for (const view of ["pa", "lateral"] as const) {
    it(`${view}: no soft-tissue point lies inside any bone outline (owner review)`, () => {
      const ss = outlines.views[view].structures as unknown as Structure[];
      const soft = ss.find((s) => s.group === "soft")!;
      // open bone outlines (forearm, styloid tip) are closed by the chord between their ends; points along each soft segment are sampled too
      const bones = ss.filter((s) => s.group !== "soft" && s.group !== "joints" && s.points.length > 2);
      const samples: Pt[] = [];
      soft.points.forEach((p, i) => {
        const q = soft.points[i + 1];
        if (!q) return void samples.push(p);
        const n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 2));
        for (let k = 0; k < n; k++) samples.push([p[0] + ((q[0] - p[0]) * k) / n, p[1] + ((q[1] - p[1]) * k) / n]);
      });
      const bad = samples.flatMap((p) => bones.filter((b) => inPolygon(p, b.points)).map((b) => `${p.map(Math.round).join(",")} in ${b.id}`));
      expect(bad).toEqual([]);
    });
  }
});
