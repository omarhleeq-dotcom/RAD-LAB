"use client";

import { useState } from "react";
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
}

export function PositioningView({ radCase, settings, mode, onChange, disabled, layout = CHEST_PA_LAYOUT }: Props) {
  const t = useTranslations("positioning");
  const tAny = useTranslations() as unknown as (key: string) => string;
  const { figure, SecondView, Cues, texts } = layout;
  const [guidesOn, setGuidesOn] = useState(true);
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

  return (
    <section aria-labelledby="pos-heading" className="rounded-lg border border-line bg-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 id="pos-heading" className="font-semibold">
          {t("title")}
        </h2>
        {mode === "practice" && (
          <label className="flex cursor-pointer items-center gap-2 text-sm has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-signal">
            <input type="checkbox" className="accent-signal" checked={guidesOn} onChange={(e) => setGuidesOn(e.target.checked)} />
            {t("guides")}
          </label>
        )}
      </div>

      <div className="grid gap-4 bg-console p-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <figure className="m-0">
          <DetectorWorkspace radCase={radCase} settings={settings} onChange={onChange} disabled={disabled} showGuides={showGuides} figure={figure} />
          <figcaption className="mt-1 text-center text-xs text-console-text/80">{tAny(texts.detectorCaption)}</figcaption>
          <p className="mt-1 text-center text-xs text-console-text/80">{t("workspaceHint")}</p>
          <p
            id="ray-status"
            className={clsx("mt-2 text-center text-sm font-medium", showGuides ? "text-signal" : "sr-only")}
          >
            {showGuides ? `${t("centeringTitle")}: ${statusText}` : t("guidesOff")}
          </p>
        </figure>
        <div className="space-y-4">
          <figure className="m-0">
            <SecondView radCase={radCase} settings={settings} showGuides={showGuides} />
            <figcaption className="mt-1 text-center text-xs text-console-text/80">{tAny(texts.secondViewCaption)}</figcaption>
          </figure>
          <Cues
            chin={settings.chinPosition}
            shoulders={settings.shoulderPosition}
            onChin={(v) => onChange("chinPosition", v)}
            onShoulders={(v) => onChange("shoulderPosition", v)}
            disabled={disabled}
            showGuides={showGuides}
          />
        </div>
      </div>
      <p className="px-4 pt-2 text-xs text-muted">{tAny(texts.schematicNote)}</p>

      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <RangeField label={t("rotation")} unit="°" {...controls.rotationDeg} value={settings.rotationDeg} disabled={disabled} onChange={(v) => onChange("rotationDeg", v)} />
          <p className="mt-1 text-xs text-muted">{tAny(texts.rotationHelp)}</p>
        </div>

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
          <p className="mt-1 text-xs text-muted">{t("markerHint")}</p>
          {showGuides && <p className="mt-1 text-xs text-muted">{tAny(texts.markerConvention)}</p>}
        </fieldset>

        <details className="sm:col-span-2" open>
          <summary className="min-h-6 cursor-pointer py-1 text-sm font-medium">{t("fineAdjust")}</summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <RangeField label={t("centerX")} unit="cm" min={-W / 2} max={W / 2} step={0.5} value={roundTo((settings.centralRay.x * W) / 2, 1)} disabled={disabled} onChange={(v) => onChange("centralRay", { ...settings.centralRay, x: roundTo(v / (W / 2)) })} />
            <RangeField label={t("centerY")} unit="cm" min={0} max={H} step={0.5} value={roundTo(((settings.centralRay.y + 1) / 2) * H, 1)} disabled={disabled} onChange={(v) => onChange("centralRay", { ...settings.centralRay, y: roundTo((v / H) * 2 - 1) })} />
            <RangeField label={t("collWidth")} unit="cm" min={Math.ceil(positioning.minCollimation * W)} max={W} step={1} value={roundTo(settings.collimation.width * W, 1)} disabled={disabled} onChange={(v) => onChange("collimation", { ...settings.collimation, width: roundTo(v / W) })} />
            <RangeField label={t("collHeight")} unit="cm" min={Math.ceil(positioning.minCollimation * H)} max={H} step={1} value={roundTo(settings.collimation.height * H, 1)} disabled={disabled} onChange={(v) => onChange("collimation", { ...settings.collimation, height: roundTo(v / H) })} />
          </div>
        </details>
      </div>
    </section>
  );
}
