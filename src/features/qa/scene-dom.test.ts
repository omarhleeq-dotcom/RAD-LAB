import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { expect, it } from "vitest";
import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";
import { CASES } from "@/data/cases";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { evaluate } from "@/features/evaluation/engine";
import { ResultPanel } from "@/features/evaluation/ResultPanel";
import { PositioningScene } from "@/features/positioning/scenes";

/**
 * S14-0 byte-identity guard: the server-rendered markup (SHA-256) of the positioning scene (practice / assessment) and of the
 * result panel (score, image alt text, effect cards) of every registered exam, for ~25 settings states each, EN and AR.
 * `scripts/qa/scene-dom/hashes.json` was captured from the code BEFORE the S14-0 refactor and is never regenerated to make
 * a change pass (same rule as the characterisation). An unrelated visual change legitimately changes it only with owner approval.
 */
const golden = JSON.parse(readFileSync("scripts/qa/scene-dom/hashes.json", "utf8")) as Record<string, string>;
const wrap = (locale: "en" | "ar", node: React.ReactElement) =>
  createElement(NextIntlClientProvider as ComponentType<Record<string, unknown>>, { locale, messages: locale === "en" ? en : ar, timeZone: "UTC" }, node);

function variants(c: RadCase): Record<string, Partial<SimulationSettings>> {
  const v: Record<string, Partial<SimulationSettings>> = {
    initial: {},
    rot8: { rotationDeg: 8 }, rotm8: { rotationDeg: -8 }, rot3: { rotationDeg: 3 },
    chinFlip: { chinPosition: c.initialSettings.chinPosition === "tucked" ? "elevated" : "tucked" },
    shFlip: { shoulderPosition: c.initialSettings.shoulderPosition === "relaxed" ? "rolled-forward" : "relaxed" },
    markerL: { sideMarker: "L", markerPosition: c.positioning.defaultMarkerPosition.L },
    markerR: { sideMarker: "R", markerPosition: c.positioning.defaultMarkerPosition.R },
    markerNone: { sideMarker: null },
    markerMoved: { sideMarker: "L", markerPosition: { x: 0.5, y: -0.5 } },
    rayOff: { centralRay: { x: 0.3, y: 0.4 } },
    tight: { collimation: { width: 0.6, height: 0.5 } },
    sid120: { sidCm: 120 }, sid200: { sidCm: 200 },
    projPA: { projection: "pa-erect" }, projAP: { projection: "ap-erect" }, projLat: { projection: "lateral-left" },
    lowKv: { kvp: 60 }, highKv: { kvp: 150 }, lowMas: { mas: 0.5 } as never,
  };
  if (c.initialSettings.tubeAngulationDeg !== undefined || c.controls.tubeAngulationDeg) {
    v.tube10 = { tubeAngulationDeg: 10 }; v.tubem10 = { tubeAngulationDeg: -10 };
  }
  for (const cc of c.choiceControls ?? [])
    for (const o of cc.options) v[`choice-${cc.id}-${o.id}`] = { choices: { ...(c.initialSettings.choices ?? {}), [cc.id]: o.id } };
  return v;
}

// Per-test timeout (owner decision 2026-10-24, DECISIONS.md#housekeeping-owner-2026-10-24): the 5000 ms default expired on loaded CI; no hash ever differed.
it("the rendered scenes and result panels of PA, Lateral and AP are unchanged (S14-0)", () => {
  const out: Record<string, string> = {};
  // The wrist exams (S14.1c) have their own guard (`scene-dom-wrist.test.ts`); this one stays the chest set captured before S14-0.
  for (const c of CASES.filter((x) => x.bodyPart === "chest")) {
    for (const [vn, patch] of Object.entries(variants(c))) {
      const settings = { ...c.initialSettings, ...patch } as SimulationSettings;
      for (const locale of ["en", "ar"] as const) {
        for (const mode of ["practice", "assessment"] as const) {
          const k = `scene|${c.id}|${vn}|${locale}|${mode}`;
          const html = renderToStaticMarkup(wrap(locale, createElement(PositioningScene, { radCase: c, settings, mode, onChange: () => {}, disabled: false })));
          out[k] = createHash("sha256").update(html).digest("hex");
        }
        const k = `result|${c.id}|${vn}|${locale}`;
        const result = evaluate(c, settings);
        const html = renderToStaticMarkup(wrap(locale, createElement(ResultPanel, { radCase: c, settings, result, onRetry: () => {}, onRestart: () => {} })));
        out[k] = createHash("sha256").update(html).digest("hex");
      }
    }
  }
  expect(Object.keys(out)).toEqual(Object.keys(golden));
  const changed = Object.keys(out).filter((k) => out[k] !== golden[k]);
  expect(changed).toEqual([]);
}, 30_000);
