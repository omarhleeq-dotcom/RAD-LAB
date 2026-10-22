"use client";

import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { RangeField } from "@/components/RangeField";
import type { RadCase } from "@/domain/case";
import type { SimulationMode, SimulationSettings, SideMarkerId } from "@/domain/simulation";
import { centeringStatus } from "@/features/evaluation/centering";
import { roundTo } from "@/features/simulation/coords";
import { DetectorWorkspace } from "./DetectorWorkspace";
import { CHEST_PA_LAYOUT, type SceneLayout } from "./scene-layouts";

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
  mode: SimulationMode;
  onChange: <K extends keyof SimulationSettings>(key: K, value: SimulationSettings[K]) => void;
  disabled: boolean;
  /** What differs per exam: detector figure, second view, cues panel and texts (registry: `scene-layouts.tsx`, S14-0). Default: Chest PA. */
  layout?: SceneLayout;
  /** Phone layout (UI-3, F3): where the control groups and notes are portalled; omitted = the unchanged single-section layout. */
  slots?: SceneSlots;
}

/** Tab-panel targets of the phone workspace. A target that is not mounted yet renders nothing until it is. */
export interface SceneSlots {
  positioning: Element | null;
  centring: Element | null;
  notes: Element | null;
}

export function PositioningView({ radCase, settings, mode, onChange, disabled, layout = CHEST_PA_LAYOUT, slots }: Props) {
  const t = useTranslations("positioning");
  const tw = useTranslations("workspace");
  const tAny = useTranslations() as unknown as (key: string) => string;
  const { figure, SecondView, Cues, texts } = layout;
  const [guidesOn, setGuidesOn] = useState(true);
  // Phone only: one of the two views is shown at a time, so the sticky scene stays short. The drawings themselves are unchanged.
  const [view, setView] = useState<"detector" | "second">("detector");
  const phone = slots !== undefined;
  // The view not shown stays laid out (invisible, out of flow): its label pills are measured with getBBox, which a display:none view cannot do.
  const offView = "invisible absolute inset-x-2 top-2";
  const place = (node: ReactNode, target: Element | null | undefined) => (phone ? target && createPortal(node, target) : node);
  // Assessment mode (not built yet) must never show guides, whatever the toggle says.
  const showGuides = mode === "practice" && guidesOn;
  const { detector, controls, positioning } = radCase;
  const { widthCm: W, heightCm: H } = detector;
  const status = centeringStatus(settings.centralRay, positioning.centering);
  const parts = [
    status.x.direction && (status.x.direction === "low" ? t("centeringXLow") : t("centeringXHigh")),
    status.y.direction && (status.y.direction === "low" ? t("centeringYLow") : t("centeringYHigh")),
  ].filter(Boolean);
  const statusText = parts.length ? parts.join(" · ") : t("centeringOk");

  const setMarker = (m: SideMarkerId | null) => {
    const defaults = positioning.defaultMarkerPosition;
    const old = settings.sideMarker;
    const at = settings.markerPosition;
    const atDefault = old !== null && at.x === defaults[old].x && at.y === defaults[old].y;
    // First choice → that side's default; switching L↔R while the marker still sits at its default follows it to the
    // other side. A marker the learner has moved is never relocated for them.
    if (m && (!old || atDefault)) onChange("markerPosition", { ...defaults[m] });
    onChange("sideMarker", m);
  };

  const cues = Cues && settings.chinPosition !== undefined && settings.shoulderPosition !== undefined && (
    <Cues
      chin={settings.chinPosition}
      shoulders={settings.shoulderPosition}
      onChin={(v) => onChange("chinPosition", v)}
      onShoulders={(v) => onChange("shoulderPosition", v)}
      disabled={disabled}
      showGuides={showGuides}
    />
  );
  // Separate elements (not a fragment) so the default section keeps its exact element tree, and with it its `useId` values.
  const rotationField = (
    <div className="sm:col-span-2">
      <RangeField label={texts.rotationLabel ? tAny(texts.rotationLabel) : t("rotation")} unit="°" {...controls.rotationDeg} value={settings.rotationDeg} disabled={disabled} onChange={(v) => onChange("rotationDeg", v)} />
      <p className="mt-1 text-xs text-muted">{tAny(texts.rotationHelp)}</p>
    </div>
  );
  const markerField = (
    <fieldset disabled={disabled} className="sm:col-span-2">
      <legend className="text-sm font-medium">{t("markerLegend")}</legend>
      <div className="mt-1 flex flex-wrap gap-2">
        {([null, "L", "R"] as const).map((m) => (
          <label
            key={m ?? "none"}
            className={clsx(
              "flex min-w-14 cursor-pointer items-center justify-center rounded border px-3 py-1.5 text-sm font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-signal",
              settings.sideMarker === m ? "border-brand bg-brand/10 text-brand-strong" : "border-line hover:bg-paper",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <input type="radio" name="side-marker" className="sr-only" checked={settings.sideMarker === m} onChange={() => setMarker(m)} />
            <bdi>{m ?? t("markerNone")}</bdi>
          </label>
        ))}
      </div>
      <p className="mt-1 text-xs text-muted">{texts.markerHint ? tAny(texts.markerHint) : t("markerHint")}</p>
      {showGuides && <p className="mt-1 text-xs text-muted">{tAny(texts.markerConvention)}</p>}
    </fieldset>
  );
  const centringControls = (
    <details className="sm:col-span-2" open={!phone}>
      <summary className="min-h-6 cursor-pointer py-1 text-sm font-medium">{phone ? t("fineAdjustPhone") : t("fineAdjust")}</summary>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <RangeField label={t("centerX")} unit="cm" min={-W / 2} max={W / 2} step={0.5} value={roundTo((settings.centralRay.x * W) / 2, 1)} disabled={disabled} onChange={(v) => onChange("centralRay", { ...settings.centralRay, x: roundTo(v / (W / 2)) })} />
        <RangeField label={t("centerY")} unit="cm" min={0} max={H} step={0.5} value={roundTo(((settings.centralRay.y + 1) / 2) * H, 1)} disabled={disabled} onChange={(v) => onChange("centralRay", { ...settings.centralRay, y: roundTo((v / H) * 2 - 1) })} />
        <RangeField label={t("collWidth")} unit="cm" min={Math.ceil(positioning.minCollimation * W)} max={W} step={1} value={roundTo(settings.collimation.width * W, 1)} disabled={disabled} onChange={(v) => onChange("collimation", { ...settings.collimation, width: roundTo(v / W) })} />
        <RangeField label={t("collHeight")} unit="cm" min={Math.ceil(positioning.minCollimation * H)} max={H} step={1} value={roundTo(settings.collimation.height * H, 1)} disabled={disabled} onChange={(v) => onChange("collimation", { ...settings.collimation, height: roundTo(v / H) })} />
      </div>
    </details>
  );
  const workspaceHint = <p className="mt-1 text-center text-xs text-console-text/80">{t("workspaceHint")}</p>;
  const schematicNote = <p className="px-4 pt-2 text-xs text-muted">{tAny(texts.schematicNote)}</p>;

  return (
    <section aria-labelledby="pos-heading" className="rounded-lg border border-line bg-panel">
      <div className={phone ? "flex items-center justify-between gap-2 px-2 py-1" : "flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3"}>
        <h2 id="pos-heading" className={phone ? "sr-only" : "font-semibold"}>
          {t("title")}
        </h2>
        {phone && (
          <div role="group" aria-label={tw("sceneViews")} className="flex min-w-0 rounded-lg border border-line p-0.5">
            {(["detector", "second"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={clsx(
                  "min-h-11 min-w-20 rounded-md px-3 text-sm font-semibold",
                  view === v ? "bg-brand text-white" : "text-ink hover:bg-paper",
                )}
              >
                {v === "detector" ? tw("viewDetector") : layout.secondViewIsTop ? tw("viewTop") : tw("viewSide")}
              </button>
            ))}
          </div>
        )}
        {mode === "practice" &&
          (phone ? (
            // Compact icon toggle on the same row; still the same checkbox with the same accessible label.
            <label className={clsx("relative grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg border has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-signal", guidesOn ? "border-brand bg-brand/10 text-brand-strong" : "border-line text-muted")}>
              <input type="checkbox" className="sr-only" checked={guidesOn} onChange={(e) => setGuidesOn(e.target.checked)} />
              <span className="sr-only">{t("guides")}</span>
              <svg aria-hidden data-ui-icon viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
                {!guidesOn && <path d="M4 4l16 16" />}
              </svg>
            </label>
          ) : (
            <label className="flex cursor-pointer items-center gap-2 text-sm has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-signal">
              <input type="checkbox" className="accent-signal" checked={guidesOn} onChange={(e) => setGuidesOn(e.target.checked)} />
              {t("guides")}
            </label>
          ))}
      </div>

      <div className={phone ? "relative grid bg-console p-2 [&_svg]:max-h-[min(24svh,13rem)]" : "grid gap-4 bg-console p-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"}>
        <figure className={clsx("m-0", phone && view !== "detector" && offView)}>
          <DetectorWorkspace radCase={radCase} settings={settings} onChange={onChange} disabled={disabled} showGuides={showGuides} figure={figure} />
          <figcaption className={phone ? "sr-only" : "mt-1 text-center text-xs text-console-text/80"}>{tAny(texts.detectorCaption)}</figcaption>
          {!phone && workspaceHint}
          <p
            id="ray-status"
            className={clsx(phone ? "mt-1" : "mt-2", "text-center text-sm font-medium", showGuides ? "text-signal" : "sr-only")}
          >
            {showGuides ? `${t("centeringTitle")}: ${statusText}` : t("guidesOff")}
          </p>
        </figure>
        <div className={clsx("space-y-4", phone && view !== "second" && offView)}>
          <figure className="m-0">
            <SecondView radCase={radCase} settings={settings} showGuides={showGuides} />
            <figcaption className={phone ? "sr-only" : "mt-1 text-center text-xs text-console-text/80"}>{tAny(texts.secondViewCaption)}</figcaption>
          </figure>
          {!phone && cues}
        </div>
      </div>
      {place(schematicNote, slots?.notes)}
      {phone ? (
        <>
          {place(
            <div className="grid gap-4">
              {cues && <div className="rounded-lg bg-console p-4">{cues}</div>}
              {rotationField}
              {markerField}
            </div>,
            slots.positioning,
          )}
          {place(
            <div className="grid gap-4">
              <p className="text-sm text-muted">{t("touchHint")}</p>
              {centringControls}
            </div>,
            slots.centring,
          )}
        </>
      ) : (
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          {rotationField}
          {markerField}
          {centringControls}
        </div>
      )}
    </section>
  );
}
