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
 * Wrist guard (S14.1c): server-rendered scene (practice / assessment) and result panel hashes of the wrist exams, EN + AR. ADDED
 * with the wrist exams (the chest hashes in `scene-dom.test.ts` are untouched). A wrist hash changes only with a deliberate,
 * reviewed visual change: `UPDATE_WRIST_HASHES=1 npx vitest run src/features/qa/scene-dom-wrist.test.ts` rewrites THIS file's golden only.
 */
const FILE = "scripts/qa/scene-dom/wrist-hashes.json";
const wrap = (locale: "en" | "ar", node: React.ReactElement) =>
  createElement(NextIntlClientProvider as ComponentType<Record<string, unknown>>, { locale, messages: locale === "en" ? en : ar, timeZone: "UTC" }, node);

const STATES: Record<string, Partial<SimulationSettings>> = {
  initial: {},
  rot8: { rotationDeg: 8 }, rotm8: { rotationDeg: -8 }, rot3: { rotationDeg: 3 },
  markerL: { sideMarker: "L", markerPosition: { x: -0.62, y: 0 } },
  markerR: { sideMarker: "R", markerPosition: { x: 0.62, y: 0 } },
  markerMoved: { sideMarker: "L", markerPosition: { x: 0.1, y: 0 } },
  rayOff: { centralRay: { x: 0.3, y: 0.4 } },
  tight: { collimation: { width: 0.4, height: 0.4 } },
  sid102: { sidCm: 102 }, sid200: { sidCm: 200 },
  projPa: { projection: "wrist-pa" }, projLat: { projection: "wrist-lateral" },
  lowKv: { kvp: 45 }, highKv: { kvp: 90 }, lowMas: { mas: 0.5 } as never,
};

// Per-test timeout (owner decision 2026-10-24, DECISIONS.md#housekeeping-owner-2026-10-24): the 5000 ms default expired on loaded CI; no hash ever differed.
it("the rendered wrist scenes and result panels are unchanged (S14.1c)", () => {
  const out: Record<string, string> = {};
  for (const c of CASES.filter((x) => x.bodyPart === "wrist")) {
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
  if (process.env.UPDATE_WRIST_HASHES === "1" || !existsSync(FILE)) writeFileSync(FILE, JSON.stringify(out, null, 1) + "\n");
  const golden = JSON.parse(readFileSync(FILE, "utf8")) as Record<string, string>;
  expect(Object.keys(out)).toEqual(Object.keys(golden));
  expect(Object.keys(out).filter((k) => out[k] !== golden[k])).toEqual([]);
}, 30_000);
