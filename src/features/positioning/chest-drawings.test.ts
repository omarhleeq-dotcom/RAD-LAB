import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";
import { CASES } from "@/data/cases";
import { fitAnatomyBox } from "@/features/simulation/geometry";
import { CHEST_LATERAL_FIGURE, CHEST_PA_FIGURE, U } from "./detector-figures";
import { PlanView } from "./PlanView";
import { AP_SIDE, apSideLayout } from "./visual-model";

const lateral = CASES.find((c) => c.id === "chest-lateral-erect")!;
const render = (node: React.ReactElement, locale: "en" | "ar" = "en") => renderToStaticMarkup(createElement(
  NextIntlClientProvider as ComponentType<Record<string, unknown>>,
  { locale, messages: locale === "en" ? en : ar, timeZone: "UTC" }, node,
));

// Read the actual SVG transform and ellipse: catches a return to the PA torso even if the labels still say lateral.
function topGeometry(deg: number, arms: string, locale: "en" | "ar", side: "L" | "R" = "L") {
  const html = render(createElement(PlanView, {
    radCase: lateral, settings: { ...lateral.initialSettings, projection: "lateral-left", rotationDeg: deg, choices: { side, arms } }, showGuides: true,
  }), locale);
  const match = html.match(/<g transform="translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\) scale\(([-\d.]+)\)"><ellipse data-anatomy="torso"[^>]*rx="([\d.]+)" ry="([\d.]+)"/)!;
  expect(match).not.toBeNull();
  const [cx, cy, angle, scale, rx, ry] = match.slice(1).map(Number) as [number, number, number, number, number, number];
  const point = (x: number, y: number) => ({
    x: cx + scale * (x * Math.cos(angle * Math.PI / 180) - y * Math.sin(angle * Math.PI / 180)),
    y: cy + scale * (x * Math.sin(angle * Math.PI / 180) + y * Math.cos(angle * Math.PI / 180)),
  });
  return { html, point, rx, ry };
}

describe("Chest Lateral overhead geometry (RAD-072)", () => {
  for (const locale of ["en", "ar"] as const) for (const arms of ["raised", "lowered"]) {
    it(`${locale}, ${arms}: transverse axis perpendicular to detector, LEFT at detector, front toward detector-view anterior`, () => {
      const { html, point, rx, ry } = topGeometry(0, arms, locale);
      const right = point(0, ry), left = point(0, -ry);
      const detector = html.match(/<rect x="([\d.]+)"[^>]*width="22"/)!;
      expect(left.x).toBeCloseTo(Number(detector[1]), 8);
      expect(left.y).toBeCloseTo(right.y, 8); // horizontal transverse axis, vertical detector
      expect(left.x).toBeGreaterThan(right.x); // tube to the right side, detector at the left side
      const front = point(rx, 0), back = point(-rx, 0);
      expect(front.x).toBeCloseTo(back.x, 8); // AP axis parallel to detector
      expect(front.y).toBeGreaterThan(back.y); // anterior at the bottom of the overhead view = left in detector display
      // In a view from above, an anterior vector pointing down has anatomical LEFT to screen right.
      const centre = point(0, 0);
      expect((front.x - centre.x) * (left.y - centre.y) - (front.y - centre.y) * (left.x - centre.x)).toBeLessThan(0);
      // RAD-072 1b (one BODY proportion set): the right–left (shoulder) axis is longer than the front-to-back depth, as in the PA.
      expect(ry).toBeGreaterThan(rx);
      const armXs = [...html.matchAll(/data-anatomy="(?:raised-arm|anterior-arm)" cx="([\d.]+)"/g)].map((m) => Number(m[1]));
      expect(armXs).toHaveLength(2);
      for (const x of armXs) {
        if (arms === "raised") expect(x).toBeGreaterThan(rx);
        else expect(x).toBeGreaterThan(0);
      }
    });
    it(`${locale}, ${arms}: 8° rotates about the same vertical body axis from lateral`, () => {
      const zero = topGeometry(0, arms, locale), turned = topGeometry(8, arms, locale);
      expect(turned.point(0, 0)).toEqual(zero.point(0, 0));
      const right = turned.point(0, turned.ry), left = turned.point(0, -turned.ry);
      expect(Math.abs(Math.atan2(left.y - right.y, left.x - right.x) * 180 / Math.PI)).toBeCloseTo(8, 8);
    });
  }
});

describe("Chest Lateral overhead: the chosen side is drawn against the detector (RAD-072 1b, T2)", () => {
  for (const side of ["L", "R"] as const) for (const deg of [0, 8]) {
    it(`side ${side}, ${deg}°: that side touches the detector, the other faces the tube`, () => {
      const { html, point, rx, ry } = topGeometry(deg, "raised", "en", side);
      const detectorX = Number(html.match(/<rect x="([\d.]+)"[^>]*width="22"/)![1]);
      // Anatomical left is local −y, right is local +y.
      const atDetector = point(0, side === "L" ? -ry : ry), atTube = point(0, side === "L" ? ry : -ry);
      if (deg === 0) expect(atDetector.x).toBeCloseTo(detectorX, 8);
      expect(atDetector.x).toBeGreaterThan(atTube.x);
      expect(html).toContain(`data-anatomy="${side === "L" ? "left" : "right"}-contact"`);
      expect(html).not.toContain(`data-anatomy="${side === "L" ? "right" : "left"}-contact"`);
      // Viewed from above: anterior is toward the bottom for the left side, toward the top for the right side.
      const front = point(rx, 0), back = point(-rx, 0);
      if (side === "L") expect(front.y).toBeGreaterThan(back.y);
      else expect(front.y).toBeLessThan(back.y);
    });
  }
});

describe("Chest Lateral detector view (RAD-072 1b)", () => {
  const draw = (patch: Record<string, unknown>) => render(createElement(CHEST_LATERAL_FIGURE.Drawing, {
    radCase: lateral, settings: { ...lateral.initialSettings, projection: "lateral-left", ...patch } as never,
    showGuides: true, W: lateral.detector.widthCm * U, H: lateral.detector.heightCm * U,
  }));
  it("draws ONE posterior-rib contour at 0° and the second (dashed) one only when rotated (L7)", () => {
    for (const arms of ["raised", "lowered"]) {
      const square = draw({ rotationDeg: 0, choices: { side: "L", arms } });
      expect(square.match(/data-anatomy="posterior-ribs"/g)).toHaveLength(1);
      expect(square).not.toContain("posterior-ribs-second");
      expect(square).not.toContain('stroke-dasharray="6 5"');
      expect(draw({ rotationDeg: 8, choices: { side: "L", arms } })).toContain("posterior-ribs-second");
    }
  });
  it("draws the frontal figure when the selected projection is not the lateral (T1, the PA figure's own projection check)", () => {
    const pa = draw({ projection: "pa-erect" });
    expect(pa).toContain('data-anatomy="right-lung"');
    expect(pa).not.toContain('data-anatomy="lateral-lung"');
    expect(draw({})).toContain('data-anatomy="lateral-lung"');
  });
});

describe("AP side view: tube angle drawn from the detector perpendicular (RAD-072 1b, S5)", () => {
  const base = { sidCm: 120, detectorHeightCm: 43, rayCm: 18.5, fieldFromCm: 4, fieldToCm: 35 };
  const beamDot = (l: ReturnType<typeof apSideLayout>) => {
    const ray = { x: l.target.x - l.tube.x, y: l.target.y - l.tube.y }, slab = { x: l.fieldB.x - l.fieldA.x, y: l.fieldB.y - l.fieldA.y };
    return (ray.x * slab.x + ray.y * slab.y) / (Math.hypot(ray.x, ray.y) * Math.hypot(slab.x, slab.y));
  };
  it("semi-erect at 0°: the central ray is perpendicular to the raised detector", () => {
    const l = apSideLayout({ ...base, tubeAngleDeg: 0, semiErect: true });
    expect(l.raiseDeg).toBe(AP_SIDE.semiErectDeg);
    expect(beamDot(l)).toBeCloseTo(0, 10);
    expect(l.tubeRotDeg).toBeCloseTo(AP_SIDE.semiErectDeg, 10); // the housing tilts with the detector
  });
  it("semi-erect at 5°: the ray is 5° caudad from that perpendicular (toward the feet, the viewer's right)", () => {
    const l = apSideLayout({ ...base, tubeAngleDeg: 5, semiErect: true });
    expect(Math.asin(beamDot(l)) * 180 / Math.PI).toBeCloseTo(5, 8);
  });
  it("supine is unchanged: vertical at 0°, the angle from the vertical otherwise", () => {
    const zero = apSideLayout({ ...base, tubeAngleDeg: 0, semiErect: false });
    expect(zero.tube.x).toBeCloseTo(zero.target.x, 10);
    expect(beamDot(zero)).toBeCloseTo(0, 10);
    const five = apSideLayout({ ...base, tubeAngleDeg: 5, semiErect: false });
    expect(five.tubeRotDeg).toBe(-5);
    expect(Math.atan2(five.target.x - five.tube.x, five.target.y - five.tube.y) * 180 / Math.PI).toBeCloseTo(5, 8);
  });
});

it("lung and heart paths fit the EXISTING scored landmark boxes in every drawn variant, leaving the spare strips empty", () => {
  for (const c of CASES.filter((c) => c.bodyPart === "chest")) {
    const figure = c.id === "chest-lateral-erect" ? CHEST_LATERAL_FIGURE : CHEST_PA_FIGURE;
    const box = fitAnatomyBox(c.radiograph, c.requiredAnatomy).landmarkCm;
    // RAD-072 1b: the variants a learner can draw (arms, chin, shoulders, guides) never move the lungs or the heart.
    for (const patch of [{}, { chinPosition: "tucked" }, { chinPosition: "elevated" }, { shoulderPosition: "relaxed" }, { shoulderPosition: "rolled-forward" }, { choices: { side: "L", arms: "raised" } }, { choices: { side: "R", arms: "lowered" } }])
      for (const showGuides of [false, true]) {
        const html = render(createElement(figure.Drawing, {
          radCase: c, settings: { ...c.initialSettings, rotationDeg: 0, projection: c.requiredProjection, ...patch } as never,
          showGuides, W: c.detector.widthCm * U, H: c.detector.heightCm * U,
        }));
        const lungs = [...html.matchAll(/<path data-anatomy="(?:lateral-lung|right-lung|left-lung)" d="([^"]+)"/g)];
        expect(lungs).toHaveLength(c.id === "chest-lateral-erect" ? 1 : 2);
        const hearts = [...html.matchAll(/<path data-anatomy="heart" d="([^"]+)"/g)];
        expect(hearts).toHaveLength(1);
        for (const [, path] of [...lungs, ...hearts]) {
          const coords = path!.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g)!.map(Number);
          for (let i = 0; i < coords.length; i += 2) {
            expect(coords[i]).toBeGreaterThanOrEqual(box.x1 * U - 1e-8);
            expect(coords[i]).toBeLessThanOrEqual(box.x2 * U + 1e-8);
            expect(coords[i + 1]).toBeGreaterThanOrEqual(box.y1 * U - 1e-8);
            expect(coords[i + 1]).toBeLessThanOrEqual(box.y2 * U + 1e-8);
          }
        }
      }
  }
});
