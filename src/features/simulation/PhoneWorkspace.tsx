"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import type { RadCase } from "@/domain/case";
import type { SimulationMode, SimulationSettings } from "@/domain/simulation";
import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/localized";
import { PatientInstructionsPanel } from "@/features/patient/PatientInstructionsPanel";
import type { SceneSlots } from "@/features/positioning/PositioningView";
import { PositioningScene } from "@/features/positioning/scenes";
import { assessReadiness } from "@/features/technique/readiness";
import { ChoiceControls, ConsolePanel, ProjectionControl } from "@/features/xray-console/ConsolePanel";
import { ReadinessPanel } from "@/features/xray-console/ReadinessPanel";
import { WORKSPACE_TABS, followingTab, nextTab, stepState, tabsNeedingAttention, type WorkspaceTab } from "./workspace-tabs";

/** The shell listens for this and opens its navigation dialog (menu + language switch) when its own top bar is hidden. */
export const OPEN_MENU_EVENT = "radlab:open-menu";

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
  mode: SimulationMode;
  onChange: <K extends keyof SimulationSettings>(key: K, value: SimulationSettings[K]) => void;
  onExpose: () => void;
  locked: boolean;
  /** Locale-less path of the exam's library category (the back button). */
  backHref: string;
  /** The result screen (set after Expose): it replaces the controls and scrolls inside the view. */
  result: ReactNode;
}

type SlotKey = keyof SceneSlots;

const Icon = ({ d }: { d: string }) => (
  <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const barButton = "grid size-11 shrink-0 place-items-center rounded-lg text-ink hover:bg-paper";

/** A step's state mark (RAD-101 D3): ✓ done, an amber dot for a note (an unready item), an empty ring when not started; announced in the tab name. */
function StepMark({ state, label }: { state: "done" | "note" | "todo"; label: string }) {
  return (
    <>
      <span
        aria-hidden
        className={clsx(
          "grid size-3.5 shrink-0 place-items-center rounded-full text-[10px] leading-none",
          state === "done" && "bg-ok text-paper",
          state === "note" && "bg-warn",
          state === "todo" && "border-2 border-line",
        )}
      >
        {state === "done" ? "✓" : null}
      </span>
      <span className="sr-only"> ({label})</span>
    </>
  );
}

/**
 * Phone layout of the simulator (UI-3, F3/F4 Practice; RAD-101 D1–D4) as a full-screen app view: the page itself never scrolls.
 * Top bar (back, title, case details, menu) → scene (fixed; its view follows the step) → four numbered steps → the open step
 * (scrolls inside only when needed) → a fixed bottom bar with "Next" and Expose (available on every step). The existing control
 * groups are reused unchanged; the scene's own groups are portalled into the step panels and its schematic note into the
 * case-details sheet (`SceneSlots`), so the scene drawing and the desktop layout stay as they were. Navigation is free; each step
 * shows done / note (an unready item) / not started, and the readiness list sits in the last step, right before Expose.
 */
export function PhoneWorkspace({ radCase, settings, mode, onChange, onExpose, locked, backHref, result }: Props) {
  const t = useTranslations("workspace");
  const tc = useTranslations("console");
  const tsx = useTranslations("sex");
  const tshell = useTranslations("shell");
  const locale = useLocale();
  const rtl = locale === "ar";
  const base = useId();
  const readinessId = useId();
  const [tab, setTab] = useState<WorkspaceTab>("positioning");
  const [slots, setSlots] = useState<SceneSlots>({ positioning: null, centring: null, notes: null });
  // Stable callback refs: a new function per render would detach and re-attach the target on every update.
  const [{ positioning: attachPositioning, centring: attachCentring, notes: attachNotes }] = useState(() => {
    const target = (key: SlotKey) => (el: HTMLDivElement | null) => setSlots((s) => (s[key] === el ? s : { ...s, [key]: el }));
    return { positioning: target("positioning"), centring: target("centring"), notes: target("notes") };
  });
  const tabRefs = useRef<Partial<Record<WorkspaceTab, HTMLButtonElement | null>>>({});
  const panels = useRef<HTMLDivElement>(null);
  // Steps the learner has moved on from: "done" unless they still hold an unready item.
  const [visited, setVisited] = useState<ReadonlySet<WorkspaceTab>>(() => new Set());
  const caseSheet = useRef<HTMLDialogElement>(null);
  const caseStart = useRef<HTMLButtonElement>(null);
  const caseTrigger = useRef<HTMLButtonElement>(null);
  const autoOpened = useRef<string | null>(null);
  // "Enlarge scene": the same scene near full screen (tabs and bar hidden) for precise dragging; the settings live in the store, so closing keeps them.
  const [enlargedState, setEnlarged] = useState(false);
  const enlarged = enlargedState && !result;
  const enlargeOpen = useRef<HTMLButtonElement>(null);
  const enlargeClose = useRef<HTMLButtonElement>(null);
  const wasEnlarged = useRef(false);

  const readiness = assessReadiness(radCase, settings, locked ? "result" : "setup");
  const attention = tabsNeedingAttention(readiness);
  const STEP_TEXT = { done: t("stepDone"), note: t("needsAttention"), todo: t("stepNotStarted") };

  // The case details (the condition can matter) open once when a case is first loaded; Retry keeps the same case and does not reopen them.
  useEffect(() => {
    if (result || autoOpened.current === radCase.id) return;
    autoOpened.current = radCase.id;
    const dialog = caseSheet.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      caseStart.current?.focus();
    }
  }, [radCase.id, result]);

  // Same focus handling as the sheets: focus moves to Close when it opens and back to the Enlarge button when it closes.
  useEffect(() => {
    if (enlarged) enlargeClose.current?.focus();
    else if (wasEnlarged.current) enlargeOpen.current?.focus();
    wasEnlarged.current = enlarged;
  }, [enlarged]);

  const select = (id: WorkspaceTab, focus = false) => {
    if (id !== tab) setVisited((v) => (v.has(tab) ? v : new Set(v).add(tab)));
    setTab(id);
    if (focus) tabRefs.current[id]?.focus();
    panels.current?.scrollTo({ top: 0 });
  };
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, from: WorkspaceTab) => {
    const next = nextTab(from, e.key, rtl);
    if (!next) return;
    e.preventDefault();
    select(next, true);
  };
  const openCase = () => {
    caseSheet.current?.showModal();
    caseStart.current?.focus();
  };

  const following = followingTab(tab);
  const panel = (id: WorkspaceTab) => ({
    id: `${base}-panel-${id}`,
    role: "tabpanel" as const,
    "aria-labelledby": `${base}-tab-${id}`,
    hidden: tab !== id,
  });

  return (
    <div data-phone-app className="relative flex h-dvh flex-col overflow-hidden bg-paper">
      <header inert={enlarged} className="flex shrink-0 items-center gap-1 border-b border-line bg-panel px-2 py-1">
        <Link href={backHref} aria-label={t("backToLibrary")} className={barButton}>
          <span className="rtl:-scale-x-100">
            <Icon d="M15 5l-7 7 7 7" />
          </span>
        </Link>
        <h1 id="case-heading" className="min-w-0 flex-1 truncate px-1 text-base font-bold">
          {localize(radCase.title, locale)}
        </h1>
        <button ref={caseTrigger} type="button" aria-haspopup="dialog" aria-label={t("caseDetails")} onClick={openCase} className={barButton}>
          <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h.01" />
          </svg>
        </button>
        <button type="button" aria-haspopup="dialog" aria-label={tshell("openMenu")} onClick={() => window.dispatchEvent(new Event(OPEN_MENU_EVENT))} className={barButton}>
          <Icon d="M3 6h18M3 12h18M3 18h18" />
        </button>
      </header>

      {result ? (
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">{result}</div>
      ) : (
        <>
          <div
            role={enlarged ? "dialog" : undefined}
            aria-modal={enlarged || undefined}
            aria-label={enlarged ? t("enlargeScene") : undefined}
            onKeyDown={(e) => {
              if (enlarged && e.key === "Escape") setEnlarged(false);
            }}
            className={enlarged ? "fixed inset-0 z-40 flex flex-col overflow-y-auto bg-paper" : "shrink-0 border-b border-line bg-paper"}
          >
            <PositioningScene
              radCase={radCase}
              settings={settings}
              mode={mode}
              onChange={onChange}
              disabled={locked}
              slots={slots}
              enlarge={{ active: enlarged, onToggle: () => setEnlarged(!enlarged), openRef: enlargeOpen, closeRef: enlargeClose }}
              step={tab}
            />
            <div role="tablist" aria-label={t("tabsLabel")} className={clsx("grid-cols-4", enlarged ? "hidden" : "grid")}>
              {WORKSPACE_TABS.map((id, n) => (
                <button
                  key={id}
                  ref={(el) => {
                    tabRefs.current[id] = el;
                  }}
                  id={`${base}-tab-${id}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  aria-controls={`${base}-panel-${id}`}
                  tabIndex={tab === id ? 0 : -1}
                  onClick={() => select(id)}
                  onKeyDown={(e) => onTabKey(e, id)}
                  className={clsx(
                    "relative flex min-h-11 items-center justify-center gap-1 border-b-2 px-1 text-sm leading-tight font-semibold",
                    tab === id ? "border-brand text-brand-strong" : "border-transparent text-muted hover:text-ink",
                  )}
                >
                  <span aria-hidden className="shrink-0 tabular-nums">{n + 1}</span>
                  {t(`tabs.${id}`)}
                  <StepMark state={stepState(id, attention, visited)} label={STEP_TEXT[stepState(id, attention, visited)]} />
                </button>
              ))}
            </div>
          </div>

          <div ref={panels} inert={enlarged} className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
            <div {...panel("positioning")} className="space-y-3">
              <div ref={attachPositioning} className="rounded-lg border border-line bg-panel p-3" />
              {/* After the scene's own group, as in the desktop reading order (scene, then console); the projection moves here (D3). */}
              <div className="space-y-4 rounded-lg bg-console p-3 text-console-text">
                <ProjectionControl radCase={radCase} settings={settings} onChange={onChange} locked={locked} phone />
                <ChoiceControls radCase={radCase} settings={settings} onChange={onChange} locked={locked} />
              </div>
            </div>
            <div {...panel("centring")}>
              <div ref={attachCentring} className="rounded-lg border border-line bg-panel p-3" />
            </div>
            <div {...panel("technique")}>
              <ConsolePanel radCase={radCase} settings={settings} mode={mode} onChange={onChange} onExpose={onExpose} locked={locked} phone />
            </div>
            <div {...panel("patient")} className="space-y-3">
              <PatientInstructionsPanel radCase={radCase} settings={settings} onChange={onChange} disabled={locked} />
              {/* The readiness list (a Practice hint), right before Expose; it also describes the Expose button. */}
              {!locked && (
                <div className="rounded-lg bg-console p-3 text-console-text">
                  <ReadinessPanel readiness={readiness} id={readinessId} />
                </div>
              )}
            </div>
          </div>

          <div inert={enlarged} className="flex shrink-0 items-center gap-2 border-t border-console-line bg-console px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-console-text">
            {!locked && following && (
              <button
                type="button"
                onClick={() => select(following)}
                className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1 rounded-md border border-console-line px-3 text-sm font-semibold text-white hover:bg-console-raise"
              >
                <span className="truncate">{t("nextStep", { step: t(`tabs.${following}`) })}</span>
                <span aria-hidden className="rtl:-scale-x-100">›</span>
              </button>
            )}
            <button
              type="button"
              onClick={onExpose}
              disabled={!readiness.canExpose}
              aria-describedby={locked ? undefined : readinessId}
              className={clsx(
                "min-h-11 rounded-md bg-signal px-5 py-2 font-bold tracking-widest text-ink hover:brightness-110 disabled:cursor-not-allowed disabled:bg-console-line disabled:text-console-text",
                (locked || !following) && "flex-1",
              )}
            >
              {locked ? tc("locked") : tc("expose")}
            </button>
          </div>
        </>
      )}

      <dialog
        ref={caseSheet}
        aria-labelledby={`${base}-case-title`}
        className="mx-0 mt-auto mb-0 max-h-[85dvh] w-full max-w-full overflow-y-auto rounded-t-2xl bg-panel p-4 text-ink backdrop:bg-black/50"
        onClose={() => caseTrigger.current?.focus()}
        onClick={(e) => {
          if (e.target === e.currentTarget) caseSheet.current?.close();
        }}
      >
        <h2 id={`${base}-case-title`} className="text-lg font-bold">
          {t("caseDetails")}
        </h2>
        <dl className="mt-3 space-y-3 text-sm">
          <div>
            <dt className="font-semibold text-muted">{t("patient")}</dt>
            <dd>
              {localize(radCase.patient.description, locale)} ({tsx(radCase.patient.sex)}, {radCase.patient.age})
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-muted">{t("request")}</dt>
            <dd>{localize(radCase.requestedExamination, locale)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-muted">{t("scenario")}</dt>
            <dd>{localize(radCase.clinicalScenario, locale)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-muted">{t("condition")}</dt>
            <dd>{localize(radCase.patientCondition, locale)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted">{t("practiceHint")}</p>
        {/* The scene's schematic note lands here, once (SceneSlots.notes). */}
        <div ref={attachNotes} className="[&_p]:px-0" />
        <button ref={caseStart} type="button" onClick={() => caseSheet.current?.close()} className="mt-4 min-h-11 w-full rounded-md bg-brand px-4 py-2 font-bold text-white hover:bg-brand-strong">
          {t("startCase")}
        </button>
      </dialog>
    </div>
  );
}
