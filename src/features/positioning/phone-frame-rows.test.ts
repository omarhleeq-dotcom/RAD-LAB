import { expect, it } from "vitest";
import { frameRows } from "./PhoneFrameLabels";

it("keeps mixed-width and mixed-bearing text pills inside separate non-overlapping phone rows", () => {
  const labels = [
    { key: "head", x: -1, y: -18, width: 54, height: 24 },
    { key: "left", x: -2, y: -21, width: 135, height: 29 },
    { key: "midline", x: 1, y: -19, width: 210, height: 28 },
    { key: "target", x: 0, y: -24, width: 265, height: 35 },
  ];
  for (const width of [332, 374, 760]) {
    const rows = frameRows(width, labels);
    const boxes = labels.map((label) => {
      const p = rows.positions[label.key]!;
      return { left: p.x + label.x - 5, top: p.y + label.y - 1, right: p.x + label.x + label.width + 5, bottom: p.y + label.y + label.height + 1 };
    });
    for (const [i, b] of boxes.entries()) {
      expect(b.left).toBeGreaterThanOrEqual(0); expect(b.right).toBeLessThanOrEqual(width);
      expect(b.top).toBeGreaterThanOrEqual(0); expect(b.bottom).toBeLessThanOrEqual(rows.height);
      for (const c of boxes.slice(i + 1)) expect(b.right <= c.left || c.right <= b.left || b.bottom <= c.top || c.bottom <= b.top).toBe(true);
    }
  }
});

// Render the original orientation components, so the expected screen side comes from the scene, not translated words.
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";
import { DETECTOR_FIGURES } from "./detector-figures";
import { PELVIS_FIGURE } from "./PelvisFigure";
import { SHOULDER_FIGURE } from "./ShoulderFigure";
import { frameLabelKey, orientationRows } from "./PhoneFrameLabels";

const figures = { ...DETECTOR_FIGURES, pelvis: PELVIS_FIGURE, shoulder: SHOULDER_FIGURE };
for (const [family, figure] of Object.entries(figures)) for (const locale of ["en", "ar"] as const) {
  it(`${family}/${locale}: phone orientation slots keep the original scene's physical horizontal sides`, () => {
    for (const W of [180, 240, 430]) {
      const html = renderToStaticMarkup(createElement(NextIntlClientProvider as ComponentType<Record<string, unknown>>,
        { locale, messages: locale === "en" ? en : ar, timeZone: "UTC" },
        createElement(figure.Orientation, { W, showGuides: true, projection: family === "chest-lateral" ? "lateral-left" : family })));
      const labels = [...html.matchAll(/<text\b([^>]*)>(.*?)<\/text>/g)].map(([, attrs, text]) => {
        const x = Number(attrs!.match(/\bx="([^"]+)"/)![1]);
        const y = Number(attrs!.match(/\by="([^"]+)"/)![1]);
        const size = Number(attrs!.match(/font-size="([^"]+)"/)![1]);
        return { originalX: x, key: frameLabelKey(x, y, size, text!), x: -2, y: -18, width: 110, height: 24 };
      });
      const packed = orientationRows(374, W, labels);
      for (const label of labels) {
        const pillLeft = packed.positions[label.key]!.x + label.x - 5;
        if (label.originalX < W / 3) expect(pillLeft).toBe(3);
        else if (label.originalX > 2 * W / 3) expect(pillLeft + label.width + 10).toBe(371);
        else expect(pillLeft + (label.width + 10) / 2).toBe(187);
      }
    }
  });
}
