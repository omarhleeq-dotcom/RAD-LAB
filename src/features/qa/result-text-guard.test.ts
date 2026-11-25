import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
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

/**
 * RAD-100 presentation-only guard (DECISIONS.md#result-references-owner-2026-11-04). The result panel's text nodes, in order, for
 * every exam × scenario grid × locale, hashed per exam and locale. The golden was captured from main BEFORE the collapse change.
 * Elements marked `data-ui-label` (the new disclosure labels, the only new strings) are removed first; every other text node must
 * stay identical. Collapsed content stays mounted (ResultDisclosure hides it, never unmounts it), so the server markup is the text
 * with every disclosure opened. Rewriting the golden requires `UPDATE_RESULT_TEXT=1` and an owner-approved text change.
 */
const FILE = "scripts/qa/scene-dom/result-text-hashes.json";
const wrap = (locale: "en" | "ar", node: React.ReactElement) =>
  createElement(NextIntlClientProvider as ComponentType<Record<string, unknown>>, { locale, messages: locale === "en" ? en : ar, timeZone: "UTC" }, node);

const LABEL_RE = /<(span|strong)\b[^>]*\sdata-ui-label="true"[^>]*>[^<]*<\/\1>/g;
/** Visible text nodes in document order; whitespace-only nodes carry no text. */
const textNodes = (html: string) =>
  html.replace(LABEL_RE, "").split(/<[^>]*>/).map((s) => s.trim()).filter(Boolean);

/** A value grid that includes every numeric / marker / choice / own-family projection state the scene-dom guards use. */
function scenarios(c: RadCase): [string, Partial<SimulationSettings>][] {
  const s: [string, Partial<SimulationSettings>][] = [["initial", {}]];
  for (const r of [-15, -8, 0, 3, 8, 15, 20, 35, 40, 45, 55, 60]) s.push([`rot${r}`, { rotationDeg: r }]);
  const marks: [string, number, number][] = [["L", -0.62, 0], ["R", 0.62, 0], ["L", 0.1, 0], ["L", -0.68, 0], ["R", 0.1, 0], ["L", -0.5, 0], ["R", 0.5, 0],
    ["L", -0.46, 0], ["R", 0.46, 0], ["L", 0.5, -0.5], ["R", -0.86, -0.743], ["L", 0.93, -0.6], ["R", 0.37, -0.38], ["L", 0.37, -0.38]];
  for (const [m, x, y] of marks) s.push([`marker${m}${x},${y}`, { sideMarker: m as "L", markerPosition: { x, y } }]);
  s.push(["markerNone", { sideMarker: null }], ["markerL0", { sideMarker: "L", markerPosition: c.positioning.defaultMarkerPosition.L }],
    ["markerR0", { sideMarker: "R", markerPosition: c.positioning.defaultMarkerPosition.R }], ["rayOff", { centralRay: { x: 0.3, y: 0.4 } }]);
  for (const [w, h] of [[0.4, 0.4], [0.6, 0.5], [0.3, 0.4]] as const) s.push([`coll${w}x${h}`, { collimation: { width: w, height: h } }]);
  for (const sid of [102, 120, 200]) s.push([`sid${sid}`, { sidCm: sid }]);
  for (const kvp of [45, 60, 90, 150]) s.push([`kv${kvp}`, { kvp }]);
  s.push(["lowMas", { mas: 0.5 } as never]);
  if (c.initialSettings.tubeAngulationDeg !== undefined || c.controls.tubeAngulationDeg)
    for (const a of [-15, -10, -6, 0, 10, 15]) s.push([`tube${a}`, { tubeAngulationDeg: a }]);
  for (const p of new Set(CASES.filter((x) => x.bodyPart === c.bodyPart).map((x) => x.initialSettings.projection))) s.push([`proj-${p}`, { projection: p }]);
  for (const cc of c.choiceControls ?? []) for (const o of cc.options) s.push([`choice-${cc.id}-${o.id}`, { choices: { ...(c.initialSettings.choices ?? {}), [cc.id]: o.id } }]);
  return s;
}

it("the result panel text is unchanged by the RAD-100 collapse (presentation only)", () => {
  const out: Record<string, string> = {};
  for (const c of CASES) for (const locale of ["en", "ar"] as const) {
    const hash = createHash("sha256");
    for (const [name, patch] of scenarios(c)) {
      const settings = { ...c.initialSettings, ...patch } as SimulationSettings;
      const html = renderToStaticMarkup(wrap(locale, createElement(ResultPanel, { radCase: c, settings, result: evaluate(c, settings), onRetry: () => {}, onRestart: () => {} })));
      hash.update(`${name}\u0000${textNodes(html).join("\u0001")}\u0002`);
    }
    out[`text|${c.id}|${locale}`] = hash.digest("hex");
  }
  if (process.env.UPDATE_RESULT_TEXT === "1") writeFileSync(FILE, JSON.stringify(out, null, 1) + "\n");
  if (!existsSync(FILE)) throw new Error(`Missing result-text golden: ${FILE}. Writing requires UPDATE_RESULT_TEXT=1.`);
  const golden = JSON.parse(readFileSync(FILE, "utf8")) as Record<string, string>;
  expect(Object.keys(out)).toEqual(Object.keys(golden));
  expect(Object.keys(out).filter((k) => out[k] !== golden[k])).toEqual([]);
}, 120_000);
