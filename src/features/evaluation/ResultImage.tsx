"use client";

import { publicText } from "@/features/evidence/public-text";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, type ReactNode } from "react";
import { ResultDisclosure } from "./ResultDisclosure";
import type { RadCase } from "@/domain/case";
import { localize } from "@/lib/localized";
import type { RenderPlan } from "@/features/radiograph/plan";
import { RadiographCanvas } from "@/features/radiograph/RadiographCanvas";
import { describeRadiograph } from "@/features/radiograph/alt";
import { detectorCoverage } from "@/features/radiograph/coverage";
import { TUNING } from "@/features/radiograph/tuning";
import { wordingNsOf } from "@/features/radiograph/wording";

const grey = (v: number) => `rgb(${v} ${v} ${v})`;

interface Props {
  radCase: RadCase;
  plan: RenderPlan;
  information?: ReactNode;
}

/**
 * The simulated educational radiograph. The image is the primary result; the caption keeps the educational
 * disclaimer next to it (not an image of the case patient, not diagnostic, effects are approximations).
 */
export function ResultImage({ radCase, plan, information }: Props) {
  const t = useTranslations("radiograph");
  const tr = useTranslations("result");
  const locale = useLocale();
  // Lateral (S12) / AP (S13) baselines: their wording where a `radiograph.<ns>.*` message exists, else the common one.
  const ns = wordingNsOf(radCase.radiograph.projection);
  const key = (path: string) => (ns && t.has(`${ns}.${path}`) ? `${ns}.${path}` : path) as never;
  // Text alternative: the visible findings, derived from the plan (same source as the effect cards and the score).
  const alt = useMemo(() => {
    const key = (path: string) => (ns && t.has(`${ns}.${path}`) ? `${ns}.${path}` : path) as never;
    const d = describeRadiograph(plan);
    const list = new Intl.ListFormat(locale, { style: "long", type: "conjunction" });
    const parts = [t(key("alt"))];
    const phrases = d.findings.map((id) =>
      id === "collimation-clipping"
        ? t("altFindings.collimation-clipping", { sides: list.format(d.clippedSides.map((s) => t(`altSides.${s}`))) })
        : t(key(`altFindings.${id}`)),
    );
    if (d.marginOnlySides.length) parts.push(t("altClippingMargin", { sides: list.format(d.marginOnlySides.map((side) => t(`altSides.${side}`))) }));
    if (d.reference) parts.push(t(key("altReference")));
    if (phrases.length) parts.push(t("altFindingsLead", { list: list.format(phrases) }));
    const m = d.marker;
    if (m.kind === "none") parts.push(t("altMarkerNone"));
    else if (m.kind === "hidden") parts.push(t("altMarkerHidden", { side: m.side }));
    else {
      parts.push(t("altMarkerPlaced", { side: m.side, viewerSide: t(`altMarkerSides.${m.viewerSide}`) }));
      if (m.wrongSide) parts.push(t("altMarkerWrong"));
      if (m.partlyCut) parts.push(t("altMarkerPartial"));
    }
    return parts.join(" ");
  }, [plan, t, locale, ns]);
  return (
    <figure className="m-0">
      <div className="relative">
        <RadiographCanvas plan={plan} spec={radCase.radiograph} alt={alt} />
        {!plan.representative && (
          <p role="note" data-testid="not-representative" className="absolute inset-x-0 bottom-0 rounded-b bg-black/80 p-3 text-center text-xs font-medium text-white">
            {t(key("notRepresentative"))}
          </p>
        )}
      </div>
      <figcaption className="mt-2 space-y-1 text-xs text-muted">
        <ResultDisclosure title={<span className="flex items-center gap-2"><span aria-hidden>ⓘ</span>{tr("aboutImage")}</span>}>
        <p>{t("educationalNote")}</p>
        {radCase.radiograph.partialCoverageKey && (
          <div data-testid="no-data-key" className="flex items-start gap-2">
            <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" className="mt-0.5 shrink-0 rounded-sm border border-muted/60">
              <rect width="14" height="14" fill={grey(TUNING.noData.dark)} />
              <path d="M-2 4 L4 -2 M-2 10 L10 -2 M-2 16 L16 -2 M4 16 L16 4 M10 16 L16 10" stroke={grey(TUNING.noData.light)} strokeWidth="2.4" />
            </svg>
            <div className="space-y-1">
              <p>{t("noDataKey")}</p>
              <p>{t("partialCoverage", { percent: Math.round(detectorCoverage(radCase.radiograph, radCase.requiredAnatomy, radCase.detector) * 100) })}</p>
            </div>
          </div>
        )}
        <p>{t("margins")}</p>
        <p>{tr("imageBrightnessNote")}</p>
        <p lang={locale}>{publicText(localize(radCase.radiograph.credit, locale))}</p>
        {information}
        </ResultDisclosure>
      </figcaption>
    </figure>
  );
}
