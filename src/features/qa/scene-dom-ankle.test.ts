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

/**
 * Ankle guard (S14.5): server-rendered scene (practice / assessment) and result panel hashes of each ankle exam, EN + AR. ONE golden file PER EXAM
 * (`scripts/qa/scene-dom/<exam>-hashes.json`), each ADDED with its exam (every earlier hash file, and the knee / foot test, are untouched). A hash changes only
 * with a deliberate, reviewed visual change: `UPDATE_ANKLE_HASHES=<exam id> npx vitest run src/features/qa/scene-dom-ankle.test.ts` rewrites THAT exam's file only.
 */
const EXAM_IDS = ["ankle-ap", "ankle-lateral"];
const wrap = (locale: "en" | "ar", node: React.ReactElement) =>
  createElement(NextIntlClientProvider as ComponentType<Record<string, unknown>>, { locale, messages: locale === "en" ? en : ar, timeZone: "UTC" }, node);

const STATES: Record<string, Partial<SimulationSettings>> = {
  initial: {},
  rot8: { rotationDeg: 8 }, rotm8: { rotationDeg: -8 }, rot3: { rotationDeg: 3 }, rot15: { rotationDeg: 15 }, rotm15: { rotationDeg: -15 },
  markerL: { sideMarker: "L", markerPosition: { x: -0.5, y: 0 } },
  markerR: { sideMarker: "R", markerPosition: { x: 0.5, y: 0 } },
  markerMoved: { sideMarker: "R", markerPosition: { x: 0.1, y: 0 } },
  rayOff: { centralRay: { x: 0.3, y: 0.4 } },
  tight: { collimation: { width: 0.4, height: 0.4 } },
  sid102: { sidCm: 102 }, sid200: { sidCm: 200 },
  tubeM10: { tubeAngulationDeg: -10 }, tube0: { tubeAngulationDeg: 0 }, tube15: { tubeAngulationDeg: 15 },
  projAnkleAp: { projection: "ankle-ap" }, projAnkleLateral: { projection: "ankle-lateral" },
  lowKv: { kvp: 45 }, highKv: { kvp: 90 }, lowMas: { mas: 0.5 } as never,
};

for (const examId of EXAM_IDS) {
  const cases = CASES.filter((x) => x.id === examId || x.id.startsWith(`${examId}/`));
  if (cases.length === 0) continue; // the exam is added in its own commit
  it(`the rendered ${examId} scenes and result panels are unchanged (S14.5)`, () => {
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
    if (process.env.UPDATE_ANKLE_HASHES === examId || !existsSync(FILE)) writeFileSync(FILE, JSON.stringify(out, null, 1) + "\n");
    const golden = JSON.parse(readFileSync(FILE, "utf8")) as Record<string, string>;
    expect(Object.keys(out)).toEqual(Object.keys(golden));
    expect(Object.keys(out).filter((k) => out[k] !== golden[k])).toEqual([]);
  });
}
