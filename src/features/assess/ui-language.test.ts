import { createElement, type ComponentType, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { expect, it } from "vitest";
import { CASES } from "@/data/cases";
import ar from "../../../messages/ar.json";
import en from "../../../messages/en.json";
import { mixedFixture } from "../../../scripts/assess/d-fixture";
import { practicalFixture } from "../../../scripts/assess/e-fixture";
import type { SimulatorPartItem } from "./contracts";
import { PartControls } from "./PartControls";
import { PracticalScene } from "./PracticalScene";
import { CONTROL_LABELS } from "./presentation";
import { validatePracticalContent } from "./server-practical";
import { validateMixedContent } from "./server-presentation";

// CLN-037 / S-ASSESS-7: platform UI and ARIA text follow the interface language with their own lang/dir;
// exam content and the published control vocabulary (CONTROL_LABELS) stay English inside the LTR exam region.
const render = (locale: "en" | "ar", node: ReactNode) =>
  renderToStaticMarkup(createElement(NextIntlClientProvider as ComponentType<Record<string, unknown>>, { locale, messages: locale === "en" ? en : ar, timeZone: "UTC" }, node));
const MOVED = ["Choose one answer", "Clear answer", "Expose once", "Selected scene elements", "Settings diagram", "Detector and patient",
  "Move beam with arrow keys or drag", "Current equipment settings", "Current settings in text", "Positioning scene."];

function partItem() {
  const published = mixedFixture(), { specs } = validateMixedContent(published);
  const item = published.assessment.items.find((i) => i.type === "simulator-part" && i.presentation.sceneElements.length > 0) as SimulatorPartItem;
  const id = item.ref.id;
  const values = { kvp: 100, sideMarker: "R", "markerPosition.x": 0.4, "markerPosition.y": 0.3 };
  return { item, view: { controls: specs[id]!, initial: values, sceneValues: values }, values };
}

it("the platform keys added for Assess exist in both languages with the same shape", () => {
  const shape = (value: unknown): unknown => value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)])) : typeof value;
  for (const key of ["chooseOne", "clearAnswer", "part", "scene", "locked", "oneExposure", "expose"] as const) expect(shape(ar.assess[key])).toEqual(shape(en.assess[key]));
});

it("part controls: Arabic platform labels carry lang/dir; control labels stay English", () => {
  const { item, view, values } = partItem();
  const props = { item, view, values, disabled: false, onChange: () => {} };
  const english = render("en", createElement(PartControls, props)), arabic = render("ar", createElement(PartControls, props));
  expect(english).toContain(`<legend class="mb-3 font-semibold" lang="en" dir="ltr">${en.assess.part.settings}</legend>`);
  expect(arabic).toContain(`<legend class="mb-3 font-semibold" lang="ar" dir="rtl">${ar.assess.part.settings}</legend>`);
  expect(arabic).toContain(`aria-label="${ar.assess.part.sceneElements}"`);
  expect(arabic).toContain(`aria-label="${ar.assess.part.diagram}"`);
  expect(arabic).toMatch(/^<div class="space-y-4" dir="ltr" lang="en">/);
  expect(arabic).toContain(CONTROL_LABELS.sideMarker);
  for (const text of MOVED) expect(arabic).not.toContain(text);
});

it("practical scene: Arabic captions and ARIA follow the interface; the English item region is unchanged", () => {
  const c = CASES[0]!, { views } = validatePracticalContent(practicalFixture("1", [c]));
  const view = views["full-0"]!, values = { ...view.initial, sideMarker: "R" };
  const props = { view, values, disabled: false, onChange: () => {} };
  const english = render("en", createElement(PracticalScene, props)), arabic = render("ar", createElement(PracticalScene, props));
  expect(english).toContain(en.assess.scene.moveBeam);
  expect(english).toContain("Move marker R with arrow keys or drag");
  expect(arabic).toMatch(/^<figure class="space-y-3 rounded border border-line p-3" dir="ltr" lang="en">/);
  expect(arabic).toContain(`<figcaption lang="ar" dir="rtl">${ar.assess.scene.caption}</figcaption>`);
  expect(arabic).toContain(`aria-label="${ar.assess.scene.detectorPatient}" lang="ar"`);
  expect(arabic).toContain(`aria-label="${ar.assess.scene.moveBeam}"`);
  expect(arabic).toContain(`aria-label="${ar.assess.scene.moveMarker.replace("{marker}", "R")}"`);
  for (const text of MOVED) expect(arabic).not.toContain(text);
});
