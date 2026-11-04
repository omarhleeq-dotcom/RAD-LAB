import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";
import { CASES } from "@/data/cases";
import type { RangeRule } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { evaluate } from "./engine";
import { sidExplainerInput, sidGeometryDiagram, type SidDiagramPanel } from "./sid-geometry";

// The explainer-null identity guard renders every result twice: with the real explainer and with it replaced by null.
const toggle = vi.hoisted(() => ({ off: false }));
vi.mock("@/features/radiograph/SidGeometryExplainer", async (orig) => {
  const real = await orig<typeof import("@/features/radiograph/SidGeometryExplainer")>();
  return { SidGeometryExplainer: (p: Parameters<typeof real.SidGeometryExplainer>[0]) => (toggle.off ? null : real.SidGeometryExplainer(p)) };
});
const { ResultPanel } = await import("./ResultPanel");

const sidRule = (ideal: [number, number] = [100, 110]): RangeRule => ({
  id: "sid", kind: "range", category: "sid", setting: "sidCm", ideal, acceptable: [95, 130], unit: "cm", variantOnLow: "magnified-geometry",
  label: { en: "SID", ar: "SID" }, feedback: { pass: { en: "", ar: "" }, low: { en: "", ar: "" }, high: { en: "", ar: "" }, fail: { en: "", ar: "" } },
  evidence: { status: "provisional", reference: "test" },
});
const shadow = (p: SidDiagramPanel) => p.penumbra[1].x2 - p.penumbra[0].x1;
const blur = (p: SidDiagramPanel) => p.penumbra[0].x2 - p.penumbra[0].x1;

describe("sidExplainerInput: only existing data, only outside the full-credit band", () => {
  it("uses the nearest full-credit edge as the reference", () => {
    expect(sidExplainerInput(sidRule(), 90, "partial")).toEqual({ sidCm: 90, referenceSidCm: 100 });
    expect(sidExplainerInput(sidRule(), 200, "fail")).toEqual({ sidCm: 200, referenceSidCm: 110 });
    expect(sidExplainerInput(sidRule([180, 185]), 120, "fail")).toEqual({ sidCm: 120, referenceSidCm: 180 });
  });
  it("is absent inside the band, on a pass, or for a rule that does not declare geometric magnification", () => {
    for (const sid of [100, 105, 110]) expect(sidExplainerInput(sidRule(), sid, "partial")).toBeUndefined();
    expect(sidExplainerInput(sidRule(), 90, "pass")).toBeUndefined();
    expect(sidExplainerInput({ ...sidRule(), variantOnLow: undefined }, 90, "fail")).toBeUndefined();
    expect(sidExplainerInput({ ...sidRule(), setting: "kvp" }, 90, "fail")).toBeUndefined();
    expect(sidExplainerInput(undefined, 90, "fail")).toBeUndefined();
  });
});

describe("sidGeometryDiagram: similar triangles, shared scale and object gap", () => {
  it("a shorter SID gives a larger, less sharp shadow; a longer SID a smaller, sharper one", () => {
    for (const [sid, ref] of [[90, 100], [80, 100], [120, 180], [100, 180]] as const) {
      const d = sidGeometryDiagram({ sidCm: sid, referenceSidCm: ref });
      expect(d.relation).toBe("shorter");
      expect(shadow(d.yours)).toBeGreaterThan(shadow(d.reference));
      expect(blur(d.yours)).toBeGreaterThan(blur(d.reference));
    }
    for (const [sid, ref] of [[130, 110], [200, 110], [200, 185]] as const) {
      const d = sidGeometryDiagram({ sidCm: sid, referenceSidCm: ref });
      expect(d.relation).toBe("longer");
      expect(shadow(d.yours)).toBeLessThan(shadow(d.reference));
      expect(blur(d.yours)).toBeLessThan(blur(d.reference));
    }
  });
  it("only the SID differs between the panels; everything stays inside the view", () => {
    for (const [sid, ref] of [[80, 100], [100, 180], [200, 110], [130, 110]] as const) {
      const d = sidGeometryDiagram({ sidCm: sid, referenceSidCm: ref });
      expect(d.yours.object).toEqual(d.reference.object);
      expect(d.yours.detector).toEqual(d.reference.detector);
      expect(Math.min(d.yours.focalSpot.y, d.reference.focalSpot.y)).toBeGreaterThan(0);
      for (const p of [d.yours, d.reference]) {
        expect(p.focalSpot.y).toBeLessThan(p.object.y);
        expect(p.penumbra[0].x1).toBeGreaterThan(p.detector.x1);
        expect(p.penumbra[1].x2).toBeLessThan(p.detector.x2);
        for (const r of p.rays) expect(r.y2).toBe(p.detector.y);
        // Each ray passes the object plane at an object edge (straight line from the focal spot).
        const objectPlane = p.object.y + p.object.height / 2;
        const xs = p.rays.map((r) => r.x1 + ((r.x2 - r.x1) * (objectPlane - r.y1)) / (r.y2 - r.y1));
        for (const x of xs) expect([p.object.x, p.object.x + p.object.width].some((e) => Math.abs(x - e) < 1e-9)).toBe(true);
      }
    }
  });
  it("is deterministic and refuses an equal or non-positive SID", () => {
    expect(sidGeometryDiagram({ sidCm: 90, referenceSidCm: 100 })).toEqual(sidGeometryDiagram({ sidCm: 90, referenceSidCm: 100 }));
    expect(() => sidGeometryDiagram({ sidCm: 100, referenceSidCm: 100 })).toThrow(RangeError);
    expect(() => sidGeometryDiagram({ sidCm: 0, referenceSidCm: 100 })).toThrow(RangeError);
  });
});

describe("explainer-null identity guard (owner, Session 4)", () => {
  const wrap = (locale: "en" | "ar", node: React.ReactElement) =>
    createElement(NextIntlClientProvider as ComponentType<Record<string, unknown>>, { locale, messages: locale === "en" ? en : ar, timeZone: "UTC" }, node);
  const render = (c: (typeof CASES)[number], settings: SimulationSettings, locale: "en" | "ar", off: boolean) => {
    toggle.off = off;
    try {
      return renderToStaticMarkup(wrap(locale, createElement(ResultPanel, { radCase: c, settings, result: evaluate(c, settings), onRetry() {}, onRestart() {} })));
    } finally { toggle.off = false; }
  };
  /** Remove the one explainer subtree (its outer div, balanced) from the markup. */
  const strip = (html: string) => {
    const start = html.indexOf('<div data-testid="sid-geometry-explainer"');
    if (start < 0) return html;
    let depth = 0, i = start;
    const tag = /<(\/?)div\b[^>]*>/g;
    tag.lastIndex = start;
    for (let m = tag.exec(html); m; m = tag.exec(html)) {
      depth += m[1] ? -1 : 1;
      if (depth === 0) { i = m.index + m[0].length; break; }
    }
    return html.slice(0, start) + html.slice(i);
  };

  it("the result panel differs from the explainer-null render only by the explainer, and only outside the full-credit band", () => {
    let shown = 0;
    for (const c of CASES) {
      const rule = c.rules.find((r) => r.kind === "range" && r.setting === "sidCm") as RangeRule | undefined;
      if (!rule) continue;
      for (const sidCm of [rule.ideal[0] - 10, rule.ideal[0], rule.ideal[1], rule.ideal[1] + 15]) {
        const settings = { ...c.initialSettings, sidCm };
        const check = evaluate(c, settings).checks.find((k) => k.ruleId === rule.id);
        const expected = sidExplainerInput(rule, sidCm, check?.outcome ?? "pass") !== undefined;
        for (const locale of ["en", "ar"] as const) {
          const real = render(c, settings, locale, false);
          const off = render(c, settings, locale, true);
          expect(real.split('data-testid="sid-geometry-explainer"').length - 1, `${c.id} ${sidCm} ${locale}`).toBe(expected ? 1 : 0);
          expect(strip(real), `${c.id} ${sidCm} ${locale}`).toBe(off);
          if (expected) shown++;
        }
      }
    }
    expect(shown).toBeGreaterThan(0);
  }, 60_000);

  it("the explainer carries only the not-to-scale illustration: no magnification or OID numbers", () => {
    const c = CASES.find((x) => x.id === "chest-pa-erect")!;
    for (const locale of ["en", "ar"] as const) {
      const real = render(c, { ...c.initialSettings, sidCm: 120 }, locale, false);
      const start = real.indexOf('<div data-testid="sid-geometry-explainer"');
      const text = real.slice(start, start + (real.length - strip(real).length)).replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'");
      expect(text).toContain((locale === "en" ? en : ar).result.sidGeometry.notToScale);
      expect(text).not.toMatch(/[0-9٠-٩]/);
    }
  });
});
