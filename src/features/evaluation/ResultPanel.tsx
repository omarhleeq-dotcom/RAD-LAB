"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import type { RadCase } from "@/domain/case";
import type { CoreCategoryId, SimulationSettings } from "@/domain/simulation";
import { localize } from "@/lib/localized";
import { buildRenderPlan } from "@/features/radiograph/plan";
import { needsNotDrawnLabel, variantIsDrawn } from "@/features/radiograph/consistency";
import { RadiographEffects } from "@/features/radiograph/RadiographEffects";
import { wordingNsOf } from "@/features/radiograph/wording";
import { TechniqueResult } from "@/features/technique/TechniqueResult";
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
      case "projection":
        return tCon(`projections.${value as "pa-erect"}`);
      case "breathing":
        return tPat(`breathingOptions.${value as "no-instruction"}`);
      case "motionInstruction":
        return tPat(`motionOptions.${value as "none"}`);
      case "chinPosition":
        return tPos(`chinOptions.${value as "tucked"}`);
      case "shoulderPosition":
        return tPos(`shoulderOptions.${value as "relaxed"}`);
      default:
        return value;
    }
  };

  return (
    <div className="space-y-5">
    <section aria-labelledby="result-heading" className="rounded-lg border border-line bg-panel">
      <div className="border-b border-line px-4 py-3">
        <h2 id="result-heading" className="font-semibold">
          {t("title")}
        </h2>
      </div>
      <div className="grid gap-6 p-4 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <div className="space-y-4">
          <ResultImage radCase={radCase} plan={plan} />
          <div>
            <h3 className="text-sm font-semibold">{t("variantsTitle")}</h3>
            <ul className="mt-1 list-disc ps-5 text-sm text-muted">
              {result.variants.map((v) => (
                <li key={v} data-variant={v} data-drawn={variantIsDrawn(v, plan)}>
                  {t(`variants.${v}`)}
                  {v !== "correct" && !variantIsDrawn(v, plan) && <span className="ms-1 text-xs">({t("notDrawnVariant")})</span>}
                </li>
              ))}
            </ul>
            {result.variants.some((v) => v !== "correct" && !variantIsDrawn(v, plan)) && (
              <p className="mt-1 text-xs text-muted">{t("notDrawnNote")}</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-5">
            <div className="text-center" role="status">
              <div dir="ltr" className="font-mono text-5xl font-bold tabular-nums text-brand-strong">
                {score.total}
              </div>
              <div className="text-xs text-muted">{t("outOf")}</div>
            </div>
            <p
              className={clsx(
                "rounded-md px-3 py-1.5 text-sm font-semibold",
                score.passed ? "bg-ok/10 text-ok" : "bg-bad/10 text-bad",
              )}
            >
              {score.passed ? t("passed") : t("failed")}
            </p>
          </div>
          <p className="-mt-3 text-xs text-muted">{t("scoreNote")}</p>

          {result.criticalFindings.length > 0 && (
            <section aria-labelledby="critical-heading" className="rounded border-2 border-bad bg-bad/5 p-3">
              <h3 id="critical-heading" className="text-sm font-bold text-bad">
                {t("criticalTitle")}
              </h3>
              <p className="mt-1 text-xs text-muted">{t("criticalNote", { total: score.total })}</p>
              <ul className="mt-2 space-y-3">
                {result.criticalFindings.map((f) => (
                  <li key={f.id} data-critical={f.id} className="text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">{localize(f.label, locale)}</span>
                      <EvidenceBadge status={f.evidence.status} />
                    </div>
                    <p className="mt-1 text-ink">{localize(f.reason, locale)}</p>
                    <details className="mt-1 text-xs text-muted">
                      <summary className="cursor-pointer">{t("criticalEvidence")}</summary>
                      <p className="mt-1">
                        <span className="font-semibold">{t("criticalConcept")}:</span> <EvidenceBadge status={f.concept.status} /> {f.concept.note}
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold">{t("criticalImplementation")}:</span> <EvidenceBadge status={f.evidence.status} /> {f.evidence.note}
                      </p>
                      <p className="mt-1">
                        {tEv("reference")}: <bdi dir="ltr">{f.concept.reference}</bdi>
                      </p>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div>
            <h3 className="text-sm font-semibold">{t("breakdown")}</h3>
            <ul className="mt-2 space-y-2">
              {score.categories.map((c) => (
                <li key={c.category} className="text-sm">
                  <div className="flex justify-between">
                    <span>{categoryLabel(c.category)}</span>
                    <span dir="ltr" className="font-mono tabular-nums">
                      {c.earned} / {c.weight}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded bg-paper" aria-hidden>
                    <div className="h-2 rounded bg-brand" style={{ width: `${c.ratio * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("feedback")}</h3>
            <ul className="mt-2 space-y-3">
              {result.checks.map((k) => (
                <li key={k.ruleId} className={clsx("border-s-4 bg-paper/60 py-2 ps-3 pe-2", OUTCOME_STYLE[k.outcome])}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium text-ink">
                      <span aria-hidden>{OUTCOME_ICON[k.outcome]} </span>
                      {localize(k.label, locale)}
                      <span className="ms-2 text-xs font-semibold">{t(`outcome.${k.outcome}`)}</span>
                      {!k.scored && <span className="ms-2 text-xs font-normal text-muted">({t("notScored")})</span>}
                    </span>
                    <span className="text-xs text-muted">
                      {t("yourSetting")}: <bdi dir={k.observedKind || k.observedChoice ? undefined : "ltr"} className={k.observedKind || k.observedChoice ? undefined : "font-mono"}>{observedLabel(k.observedKind, k.observed, k.observedChoice)}</bdi>
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink">{localize(k.feedback, locale)}</p>
                  {k.ruleId === "collimation-clipping" && k.outcome !== "pass" && plan.marginOnlySides.length > 0 && (
                    <p data-testid="clip-margin-note" className="mt-0.5 text-xs text-muted">
                      {tRad("clippingMarginNote", { sides: plan.marginOnlySides.map((side) => tRad(`altSides.${side}`)).join(" / ") })}
                    </p>
                  )}
                  {needsNotDrawnLabel(k.ruleId, k.outcome, plan) && (
                    <p data-testid="not-drawn" className="mt-0.5 text-xs text-muted">{t("notDrawn")}</p>
                  )}
                  <details className="mt-1 text-xs text-muted">
                    <summary className="min-h-6 cursor-pointer py-0.5">
                      {t("evidenceToggle")} <EvidenceBadge status={k.evidence.status} />
                    </summary>
                    <p className="mt-1">
                      {tEv("reference")}: <bdi dir="ltr">{k.evidence.reference}</bdi>
                    </p>
                    {k.evidence.note && <p className="mt-0.5">{k.evidence.note}</p>}
                  </details>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={onRetry} className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand-strong">
              {t("retry")}
            </button>
            <button type="button" onClick={onRestart} className="rounded-md border border-line px-4 py-2 font-medium hover:bg-paper">
              {t("restart")}
            </button>
            <p className="text-xs text-muted">{t("retryHelp")}</p>
          </div>
        </div>
      </div>
    </section>
    <RadiographEffects plan={plan} sex={radCase.patient.sex} wording={wordingNsOf(radCase.radiograph.projection)} />
    <TechniqueResult radCase={radCase} kvp={settings.kvp} manualMas={settings.mas} exposure={result.exposure} />
    </div>
  );
}
