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

const lateral = CASES.find((c) => c.id === "chest-lateral-erect")!;
const render = (node: React.ReactElement, locale: "en" | "ar" = "en") => renderToStaticMarkup(createElement(
  NextIntlClientProvider as ComponentType<Record<string, unknown>>,
  { locale, messages: locale === "en" ? en : ar, timeZone: "UTC" }, node,
));

// Read the actual SVG transform and ellipse: catches a return to the PA torso even if the labels still say lateral.
function topGeometry(deg: number, arms: string, locale: "en" | "ar") {
  const html = render(createElement(PlanView, {
    radCase: lateral, settings: { ...lateral.initialSettings, projection: "lateral-left", rotationDeg: deg, choices: { side: "L", arms } }, showGuides: true,
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
      expect(rx).toBeGreaterThan(ry); // long AP dimension, shorter right–left dimension
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

it("lung paths fit the EXISTING scored landmark boxes, leaving the spare strips empty", () => {
  for (const c of CASES.filter((c) => c.bodyPart === "chest")) {
    const figure = c.id === "chest-lateral-erect" ? CHEST_LATERAL_FIGURE : CHEST_PA_FIGURE;
    const html = render(createElement(figure.Drawing, {
      radCase: c, settings: { ...c.initialSettings, rotationDeg: 0, projection: c.requiredProjection },
      showGuides: false, W: c.detector.widthCm * U, H: c.detector.heightCm * U,
    }));
    const box = fitAnatomyBox(c.radiograph, c.requiredAnatomy).landmarkCm;
    const lungs = [...html.matchAll(/<path data-anatomy="(?:lateral-lung|right-lung|left-lung)" d="([^"]+)"/g)];
    expect(lungs).toHaveLength(c.id === "chest-lateral-erect" ? 1 : 2);
    for (const [, path] of lungs) {
      const coords = path!.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g)!.map(Number);
      for (let i = 0; i < coords.length; i += 2) {
        expect(coords[i]).toBeGreaterThanOrEqual(box.x1 * U - 1e-8);
        expect(coords[i]).toBeLessThanOrEqual(box.x2 * U + 1e-8);
        expect(coords[i + 1]).toBeGreaterThanOrEqual(box.y1 * U - 1e-8);
        expect(coords[i + 1]).toBeLessThanOrEqual(box.y2 * U + 1e-8);
      }
    }
  }
});
