/**
 * Session 5 fix pass 2 — scoring vs picture at the edges of the provisional required region.
 *
 * The score clips against `RadCase.requiredAnatomy` (27 × 31 cm demo region, case data, NOT derived from the
 * baseline). The baseline's landmark box (apices → costophrenic angles) is 27 × ~28 cm and sits centred inside it,
 * leaving ≈ 1.5 cm strips above and below. These tests pin down, for a field edge in those strips:
 *   - the CLINICAL criterion / score are unchanged (the region is still 27 × 31, the check still fails);
 *   - the plan reports honestly that only the margin is cut (`marginOnlySides`), not the drawn lungs;
 *   - the pixels agree with that report: the field mask cuts exactly at the field edge (strip content is removed),
 *     the drawn lungs / costophrenic angles are fully exposed, and a deeper cut that does reach them is reported
 *     as landmark clipping and does remove them.
 */
import { describe, expect, it } from "vitest";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import { describeRadiograph } from "./alt";
import { at, cmToPx, plan, render } from "./test-utils";
import { evaluate } from "@/features/evaluation/engine";
import { TUNING } from "./tuning";

const D = chestPaErect.detector;
/** Settings for a full-width field whose top / bottom edges lie at the given detector y (cm). */
const field = (y1: number, y2: number) => ({
  centralRay: { x: 0, y: ((y1 + y2) / 2 / D.heightCm) * 2 - 1 },
  collimation: { width: 1, height: (y2 - y1) / D.heightCm },
});
const sets = (y1: number, y2: number) => ({ ...chestPaErect.initialSettings, projection: "pa-erect" as const, ...field(y1, y2) });
const check = (y1: number, y2: number) => evaluate(chestPaErect, sets(y1, y2)).checks.find((c) => c.ruleId === "collimation-clipping")!;

const base = plan();
const landmarkTop = base.image.y1 + chestPaErect.radiograph.anatomyBox.v1 * base.image.heightCm;
const landmarkBottom = base.image.y1 + chestPaErect.radiograph.anatomyBox.v2 * base.image.heightCm;
const region = chestPaErect.requiredAnatomy;
const regionTop = region.yCm, regionBottom = region.yCm + region.heightCm;

describe("the clinical criterion is not adapted to the baseline picture", () => {
  it("the region is still the provisional 27 × 31 cm demo value and the strips really exist", () => {
    expect(region).toMatchObject({ widthCm: 27, heightCm: 31 });
    expect(landmarkTop - regionTop).toBeGreaterThan(1.2);
    expect(regionBottom - landmarkBottom).toBeGreaterThan(1.2);
  });

  it("a field edge that cuts only a strip still FAILS the clipping check (same as the references' 'include the whole region')", () => {
    expect(check(regionTop + 0.5, 40).outcome).toBe("fail");
    expect(check(0, regionBottom - 0.5).outcome).toBe("fail");
    expect(check(regionTop - 0.2, regionBottom + 0.2).outcome).toBe("pass");
  });
});

describe("plan: margin-only vs landmark clipping", () => {
  it("top edge inside the top strip → clipped top, margin only", () => {
    const p = plan(field(regionTop + 0.6, 40));
    expect(p.clippedSides).toEqual(["top"]);
    expect(p.marginOnlySides).toEqual(["top"]);
    expect(p.landmarkClippedSides).toEqual([]);
    expect(p.effects.map((e) => e.id)).toContain("collimation-clipping");
  });

  it("bottom edge inside the bottom strip → clipped bottom, margin only", () => {
    const p = plan(field(0, regionBottom - 0.6));
    expect(p.clippedSides).toEqual(["bottom"]);
    expect(p.marginOnlySides).toEqual(["bottom"]);
    expect(p.landmarkClippedSides).toEqual([]);
  });

  it("an edge that reaches the drawn lungs / costophrenic angles is landmark clipping, not margin only", () => {
    const top = plan(field(landmarkTop + 1, 40));
    expect(top.landmarkClippedSides).toEqual(["top"]);
    expect(top.marginOnlySides).toEqual([]);
    const bottom = plan(field(0, landmarkBottom - 1));
    expect(bottom.landmarkClippedSides).toEqual(["bottom"]);
    expect(bottom.marginOnlySides).toEqual([]);
  });

  it("left / right: the box spans the region's full width, so every lateral clip is landmark clipping", () => {
    for (const side of ["left", "right"] as const) {
      const p = plan(side === "left"
        ? { centralRay: { x: 0.5, y: -0.14 }, collimation: { width: 0.6, height: 0.9 } }
        : { centralRay: { x: -0.5, y: -0.14 }, collimation: { width: 0.6, height: 0.9 } });
      expect(p.clippedSides).toContain(side);
      expect(p.landmarkClippedSides).toContain(side);
      expect(p.marginOnlySides).not.toContain(side);
    }
  });

  it("no clipping → both lists empty", () => {
    const p = plan({ collimation: { width: 1, height: 1 } });
    expect(p.clippedSides).toEqual([]);
    expect(p.landmarkClippedSides).toEqual([]);
    expect(p.marginOnlySides).toEqual([]);
  });

  it("mixed: top cuts the lungs, bottom only the margin → each side classified separately", () => {
    const p = plan(field(landmarkTop + 1, regionBottom - 0.6));
    expect(p.clippedSides.sort()).toEqual(["bottom", "top"]);
    expect(p.landmarkClippedSides).toEqual(["top"]);
    expect(p.marginOnlySides).toEqual(["bottom"]);
  });

  it("the text alternative carries the margin-only sides", () => {
    expect(describeRadiograph(plan(field(regionTop + 0.6, 40))).marginOnlySides).toEqual(["top"]);
    expect(describeRadiograph(plan(field(landmarkTop + 1, 40))).marginOnlySides).toEqual([]);
  });
});

describe("pixels agree with the report (renderer reads the plan, never the score)", () => {
  const colX = cmToPx(region.xCm + region.widthCm / 2 - 6); // inside a lung column, left of the midline spine
  it("margin-only top cut: the strip above the field is masked, the first drawn-lung row and below are exposed", () => {
    const y1 = regionTop + 0.6;
    const { out } = render(field(y1, 40));
    const bg = TUNING.background;
    expect(at(out, colX, cmToPx(y1 - 0.4))).toBeCloseTo(bg, 0); // above the field edge: unexposed
    expect(at(out, colX, cmToPx(y1 + 0.4))).toBeGreaterThan(bg + 5); // inside the field strip: image content
    expect(at(out, colX, cmToPx(landmarkTop + 0.5))).toBeGreaterThan(bg + 5); // drawn lungs: exposed
  });

  it("margin-only bottom cut: the drawn lungs / costophrenic angles keep their pixels", () => {
    const y2 = regionBottom - 0.6;
    const { out } = render(field(0, y2));
    const bg = TUNING.background;
    expect(at(out, colX, cmToPx(landmarkBottom - 0.5))).toBeGreaterThan(bg + 5);
    expect(at(out, colX, cmToPx(y2 + 0.4))).toBeCloseTo(bg, 0);
  });

  it("landmark clip: the lungs themselves are masked above the edge", () => {
    const y1 = landmarkTop + 1.5;
    const { out } = render(field(y1, 40));
    expect(at(out, colX, cmToPx(landmarkTop + 0.5))).toBeCloseTo(TUNING.background, 0);
    expect(at(out, colX, cmToPx(y1 + 0.5))).toBeGreaterThan(TUNING.background + 5);
  });
});
