"use client";

import { useLocale, useTranslations } from "next-intl";
import type { RadCase } from "@/domain/case";
import { localize } from "@/lib/localized";
import type { RenderPlan } from "@/features/radiograph/plan";
import { RadiographCanvas } from "@/features/radiograph/RadiographCanvas";

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
  return (
    <figure className="m-0">
      <div className="relative">
        <RadiographCanvas plan={plan} spec={radCase.radiograph} alt={t("alt")} />
        {!plan.representative && (
          <p role="note" data-testid="not-representative" className="absolute inset-x-0 bottom-0 rounded-b bg-black/80 p-3 text-center text-xs font-medium text-white">
            {t("notRepresentative")}
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
