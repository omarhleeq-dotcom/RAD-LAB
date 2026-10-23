import { describe, expect, it } from "vitest";
import { handLateralShifts, handPaAnchors, HAND_MODEL } from "@/features/hand-model/hand-model";
import outlines from "./hand-outlines.json";
import { handOutlineDrawing, polygonArea, type DrawnPart, type Pt } from "./hand-outline-drawing";
import { copyOpacity, handLayers } from "./HandFigure";
import { LIMB, STROKE } from "./scene-style";

const KINDS = ["pa", "lateral"] as const;
const ROTATIONS = Array.from({ length: 2 * HAND_MODEL.maxDeg + 1 }, (_, i) => i - HAND_MODEL.maxDeg); // the whole allowed range, −15…15
type S = { id: string; group: string; closed: boolean; drawn?: boolean; points: Pt[] };
const traced = (kind: (typeof KINDS)[number]) => outlines.views[kind].structures as unknown as S[];
const drawnBones = (kind: (typeof KINDS)[number]) => traced(kind).filter((s) => !["soft", "joints"].includes(s.group) && s.drawn !== false && s.points.length > 2);
const meanX = (parts: DrawnPart[]) => parts.flatMap((p) => p.points).reduce((a, p, _, all) => a + p[0] / all.length, 0);

describe("hand drawing from the traced outlines (RAD-072 2a)", () => {
  it("draws every structure exactly as traced at rotation 0", () => {
    for (const kind of KINDS) {
      const d = handOutlineDrawing(kind, 0);
      const byId = new Map(traced(kind).map((s) => [s.id, s]));
      for (const p of [d.soft, ...d.bones, ...d.joints])
        p.points.forEach(([x, y], i) => {
          const [tx, ty] = byId.get(p.id)!.points[i]!;
          expect(Math.abs(x - tx) + Math.abs(y - ty), `${kind} ${p.id} #${p.copy} point ${i}`).toBeLessThan(1e-6);
        });
    }
  });

  it("does not draw the sesamoid-like densities (drawn: false) or the single-point prominences", () => {
    for (const kind of KINDS) {
      const ids = new Set([...handOutlineDrawing(kind, 0).bones, ...handOutlineDrawing(kind, 0).joints].map((p) => p.id));
      for (const s of traced(kind)) if (s.drawn === false || s.points.length < 3) expect(ids.has(s.id), `${kind} ${s.id}`).toBe(false);
    }
  });

  // Open finding H1: a hand bone disappeared when the hand was rotated (the lateral thumb under the digit column at −10…−15°),
  // because the bones were drawn with OPAQUE fills from far to near. Now every bone keeps a translucent fill and its own edge on top.
  it("keeps every bone visible over the whole rotation range in both exams (H1)", () => {
    for (const kind of KINDS)
      for (const rot of ROTATIONS) {
        const d = handOutlineDrawing(kind, rot);
        const base = handOutlineDrawing(kind, 0);
        for (const s of drawnBones(kind)) {
          const parts = d.bones.filter((p) => p.id === s.id);
          expect(parts.length, `${kind} ${rot}° ${s.id}`).toBeGreaterThan(0);
          for (const p of parts) {
            expect(p.points.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))).toBe(true);
            if (p.closed) {
              const a0 = polygonArea(base.bones.find((q) => q.id === p.id && q.copy === p.copy)!.points);
              expect(polygonArea(p.points) / a0, `${kind} ${rot}° ${s.id} keeps its size`).toBeGreaterThan(0.5);
            }
          }
        }
        // draw order: every bone's edge (under-stroke and line) comes after ALL bone fills, and no fill is opaque
        const layers = handLayers(d);
        const lastFill = layers.map((l) => l.layer).lastIndexOf("boneFill");
        for (const p of d.bones) {
          const edge = layers.findIndex((l) => l.layer === "edge" && l.part === p);
          const under = layers.findIndex((l) => l.layer === "edgeUnder" && l.part === p);
          expect(edge, `${kind} ${rot}° ${p.id} edge`).toBeGreaterThan(lastFill);
          expect(under, `${kind} ${rot}° ${p.id} under-stroke`).toBeGreaterThan(lastFill);
          expect(under).toBeLessThan(layers.findIndex((l) => l.layer === "edge"));
          expect(copyOpacity(p.copies)).toBeLessThan(1);
        }
      }
  });

  it("really superimposes bones where the old opaque drawing hid them (lateral thumb over the digit column at −12°)", () => {
    const d = handOutlineDrawing("lateral", -12);
    const thumb = d.bones.filter((p) => p.id === "thumb-proximal")[0]!;
    const column = d.bones.filter((p) => p.id === "digits-group" || p.id === "metacarpal-stack");
    const span = (ps: DrawnPart[]): [number, number] => [Math.min(...ps.flatMap((p) => p.points.map((q) => q[0]))), Math.max(...ps.flatMap((p) => p.points.map((q) => q[0])))];
    const [t0, t1] = span([thumb]), [c0, c1] = span(column);
    expect(Math.min(t1, c1) - Math.max(t0, c0)).toBeGreaterThan(0);
  });

  it("turns in the same direction as the result image", () => {
    for (const rot of [5, 10, 15]) {
      // PA: the thumb moves the way the result image's thumb band moves (positive = toward the viewer's left)
      const thumbDx = meanX(handOutlineDrawing("pa", rot).bones.filter((p) => p.group === "thumb")) - meanX(handOutlineDrawing("pa", 0).bones.filter((p) => p.group === "thumb"));
      expect(Math.sign(thumbDx)).toBe(Math.sign(handPaAnchors(rot).thumb[0]!.du));
      // lateral: each digit's copy moves the way the result image's copy of that digit moves (5 … 2)
      const col = handLateralShifts(rot).column;
      const d = handOutlineDrawing("lateral", rot), b = handOutlineDrawing("lateral", 0);
      [0, 1, 2, 3].forEach((i) => {
        const dx = meanX(d.bones.filter((p) => p.id === "digits-group" && p.copy === i)) - meanX(b.bones.filter((p) => p.id === "digits-group" && p.copy === i));
        expect(Math.sign(Math.round(dx)), `digit copy ${i} at ${rot}°`).toBe(Math.sign(Math.round(col[i]! * 1000)));
      });
    }
  });

  it("mirrors for a right hand only on request", () => {
    const left = handOutlineDrawing("pa", 4), right = handOutlineDrawing("pa", 4, { mirror: true });
    const xs = traced("pa").find((s) => s.group === "soft")!.points.map((p) => p[0]);
    const axis2 = Math.min(...xs) + Math.max(...xs);
    right.bones.forEach((p, i) => p.points.forEach(([x, y], j) => expect([x, y]).toEqual([axis2 - left.bones[i]!.points[j]![0], left.bones[i]!.points[j]![1]])));
  });

  it("keeps the copies of a superimposed group as light as one bone at the base pose, and the guides thinner than a bone edge", () => {
    for (const n of [1, 2, 4]) expect(1 - (1 - copyOpacity(n)) ** n).toBeCloseTo(LIMB.boneFillOpacity, 10);
    expect(STROKE.guide).toBeLessThan(LIMB.edgeUnder);
  });
});
