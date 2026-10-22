"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import type { RadCase } from "@/domain/case";
import type { SimulationMode, SimulationSettings } from "@/domain/simulation";
import { PatientInstructionsPanel } from "@/features/patient/PatientInstructionsPanel";
import type { SceneSlots } from "@/features/positioning/PositioningView";
import { PositioningScene } from "@/features/positioning/scenes";
import { assessReadiness } from "@/features/technique/readiness";
import { ChoiceControls, ConsolePanel } from "@/features/xray-console/ConsolePanel";
import { LED, ReadinessPanel } from "@/features/xray-console/ReadinessPanel";
import { WORKSPACE_TABS, nextTab, tabsNeedingAttention, type WorkspaceTab } from "./workspace-tabs";

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
  mode: SimulationMode;
  onChange: <K extends keyof SimulationSettings>(key: K, value: SimulationSettings[K]) => void;
  onExpose: () => void;
  locked: boolean;
}

type SlotKey = keyof SceneSlots;

/**
 * Phone layout of the simulator (UI-3, F3/F4 Practice): a sticky scene with the four control tabs under it, and a sticky
 * bottom bar with the readiness summary and Expose. The existing control groups are reused unchanged; the scene's own
 * groups are portalled into the tab panels (`SceneSlots`), so the scene drawing and the desktop layout stay as they were.
 * Navigation is free; a dot marks a tab that holds an unready item. Forced order (Assess) is not part of this layout.
 */
export function PhoneWorkspace({ radCase, settings, mode, onChange, onExpose, locked }: Props) {
  const t = useTranslations("workspace");
  const tc = useTranslations("console");
  const tr = useTranslations("console.readiness");
  const rtl = useLocale() === "ar";
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
  const stickyStart = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDialogElement>(null);
  const sheetClose = useRef<HTMLButtonElement>(null);
  const sheetTrigger = useRef<HTMLButtonElement>(null);

  const readiness = assessReadiness(radCase, settings, locked ? "result" : "setup");
  const attention = tabsNeedingAttention(readiness);

  const select = (id: WorkspaceTab, focus = false) => {
    setTab(id);
    if (focus) tabRefs.current[id]?.focus();
    // When the scene is already stuck, show the new panel from its start instead of somewhere in the middle.
    const start = stickyStart.current;
    if (start && start.getBoundingClientRect().top < 0) start.scrollIntoView({ block: "start" });
  };
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, from: WorkspaceTab) => {
    const next = nextTab(from, e.key, rtl);
    if (!next) return;
    e.preventDefault();
    select(next, true);
  };
  const openSheet = () => {
    sheet.current?.showModal();
    sheetClose.current?.focus();
  };
  const closeSheet = () => sheet.current?.close();

  const panel = (id: WorkspaceTab) => ({
    id: `${base}-panel-${id}`,
    role: "tabpanel" as const,
    "aria-labelledby": `${base}-tab-${id}`,
    hidden: tab !== id,
  });

  return (
    <div>
      <div ref={stickyStart} />
      <div className="sticky top-[var(--site-bar-height,4.75rem)] z-10 -mx-4 bg-paper px-4 pt-2 shadow-sm">
        <PositioningScene radCase={radCase} settings={settings} mode={mode} onChange={onChange} disabled={locked} slots={slots} />
        <div role="tablist" aria-label={t("tabsLabel")} className="grid grid-cols-4">
          {WORKSPACE_TABS.map((id) => (
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
                "relative min-h-11 border-b-2 px-1 text-sm font-semibold",
                tab === id ? "border-brand text-brand-strong" : "border-transparent text-muted hover:text-ink",
              )}
            >
              {t(`tabs.${id}`)}
              {attention.has(id) && (
                <>
                  <span aria-hidden className="absolute end-1.5 top-2 h-2 w-2 rounded-full bg-warn" />
                  <span className="sr-only"> ({t("needsAttention")})</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 py-4">
        <div {...panel("positioning")} className="space-y-4">
          <div ref={attachPositioning} className="rounded-lg border border-line bg-panel p-4" />
          {/* After the scene's own group, as in the desktop reading order (scene, then console). */}
          {radCase.choiceControls?.length ? (
            <div className="space-y-5 rounded-lg bg-console p-4 text-console-text">
              <ChoiceControls radCase={radCase} settings={settings} onChange={onChange} locked={locked} />
            </div>
          ) : null}
        </div>
        <div {...panel("centring")}>
          <div ref={attachCentring} className="rounded-lg border border-line bg-panel p-4" />
        </div>
        <div {...panel("patient")}>
          <PatientInstructionsPanel radCase={radCase} settings={settings} onChange={onChange} disabled={locked} />
        </div>
        <div {...panel("technique")}>
          <ConsolePanel radCase={radCase} settings={settings} mode={mode} onChange={onChange} onExpose={onExpose} locked={locked} phone />
        </div>
        <div ref={attachNotes} />
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex items-center gap-2 border-t border-console-line bg-console px-4 py-2 text-console-text">
        {!locked && (
          <button
            ref={sheetTrigger}
            type="button"
            aria-haspopup="dialog"
            aria-controls={`${base}-sheet`}
            onClick={openSheet}
            className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded px-2 text-start text-sm font-semibold text-white hover:bg-console-raise"
          >
            <span aria-hidden className={clsx("h-3 w-3 shrink-0 rounded-full", LED[readiness.level])} />
            <span className="sr-only">{tr("title")}: </span>
            <span aria-live="polite">{tr(readiness.level)}</span>
            <span aria-hidden className="ms-auto text-console-text/70">▴</span>
          </button>
        )}
        <button
          type="button"
          onClick={onExpose}
          disabled={!readiness.canExpose}
          aria-describedby={locked ? undefined : readinessId}
          className={clsx(
            "min-h-11 rounded-md bg-signal px-5 py-2 font-bold tracking-widest text-ink hover:brightness-110 disabled:cursor-not-allowed disabled:bg-console-line disabled:text-console-text",
            locked && "flex-1",
          )}
        >
          {locked ? tc("locked") : tc("expose")}
        </button>
      </div>

      <dialog
        ref={sheet}
        id={`${base}-sheet`}
        aria-labelledby={`${base}-sheet-title`}
        className="mx-0 mt-auto mb-0 w-full max-w-full rounded-t-2xl bg-console p-4 text-console-text backdrop:bg-black/50"
        onClose={() => sheetTrigger.current?.focus()}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeSheet();
        }}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id={`${base}-sheet-title`} className="font-semibold text-white">
            {t("readinessDetails")}
          </h2>
          <button ref={sheetClose} type="button" onClick={closeSheet} className="min-h-11 min-w-11 rounded border border-console-line px-3 text-sm font-semibold text-white hover:bg-console-raise">
            {t("closeSheet")}
          </button>
        </div>
        {!locked && <ReadinessPanel readiness={readiness} id={readinessId} />}
      </dialog>
    </div>
  );
}
