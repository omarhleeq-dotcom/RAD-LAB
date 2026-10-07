import { describe, expect, it } from "vitest";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import { boxBlur, gaussianNoise, inspirationLut, renderRadiograph, rotationShiftU, scapulaOverlay, jawOverlay } from "./pipeline";
import { at, cmToPx, makePhantom, meanRect, plan, PX_PER_CM, render, stdRect } from "./test-utils";
import { TUNING } from "./tuning";

const spec = chestPaErect.radiograph;
const W = Math.round(35 * PX_PER_CM), H = Math.round(43 * PX_PER_CM);
const base = render();

/** x/y pixel of source-image coordinates in the baseline placement. */
const px = (u: number, v: number) => ({
  x: Math.round((base.plan.image.x1 + u * base.plan.image.widthCm) * PX_PER_CM),
  y: Math.round((base.plan.image.y1 + v * base.plan.image.heightCm) * PX_PER_CM),
});
/** Column (x) of the brightest pixel in a row band: the phantom's spine column. */
function spineX(o: typeof base.out, y: number) {
  let best = 0, bx = 0;
  for (let x = Math.round(W * 0.3); x < Math.round(W * 0.7); x++) {
    let s = 0;
    for (let k = -2; k <= 2; k++) s += at(o, x, y + k);
    if (s > best) { best = s; bx = x; }
  }
  return bx;
}
/** First row (from the top) at column x where the luma exceeds `thr`, scanning rows in [y1, y2). */
const firstRowAbove = (o: typeof base.out, x: number, y1: number, y2: number, thr: number) => {
  for (let y = y1; y < y2; y++) if (at(o, x, y) > thr) return y;
  return -1;
};

describe("pipeline: determinism and basics", () => {
  it("same state → byte-identical pixels (no uncontrolled randomness)", () => {
    const patch = { mas: 1, motionInstruction: "none", rotationDeg: 9, shoulderPosition: "relaxed", chinPosition: "tucked", breathing: "no-instruction", kvp: 80 } as const;
    const a = render(patch).out.luma, b = render(patch).out.luma;
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
  });

  it("output covers the whole detector at the requested working resolution", () => {
    expect(base.out.width).toBe(W);
    expect(base.out.height).toBe(H);
    expect(base.out.luma.length).toBe(W * H);
  });

  it("the deterministic noise source is ~N(0,1), reproducible and seed-dependent", () => {
    const n = 40000;
    let s = 0, s2 = 0;
    for (let i = 0; i < n; i++) { const g = gaussianNoise(i, 123); s += g; s2 += g * g; }
    expect(Math.abs(s / n)).toBeLessThan(0.03);
    expect(Math.sqrt(s2 / n)).toBeGreaterThan(0.95);
    expect(Math.sqrt(s2 / n)).toBeLessThan(1.05);
    expect(gaussianNoise(77, 123)).toBe(gaussianNoise(77, 123));
    expect(gaussianNoise(77, 123)).not.toBe(gaussianNoise(77, 124));
  });

  it("box blur preserves a constant image", () => {
    const flat = new Float32Array(30 * 20).fill(50);
    expect(Array.from(boxBlur(flat, 30, 20, 3, 2)).every((v) => Math.abs(v - 50) < 1e-4)).toBe(true);
  });
});

describe("rotation is drawn with anatomical cues, never by rotating the whole image", () => {
  const r0 = render({ rotationDeg: 0 }), rp = render({ rotationDeg: 15 }), rn = render({ rotationDeg: -15 });
  const y = px(0.5, 0.45).y;

  it("the spinous-process line moves right for + and left for −, more for larger rotation", () => {
    const x0 = spineX(r0.out, y), xp = spineX(rp.out, y), xn = spineX(rn.out, y), x5 = spineX(render({ rotationDeg: 5 }).out, y);
    expect(xp).toBeGreaterThan(x0);
    expect(xn).toBeLessThan(x0);
    expect(xp - x0).toBeGreaterThan(x5 - x0);
    expect(xp - x0).toBeGreaterThanOrEqual(Math.round(0.03 * base.plan.image.widthCm * PX_PER_CM));
  });

  it("the exposed-area footprint and the image frame are unchanged (a rotated picture would rotate them)", () => {
    const footprint = (o: typeof r0.out) => Array.from(o.luma, (v) => (v > TUNING.background + 3 ? 1 : 0));
    const f0 = footprint(r0.out), fp = footprint(rp.out);
    let diff = 0;
    for (let i = 0; i < f0.length; i++) if (f0[i] !== fp[i]) diff++;
    // Only the dark lung/edge pixels near the threshold may differ; a whole-image rotation would change thousands.
    expect(diff / f0.length).toBeLessThan(0.01);
    for (const [x, yy] of [[W * 0.2, 2], [W * 0.8, 2], [W * 0.2, H * 0.8], [W * 0.8, H * 0.8]] as const) {
      expect(Math.abs(at(rp.out, Math.round(x), Math.round(yy)) - at(r0.out, Math.round(x), Math.round(yy)))).toBeLessThan(40);
    }
  });

  it("the lateral rib-cage margins stay put while the interior shifts (hemithorax asymmetry)", () => {
    const rot = plan({ rotationDeg: 15 }).anatomy.rotation!;
    expect(Math.abs(rotationShiftU(spec.anatomyBox.u1, rot, spec))).toBeLessThan(0.002);
    expect(Math.abs(rotationShiftU(spec.anatomyBox.u2, rot, spec))).toBeLessThan(0.002);
    expect(rotationShiftU(spec.midlineU!, rot, spec)).toBeGreaterThan(0.05);
    // Left lung (viewer's left) is compressed, right expanded for positive rotation.
    const uL = spec.midlineU! - 0.2, uR = spec.midlineU! + 0.2;
    expect(rotationShiftU(uL, rot, spec)).toBeGreaterThan(0);
    expect(rotationShiftU(uR, rot, spec)).toBeGreaterThan(0);
    expect(rotationShiftU(spec.midlineU!, rot, spec)).toBeGreaterThan(rotationShiftU(uR, rot, spec));
  });

  it("± rotation are mirror-image cues (opposite shifts), not the same picture", () => {
    expect(Buffer.from(rp.out.luma).equals(Buffer.from(rn.out.luma))).toBe(false);
    expect(Buffer.from(rp.out.luma).equals(Buffer.from(r0.out.luma))).toBe(false);
  });
});

describe("inspiration: reduced expansion → higher diaphragm and shorter lungs", () => {
  const full = render({ breathing: "deep-inspiration-hold" }), reduced = render({ breathing: "expiration-hold" });
  const x = px(0.3, 0).x;

  it("the diaphragm edge sits higher and the apex does not move", () => {
    const y1 = px(0, 0.55).y, y2 = px(0, 0.95).y;
    const dFull = firstRowAbove(full.out, x, y1, y2, 100), dRed = firstRowAbove(reduced.out, x, y1, y2, 100);
    expect(dFull).toBeGreaterThan(0);
    expect(dRed).toBeGreaterThan(0);
    expect(dFull - dRed).toBeGreaterThanOrEqual(Math.round(0.03 * full.plan.image.heightCm * PX_PER_CM));
    const apexRow = px(0, spec.lungApexV! + 0.04).y;
    expect(Math.abs(at(full.out, x, apexRow) - at(reduced.out, x, apexRow))).toBeLessThan(8);
  });

  it("the vertical map is monotonic with fixed ends (no folding / duplication)", () => {
    const lut = inspirationLut(spec, TUNING.inspiration.extentReduction);
    expect(lut[0]).toBe(0);
    expect(lut[lut.length - 1]).toBe(1);
    for (let i = 1; i < lut.length; i++) expect(lut[i]!).toBeGreaterThanOrEqual(lut[i - 1]!);
    // Output rows above the dome map to source rows further down: the lungs are compressed.
    const v = spec.diaphragmDomeV! - 0.04;
    expect(lut[Math.round(v * (lut.length - 1))]!).toBeGreaterThan(v);
  });
});

describe("collimation / centering: clipped anatomy is actually missing from the image", () => {
  const bg = TUNING.background;
  const req = chestPaErect.requiredAnatomy;
  const region = { x1: cmToPx(req.xCm), y1: cmToPx(req.yCm), x2: cmToPx(req.xCm + req.widthCm), y2: cmToPx(req.yCm + req.heightCm) };
  const full = render({ collimation: { width: 1, height: 1 } });

  it.each([
    ["top", { centralRay: { x: 0, y: 0.35 }, collimation: { width: 1, height: 0.5 } }, "y", "less"],
    ["bottom", { centralRay: { x: 0, y: -0.7 }, collimation: { width: 1, height: 0.5 } }, "y", "greater"],
    ["left", { centralRay: { x: 0.55, y: -0.14 }, collimation: { width: 0.6, height: 1 } }, "x", "less"],
    ["right", { centralRay: { x: -0.55, y: -0.14 }, collimation: { width: 0.6, height: 1 } }, "x", "greater"],
  ] as const)("%s clipping: anatomy on that side of the field is unexposed", (side, patch, axis, which) => {
    const r = render(patch);
    expect(r.plan.fieldCm).toBeDefined();
    const f = r.out.fieldPx;
    // Every pixel outside the field is background; a probe row/column inside the required region on the clipped side is cut.
    const probe = side === "top" ? { x: Math.round((region.x1 + region.x2) / 2), y: region.y1 + 6 }
      : side === "bottom" ? { x: Math.round((region.x1 + region.x2) / 2), y: region.y2 - 6 }
      : side === "left" ? { x: region.x1 + 6, y: Math.round((region.y1 + region.y2) / 2) }
      : { x: region.x2 - 6, y: Math.round((region.y1 + region.y2) / 2) };
    expect(at(r.out, probe.x, probe.y), `${side} probe is unexposed`).toBeLessThanOrEqual(bg + 1);
    expect(at(full.out, probe.x, probe.y), `${side} probe is anatomy when fully open`).toBeGreaterThan(bg + 15);
    // The cut is on the correct side of the field.
    expect(axis === "y" ? (which === "less" ? probe.y < f.y1 : probe.y > f.y2) : which === "less" ? probe.x < f.x1 : probe.x > f.x2).toBe(true);
    // Nothing outside the field carries signal.
    for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) {
      if (x < f.x1 - 3 || x > f.x2 + 3 || y < f.y1 - 3 || y > f.y2 + 3) expect(at(r.out, x, y)).toBeLessThanOrEqual(bg + 1);
    }
  });

  it("an open field simply shows more; no scatter / contrast penalty is applied", () => {
    const tight = render({ collimation: { width: 0.94, height: 0.84 }, centralRay: { x: 0, y: -0.14 } });
    const inner = [cmToPx(6), cmToPx(8), cmToPx(28), cmToPx(30)] as const;
    expect(meanRect(tight.out, ...inner)).toBeCloseTo(meanRect(full.out, ...inner), 0);
    expect(stdRect(tight.out, ...inner)).toBeCloseTo(stdRect(full.out, ...inner), 0);
  });

  it("centering error moves the field but not the anatomy under it", () => {
    const a = render({ centralRay: { x: 0, y: -0.14 }, collimation: { width: 0.7, height: 0.7 } });
    const b = render({ centralRay: { x: 0.2, y: -0.14 }, collimation: { width: 0.7, height: 0.7 } });
    const x = cmToPx(24), y = cmToPx(20); // inside both fields
    expect(Math.abs(at(a.out, x, y) - at(b.out, x, y))).toBeLessThan(3);
    expect(Buffer.from(a.out.luma).equals(Buffer.from(b.out.luma))).toBe(false);
  });
});

describe("technique effects: noise ≠ brightness; excess exposure ≠ darkening; penetration is local", () => {
  const ref = render();
  const inner = [cmToPx(6), cmToPx(6), cmToPx(29), cmToPx(32)] as const;

  it("low detector exposure adds noise and does NOT brighten the image", () => {
    for (const mas of [2, 1, 0.5]) {
      const low = render({ mas });
      expect(low.plan.technique.noiseSigma).toBeGreaterThan(0);
      expect(Math.abs(low.out.meanInField - ref.out.meanInField), `mAs ${mas}`).toBeLessThan(1.5);
      expect(Math.abs(meanRect(low.out, ...inner) - meanRect(ref.out, ...inner))).toBeLessThan(2);
      // …but it is visibly noisier in a flat region of the phantom (the lung field).
      const lung = [cmToPx(9), cmToPx(12), cmToPx(13), cmToPx(20)] as const;
      expect(stdRect(low.out, ...lung)).toBeGreaterThan(stdRect(ref.out, ...lung) + 2);
    }
  });

  it("noise grows as exposure falls", () => {
    const lung = [cmToPx(9), cmToPx(12), cmToPx(13), cmToPx(20)] as const;
    const s = [2, 1, 0.5].map((mas) => stdRect(render({ mas }).out, ...lung));
    expect(s[1]!).toBeGreaterThan(s[0]!);
    expect(s[2]!).toBeGreaterThan(s[1]!);
  });

  it("low exposure reduces fine low-contrast detail", () => {
    const zone = [cmToPx(14), cmToPx(10), cmToPx(21), cmToPx(14)] as const;
    // Dense-zone texture is ±30 stripes; with the noise removed from the comparison the detail gain is < 1.
    expect(render({ mas: 0.5 }).plan.technique.detailGain).toBeLessThan(0.7);
    expect(stdRect(ref.out, ...zone)).toBeGreaterThan(0);
  });

  it("excess detector exposure is pixel-identical to the reference: no darkening, no change at all", () => {
    for (const mas of [6.3, 12.5, 40]) {
      const hi = render({ mas });
      expect(Buffer.from(hi.out.luma).equals(Buffer.from(ref.out.luma)), `mAs ${mas}`).toBe(true);
      expect(hi.out.meanInField).toBe(ref.out.meanInField);
    }
  });

  it("neither exposure direction changes the picture's brightness (display processing keeps it normalised)", () => {
    const means = [0.5, 1, 3.2, 12.5, 40].map((mas) => render({ mas }).out.meanInField);
    expect(Math.max(...means) - Math.min(...means)).toBeLessThan(1.5);
  });

  it("low penetration reduces structure contrast inside the dense zones only, with no global brightness shift", () => {
    // kV low, mAs high enough that detector exposure is not low: isolates penetration from noise.
    const lp = render({ kvp: 70, mas: 40 });
    expect(lp.plan.technique.noiseSigma).toBe(0);
    const z = chestPaErect.radiograph.denseZones![0]!;
    const zc = px(z.cu, z.cv);
    const zoneRect = [zc.x - 4, zc.y - 40, zc.x + 4, zc.y + 40] as const;
    const outRect = [px(0.14, 0.4).x, px(0.14, 0.4).y, px(0.22, 0.4).x, px(0.14, 0.5).y] as const; // peripheral lung, outside zones
    expect(stdRect(lp.out, ...zoneRect)).toBeLessThan(stdRect(ref.out, ...zoneRect) * 0.7);
    expect(Math.abs(stdRect(lp.out, ...outRect) - stdRect(ref.out, ...outRect))).toBeLessThan(1.5);
    expect(Math.abs(lp.out.meanInField - ref.out.meanInField)).toBeLessThan(1.5);
    expect(Math.abs(meanRect(lp.out, ...outRect) - meanRect(ref.out, ...outRect))).toBeLessThan(2);
  });

  it("more mAs does not repair low penetration", () => {
    const a = render({ kvp: 70, mas: 16 }), b = render({ kvp: 70, mas: 40 });
    expect(a.plan.technique.penetrationContrastKept).toBe(b.plan.technique.penetrationContrastKept);
    expect(Buffer.from(a.out.luma).equals(Buffer.from(b.out.luma))).toBe(true);
  });
});

describe("motion → loss of sharpness; distinct from noise", () => {
  const sharp = render(), moved = render({ motionInstruction: "none" });
  /** Largest vertical step across the phantom's diaphragm edge. */
  const edge = (o: typeof sharp.out) => {
    const x = px(0.3, 0).x;
    let m = 0;
    for (let y = px(0, 0.6).y; y < px(0, 0.95).y; y++) m = Math.max(m, Math.abs(at(o, x, y + 1) - at(o, x, y)));
    return m;
  };

  it("blurs edges", () => {
    expect(edge(moved.out)).toBeLessThan(edge(sharp.out) * 0.6);
  });

  it("adds no noise and does not change brightness", () => {
    expect(moved.plan.technique.noiseSigma).toBe(0);
    const flat = [cmToPx(9), cmToPx(12), cmToPx(13), cmToPx(20)] as const;
    expect(stdRect(moved.out, ...flat)).toBeLessThan(stdRect(sharp.out, ...flat) + 1);
    expect(Math.abs(moved.out.meanInField - sharp.out.meanInField)).toBeLessThan(1.5);
  });

  it("low exposure alone does not blur; motion alone does not add noise", () => {
    const low = render({ mas: 1 });
    expect(low.plan.motion).toBeNull();
    expect(edge(low.out)).toBeGreaterThan(edge(sharp.out) * 0.5);
    const lung = [cmToPx(9), cmToPx(12), cmToPx(13), cmToPx(20)] as const;
    expect(stdRect(low.out, ...lung)).toBeGreaterThan(stdRect(moved.out, ...lung) + 2);
  });

  it("is independent of technique values: motion appears only with the instruction, whatever kVp / mAs / SID", () => {
    for (const patch of [{ kvp: 50 }, { mas: 40 }, { sidCm: 100 }]) {
      expect(render({ ...patch, motionInstruction: "remain-still" }).plan.motion).toBeNull();
      expect(render({ ...patch, motionInstruction: "none" }).plan.motion).not.toBeNull();
    }
  });
});

describe("positioning overlays are schematic, local and additive", () => {
  it("scapulae add density over the lateral lung fields only when the shoulders are not forward", () => {
    const fwd = render({ shoulderPosition: "rolled-forward" }), relaxed = render({ shoulderPosition: "relaxed" });
    const s = spec.scapulae!.left;
    const p = px(s.cu + s.ru * 0.8, s.cv); // medial border of the left scapula
    expect(at(relaxed.out, p.x, p.y)).toBeGreaterThan(at(fwd.out, p.x, p.y) + 8);
    const far = px(0.5, 0.9); // nowhere near a scapula
    expect(Math.abs(at(relaxed.out, far.x, far.y) - at(fwd.out, far.x, far.y))).toBeLessThan(6);
    expect(scapulaOverlay(spec.scapulae!.left, "left", 0.9, 0.9)).toBe(0);
  });

  it("the jaw overlay covers the apices only when the chin is tucked", () => {
    const up = render({ chinPosition: "elevated" }), down = render({ chinPosition: "tucked" });
    const p = px(0.49, 0.1);
    expect(at(down.out, p.x, p.y)).toBeGreaterThan(at(up.out, p.x, p.y) + 8);
    expect(jawOverlay(spec, 0.1, 0.1)).toBe(0);
    expect(jawOverlay(spec, 0.49, 0.5)).toBeLessThan(1);
  });
});

describe("combined errors do not fight each other", () => {
  const combo = {
    rotationDeg: 10, centralRay: { x: 0.35, y: -0.14 }, collimation: { width: 0.6, height: 0.9 },
    mas: 1, kvp: 80, shoulderPosition: "relaxed", chinPosition: "tucked", breathing: "no-instruction", motionInstruction: "none",
  } as const;
  it("renders every effect together, deterministically, inside the field only", () => {
    const a = render(combo), b = render(combo);
    expect(Buffer.from(a.out.luma).equals(Buffer.from(b.out.luma))).toBe(true);
    const f = a.out.fieldPx;
    for (let y = 0; y < H; y += 5) for (let x = 0; x < W; x += 5) {
      if (x < f.x1 - 3 || x > f.x2 + 3 || y < f.y1 - 3 || y > f.y2 + 3) expect(at(a.out, x, y)).toBeLessThanOrEqual(TUNING.background + 1);
    }
    expect(a.out.meanInField).toBeGreaterThan(40);
    expect(Math.abs(a.out.meanInField - render({ ...combo, mas: 3.2, kvp: 120 }).out.meanInField)).toBeLessThan(12);
  });

  it("rotation + clipping: the cut is by the field, the rotation shows inside it", () => {
    const rc = render({ rotationDeg: 12, centralRay: { x: 0, y: -0.14 }, collimation: { width: 0.5, height: 0.9 } });
    const f = rc.out.fieldPx;
    expect(at(rc.out, Math.round(f.x1) - 8, H / 2)).toBeLessThanOrEqual(TUNING.background + 1);
    const y = px(0.5, 0.45).y;
    expect(spineX(rc.out, y)).toBeGreaterThan(spineX(render({ rotationDeg: 0, centralRay: { x: 0, y: -0.14 }, collimation: { width: 0.5, height: 0.9 } }).out, y));
  });
});

describe("renderer is independent of the scoring path", () => {
  it("renderRadiograph takes the plan and the image only (no settings, no score, no locale)", () => {
    expect(renderRadiograph.length).toBe(4);
    const p = plan();
    expect(Object.keys(p)).not.toEqual(expect.arrayContaining(["score", "checks", "locale"]));
  });

  it("the phantom pipeline never mutates its inputs (pure)", () => {
    const src = makePhantom();
    const copy = Float32Array.from(src.data as Float32Array);
    renderRadiograph(plan({ mas: 1, rotationDeg: 8, motionInstruction: "none", kvp: 70 }), spec, src, PX_PER_CM);
    expect(Buffer.from(src.data as Float32Array).equals(Buffer.from(copy))).toBe(true);
  });
});

describe("detector area the baseline does not cover (regression: must never render as black)", () => {
  const ref = render({ collimation: { width: 1, height: 1 }, centralRay: { x: 0, y: 0 } }); // field = whole detector
  const im = ref.plan.image;
  const bandBottom = { x1: cmToPx(8), x2: cmToPx(28), y1: cmToPx(im.y1 + im.heightCm) + 3, y2: H - 3 };
  const bandLeft = { x1: 3, x2: cmToPx(im.x1) - 3, y1: cmToPx(5), y2: cmToPx(30) };
  const values = (o: typeof ref.out, b: typeof bandBottom) => {
    const v = new Set<number>();
    for (let y = b.y1; y < b.y2; y++) for (let x = b.x1; x < b.x2; x++) v.add(at(o, x, y));
    return v;
  };

  it("the reference image really leaves bands on the bottom and both sides", () => {
    expect(im.y1 + im.heightCm).toBeLessThan(43 - 3);
    expect(im.x1).toBeGreaterThan(1);
    expect(35 - (im.x1 + im.widthCm)).toBeGreaterThan(1);
    expect(bandBottom.y2 - bandBottom.y1).toBeGreaterThan(20);
    expect(bandLeft.x2 - bandLeft.x1).toBeGreaterThan(4);
  });

  it("inside the field they are a neutral grey hatch, clearly different from black exposure / the collimator shadow", () => {
    for (const band of [bandBottom, bandLeft]) {
      const v = values(ref.out, band);
      expect([...v].sort()).toEqual([TUNING.noData.dark, TUNING.noData.light].sort());
      expect(Math.min(...v)).toBeGreaterThan(TUNING.background + 60);
      expect(Math.min(...v)).toBeGreaterThan(60);
    }
  });

  it("alternates (it is a pattern, not a flat tone that could be read as anatomy or collimation)", () => {
    let flips = 0, prev = -1;
    const y = Math.round((bandBottom.y1 + bandBottom.y2) / 2);
    for (let x = bandBottom.x1; x < bandBottom.x2; x++) { const c = at(ref.out, x, y); if (prev !== -1 && c !== prev) flips++; prev = c; }
    expect(flips).toBeGreaterThan(4);
  });

  it("outside the collimated field the same detector area is the dark collimator shadow, not the hatch", () => {
    const tight = render({ centralRay: { x: 0, y: -0.4 }, collimation: { width: 0.9, height: 0.4 } });
    expect(tight.plan.fieldCm.y2).toBeLessThan(im.y1 + im.heightCm);
    for (let y = bandBottom.y1; y < bandBottom.y2; y += 2) for (let x = bandBottom.x1; x < bandBottom.x2; x += 2) expect(at(tight.out, x, y)).toBeLessThanOrEqual(TUNING.background + 1);
  });

  it("the hatch is identical whatever effects are on the image (no noise, blur, penetration or rotation bleeds into it)", () => {
    const heavy = render({ collimation: { width: 1, height: 1 }, centralRay: { x: 0, y: 0 }, mas: 0.5, kvp: 70, motionInstruction: "none", rotationDeg: 15, breathing: "no-instruction", shoulderPosition: "relaxed", chinPosition: "tucked" });
    for (const band of [bandBottom, bandLeft]) {
      for (let y = band.y1; y < band.y2; y++) for (let x = band.x1; x < band.x2; x++) expect(at(heavy.out, x, y)).toBe(at(ref.out, x, y));
    }
  });

  it("display normalisation ignores the hatch: brightness is measured on image data only", () => {
    const x1 = cmToPx(im.x1) + 6, x2 = cmToPx(im.x1 + im.widthCm) - 6, y2 = cmToPx(im.y1 + im.heightCm) - 6;
    const dataMean = meanRect(ref.out, x1, 0, x2, y2);
    expect(Math.abs(ref.out.meanInField - dataMean)).toBeLessThan(2);
  });
});

