"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import type { RadCase } from "@/domain/case";
import { localize } from "@/lib/localized";
import type { RenderPlan } from "@/features/radiograph/plan";
import { RadiographCanvas } from "@/features/radiograph/RadiographCanvas";
import { describeRadiograph } from "@/features/radiograph/alt";

interface Props {
  radCase: RadCase;
  plan: RenderPlan;
}

/**
 * The simulated educational radiograph. The image is the primary result; the caption keeps the educational
 * disclaimer next to it (not an image of the case patient, not diagnostic, effects are approximations).
 */
export function ResultImage({ radCase, plan }: Props) {
  const t = useTranslations("radiograph");
  const tr = useTranslations("result");
  const locale = useLocale();
  // Chest Lateral baseline (S12): lateral wording where a `radiograph.lateral.*` message exists, else the common one.
  const lateral = radCase.radiograph.projection === "lateral-left";
  const key = (path: string) => (lateral && t.has(`lateral.${path}`) ? `lateral.${path}` : path) as never;
  // Text alternative: the visible findings, derived from the plan (same source as the effect cards and the score).
  const alt = useMemo(() => {
    const key = (path: string) => (lateral && t.has(`lateral.${path}`) ? `lateral.${path}` : path) as never;
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
  }, [plan, t, locale, lateral]);
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
        <p className="font-medium text-ink">{t("educationalNote")}</p>
        <p>{t("margins")}</p>
        <p>{tr("imageBrightnessNote")}</p>
        <p lang={locale}>{localize(radCase.radiograph.credit, locale)}</p>
      </figcaption>
    </figure>
  );
}
