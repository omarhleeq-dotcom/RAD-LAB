import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

// Number of paragraphs (keys p1…pN) per section of the `terms` messages.
const SECTIONS = [["keep", 5], ["notKeep", 3], ["why", 2], ["who", 1], ["protect", 2], ["howLong", 1], ["rights", 2], ["patients", 1]] as const;

export async function generateMetadata({ params }: PageProps<"/[locale]/terms">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });
  return { title: t("title") };
}

export default async function TermsPage({ params }: PageProps<"/[locale]/terms">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("terms");
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p data-testid="terms-draft" className="mt-4 rounded-md border border-signal bg-signal/10 px-3 py-2 text-sm">{t("draft")}</p>
      <p className="mt-4 text-lg">{t("lead")}</p>
      {SECTIONS.map(([key, count]) => (
        <section key={key} className="mt-8" aria-labelledby={`terms-${key}`}>
          <h2 id={`terms-${key}`} className="text-xl font-semibold">{t(`${key}.title`)}</h2>
          <ul className="mt-3 list-disc space-y-2 ps-6">
            {Array.from({ length: count }, (_, i) => (
              <li key={i}>{t(`${key}.p${i + 1}` as `${typeof key}.p1`)}</li>
            ))}
          </ul>
        </section>
      ))}
      <p className="mt-8 rounded-md border border-line bg-paper px-3 py-2">{t("closing")}</p>
    </div>
  );
}
