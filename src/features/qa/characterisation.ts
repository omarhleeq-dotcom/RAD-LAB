/**
 * Session 7 characterisation snapshot (test-only; not imported by the app).
 *
 * Purpose: freeze EVERYTHING a learner can observe for Chest PA, for every scenario of the 53-scenario QA matrix,
 * so a refactor of the case / engine / renderer structure can be proven to change nothing:
 *   - the numeric score, per-category scores, critical findings, pass / below-pass-mark verdict;
 *   - every check (rule id, outcome, credit, weight, evidence) and its EN + AR feedback strings;
 *   - the UI message keys the result screen resolves (outcome, variant, category, effect, alt keys) with their
 *     EN + AR text;
 *   - the EN + AR text alternative of the radiograph canvas;
 *   - the complete evaluation result (incl. result state and exposure) and the complete render plan, as JSON;
 *   - a SHA-256 of the full 8-bit render of the synthetic phantom;
 *   - the SHA-256 of every committed golden PNG;
 *   - the composed case object itself (patient, rules, controls, technique, …) as JSON.
 *
 * The output is committed in `scripts/qa/characterisation/`. It was generated on `main` BEFORE any Session 7
 * production change and must never be regenerated to make a refactor pass: a difference means the refactor changed
 * behaviour. Generate (only on a deliberate, reviewed behaviour change) with:  npm run qa:characterise
 *
 * ADAPTER: the four imports marked below are the only coupling to the production API. A structural refactor may
 * change how they are obtained, never what they return.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createTranslator } from "next-intl";
import enMessages from "../../../messages/en.json";
import arMessages from "../../../messages/ar.json";
// ---- ADAPTER (public production API used by the snapshot) -------------------------------------------------------
import { chestPaErect as caseUnderTest } from "@/data/cases/chest-pa-erect";
import { evaluate } from "@/features/evaluation/engine";
import { buildRenderPlan } from "@/features/radiograph/plan";
import { renderRadiograph } from "@/features/radiograph/pipeline";
// -----------------------------------------------------------------------------------------------------------------
import { describeRadiograph } from "@/features/radiograph/alt";
import { needsNotDrawnLabel, checkIsDrawn, variantIsDrawn } from "@/features/radiograph/consistency";
import { makePhantom, PX_PER_CM } from "@/features/radiograph/test-utils";
import { analyse, SCENARIOS } from "./scenario-matrix";

export const CHARACTERISATION_DIR = resolve(__dirname, "../../../scripts/qa/characterisation");
export const SNAPSHOT_FILE = resolve(CHARACTERISATION_DIR, "chest-pa-scenarios.json");
export const CASE_FILE = resolve(CHARACTERISATION_DIR, "chest-pa-case.json");
export const GOLDEN_CHECKSUMS_FILE = resolve(CHARACTERISATION_DIR, "golden-image-checksums.json");
const GOLDEN_IMAGES = resolve(__dirname, "../../../scripts/qa/golden/images");

type Locale = "en" | "ar";
const MESSAGES = { en: enMessages, ar: arMessages } as const;

// Loosely typed on purpose: the characterisation must not depend on message-key typing of the app.
type Translate = (key: string, values?: Record<string, string | number>) => string;
function translator(locale: Locale, namespace: string): Translate {
  return createTranslator({ locale, messages: MESSAGES[locale] as never, namespace } as never) as unknown as Translate;
}

/**
 * Text alternative of the radiograph canvas. Mirrors `ResultImage.tsx` line for line (same keys, same order) so the
 * snapshot pins the strings the learner hears; the component itself is not changed by Session 7.
 */
function altText(locale: Locale, plan: ReturnType<typeof buildRenderPlan>): { text: string; keys: string[] } {
  const t = translator(locale, "radiograph");
  const keys: string[] = ["radiograph.alt"];
  const d = describeRadiograph(plan);
  const list = new Intl.ListFormat(locale, { style: "long", type: "conjunction" });
  const parts = [t("alt")];
  const phrases = d.findings.map((id) => {
    if (id === "collimation-clipping") {
      keys.push("radiograph.altFindings.collimation-clipping", ...d.clippedSides.map((s) => `radiograph.altSides.${s}`));
      return t("altFindings.collimation-clipping", { sides: list.format(d.clippedSides.map((s) => t(`altSides.${s}`))) });
    }
    keys.push(`radiograph.altFindings.${id}`);
    return t(`altFindings.${id}`);
  });
  if (d.marginOnlySides.length) {
    keys.push("radiograph.altClippingMargin", ...d.marginOnlySides.map((s) => `radiograph.altSides.${s}`));
    parts.push(t("altClippingMargin", { sides: list.format(d.marginOnlySides.map((side) => t(`altSides.${side}`))) }));
  }
  if (d.reference) {
    keys.push("radiograph.altReference");
    parts.push(t("altReference"));
  }
  if (phrases.length) {
    keys.push("radiograph.altFindingsLead");
    parts.push(t("altFindingsLead", { list: list.format(phrases) }));
  }
  const m = d.marker;
  if (m.kind === "none") {
    keys.push("radiograph.altMarkerNone");
    parts.push(t("altMarkerNone"));
  } else if (m.kind === "hidden") {
    keys.push("radiograph.altMarkerHidden");
    parts.push(t("altMarkerHidden", { side: m.side }));
  } else {
    keys.push("radiograph.altMarkerPlaced", `radiograph.altMarkerSides.${m.viewerSide}`);
    parts.push(t("altMarkerPlaced", { side: m.side, viewerSide: t(`altMarkerSides.${m.viewerSide}`) }));
    if (m.wrongSide) {
      keys.push("radiograph.altMarkerWrong");
      parts.push(t("altMarkerWrong"));
    }
    if (m.partlyCut) {
      keys.push("radiograph.altMarkerPartial");
      parts.push(t("altMarkerPartial"));
    }
  }
  return { text: parts.join(" "), keys };
}

/** The result-screen message keys for one result (mirrors `ResultPanel.tsx`) and their EN / AR text. */
function resultMessageKeys(result: ReturnType<typeof evaluate>, plan: ReturnType<typeof buildRenderPlan>) {
  const keys = new Set<string>(["result.passed", "result.failed"]);
  for (const k of result.checks) {
    keys.add(`result.outcome.${k.outcome}`);
    keys.add(`categories.${k.category}`);
    if (needsNotDrawnLabel(k.ruleId, k.outcome, plan)) keys.add("result.notDrawn");
    if (!k.scored) keys.add("result.notScored");
  }
  for (const c of result.score.categories) keys.add(`categories.${c.category}`);
  for (const v of result.variants) {
    keys.add(`result.variants.${v}`);
    if (v !== "correct" && !variantIsDrawn(v, plan)) keys.add("result.notDrawnVariant");
  }
  if (result.criticalFindings.length) keys.add("result.criticalTitle").add("result.criticalNote");
  for (const e of plan.effects) {
    keys.add(`radiograph.effects.${e.id}.title`).add(`radiograph.effects.${e.id}.desc`);
  }
  if (plan.marginOnlySides.length) keys.add("radiograph.clippingMarginNote");
  const sorted = [...keys].sort();
  const text = (locale: Locale) => {
    const out: Record<string, string> = {};
    for (const key of sorted) {
      const [ns, ...rest] = key.split(".");
      const t = translator(locale, ns!);
      out[key] = key === "result.criticalNote"
        ? t(rest.join("."), { total: result.score.total })
        : key === "radiograph.clippingMarginNote"
          ? t(rest.join("."), { sides: plan.marginOnlySides.map((s) => translator(locale, "radiograph")(`altSides.${s}`)).join(" / ") })
          : t(rest.join("."));
    }
    return out;
  };
  return { keys: sorted, en: text("en"), ar: text("ar") };
}

const sha256 = (data: Uint8Array | string) => createHash("sha256").update(data).digest("hex");

/** Deterministic JSON: stable key order, so a diff reflects a value change and never an ordering accident. */
export function stableStringify(value: unknown): string {
  const norm = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(norm);
    if (v && typeof v === "object") {
      return Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, norm((v as Record<string, unknown>)[k])]));
    }
    // NaN / ±Infinity are not JSON; keep them distinguishable instead of silently becoming null.
    if (typeof v === "number" && !Number.isFinite(v)) return `__${String(v)}__`;
    return v;
  };
  return JSON.stringify(norm(value), null, 1) + "\n";
}

export function buildScenarioSnapshot(): Record<string, unknown> {
  const phantom = makePhantom();
  const out: Record<string, unknown> = {};
  for (const sc of SCENARIOS) {
    const r = analyse(sc, caseUnderTest);
    const render = renderRadiograph(r.plan, caseUnderTest.radiograph, phantom, PX_PER_CM);
    const bytes = Uint8Array.from(render.luma, (v) => Math.max(0, Math.min(255, Math.round(v))));
    const msg = resultMessageKeys(r.result, r.plan);
    out[sc.id] = {
      verdict: {
        total: r.result.score.total,
        passed: r.result.score.passed,
        thresholdMet: r.result.score.thresholdMet,
        verdictLabel: r.result.score.passed ? "meets-educational-pass-mark" : "below-educational-pass-mark",
        categories: r.result.score.categories,
        criticalFindings: r.result.criticalFindings,
      },
      checks: r.result.checks.map((k) => ({
        ruleId: k.ruleId,
        category: k.category,
        outcome: k.outcome,
        credit: k.credit,
        weight: k.weight,
        scored: k.scored,
        observed: k.observed,
        observedKind: k.observedKind ?? null,
        variant: k.variant ?? null,
        evidence: k.evidence,
        drawn: checkIsDrawn(k.ruleId, k.outcome, r.plan),
        notDrawnLabel: needsNotDrawnLabel(k.ruleId, k.outcome, r.plan),
        label: k.label,
        feedback: k.feedback,
      })),
      variants: r.result.variants,
      primaryVariant: r.result.primaryVariant,
      messageKeys: msg.keys,
      messagesEn: msg.en,
      messagesAr: msg.ar,
      altText: { en: altText("en", r.plan), ar: altText("ar", r.plan) },
      result: r.result,
      plan: r.plan,
      render: { width: render.width, height: render.height, sha256: sha256(bytes) },
    };
  }
  return out;
}

export function buildCaseSnapshot(): unknown {
  return caseUnderTest;
}

/** SHA-256 of every committed golden PNG (the browser runner compares the canvas with these). */
export function buildGoldenChecksums(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of readdirSync(GOLDEN_IMAGES).filter((n) => n.endsWith(".png")).sort()) {
    out[f] = sha256(readFileSync(resolve(GOLDEN_IMAGES, f)));
  }
  return out;
}
