import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { CASE_DEFINITIONS } from "@/data/cases";
import { getExam } from "@/data/exams";
import { SCIENTIFIC_CREDITS, usedImageCredits } from "@/data/credits";
import { routing } from "@/i18n/routing";
import { localize } from "@/lib/localized";

export async function generateMetadata({ params }: PageProps<"/[locale]/credits">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "credits" });
  return { title: t("title") };
}

export default async function CreditsPage({ params }: PageProps<"/[locale]/credits">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("credits");
  const text = (value: Parameters<typeof localize>[0]) => localize(value, locale);
  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-10 wrap-anywhere">
      <div><h1 className="text-3xl font-bold">{t("title")}</h1><p className="mt-4 text-lg">{t("lead")}</p></div>
      <section aria-labelledby="credits-images">
        <h2 id="credits-images" className="text-2xl font-semibold">{t("images")}</h2>
        <p className="mt-3 text-sm text-muted">{t("sourceLinkNote")}</p>
        <ul className="mt-4 space-y-6">
          {usedImageCredits(CASE_DEFINITIONS).map(({ credit, examIds }) => (
            <li key={credit.assetId} data-testid="credit-entry" className="rounded-md border border-line p-4">
              <h3 className="text-lg font-semibold">{[...examIds].map((id) => text(getExam(id)!.title)).join(" / ")}</h3>
              <p className="mt-2"><a href={credit.url} className="text-brand underline">{text(credit.title)}</a></p>
              <dl className="mt-3 space-y-2 text-sm">
                <div><dt className="font-semibold">{t("author")}</dt><dd>{text(credit.author)}</dd></div>
                <div><dt className="font-semibold">{t("license")}</dt><dd>{credit.license && credit.licenseUrl ? <a href={credit.licenseUrl} className="text-brand underline">{text(credit.license)}</a> : t("pendingLicense")}</dd></div>
                <div><dt className="font-semibold">{t("date")}</dt><dd dir="auto">{text(credit.date)}</dd></div>
                <div><dt className="font-semibold">{t("modifications")}</dt><dd>{text(credit.modifications)}</dd></div>
              </dl>
              <p className="mt-3 text-sm">{t(credit.evidence)}</p>
              {credit.context && <p className="mt-3 text-sm">{text(credit.context)}</p>}
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="credits-science">
        <h2 id="credits-science" className="text-2xl font-semibold">{t("science")}</h2>
        <p className="mt-3">{t("scienceLead")}</p><p className="mt-3 text-sm text-muted">{t("provenance")}</p>
        <ul className="mt-4 space-y-5">
          {SCIENTIFIC_CREDITS.map((source) => (
            <li key={source.id} className="border-s-2 border-line ps-4">
              <h3 className="font-semibold">{text(source.title)}</h3>
              <p>{text(source.author)} · {text(source.edition)}</p>
              <p dir="auto">{text(source.locators)}</p>
              <p className="text-sm text-muted">{t(source.role)}</p>
            </li>
          ))}
        </ul>
        <h3 className="mt-6 font-semibold">{t("unreadTitle")}</h3><p className="mt-2">{t("unread")}</p>
      </section>
      <section aria-labelledby="credits-originals">
        <h2 id="credits-originals" className="text-2xl font-semibold">{t("originals")}</h2><p className="mt-3">{t("originalsBody")}</p>
      </section>
    </div>
  );
}
