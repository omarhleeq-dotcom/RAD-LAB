import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { MODALITIES } from "@/data/modalities";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import { modalityPath } from "@/features/platform/routes";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tc = await getTranslations("common");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand">{t("mvpNote")}</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-4 text-lg text-muted">{t("subtitle")}</p>
      </section>

      <section className="mt-10" aria-labelledby="catalog-heading">
        <h2 id="catalog-heading" className="text-xl font-semibold">
          {t("catalogTitle")}
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODALITIES.map((m) => (
            <li
              key={m.id}
              data-testid={`modality-${m.id}`}
              className={`flex flex-col rounded-lg border p-5 ${m.status === "available" ? "border-line bg-panel" : "border-dashed border-line bg-paper"}`}
            >
              <h3 className="text-lg font-semibold">
                {m.status === "available" ? (
                  <Link href={modalityPath(m.id)} className="text-brand hover:underline">
                    {localize(m.name, locale)}
                  </Link>
                ) : (
                  <span className="text-muted">{localize(m.name, locale)}</span>
                )}
              </h3>
              {m.status === "available" && m.description && <p className="mt-2 flex-1">{localize(m.description, locale)}</p>}
              {m.status === "planned" && <p className="mt-2 text-sm font-medium text-muted">{tc("comingSoon")}</p>}
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-3xl text-sm text-muted">{t("provisionalNotice")}</p>
      </section>
    </div>
  );
}
