import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { CASES } from "@/data/cases";
import type { RadCase } from "@/domain/case";
import { evaluate } from "./engine";
import { ResultPanel } from "./ResultPanel";
import { displayTarget, formatResultNumber, formatResultObserved, formatResultRange } from "./result-values";
import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";

const chest = CASES.find((c) => c.id === "chest-pa-erect")!;

describe("phone-review display values", () => {
  it("formats signed ranges with mathematical minus signs, explicit bounds and unit spacing", () => {
    expect(formatResultRange([-2, 2], "°", "en")).toBe("−2° to +2°");
    expect(formatResultRange([180, 185], "cm", "en")).toBe("180 cm to 185 cm");
    expect(formatResultRange([0, 0], "°", "en")).toBe("0° to 0°");
    expect(formatResultNumber(-0.001, "cm")).toBe("0 cm");
  });
  it("keeps each Arabic numeric bound in LTR isolation, with the Arabic range words", () => {
    expect(formatResultRange([-2, 2], "°", "ar")).toBe("بين \u2066−2°\u2069 و\u2066+2°\u2069");
    expect(formatResultRange([105, 125], "kVp", "ar")).toBe("بين \u2066105 kVp\u2069 و\u2066125 kVp\u2069");
  });
  it("changes only observed-value typography, preserving numbers and non-numeric labels", () => {
    expect(formatResultObserved("-8 °")).toBe("−8°");
    expect(formatResultObserved("+4.03 cm")).toBe("+4.03 cm");
    expect(formatResultObserved("AP erect")).toBe("AP erect");
  });
  it("uses each exam's own kVp band and centering tolerance, expressed in the observation's cm-offset units", () => {
    for (const c of CASES) for (const rule of c.rules) {
      if (rule.kind === "technique" && rule.check === "kvp-band") {
        expect(displayTarget(rule, c, "en")).toBe(`${c.technique.kvp.targetBand[0]} kVp to ${c.technique.kvp.targetBand[1]} kVp`);
      }
      if (rule.kind === "centering") {
        const cm = c.positioning.centering.idealTolerance[rule.axis] * (rule.axis === "x" ? c.detector.widthCm : c.detector.heightCm) / 2;
        const rounded = Math.round(cm * 100) / 100;
        expect(displayTarget(rule, c, "en")).toBe(`0 cm (±${rounded} cm)`);
      }
    }
    const rule = chest.rules.find((r) => r.kind === "centering" && r.axis === "y")!;
    // The absolute target may be nonzero: the displayed observation/target still describes offset FROM it.
    const shifted = { ...chest, positioning: { ...chest.positioning, centering: { ...chest.positioning.centering, target: { x: 0.2, y: 0.7 } } } };
    expect(displayTarget(rule, shifted, "en")).toBe(displayTarget(rule, chest, "en"));
  });
  it("omits targets when no applicable target data exists", () => {
    const kvp = chest.rules.find((r) => r.kind === "technique" && r.check === "kvp-band")!;
    const centering = chest.rules.find((r) => r.kind === "centering")!;
    const withoutKvp = { ...chest, technique: { ...chest.technique, kvp: undefined } } as unknown as RadCase;
    const withoutCenter = { ...chest, positioning: { ...chest.positioning, centering: undefined } } as unknown as RadCase;
    expect(displayTarget(kvp, withoutKvp, "en")).toBeUndefined();
    expect(displayTarget(centering, withoutCenter, "en")).toBeUndefined();
    expect(displayTarget(undefined, chest, "en")).toBeUndefined();
    for (const rule of chest.rules.filter((r) => r.kind === "coverage" || r.kind === "marker")) expect(displayTarget(rule, chest, "en")).toBeUndefined();
  });
  for (const locale of ["en", "ar"] as const) it(`${locale}: one image-info line; outcome is screen-reader text; marker's not-scored label occurs once`, () => {
    const msgs = locale === "en" ? en : ar;
    const html = renderToStaticMarkup(createElement(NextIntlClientProvider as ComponentType<Record<string, unknown>>, { locale, messages: msgs, timeZone: "UTC" },
      createElement(ResultPanel, { radCase: chest, settings: chest.initialSettings, result: evaluate(chest, chest.initialSettings), onRetry() {}, onRestart() {} })));
    const buttons = html.match(/<button\b[\s\S]*?<\/button>/g)!;
    const image = buttons.find((b) => b.includes(msgs.result.aboutImage))!;
    expect(image).toContain('aria-expanded="false"');
    expect(image).toContain("<svg");
    expect(html).not.toContain(msgs.result.imageCaption);
    const marker = buttons.find((b) => b.includes(locale === "en" ? "Side marker (not scored)" : "علامة الجانب (غير محسوبة)"))!;
    expect(marker.split(msgs.result.notScored)).toHaveLength(2);
    expect(marker).toContain(`<span class="sr-only">${msgs.result.outcome.fail}</span>`);
    expect(marker).toContain('aria-expanded="false"');
    const kvp = buttons.find((b) => b.includes('70 kVp'))!;
    expect(kvp).toContain(`${msgs.result.target}:`);
    expect(kvp).toContain(locale === "en" ? ' to ' : 'بين ');
    const cr = buttons.find((b) => b.includes('+4.03 cm'))!;
    expect(cr).toContain('0 cm (±');
  });
});
