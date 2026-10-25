// @vitest-environment jsdom
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { it, expect } from "vitest";
import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";
import { wristPa } from "@/data/cases/wrist-pa";
import { DetectorWorkspace } from "./DetectorWorkspace";
import { WRIST_PA_FIGURE } from "./detector-figures";
const settings = { ...wristPa.initialSettings, projection: "wrist-pa", centralRay: { x: 0, y: -1 / 6 }, collimation: { width: 14 / 18, height: 16 / 24 }, markerPosition: { x: -.42, y: -.16 } };
// A text-existence assertion alone misses paint-order regressions: the guide must also precede the badge.
it.each(["en", "ar"] as const)("keeps L and R badges identical to guides OFF and above guide strokes (%s)", locale => {
  for (const sideMarker of ["L", "R"] as const) {
    const render = (showGuides: boolean) => new DOMParser().parseFromString(renderToStaticMarkup(h(NextIntlClientProvider, { locale, messages: locale === "en" ? en : ar, timeZone: "UTC", children: h(DetectorWorkspace, { radCase: wristPa, settings: { ...settings, sideMarker }, showGuides, disabled: false, onChange() {}, figure: WRIST_PA_FIGURE }) })), "text/html");
    const on = render(true), off = render(false);
    const badge = (doc: Document) => [...doc.querySelectorAll('g[role="button"]')].find(g => g.querySelector("text")?.textContent === sideMarker)!;
    expect(badge(on)?.querySelector("text")?.textContent).toBe(sideMarker);
    expect(badge(on).outerHTML).toBe(badge(off).outerHTML);
    const guides = [...on.querySelectorAll('g[role="img"]')].filter(g => g.querySelector("title"));
    expect(guides).toHaveLength(2);
    for (const guide of guides) expect(guide.compareDocumentPosition(badge(on)) & 4).toBe(4);
  }
});
