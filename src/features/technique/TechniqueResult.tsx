"use client";

import { publicReference } from "@/features/evidence/public-text";
import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import type { RadCase } from "@/domain/case";
import type { DetectorExposureResult, ExposureTendency } from "@/domain/technique";
import { localize } from "@/lib/localized";
import { formatDI } from "./di";

const GAUGE_MIN = -6;
const GAUGE_MAX = 6;
const pct = (di: number) => ((Math.min(GAUGE_MAX, Math.max(GAUGE_MIN, di)) - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)) * 100;

const TENDENCY_STYLE: Record<ExposureTendency, string> = {
  insufficient: "bg-bad/10 text-bad",
  "below-target": "bg-warn/10 text-warn",
  "target-range": "bg-ok/10 text-ok",
  "above-target": "bg-warn/10 text-warn",
  excessive: "bg-bad/10 text-bad",
};

interface Props {
  radCase: RadCase;
  kvp: number;
  manualMas: number;
  exposure: DetectorExposureResult;
}

/**
 * Post-exposure technique analysis. Pure presentation of `DetectorExposureResult`; all numbers are computed by
 * `features/technique` and none of them is displayed brightness.
 */
export function TechniqueResult({ radCase, kvp, manualMas, exposure: x }: Props) {
  const t = useTranslations("technique");
  const locale = useLocale();
  const { deviation } = radCase.technique;
  const sidRule = radCase.rules.find(r => r.kind === "range" && r.setting === "sidCm");
  const extremitySidBand = sidRule?.kind === "range" && sidRule.ideal[0] === 100 && sidRule.ideal[1] === 110;
  const aec = x.mode === "aec";
  const fmt = (n: number, d = 2) => String(Math.round(n * 10 ** d) / 10 ** d);

  const metrics: { label: string; value: string; ltr?: boolean; tone?: string }[] = [
    { label: t("modeLabel"), value: aec ? t("modeAec") : t("modeManual") },
    { label: t("kvp"), value: `${kvp} kVp`, ltr: true },
    aec
      ? { label: t("masDelivered"), value: `${fmt(x.deliveredMas)} mAs`, ltr: true }
      : { label: t("masSelected"), value: `${manualMas} mAs`, ltr: true },
    { label: t("sid"), value: `${x.sid.sidCm} cm`, ltr: true },
    { label: t("relativeExposure"), value: `×${fmt(x.exposureRatio)}`, ltr: true },
    { label: t("di"), value: formatDI(x.deviationIndex), ltr: true },
    { label: t("tendency"), value: t(`tendencies.${x.tendency}`), tone: TENDENCY_STYLE[x.tendency] },
    { label: t("noise"), value: t(`noiseLevels.${x.quantumNoise.level}`) },
    { label: t("penetration"), value: t(`penetrations.${x.penetration}`) },
    { label: t("dose"), value: t(`doses.${x.doseAwareness}`) },
  ];

  return (
    <section aria-labelledby="technique-heading" className="space-y-5 rounded-lg border border-line bg-panel p-4">
      <div>
        <h2 id="technique-heading" className="font-semibold">
          {t("title")}
        </h2>
        <p className="mt-1 text-xs text-muted">{t("model")}</p>
      </div>

      <div className="rounded border border-brand/40 bg-brand/5 p-3 text-sm">
        <h3 className="font-semibold text-brand-strong">{t("brightnessTitle")}</h3>
        <p className="mt-1 text-ink">{t("brightness")}</p>
      </div>

      <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.label} className={clsx("rounded border border-line px-3 py-2", m.tone)}>
            <dt className="text-xs font-medium text-muted">{m.label}</dt>
            <dd className="mt-0.5 text-sm font-semibold">
              {m.ltr ? (
                <bdi dir="ltr" className="font-mono tabular-nums">
                  {m.value}
                </bdi>
              ) : (
                m.value
              )}
            </dd>
          </div>
        ))}
      </dl>

      {/* DI scale. Physical left→right regardless of UI direction (numbers are not mirrored). */}
      <div>
        <h3 className="text-sm font-semibold">{t("gaugeTitle")}</h3>
        <div dir="ltr" role="img" aria-label={`${t("gaugeAlt")} DI ${formatDI(x.deviationIndex)}`} className="mt-3">
          <div className="relative h-4 rounded bg-bad/20">
            <div
              className="absolute inset-y-0 bg-warn/30"
              style={{ left: `${pct(deviation.acceptable[0])}%`, width: `${pct(deviation.acceptable[1]) - pct(deviation.acceptable[0])}%` }}
            />
            <div
              className="absolute inset-y-0 bg-ok/40"
              style={{ left: `${pct(deviation.ideal[0])}%`, width: `${pct(deviation.ideal[1]) - pct(deviation.ideal[0])}%` }}
            />
            <div className="absolute inset-y-0 w-px bg-ink/60" style={{ left: `${pct(0)}%` }} />
            <div
              className="absolute -top-1.5 h-7 w-1.5 -translate-x-1/2 rounded bg-ink ring-2 ring-white"
              style={{ left: `${pct(x.deviationIndex)}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between font-mono text-[0.7rem] tabular-nums text-muted">
            {[-6, -3, 0, 3, 6].map((n) => (
              <span key={n}>{n > 0 ? `+${n}` : n}</span>
            ))}
          </div>
        </div>
        <p className="mt-1 text-xs text-muted">{t("gaugeNote")}</p>
      </div>

      {x.aec && (
        <div>
          <h3 className="text-sm font-semibold">{t("aecTitle")}</h3>
          {!x.aec.terminatedOnChambers && <p className="mt-1 text-sm text-bad">{t("aecBackup")}</p>}
          <ul className="mt-2 grid gap-2 sm:grid-cols-3">
            {x.aec.chambers.map((c) => {
              const spec = radCase.technique.aec!.chambers.find((s) => s.id === c.id)!;
              const state = c.active ? t("aecActive") : c.selected ? t("aecOutside") : t("aecNotSelected");
              return (
                <li key={c.id} className={clsx("rounded border px-3 py-2 text-sm", c.active ? "border-signal bg-signal/10" : c.selected ? "border-bad/50 bg-bad/5" : "border-line")}>
                  <div className="font-medium">{localize(spec.label, locale)}</div>
                  <div className="text-xs text-muted">
                    {t("aecUnder")} {t(`anatomy.${c.anatomy}`)}
                  </div>
                  <div className="mt-1 text-xs font-semibold">{state}</div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold">{t("whyTitle")}</h3>
        <ul className="mt-2 list-disc space-y-1.5 ps-5 text-sm text-ink">
          <li>{t("why.kvp")}</li>
          <li>{t("why.mas")}</li>
          <li>
            {aec
              ? t("why.sidAec", { mas: fmt(x.deliveredMas) })
              : extremitySidBand ? t("why.sidBand", { factor: fmt(x.sid.inverseSquareFactor), sid: x.sid.sidCm })
              : t("why.sid", { factor: fmt(x.sid.inverseSquareFactor), sid: x.sid.sidCm, ref: x.sid.referenceCm })}
          </li>
          {aec && <li>{t("why.aec")}</li>}
          <li>{t("why.di")}</li>
          <li>{t("why.noise")}</li>
          <li>{t("why.dose")}</li>
        </ul>
      </div>

      <details className="rounded border border-line">
        <summary className="cursor-pointer px-3 py-2 text-sm font-semibold">{t("assumptionsTitle")}</summary>
        <div className="space-y-3 border-t border-line p-3">
          <p className="text-xs text-muted">{t("assumptionsIntro")}</p>
          <p className="text-xs">
            <span className="font-semibold">{t("profile")}:</span> {localize(radCase.technique.label, locale)}{" "}
            <EvidenceBadge status={radCase.technique.evidence.status} />
          </p>
          <ul className="space-y-2">
            {radCase.technique.assumptions.map((a) => (
              <li key={a.id} className="text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{localize(a.label, locale)}</span>
                  <EvidenceBadge status={a.evidence.status} />
                </div>
                <p className="text-xs text-muted">{localize(a.value, locale)}</p>
                {publicReference(a.evidence.reference) && (
                  <p className="text-[0.7rem] text-muted">
                    <bdi dir="ltr">{publicReference(a.evidence.reference)}</bdi>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </details>
    </section>
  );
}
