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

/** New pelvis-only scene/result guard; never updates earlier exam hashes. */
const EXAM_IDS = ["pelvis-ap-supine"];
const wrap = (locale: "en" | "ar", node: React.ReactElement) =>
  createElement(NextIntlClientProvider as ComponentType<Record<string, unknown>>, { locale, messages: locale === "en" ? en : ar, timeZone: "UTC" }, node);

const STATES: Record<string, Partial<SimulationSettings>> = {
  initial: {}, rotationM15: { rotationDeg: -15 }, rotationP15: { rotationDeg: 15 }, rotation0: { rotationDeg: 0 },
  legsInternal: { choices: { legPosition: "internal", respiration: "suspend" } },
  legsExternal: { choices: { legPosition: "external", respiration: "normal" } },
  tubeM15: { tubeAngulationDeg: -15 }, tubeP15: { tubeAngulationDeg: 15 },
  markerR: { sideMarker: "R", markerPosition: { x: -0.93, y: -0.6 } },
  markerL: { sideMarker: "L", markerPosition: { x: 0.93, y: -0.6 } },
  sid200: { sidCm: 200 }, tight: { collimation: { width: 0.4, height: 0.4 } },
};

for (const examId of EXAM_IDS) {
  const cases = CASES.filter((x) => x.id === examId || x.id.startsWith(`${examId}/`));
  if (cases.length === 0) continue; // the exam is added in its own commit
  it(`the rendered ${examId} scenes and result panels are unchanged (S-PELVIS-1)`, () => {
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
    if (process.env.UPDATE_PELVIS_HASHES === examId || !existsSync(FILE)) writeFileSync(FILE, JSON.stringify(out, null, 1) + "\n");
    const golden = JSON.parse(readFileSync(FILE, "utf8")) as Record<string, string>;
    expect(Object.keys(out)).toEqual(Object.keys(golden));
    expect(Object.keys(out).filter((k) => out[k] !== golden[k])).toEqual([]);
  });
}
