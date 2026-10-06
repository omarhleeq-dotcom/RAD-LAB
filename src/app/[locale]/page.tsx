import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { CASES } from "@/data/cases";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localize } from "@/lib/localized";

const ROADMAP = ["chestAp", "chestLateral", "extremities", "ct", "mri"] as const;

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const ts = await getTranslations("sex");

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand">{t("mvpNote")}</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-4 text-lg text-muted">{t("subtitle")}</p>
      </section>

      <section className="mt-10" aria-labelledby="cases-heading">
        <h2 id="cases-heading" className="text-xl font-semibold">
          {t("casesTitle")}
        </h2>
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {CASES.map((c) => (
            <li key={c.id} className="flex flex-col rounded-lg border border-line bg-panel p-5">
              <h3 className="text-lg font-semibold">{localize(c.title, locale)}</h3>
              <p className="mt-1 text-sm text-muted">
                {t("patientLine", { age: c.patient.age, sex: ts(c.patient.sex) })}
              </p>
              <p className="mt-3 flex-1">{localize(c.clinicalScenario, locale)}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <Link
                  href={`/simulation/${c.id}`}
                  className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand-strong"
                >
                  {t("startCase")}
                </Link>
                {c.provisional && (
                  <span className="rounded bg-signal/20 px-2 py-1 text-xs font-medium text-warn">
                    {tc("provisionalBadge")}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-3xl text-sm text-muted">{t("provisionalNotice")}</p>
      </section>

      <section className="mt-10" aria-labelledby="roadmap-heading">
        <h2 id="roadmap-heading" className="text-xl font-semibold">
          {t("roadmapTitle")}
        </h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {ROADMAP.map((key) => (
            <li key={key} className="rounded-md border border-dashed border-line px-3 py-2 text-sm text-muted">
              {t(`roadmap.${key}`)} · {tc("comingSoon")}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
