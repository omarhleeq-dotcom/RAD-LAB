import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";
import { CASES } from "@/data/cases";
import { detectorCoverage } from "@/features/radiograph/coverage";
import { evaluate } from "./engine";
import { ResultPanel } from "./ResultPanel";

const html = (c: (typeof CASES)[number], locale: "en" | "ar") => renderToStaticMarkup(createElement(
  NextIntlClientProvider as ComponentType<Record<string, unknown>>, { locale, messages: locale === "en" ? en : ar, timeZone: "UTC" },
  createElement(ResultPanel, { radCase: c, settings: c.initialSettings, result: evaluate(c, c.initialSettings), onRetry: () => {}, onRestart: () => {} }),
));

describe("Result image: no-data key and coverage line (RAD-072 part 3b, S13b-1 b)", () => {
  for (const locale of ["en", "ar"] as const) {
    const msgs = locale === "en" ? en : ar;
    for (const id of ["ankle-ap", "shoulder-grashey-erect"]) {
      it(`${id} (${locale}): the key and the coverage line show, the share computed from the fit`, () => {
        const c = CASES.find((x) => x.id === id)!;
        const out = html(c, locale);
        const pct = Math.round(detectorCoverage(c.radiograph, c.requiredAnatomy, c.detector) * 100);
        expect(out).toContain('data-testid="no-data-key"');
        expect(out).toContain(msgs.radiograph.noDataKey);
        expect(out).toContain(msgs.radiograph.partialCoverage.replace("{percent}", String(pct)));
        expect(pct).toBeGreaterThan(0);
        expect(out).toContain(msgs.radiograph.margins); // the existing sentence stays
      });
    }
    it(`every other exam (${locale}), the chest lateral included, shows nothing new`, () => {
      for (const c of CASES.filter((x) => !x.radiograph.partialCoverageKey)) {
        const out = html(c, locale);
        expect(out).not.toContain("no-data-key");
        expect(out).not.toContain(msgs.radiograph.noDataKey);
      }
    });
  }
});
