import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { CASES } from "@/data/cases";
import { CRITICAL_DETECTORS } from "./critical";
import { evaluate } from "./engine";
import { CRITICAL_RULE_LINKS, criticalForCheck, orderFixes, pointsLost, resultContent, ruleTarget } from "./result-presentation";
import { buildRenderPlan } from "@/features/radiograph/plan";
import { RadiographEffects } from "@/features/radiograph/RadiographEffects";
import { ResultImage } from "./ResultImage";
import { ResultPanel } from "./ResultPanel";
import { wordingNsOf } from "@/features/radiograph/wording";
import { variantIsDrawn } from "@/features/radiograph/consistency";
import { localize } from "@/lib/localized";
import { publicText, publicReference } from "@/features/evidence/public-text";
import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";

const c = CASES.find((x) => x.id === "chest-pa-erect")!;
const wrap = (locale: "en" | "ar", node: React.ReactNode) => createElement(NextIntlClientProvider as ComponentType<Record<string, unknown>>, { locale, messages: locale === "en" ? en : ar, timeZone: "UTC" }, node);
const escape = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");

describe("result presentation priority", () => {
  it("keeps every current critical mechanism explicitly linked", () => {
    expect(Object.keys(CRITICAL_RULE_LINKS).sort()).toEqual(Object.keys(CRITICAL_DETECTORS).sort());
  });
  it("puts critical zero-weight marker before non-critical scored losses, without mutating checks", () => {
    const r = evaluate(c, c.initialSettings);
    const snapshot = structuredClone(r);
    const ordered = orderFixes(c, r);
    expect(ordered.every((x) => x.outcome !== "pass")).toBe(true);
    expect(ordered.slice(0, 2).map((x) => x.ruleId)).toEqual(["projection", "side-marker"]);
    expect(ordered.slice(2).every((x) => criticalForCheck(x, c, r.criticalFindings).length === 0)).toBe(true);
    expect(r).toEqual(snapshot);
    for (let i = 3; i < ordered.length; i++) expect(pointsLost(ordered[i - 1], r.checks, c)).toBeGreaterThanOrEqual(pointsLost(ordered[i], r.checks, c));
  });
  it("uses category weights and partial credit, preserving ties and zero-weight items", () => {
    const r = evaluate(c, c.initialSettings);
    r.criticalFindings = [];
    const template = r.checks[0];
    r.checks = [
      { ...template, ruleId: "a", category: "rotation", credit: 0.5, outcome: "partial", weight: 1 },
      { ...template, ruleId: "b", category: "sid", credit: 0, outcome: "fail", weight: 1 },
      { ...template, ruleId: "c", category: "sid", credit: 0, outcome: "fail", weight: 1 },
      { ...template, ruleId: "d", category: "sid", credit: 0, outcome: "fail", weight: 0, scored: false },
    ];
    const custom = { ...c, scoring: { ...c.scoring, categoryWeights: { rotation: 10, sid: 40 } } };
    expect(orderFixes(custom, r).map((k) => k.ruleId)).toEqual(["b", "c", "a", "d"]);
    expect(pointsLost({ ...r.checks[0], capsCategory: true }, r.checks, custom)).toBe(5);
    expect(orderFixes(c, { ...r, checks: r.checks.map((k) => ({ ...k, outcome: "pass" })) })).toEqual([]);
  });
  it("takes targets only from explicit rule data; none is invented for other mechanisms", () => {
    for (const exam of CASES) for (const rule of exam.rules) {
      expect(ruleTarget(rule)).toEqual(rule.kind === "equals" ? rule.expected : rule.kind === "range" ? `${rule.ideal[0]}–${rule.ideal[1]} ${rule.unit}` : undefined);
    }
    expect(ruleTarget(undefined)).toBeUndefined();
  });
});

// The old page used these same image/effect components and variants array. Compare their whole text payload,
// not only IDs: feedback, caption, concept, magnitude, coverage key and evidence must all remain reachable.
describe("no old result information is lost (every exam, EN/AR)", () => {
  for (const locale of ["en", "ar"] as const) it(locale, () => {
    const msgs = locale === "en" ? en : ar;
    for (const exam of CASES) for (const patch of [{}, { rotationDeg: 8, sideMarker: null, kvp: 40, centralRay: { x: 0.3, y: 0.4 } }, { projection: exam.requiredProjection, rotationDeg: 0 }]) {
      const settings = { ...exam.initialSettings, ...patch };
      const result = evaluate(exam, settings);
      const plan = buildRenderPlan(result.resultState, exam);
      const content = resultContent(exam, result, plan);
      const slots = [undefined, ...content.fixes.map((k) => k.ruleId)];
      expect(slots.flatMap((id) => content.effects(id)).map((e) => e.id).sort()).toEqual(plan.effects.map((e) => e.id).sort());
      expect(slots.flatMap((id) => content.variants(id)).sort()).toEqual([...result.variants].sort());
      const out = renderToStaticMarkup(wrap(locale, createElement(ResultPanel, { radCase: exam, settings, result, onRetry() {}, onRestart() {} })));
      const oldSections = renderToStaticMarkup(wrap(locale, createElement("div", null,
        createElement(ResultImage, { radCase: exam, plan }),
        createElement(RadiographEffects, { plan, sex: exam.patient.sex, wording: wordingNsOf(exam.radiograph.projection) }))));
      // Extract the prior caption/effect text nodes, allowing their new containing elements/order.
      for (const text of oldSections.replace(/<[^>]*>/g, "\n").split("\n").map((s) => s.trim()).filter(Boolean)) expect(out, `${exam.id}: ${text}`).toContain(text);
      for (const caption of [msgs.radiograph.educationalNote, msgs.radiograph.margins, msgs.result.imageBrightnessNote, publicText(localize(exam.radiograph.credit, locale))]) expect(out).toContain(escape(caption));
      for (const k of result.checks) {
        expect(out).toContain(escape(localize(k.feedback, locale)));
        for (const value of [publicReference(k.evidence.reference), k.evidence.note && publicText(k.evidence.note)]) if (value) expect(out).toContain(escape(value));
      }
      for (const f of result.criticalFindings) {
        expect(out).toContain(escape(localize(f.reason, locale)));
        for (const ev of [f.concept, f.evidence]) for (const value of [publicReference(ev.reference), ev.note && publicText(ev.note)]) if (value) expect(out).toContain(escape(value));
      }
      for (const v of result.variants) expect(out).toContain(escape(msgs.result.variants[v as keyof typeof msgs.result.variants]));
      if (result.variants.some((v) => v !== "correct" && !variantIsDrawn(v, plan))) expect(out).toContain(escape(msgs.result.notDrawnNote));
      expect(out.indexOf('id="result-heading"')).toBeLessThan(out.indexOf('data-testid="radiograph"'));
    }
  });
});
