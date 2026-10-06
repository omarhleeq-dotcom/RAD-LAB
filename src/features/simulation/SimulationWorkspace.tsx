"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/localized";
import { ResultPanel } from "@/features/evaluation/ResultPanel";
import { PatientInstructionsPanel } from "@/features/patient/PatientInstructionsPanel";
import { PositioningView } from "@/features/positioning/PositioningView";
import { ConsolePanel } from "@/features/xray-console/ConsolePanel";
import { useSimulationStore } from "@/stores/simulation-store";

export function SimulationWorkspace({ caseId }: { caseId: string }) {
  const t = useTranslations("workspace");
  const tc = useTranslations("common");
  const ts = useTranslations("sex");
  const locale = useLocale();
  const { activeCase, settings, mode, phase, result, attempt, loadCase, setSetting, expose, retry, reset } =
    useSimulationStore();
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => loadCase(caseId), [caseId, loadCase]);
  useEffect(() => {
    if (phase === "result") resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [phase]);

  if (!activeCase || !settings || activeCase.id !== caseId) return null;
  const c = activeCase;
  const locked = phase === "result";

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-sm text-brand hover:underline">
          ← {tc("backHome")}
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="rounded bg-brand/10 px-2 py-1 text-brand-strong">{t("modePractice")}</span>
          <span className="rounded bg-paper px-2 py-1 text-muted">{t("attempt", { n: attempt })}</span>
          {c.provisional && <span className="rounded bg-signal/25 px-2 py-1 text-warn">{tc("provisionalBadge")}</span>}
        </div>
      </div>

      <section aria-labelledby="case-heading" className="rounded-lg border border-line bg-panel p-4">
        <h1 id="case-heading" className="text-xl font-bold">
          {localize(c.title, locale)}
        </h1>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-muted">{t("patient")}</dt>
            <dd>
              {localize(c.patient.description, locale)} ({ts(c.patient.sex)}, {c.patient.age})
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-muted">{t("request")}</dt>
            <dd>{localize(c.requestedExamination, locale)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-muted">{t("scenario")}</dt>
            <dd>{localize(c.clinicalScenario, locale)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-muted">{t("condition")}</dt>
            <dd>{localize(c.patientCondition, locale)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted">{t("practiceHint")}</p>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-5">
          <PositioningView radCase={c} settings={settings} mode={mode} onChange={setSetting} disabled={locked} />
          <PatientInstructionsPanel radCase={c} settings={settings} onChange={setSetting} disabled={locked} />
        </div>
        <ConsolePanel radCase={c} settings={settings} mode={mode} onChange={setSetting} onExpose={expose} locked={locked} />
      </div>

      <div ref={resultRef} className="scroll-mt-4">
        {result && (
          <ResultPanel radCase={c} settings={settings} result={result} onRetry={retry} onRestart={reset} />
        )}
      </div>
    </main>
  );
}
