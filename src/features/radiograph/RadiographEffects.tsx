"use client";

import { useTranslations } from "next-intl";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import type { RenderPlan } from "./plan";

/**
 * Post-exposure explanation: which learner action / simulated state produced which visible effect, with the
 * evidence class of the clinical principle. Shown only with the result, so Practice Mode reveals nothing earlier.
 */
export function RadiographEffects({ plan }: { plan: RenderPlan }) {
  const t = useTranslations("radiograph");
  return (
    <section aria-labelledby="effects-heading" className="rounded-lg border border-line bg-panel">
      <div className="border-b border-line px-4 py-3">
        <h2 id="effects-heading" className="font-semibold">
          {t("effectsTitle")}
        </h2>
        <p className="mt-1 text-xs text-muted">{t("effectsIntro")}</p>
      </div>
      <ul className="grid gap-3 p-4 md:grid-cols-2">
        {plan.effects.map((e) => (
          <li key={e.id} data-effect={e.id} className="rounded border border-line bg-paper/60 p-3">
            <h3 className="text-sm font-semibold">{t(`effects.${e.id}.title`)}</h3>
            <p className="mt-1 text-sm">{t(`effects.${e.id}.desc`)}</p>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span>{t("principle")}:</span>
              <EvidenceBadge status={e.principle.status} />
              <span>{t("approximation")}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
