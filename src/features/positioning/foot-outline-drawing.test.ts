import { describe, expect, it } from "vitest";
import { FOOT_MODEL, LOWER_LIMB_MODEL, type FootKind } from "@/features/lower-limb-model/lower-limb-model";
import { LOWER_LIMB_RADIOGRAPHS } from "@/data/cases/lower-limb-radiographs";
import outlines from "./foot-outlines.json";
import { footOutlineDrawing, footRigidShifts, type DrawnPart } from "./foot-outline-drawing";
import { footSideProportions } from "./foot-side-proportions";
import { limbRotationPlan } from "@/features/radiograph/limb-effects";
import { copyOpacity, outlineLayers } from "./outline-layers";
import { polygonArea, type Pt } from "./outline-geometry";

const KINDS: FootKind[] = ["ap", "oblique"];
// the console values: the AP's turn is −15…15; the oblique's console value is the absolute plantar angle (the model uses its deviation from 40°, clamped)
const RANGE: Record<FootKind, number[]> = {
  ap: Array.from({ length: 2 * LOWER_LIMB_MODEL.maxDeg + 1 }, (_, i) => i - LOWER_LIMB_MODEL.maxDeg),
  oblique: Array.from({ length: 71 }, (_, i) => i), // the exam's control: 0…70°
};
type S = { id: string; group: string; closed: boolean; drawn?: boolean; points: Pt[] };
const traced = (kind: FootKind) => outlines.views[kind].structures as unknown as S[];
const drawnBones = (kind: FootKind) => traced(kind).filter((s) => !["soft", "joints"].includes(s.group) && s.drawn !== false && s.points.length > 2);
const centroidX = (pts: Pt[]) => pts.reduce((a, p) => a + p[0], 0) / pts.length;

describe("foot drawing from the traced outlines (RAD-072 2b)", () => {
  it("draws every structure exactly as traced at the base pose (AP 0°, oblique 40°)", () => {
    for (const [kind, base] of [["ap", 0], ["oblique", 40]] as const) {
      const d = footOutlineDrawing(kind, base);
      const byId = new Map(traced(kind).map((s) => [s.id, s]));
      for (const p of [...d.soft, ...d.bones, ...d.joints])
        p.points.forEach(([x, y], i) => {
          const [tx, ty] = byId.get(p.id)!.points[i]!;
          expect(Math.abs(x - tx) + Math.abs(y - ty), `${kind} ${p.id} point ${i}`).toBeLessThan(1e-6);
        });
    }
  });

  it("does not draw the sesamoids (drawn: false) or single points", () => {
    for (const kind of KINDS) {
      const ids = new Set(footOutlineDrawing(kind, 0).bones.map((p) => p.id));
      expect(ids.has("sesamoid-tibial") || ids.has("sesamoid-fibular")).toBe(false);
      for (const s of traced(kind)) if (s.drawn === false) expect(ids.has(s.id)).toBe(false);
    }
  });

  // Owner finding #13: bones were sheared by the result image's band warp. The drawing moves every bone as a RIGID piece.
  it("moves every bone rigidly over the whole range: no bone is bent, resized or tilted (#13)", () => {
    for (const kind of KINDS)
      for (const v of RANGE[kind]) {
        const d = footOutlineDrawing(kind, v);
        const b = footOutlineDrawing(kind, kind === "ap" ? 0 : 40);
        for (const p of [...d.bones, ...d.joints]) {
          const q = b.bones.concat(b.joints).find((x) => x.id === p.id)!;
          const dx0 = p.points[0]![0] - q.points[0]![0];
          p.points.forEach(([x, y], i) => {
            expect(y, `${kind} ${v}° ${p.id} y`).toBe(q.points[i]![1]);
            expect(x - q.points[i]![0], `${kind} ${v}° ${p.id} rigid`).toBeCloseTo(dx0, 6);
          });
        }
      }
  });

  // Owner decision (DECISIONS #radiograph-foot-edges-owner-2026-11-04, item 4): each toe moves WITH its metatarsal ray, by the ray shift the
  // RESULT IMAGE uses (the plan's metatarsal anchors, band 2, read by `footRayAnchors`), at every console station.
  it("moves each toe with its metatarsal by the result image's own ray shift at every console station", () => {
    for (const kind of KINDS) {
      const W = FOOT_MODEL[kind].widthPx, lm = LOWER_LIMB_RADIOGRAPHS[kind === "ap" ? "foot-ap" : "foot-oblique"].limbRotation;
      const b = footOutlineDrawing(kind, kind === "ap" ? 0 : 40);
      for (const v of RANGE[kind]) {
        const d = footOutlineDrawing(kind, v);
        const plan = limbRotationPlan(v, true, lm);
        const dx = (id: string) => centroidX(d.bones.concat(d.joints).find((x) => x.id === id)!.points) - centroidX(b.bones.concat(b.joints).find((x) => x.id === id)!.points);
        for (let n = 1; n <= 5; n++) {
          const ray = (plan?.hand?.anchors?.[1]?.[n - 1]?.du ?? 0) * W; // no plan only at the base pose: every shift is 0
          expect(dx(`mt${n}`), `${kind} ${v}° mt${n}`).toBeCloseTo(ray, 6);
          for (const p of d.bones.concat(d.joints).filter((x) => x.id.startsWith(`t${n}-`)))
            expect(dx(p.id), `${kind} ${v}° ${p.id} = mt${n}`).toBeCloseTo(dx(`mt${n}`), 9);
        }
      }
    }
  });

  it("the rigid shift is the model's own displacement at the bone (and the tarsals do not move)", () => {
    for (const kind of KINDS) {
      const s = footRigidShifts(kind, kind === "ap" ? 12 : 55);
      expect(Object.values(s).every(Number.isFinite)).toBe(true);
      const d = footOutlineDrawing(kind, kind === "ap" ? 12 : 55), b = footOutlineDrawing(kind, kind === "ap" ? 0 : 40);
      for (const p of d.bones.filter((x) => x.group === "tarsals")) expect(centroidX(p.points)).toBeCloseTo(centroidX(b.bones.find((x) => x.id === p.id)!.points), 9);
    }
  });

  // Overlapping bones stay visible over the whole range: translucent fills, every edge on top.
  it("keeps every bone visible (own edge on top of all fills) over the whole range in both exams", () => {
    for (const kind of KINDS)
      for (const v of RANGE[kind]) {
        const d = footOutlineDrawing(kind, v);
        const base = footOutlineDrawing(kind, kind === "ap" ? 0 : 40);
        for (const s of drawnBones(kind)) {
          const p = d.bones.find((x) => x.id === s.id);
          expect(p, `${kind} ${v}° ${s.id}`).toBeDefined();
          const fill = (q: DrawnPart) => q.fillPoints ?? q.points;
          expect(polygonArea(fill(p!)) / polygonArea(fill(base.bones.find((x) => x.id === s.id)!)), `${kind} ${v}° ${s.id} size`).toBeCloseTo(1, 9);
        }
        const layers = outlineLayers(d);
        const lastFill = layers.map((l) => l.layer).lastIndexOf("boneFill");
        for (const p of d.bones) {
          expect(layers.findIndex((l) => l.layer === "edge" && l.part === p), `${kind} ${v}° ${p.id} edge`).toBeGreaterThan(lastFill);
          expect(layers.findIndex((l) => l.layer === "edgeUnder" && l.part === p), `${kind} ${v}° ${p.id} under`).toBeGreaterThan(lastFill);
          expect(copyOpacity(p.copies)).toBeLessThan(1);
        }
      }
  });

  it("the oblique at 25° and 55° (the clamp) draws the same as 25° / 55° of deviation and never beyond", () => {
    expect(footOutlineDrawing("oblique", 70)).toEqual(footOutlineDrawing("oblique", 55));
    expect(footOutlineDrawing("oblique", 0)).toEqual(footOutlineDrawing("oblique", 25));
  });

  it("mirrors for a left foot only on request", () => {
    const right = footOutlineDrawing("ap", 4), left = footOutlineDrawing("ap", 4, { mirror: true });
    const xs = traced("ap").filter((s) => s.group === "soft").flatMap((s) => s.points.map((p) => p[0]));
    const axis2 = Math.min(...xs) + Math.max(...xs);
    left.bones.forEach((p, i) => p.points.forEach(([x, y], j) => expect([x, y]).toEqual([axis2 - right.bones[i]!.points[j]![0], right.bones[i]!.points[j]![1]])));
  });

  // Side view: proportions only, read from the traced foot (no geometry or scoring change).
  it("the side view's toe reach and forefoot width come from the traced foot", () => {
    for (const kind of ["foot-ap", "foot-oblique"] as const) {
      const p = footSideProportions(kind);
      expect(p.toeReach).toBeGreaterThan(60);
      expect(p.toeReach).toBeLessThan(110);
      expect(p.forefootWidth).toBeGreaterThan(40);
      expect(p.forefootWidth).toBeLessThan(80);
    }
  });
});
