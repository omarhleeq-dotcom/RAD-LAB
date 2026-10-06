"use client";

import { useTranslations } from "next-intl";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import type { RenderPlan } from "./plan";

/**
 * Post-exposure explanation: which learner action / simulated state produced which visible effect, with the
 * two separate evidence records — the clinical CONCEPT and the RENDERED MAGNITUDE. Shown only with the result, so Practice Mode reveals nothing earlier.
 */
export function RadiographEffects({ plan, sex, lateral = false }: { plan: RenderPlan; sex: "female" | "male"; lateral?: boolean }) {
  const t = useTranslations("radiograph");
  // Chest Lateral (S12): lateral wording where `radiograph.lateral.effects.<id>` exists, else the common effect text.
  const tt = t as unknown as (key: string, values?: Record<string, unknown>) => string;
  const base = (id: string) => (lateral && t.has(`lateral.effects.${id}.title`) ? `lateral.effects.${id}` : `effects.${id}`);
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
            <h3 className="text-sm font-semibold">{tt(`${base(e.id)}.title`)}</h3>
            <p className="mt-1 text-sm">{tt(`${base(e.id)}.desc`, { sex })}</p>
            {e.id === "collimation-clipping" && plan.marginOnlySides.length > 0 && (
              <p data-testid="clip-margin-note" className="mt-1 text-sm">
                {t("clippingMarginNote", { sides: plan.marginOnlySides.map((side) => t(`altSides.${side}`)).join(" / ") })}
              </p>
            )}
            <dl className="mt-2 space-y-1 text-xs text-muted">
              <div className="flex flex-wrap items-center gap-2">
                <dt>{t("concept")}:</dt>
                <dd>
                  <EvidenceBadge status={e.concept.status} />
                </dd>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <dt>{t("magnitude")}:</dt>
                <dd>
                  <span className="inline-block rounded border border-line bg-paper px-1.5 py-0.5 align-middle text-[0.65rem] font-bold uppercase tracking-wide text-muted">
                    {e.magnitude.kind === "none" ? t("magnitudeNone") : t("magnitudeApprox")}
                  </span>
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
