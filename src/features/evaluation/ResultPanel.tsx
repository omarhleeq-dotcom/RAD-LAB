"use client";

import { publicReference, publicText } from "@/features/evidence/public-text";
import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import type { RadCase } from "@/domain/case";
import type { CoreCategoryId, SimulationSettings } from "@/domain/simulation";
import { localize } from "@/lib/localized";
import { buildRenderPlan } from "@/features/radiograph/plan";
import { needsNotDrawnLabel, variantIsDrawn } from "@/features/radiograph/consistency";
import { RadiographEffect } from "@/features/radiograph/RadiographEffects";
import { projectionLabelOf } from "@/features/simulation/projection-label";
import { wordingNsOf } from "@/features/radiograph/wording";
import { TechniqueResult } from "@/features/technique/TechniqueResult";
import { ResultDisclosure } from "./ResultDisclosure";
import { criticalForCheck, resultContent, ruleTarget } from "./result-presentation";
import { ResultImage } from "./ResultImage";
import type { CheckOutcome, CheckResult, EvaluationResult } from "./types";

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
  result: EvaluationResult;
  onRetry: () => void;
  onRestart: () => void;
}

const OUTCOME_STYLE: Record<CheckOutcome, string> = {
  pass: "border-ok text-ok",
  partial: "border-warn text-warn",
  fail: "border-bad text-bad",
};
const OUTCOME_ICON: Record<CheckOutcome, string> = { pass: "✓", partial: "◐", fail: "✕" };

export function ResultPanel({ radCase, settings, result, onRetry, onRestart }: Props) {
  const t = useTranslations("result");
  const tRad = useTranslations("radiograph");
  const tCat = useTranslations("categories");
  const tCon = useTranslations("console");
  const tPos = useTranslations("positioning");
  const tPat = useTranslations("patient");
  const tEv = useTranslations("evidence");
  const locale = useLocale();
  const { score } = result;
  const plan = useMemo(() => buildRenderPlan(result.resultState, radCase), [result.resultState, radCase]);
  // Core categories use their message keys; a category an exam adds brings its own bilingual label (S11).
  const categoryLabel = (id: string) => {
    const own = radCase.scoring.categoryLabels?.[id];
    return own ? localize(own, locale) : tCat(id as CoreCategoryId);
  };
  const observedLabel = (kind: CheckResult["observedKind"], value: string, choice?: string) => {
    if (choice) {
      const label = radCase.choiceControls?.find((x) => x.id === choice)?.options.find((o) => o.id === value)?.label;
      return label ? localize(label, locale) : value;
    }
    switch (kind) {
      case "projection": {
        const own = projectionLabelOf(radCase.choiceControls, result.resultState.patient.choices, value as "pa-erect");
        return own ? localize(own, locale) : tCon(`projections.${value as "pa-erect"}`);
      }
      case "breathing":
        return tPat(`breathingOptions.${value as "no-instruction"}`, { sex: radCase.patient.sex });
      case "motionInstruction":
        return tPat(`motionOptions.${value as "none"}`, { sex: radCase.patient.sex });
      case "chinPosition":
        return tPos(`chinOptions.${value as "tucked"}`);
      case "shoulderPosition":
        return tPos(`shoulderOptions.${value as "relaxed"}`);
      default:
        return value;
    }
  };

  const content = resultContent(radCase, result, plan);
  const effects = (ruleId?: string) => content.effects(ruleId).map((effect) => (
    <RadiographEffect key={effect.id} effect={effect} plan={plan} sex={radCase.patient.sex} wording={wordingNsOf(radCase.radiograph.projection)} />
  ));
  const variants = (ruleId?: string) => content.variants(ruleId).map((v) => (
    <p key={v} data-variant={v} data-drawn={variantIsDrawn(v, plan)} className="text-xs text-muted">
      {t(`variants.${v}`)}{v !== "correct" && !variantIsDrawn(v, plan) && <> ({t("notDrawnVariant")})</>}
    </p>
  ));
  const evidence = (ev: CheckResult["evidence"]) => (
    <div className="mt-2 space-y-1 text-xs text-muted">
      <EvidenceBadge status={ev.status} /> <a href={`/${locale}/credits`} className="underline text-brand-strong">{tEv("reference")}</a>
      {publicReference(ev.reference) && <p>{tEv("reference")}: <bdi dir="ltr">{publicReference(ev.reference)}</bdi></p>}
      {ev.note && <p>{publicText(ev.note)}</p>}
    </div>
  );
  const item = (k: CheckResult) => {
    const critical = criticalForCheck(k, radCase, result.criticalFindings);
    const target = ruleTarget(radCase.rules.find((r) => r.id === k.ruleId));
    return (
      <li key={k.ruleId} className={clsx("rounded border-s-4 bg-paper/60", OUTCOME_STYLE[k.outcome])}>
        <ResultDisclosure title={<>
          <span className="block text-ink">
            <span aria-hidden>{OUTCOME_ICON[k.outcome]} </span>
            <span className="font-semibold">{localize(k.label, locale)}</span>{" "}
            <span className="text-xs">{t(`outcome.${k.outcome}`)}</span>{" "}
            {critical.length > 0 && <strong className="text-xs text-bad">{t("critical")}</strong>}
            {!k.scored && <span className="ms-1 text-xs text-muted">({t("notScored")})</span>}
            <span className="ms-2 text-xs text-muted">{t("yourSetting")}: <bdi dir={k.observedKind || k.observedChoice ? undefined : "ltr"}>{observedLabel(k.observedKind, k.observed, k.observedChoice)}</bdi>
              {target !== undefined && <> <span aria-hidden className="inline-block rtl:-scale-x-100">→</span> <span className="sr-only">{t("target")}: </span><bdi dir={k.observedKind || k.observedChoice ? undefined : "ltr"}>{observedLabel(k.observedKind, target, k.observedChoice)}</bdi></>}
            </span>
          </span>
          {/* Feedback contains decimals, abbreviations and inline references in both locales; retain it verbatim,
              clamped, rather than risk treating a reference or decimal point as a sentence boundary. */}
          <span className="mt-1 line-clamp-2 text-sm text-ink group-aria-expanded:hidden">{localize(k.feedback, locale)}</span>
        </>}>
          <p className="text-sm text-ink">{localize(k.feedback, locale)}</p>
          {k.ruleId === "collimation-clipping" && k.outcome !== "pass" && plan.marginOnlySides.length > 0 && (
            <p data-testid="clip-margin-note" className="mt-1 text-xs text-muted">{tRad("clippingMarginNote", { sides: plan.marginOnlySides.map((side) => tRad(`altSides.${side}`)).join(" / ") })}</p>
          )}
          {needsNotDrawnLabel(k.ruleId, k.outcome, plan) && <p data-testid="not-drawn" className="mt-1 text-xs text-muted">{t("notDrawn")}</p>}
          {variants(k.ruleId)}
          <ul className="mt-2 space-y-2">{effects(k.ruleId)}</ul>
          {evidence(k.evidence)}
          {critical.map((f) => <div key={f.id} data-critical={f.id} className="mt-2 space-y-1 border-t border-line pt-2 text-sm text-ink">
            <p>{localize(f.reason, locale)}</p>
            {f.id === result.criticalFindings[0]?.id && <p className="text-xs text-muted">{t("criticalNote", { total: score.total })}</p>}
            <p className="text-xs font-semibold">{t("criticalConcept")}</p>{evidence(f.concept)}
            <p className="text-xs font-semibold">{t("criticalImplementation")}</p>{evidence(f.evidence)}
          </div>)}
        </ResultDisclosure>
      </li>
    );
  };

  return (
    <section aria-labelledby="result-heading" className="space-y-4 rounded-lg border border-line bg-panel p-3 sm:p-4">
      <div className="space-y-2 rounded border border-line p-3" role="status">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="result-heading" className={clsx("font-bold", score.passed ? "text-ok" : "text-bad")}>{score.passed ? t("passed") : t("failed")}</h2>
          <span dir="ltr" className="font-mono text-2xl font-bold text-brand-strong">{score.total} <span className="text-sm">/ 100</span></span>
        </div>
        {result.criticalFindings.length > 0 && <p className="text-sm text-bad">{result.criticalFindings.map((f) => localize(f.label, locale)).join(" / ")}</p>}
        <p className="flex flex-wrap gap-x-4 text-xs">
          {(["fail", "partial", "pass"] as const).map((outcome) => <span key={outcome}>{t(`outcome.${outcome}`)}: {result.checks.filter((k) => k.outcome === outcome).length}</span>)}
        </p>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="min-w-0 lg:sticky lg:top-4">
          <ResultImage radCase={radCase} plan={plan} information={<>
            <p className="text-xs text-muted">{t("scoreNote")}</p>
            <h3 className="mt-3 text-sm font-semibold">{tRad("effectsTitle")}</h3>
            <p className="text-xs text-muted">{tRad("effectsIntro")}</p>
            {variants()}
            {result.variants.some((v) => v !== "correct" && !variantIsDrawn(v, plan)) && <p className="text-xs text-muted">{t("notDrawnNote")}</p>}
            <ul className="mt-2 space-y-2">{effects()}</ul>
          </>} />
        </div>

        <div className="min-w-0 space-y-3">
          <div>
            <h3 className="mb-2 font-semibold">{t("fixThese")}</h3>
            <ul className="space-y-2">{content.fixes.map(item)}</ul>
          </div>
          <ResultDisclosure title={<strong>{t("correctCount", { n: content.correct.length })}</strong>} className="rounded border border-line">
            <ul className="space-y-2">{content.correct.map(item)}</ul>
          </ResultDisclosure>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onRetry} className="min-h-11 rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand-strong">{t("retry")}</button>
            <button type="button" onClick={onRestart} className="min-h-11 rounded-md border border-line px-4 py-2 font-medium hover:bg-paper">{t("restart")}</button>
            <p className="w-full text-xs text-muted">{t("retryHelp")}</p>
          </div>
          <ResultDisclosure title={<strong>{t("breakdown")}</strong>} className="rounded border border-line">
            <ul className="space-y-2">{score.categories.map((c) => <li key={c.category} className="text-sm">
              <div className="flex justify-between gap-2"><span>{categoryLabel(c.category)}</span><span dir="ltr" className="font-mono">{c.earned} / {c.weight}</span></div>
              <div className="mt-1 h-2 rounded bg-paper" aria-hidden><div className="h-2 rounded bg-brand" style={{ width: `${c.ratio * 100}%` }} /></div>
            </li>)}</ul>
          </ResultDisclosure>
          <ResultDisclosure title={<strong>{t("techniqueAnalysis")}</strong>} className="rounded border border-line">
            <TechniqueResult radCase={radCase} kvp={settings.kvp} manualMas={settings.mas} exposure={result.exposure} />
          </ResultDisclosure>

        </div>
      </div>
    </section>
  );
}
