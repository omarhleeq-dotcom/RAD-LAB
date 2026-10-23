import { describe, expect, it } from "vitest";
import wrist from "./wrist-outlines.json";
import foot from "./foot-outlines.json";

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

/** The vocabulary of `follows` (the drawing link) per region; the models themselves are unchanged. */
const FOLLOWS = {
  wrist: { pa: ["anchors", "ulna", "radius"], lateral: ["metacarpals", "head", "static"] },
  foot: { ap: ["toes", "metatarsal", "static"], oblique: ["toes", "metatarsal", "static"] },
} as const;

const docs: [string, Doc, Record<string, readonly string[]>][] = [
  ["wrist", wrist as unknown as Doc, FOLLOWS.wrist],
  ["foot", foot as unknown as Doc, FOLLOWS.foot],
];

describe("traced wrist and foot outlines (RAD-072 2b)", () => {
  for (const [region, doc, vocab] of docs) {
    for (const [view, v] of Object.entries(doc.views)) {
      const ss = v.structures;
      it(`${region} ${view}: no soft-tissue point lies inside any bone outline`, () => {
        const softs = ss.filter((s) => s.group === "soft");
        expect(softs.length).toBeGreaterThan(0);
        // open bone outlines (forearm, bones cut by the image edge) are closed by the chord between their ends; points along each soft segment are sampled too
        const bones = ss.filter((s) => s.group !== "soft" && s.group !== "joints" && s.points.length > 2);
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
      it(`${region} ${view}: every structure names a known follows link, has unique id and stays inside the image`, () => {
        const ids = ss.map((s) => s.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const s of ss) {
          if (s.group !== "soft") expect(vocab[view], `${s.id}`).toContain(s.follows);
          for (const [x, y] of s.points) {
            expect(x).toBeGreaterThanOrEqual(0);
            expect(x).toBeLessThanOrEqual(v.widthPx);
            expect(y).toBeGreaterThanOrEqual(0);
            expect(y).toBeLessThanOrEqual(v.heightPx);
          }
        }
      });
    }
  }

  it("the sesamoids are traced but not drawn", () => {
    for (const view of ["ap", "oblique"] as const) {
      const s = (foot as unknown as Doc).views[view]!.structures.filter((x) => x.group === "sesamoids");
      expect(s.length).toBe(2);
      expect(s.every((x) => x.drawn === false)).toBe(true);
    }
  });

  it("the PA wrist carries every carpal bone, the two that overlap as one named outline", () => {
    const ids = (wrist as unknown as Doc).views.pa!.structures.map((s) => s.id);
    for (const id of ["scaphoid", "lunate", "triquetrum-pisiform", "trapezium", "trapezoid", "capitate", "hamate", "radius", "ulna", "radiocarpal", "midcarpal"]) expect(ids).toContain(id);
  });
});
