import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { CASES } from "@/data/cases";
import { scenarioSettings, SCENARIOS } from "@/features/qa/scenario-matrix";
import { evaluate } from "./engine";
import { ResultPanel } from "./ResultPanel";
import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";

const chest = CASES.find((c) => c.id === "chest-pa-erect")!;
const correct = scenarioSettings(SCENARIOS.find((s) => s.id === "correct")!, chest);
const cases = {
  critical: { ...correct, sideMarker: null },
  below: chest.initialSettings,
  pass: correct,
};

for (const locale of ["en", "ar"] as const) describe(`${locale}: critical-fail result wording`, () => {
  const messages = locale === "en" ? en : ar;
  for (const kind of ["critical", "below", "pass"] as const) it(`${kind}: explains the verdict using the existing numeric and critical gates`, () => {
    const settings = cases[kind];
    const result = evaluate(chest, settings);
    expect(result.score.thresholdMet).toBe(kind !== "below");
    expect(result.score.passed).toBe(kind === "pass");
    if (kind === "critical") {
      expect(result.score.total).toBe(100);
      expect(result.criticalFindings.map((f) => f.id)).toContain("missing-marker");
    }
    const html = renderToStaticMarkup(createElement(NextIntlClientProvider as ComponentType<Record<string, unknown>>,
      { locale, messages, timeZone: "UTC" }, createElement(ResultPanel,
        { radCase: chest, settings, result, onRetry() {}, onRestart() {} })));
    const header = html.match(/<h2 id="result-heading"[^>]*>(.*?)<\/h2>/)![1];
    expect(header).toBe(kind === "critical" ? messages.result.criticalFailed : kind === "pass" ? messages.result.passed : messages.result.failed);
    const summary = messages.result.criticalFailSummary.replace("{total}", String(result.score.total));
    if (kind === "critical") {
      expect(html).toContain(summary);
      // The explanation follows the score row immediately, before the critical finding list.
      expect(html).toContain(`</span></div><p class="text-sm text-bad">${summary}</p>`);
    } else expect(html).not.toContain(summary);
    if (result.criticalFindings.length) expect(html).toContain(messages.result.criticalNote.replace("{total}", String(result.score.total)));
  });
});
