import { describe, expect, it } from "vitest";
import { interpolateAnchors, wristLateralCopies, wristPaShifts, WRIST_MODEL } from "@/features/wrist-model/wrist-model";
import outlines from "./wrist-outlines.json";
import { outlineLayers, copyOpacity } from "./outline-layers";
import { polygonArea, type Pt } from "./outline-geometry";
import { wristSideHeights } from "./wrist-visual";
import { wristOutlineDrawing, WRIST_IMAGE, type DrawnPart } from "./wrist-outline-drawing";

// The model never lets the warp fold (`monotone`: displaced anchors stay at least MIN_SLOPE = 0.2 of their spacing apart), so a bone between two columns can
// narrow to about a third at the extremes (trapezium at ±13…15°); it never vanishes.
const MIN_AREA = 0.3;
const KINDS = ["pa", "lateral"] as const;
const ROTATIONS = Array.from({ length: 2 * WRIST_MODEL.maxDeg + 1 }, (_, i) => i - WRIST_MODEL.maxDeg); // the whole allowed range, −15…15
type S = { id: string; group: string; closed: boolean; drawn?: boolean; points: Pt[] };
const traced = (kind: (typeof KINDS)[number]) => outlines.views[kind].structures as unknown as S[];
const drawnBones = (kind: (typeof KINDS)[number]) => traced(kind).filter((s) => !["soft", "joints"].includes(s.group) && s.drawn !== false && s.points.length > 2);
const meanX = (parts: DrawnPart[]) => parts.flatMap((p) => p.points).reduce((a, p, _, all) => a + p[0] / all.length, 0);
const rowsMeanX = (p: DrawnPart, y0: number, y1: number) => {
  const xs = p.points.filter((q) => q[1] >= y0 && q[1] <= y1).map((q) => q[0]);
  return xs.reduce((a, b) => a + b, 0) / xs.length;
};

describe("wrist drawing from the traced outlines (RAD-072 2b)", () => {
  it("draws every structure exactly as traced at rotation 0 (both exams)", () => {
    for (const kind of KINDS) {
      const d = wristOutlineDrawing(kind, 0);
      const byId = new Map(traced(kind).map((s) => [s.id, s]));
      for (const p of [...d.soft, ...d.bones, ...d.joints])
        p.points.forEach(([x, y], i) => {
          const [tx, ty] = byId.get(p.id)!.points[i]!;
          expect(Math.abs(x - tx) + Math.abs(y - ty), `${kind} ${p.id} #${p.copy} point ${i}`).toBeLessThan(1e-6);
        });
    }
  });

  it("does not draw single-point prominences", () => {
    for (const kind of KINDS) {
      const ids = new Set([...wristOutlineDrawing(kind, 0).bones, ...wristOutlineDrawing(kind, 0).joints].map((p) => p.id));
      for (const s of traced(kind)) if (s.drawn === false || s.points.length < 3) expect(ids.has(s.id), `${kind} ${s.id}`).toBe(false);
    }
  });

  // Overlapping bones stay visible over the whole range: every bone keeps a translucent fill and its own edge on top (limb drawing style).
  it("keeps every bone visible over the whole rotation range in both exams", () => {
    for (const kind of KINDS)
      for (const rot of ROTATIONS) {
        const d = wristOutlineDrawing(kind, rot);
        const base = wristOutlineDrawing(kind, 0);
        for (const s of drawnBones(kind)) {
          const parts = d.bones.filter((p) => p.id === s.id);
          expect(parts.length, `${kind} ${rot}° ${s.id}`).toBeGreaterThan(0);
          for (const p of parts) {
            expect(p.points.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))).toBe(true);
            // size: the (closed, or border-closed) polygon of the bone keeps a real area (see MIN_AREA)
            const fill = (q: DrawnPart) => q.fillPoints ?? q.points;
            const a0 = polygonArea(fill(base.bones.find((q) => q.id === p.id && q.copy === p.copy)!));
            expect(polygonArea(fill(p)) / a0, `${kind} ${rot}° ${s.id} keeps its size`).toBeGreaterThan(MIN_AREA);
          }
        }
        const layers = outlineLayers(d);
        const lastFill = layers.map((l) => l.layer).lastIndexOf("boneFill");
        for (const p of d.bones) {
          const edge = layers.findIndex((l) => l.layer === "edge" && l.part === p);
          const under = layers.findIndex((l) => l.layer === "edgeUnder" && l.part === p);
          expect(edge, `${kind} ${rot}° ${p.id} edge`).toBeGreaterThan(lastFill);
          expect(under, `${kind} ${rot}° ${p.id} under-stroke`).toBeGreaterThan(lastFill);
          expect(copyOpacity(p.copies)).toBeLessThan(1);
        }
      }
  });

  it("PA turns the same parts in the same direction as the result image (metacarpal bases, ulna, radius)", () => {
    const H = WRIST_IMAGE.pa.heightPx, W = WRIST_IMAGE.pa.widthPx;
    for (const rot of [5, 10, 15, -5, -10, -15]) {
      const m = wristPaShifts(rot);
      const d = wristOutlineDrawing("pa", rot), b = wristOutlineDrawing("pa", 0);
      const at = (dd: typeof d, id: string, y0: number, y1: number) => rowsMeanX(dd.bones.find((p) => p.id === id)!, y0, y1);
      // the forearm layers (rows well below the radiocarpal joint, which starts at 0.52 of the height) move rigidly by the model's own shift
      const uDx = at(d, "ulna", 0.8 * H, H) - at(b, "ulna", 0.8 * H, H);
      const rDx = at(d, "radius", 0.8 * H, H) - at(b, "radius", 0.8 * H, H);
      expect(uDx / W, `ulna ${rot}°`).toBeCloseTo(m.ulna, 3);
      expect(rDx / W, `radius ${rot}°`).toBeCloseTo(m.radius, 3);
      // every point above the forearm rows moves by exactly the model's column-anchor displacement at its x (the result image's warp)
      for (const id of ["mc5-base", "mc3-base", "mc2-base", "capitate", "scaphoid"]) {
        const p0 = b.bones.find((p) => p.id === id)!, p1 = d.bones.find((p) => p.id === id)!;
        p0.points.forEach(([x, y], i) => {
          if (y > 0.45 * H) return;
          expect(p1.points[i]![0] - x, `${id} point ${i} at ${rot}°`).toBeCloseTo(interpolateAnchors(m.anchors, x / W) * W, 6);
          expect(p1.points[i]![1]).toBe(y);
        });
      }
      // the carpals follow the anchors too: the capitate moves with the middle columns
      const cx = meanX(d.bones.filter((p) => p.id === "capitate")) - meanX(b.bones.filter((p) => p.id === "capitate"));
      expect(Number.isFinite(cx)).toBe(true);
    }
  });

  it("lateral draws two copies of the superimposed bands, moved like the result image's copies", () => {
    for (const rot of [5, 10, 15, -5, -10, -15]) {
      const c = wristLateralCopies(rot);
      const d = wristOutlineDrawing("lateral", rot), b = wristOutlineDrawing("lateral", 0);
      const W = WRIST_IMAGE.lateral.widthPx, H = WRIST_IMAGE.lateral.heightPx;
      for (const [id, copies, y0, y1] of [["mc2-5-bases", c.metacarpals, 0, 0.12 * H], ["radius-ulna", c.head, 0.46 * H, 0.52 * H]] as const) {
        const parts = d.bones.filter((p) => p.id === id);
        expect(parts.length, id).toBe(2);
        parts.forEach((p, i) => {
          const dx = rowsMeanX(p, y0, y1) - rowsMeanX(b.bones.find((q) => q.id === id && q.copy === i)!, y0, y1);
          expect(Math.sign(Math.round(dx)), `${id} copy ${i} at ${rot}°`).toBe(Math.sign(Math.round(copies[i]!.du * W)));
        });
      }
    }
  });

  it("really superimposes: at ±15° the two forearm copies still overlap and keep separate edges", () => {
    for (const rot of [-15, 15]) {
      const parts = wristOutlineDrawing("lateral", rot).bones.filter((p) => p.id === "radius-ulna");
      const xs = (p: DrawnPart): [number, number] => [Math.min(...p.points.map((q) => q[0])), Math.max(...p.points.map((q) => q[0]))];
      const [a0, a1] = xs(parts[0]!), [b0, b1] = xs(parts[1]!);
      expect(Math.min(a1, b1) - Math.max(a0, b0)).toBeGreaterThan(0);
      expect(parts[0]!.points).not.toEqual(parts[1]!.points);
    }
  });

  it("mirrors for a right wrist only on request", () => {
    const left = wristOutlineDrawing("pa", 4), right = wristOutlineDrawing("pa", 4, { mirror: true });
    const xs = traced("pa").filter((s) => s.group === "soft").flatMap((s) => s.points.map((p) => p[0]));
    const axis2 = Math.min(...xs) + Math.max(...xs);
    right.bones.forEach((p, i) => p.points.forEach(([x, y], j) => expect([x, y]).toEqual([axis2 - left.bones[i]!.points[j]![0], left.bones[i]!.points[j]![1]])));
  });

  // Side view: proportions only, read from the traced soft tissue (no geometry or scoring change).
  it("the side view's hand and forearm heights come from the traced wrist and follow the set-up", () => {
    const flat = wristSideHeights(false), edge = wristSideHeights(true);
    // palm down shows the wrist's thickness (the lateral image's width), on the ulnar edge its width (the PA image's width): the wrist is wider than thick
    expect(edge.hand).toBeGreaterThan(flat.hand);
    expect(edge.forearm).toBeGreaterThan(flat.forearm);
    for (const v of [flat.hand, flat.forearm, edge.hand, edge.forearm]) expect(v).toBeGreaterThan(20), expect(v).toBeLessThan(70);
  });
});
