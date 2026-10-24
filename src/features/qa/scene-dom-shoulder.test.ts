import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { expect, it } from "vitest";
import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";
import { CASES } from "@/data/cases";
import type { SimulationSettings } from "@/domain/simulation";
import { evaluate } from "@/features/evaluation/engine";
import { ResultPanel } from "@/features/evaluation/ResultPanel";
import { PositioningScene } from "@/features/positioning/scenes";

/** New shoulder-only scene/result guard (S-SHOULDER-3); never updates earlier exam hashes. */
const EXAM_IDS = ["shoulder-grashey-erect"];
const wrap = (locale: "en" | "ar", node: React.ReactElement) =>
  createElement(NextIntlClientProvider as ComponentType<Record<string, unknown>>, { locale, messages: locale === "en" ? en : ar, timeZone: "UTC" }, node);

const STATES: Record<string, Partial<SimulationSettings>> = {
  initial: {}, turn0: { rotationDeg: 0 }, turn20: { rotationDeg: 20 }, turn35: { rotationDeg: 35 }, turn40: { rotationDeg: 40 }, turn45: { rotationDeg: 45 }, turn60: { rotationDeg: 60 },
  armNeutral: { choices: { armPosition: "neutral", respiration: "suspend" } },
  armInternal: { choices: { armPosition: "internal", respiration: "normal" } },
  armExternal: { choices: { armPosition: "external", respiration: "none" } },
  tubeM15: { tubeAngulationDeg: -15 }, tubeP15: { tubeAngulationDeg: 15 },
  markerR: { sideMarker: "R", markerPosition: { x: 0.37, y: -0.38 } },
  markerL: { sideMarker: "L", markerPosition: { x: 0.37, y: -0.38 } },
  sid200: { sidCm: 200 }, tight: { collimation: { width: 0.3, height: 0.4 } },
};

for (const examId of EXAM_IDS) {
  const cases = CASES.filter((x) => x.id === examId || x.id.startsWith(`${examId}/`));
  if (cases.length === 0) continue; // the exam is added in its own commit
  // Per-test timeout (owner decision 2026-10-24, DECISIONS.md#housekeeping-owner-2026-10-24): the 5000 ms default expired on loaded CI; no hash ever differed.
  it(`the rendered ${examId} scenes and result panels are unchanged (S-SHOULDER-3)`, () => {
    const FILE = `scripts/qa/scene-dom/${examId}-hashes.json`;
    const out: Record<string, string> = {};
    for (const c of cases) {
        for (const [vn, patch] of Object.entries(STATES)) {
        const settings = { ...c.initialSettings, ...patch } as SimulationSettings;
        for (const locale of ["en", "ar"] as const) {
          for (const mode of ["practice", "assessment"] as const) {
            const html = renderToStaticMarkup(wrap(locale, createElement(PositioningScene, { radCase: c, settings, mode, onChange: () => {}, disabled: false })));
            out[`scene|${c.id}|${vn}|${locale}|${mode}`] = createHash("sha256").update(html).digest("hex");
          }
          const result = evaluate(c, settings);
          const html = renderToStaticMarkup(wrap(locale, createElement(ResultPanel, { radCase: c, settings, result, onRetry: () => {}, onRestart: () => {} })));
          out[`result|${c.id}|${vn}|${locale}`] = createHash("sha256").update(html).digest("hex");
        }
      }
    }
    if (process.env.UPDATE_SHOULDER_HASHES === examId || !existsSync(FILE)) writeFileSync(FILE, JSON.stringify(out, null, 1) + "\n");
    const golden = JSON.parse(readFileSync(FILE, "utf8")) as Record<string, string>;
    expect(Object.keys(out)).toEqual(Object.keys(golden));
    expect(Object.keys(out).filter((k) => out[k] !== golden[k])).toEqual([]);
  }, 30_000);
}
