import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("home");
  return <div className="platform-page home-dashboard" data-testid="home-dashboard">
    <section className="home-welcome">
      <p className="practice-chip">{t("mvpNote")}</p>
      <h1 className="mt-3">{t("dashboardTitle")}</h1>
      <p className="platform-intro mt-3">{t("dashboardIntro")}</p>
      <div className="home-decoration" aria-hidden="true"><span /><span /><span /></div>
    </section>
    <section className="home-overview" aria-labelledby="overview-heading">
      <h2 id="overview-heading">{t("overview")}</h2>
      <div className="dashboard-empty">
        <svg viewBox="0 0 80 80" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><rect x="16" y="12" width="48" height="56" rx="10" /><path d="M28 29h24M28 40h16M28 51h20" strokeLinecap="round" /></svg>
        <h3>{t("emptyTitle")}</h3><p>{t("emptyBody")}</p>
      </div>
    </section>
  </div>;
}
