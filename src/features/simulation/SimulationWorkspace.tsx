"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { localize } from "@/lib/localized";
import { ResultPanel } from "@/features/evaluation/ResultPanel";
import { PatientInstructionsPanel } from "@/features/patient/PatientInstructionsPanel";
import { PositioningScene } from "@/features/positioning/scenes";
import { AttemptRecorder } from "@/features/pilot/AttemptRecorder";
import { ResultDisclosure } from "@/features/evaluation/ResultDisclosure";
import { savedAttempt } from "@/features/pilot/saved-attempt";
import { FeedbackBox } from "@/features/pilot/FeedbackBox";
import { splitCaseId } from "@/features/pilot/attempt-record";
import { ConsolePanel } from "@/features/xray-console/ConsolePanel";
import { useSimulationStore } from "@/stores/simulation-store";
import { PhoneWorkspace } from "./PhoneWorkspace";

// Below the site's desktop breakpoint (the side navigation's 1024px) the simulator uses the tabbed phone layout (UI-3, F3).
const PHONE_QUERY = "(max-width: 1023px)";
const subscribePhone = (onChange: () => void) => {
  const query = matchMedia(PHONE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const usePhoneLayout = () => useSyncExternalStore(subscribePhone, () => matchMedia(PHONE_QUERY).matches, () => false);

export function SimulationWorkspace({ caseId, backHref = "/" }: { caseId: string; backHref?: string }) {
  const t = useTranslations("workspace");
  const tr = useTranslations("result");
  const saved = useSyncExternalStore(savedAttempt.subscribe, savedAttempt.get, () => null);
  const ts = useTranslations("sex");
  const locale = useLocale();
  const { activeCase, settings, mode, phase, result, attempt, loadCase, setSetting, expose, retry, reset } =
    useSimulationStore();
  const resultRef = useRef<HTMLDivElement>(null);
  const phone = usePhoneLayout();

  useEffect(() => loadCase(caseId), [caseId, loadCase]);
  useEffect(() => {
    if (phase === "result") resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [phase]);

  if (!activeCase || !settings || activeCase.id !== caseId) return null;
  const c = activeCase;
  const locked = phase === "result";

  const resultPanels = result && (
    <>
      <ResultPanel radCase={c} settings={settings} result={result} onRetry={retry} onRestart={reset} />
      {saved?.status === "saved" && <ResultDisclosure title={tr("addNote")} className="mt-5 rounded-lg border border-line bg-panel [&>div>section]:mt-0 [&>div>section]:border-0 [&>div>section]:p-0">
        <FeedbackBox examId={splitCaseId(c.id).examId} />
      </ResultDisclosure>}
    </>
  );

  // Phone: a full-screen app view; the result replaces the controls inside it (the page itself does not scroll).
  if (phone) {
    return (
      <>
        <AttemptRecorder />
        <PhoneWorkspace radCase={c} settings={settings} mode={mode} onChange={setSetting} onExpose={expose} locked={locked} backHref={backHref} result={resultPanels} />
      </>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6">
      <AttemptRecorder />
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="rounded bg-brand/10 px-2 py-1 text-brand-strong">{t("modePractice")}</span>
          <span className="rounded bg-paper px-2 py-1 text-muted">{t("attempt", { n: attempt })}</span>
        </div>
      </div>

      {locked && <h1 className="sr-only">{localize(c.title, locale)}</h1>}
      {!locked && <>
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
            <PositioningScene radCase={c} settings={settings} mode={mode} onChange={setSetting} disabled={locked} />
            <PatientInstructionsPanel radCase={c} settings={settings} onChange={setSetting} disabled={locked} />
          </div>
          <ConsolePanel radCase={c} settings={settings} mode={mode} onChange={setSetting} onExpose={expose} locked={locked} />
        </div>

      </>}
      <div ref={resultRef} className="scroll-mt-4">
        {resultPanels}
      </div>
    </div>
  );
}
