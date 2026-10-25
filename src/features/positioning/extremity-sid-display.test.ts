// @vitest-environment jsdom
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { it, expect } from "vitest";
import { CASES } from "@/data/cases";
import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";
import { WristSideView } from "./WristSideView";
import { HandSideView } from "./HandSideView";
import { ElbowSideView } from "./ElbowSideView";
import { evaluate } from "@/features/evaluation/engine";
import { TechniqueResult } from "@/features/technique/TechniqueResult";
import { LowerLimbSideView } from "./LowerLimbSideView";

const limbs = CASES.filter(c => /^(wrist|hand|elbow|knee|ankle|foot)-/.test(c.id));
it.each(limbs)("$id displays the full-credit SID band without altering its model anchor", c => {
  expect(c.technique?.manual?.reference.sidCm).toBe(102);
  const View = c.id.startsWith("wrist") ? WristSideView : c.id.startsWith("hand") ? HandSideView : c.id.startsWith("elbow") ? ElbowSideView : LowerLimbSideView;
  for (const locale of ["en", "ar"] as const) {
    const markup = renderToStaticMarkup(h(NextIntlClientProvider, { locale, messages: locale === "en" ? en : ar, timeZone: "UTC", children: h(View, { radCase: c, settings: { ...c.initialSettings, sidCm: 105 }, showGuides: true }) }));
    const text = new DOMParser().parseFromString(markup, "text/html").body.textContent;
    expect(text).toContain(locale === "en" ? "Reference band 100–110 cm" : "النطاق المرجعي 100–110 سم");
    const result = evaluate(c, { ...c.initialSettings, sidCm: 105 });
    const resultHtml = renderToStaticMarkup(h(NextIntlClientProvider, { locale, messages: locale === "en" ? en : ar, timeZone: "UTC", children: h(TechniqueResult, { radCase: c, kvp: c.initialSettings.kvp, manualMas: c.initialSettings.mas, exposure: result.exposure! }) }));
    const resultText = new DOMParser().parseFromString(resultHtml, "text/html").body.textContent;
    expect(resultText).toContain("100–110");
    expect(resultText).not.toMatch(/102\s*(?:cm|سم)/);
    const evidence = JSON.stringify([c.technique?.manual?.evidence, c.technique?.assumptions]);
    expect(evidence).toContain("100–110");
    expect(evidence).not.toMatch(/102\s*(?:cm|سم)/);
  }
});
