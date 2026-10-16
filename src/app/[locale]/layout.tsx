import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { RouteFocus } from "@/components/shell/RouteFocus";
import { PILOT } from "@/features/pilot/config";
import { SessionGate } from "@/features/pilot/SessionGate";
import { Link } from "@/i18n/navigation";
import { dirFor, routing } from "@/i18n/routing";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  // Pilot preview: never indexed (also enforced by public/_headers and public/robots.txt). Pages set their own title.
  const full = `${t("appName")} — ${t("tagline")}`;
  return { title: { default: full, template: `%s — ${t("appName")}` }, robots: { index: false, follow: false } };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("common");
  const ta = PILOT ? await getTranslations("account") : null;

  return (
    <html lang={locale} dir={dirFor(locale)}>
      <body className="antialiased">
        <NextIntlClientProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-brand focus:px-3 focus:py-2 focus:text-white"
          >
            {t("skipToContent")}
          </a>
          <header className="border-b border-line bg-panel">
            <p
              role="note"
              data-testid="preview-banner"
              className="border-b border-signal/60 bg-signal/25 px-4 py-1.5 text-center text-xs font-semibold text-ink"
            >
              {t("previewBanner")}
            </p>
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
              <Link href="/" className="flex items-baseline gap-3">
                <span dir="ltr" className="text-xl font-bold tracking-wide text-brand-strong">
                  RAD<span className="text-signal">·</span>LAB
                </span>
                <span className="hidden text-sm text-muted sm:inline">{t("tagline")}</span>
              </Link>
              {ta ? (
                <div className="flex items-center gap-4">
                  <Link href="/account" data-testid="account-link" className="text-sm font-medium text-brand hover:underline">
                    {ta("nav")}
                  </Link>
                  <LanguageSwitcher />
                </div>
              ) : (
                <LanguageSwitcher />
              )}
            </div>
          </header>
          <RouteFocus />
          <main id="main-content" tabIndex={-1} className="outline-none">
            <SessionGate>{children}</SessionGate>
          </main>
          <footer className="border-t border-line bg-panel">
            <p role="note" className="mx-auto max-w-7xl px-4 py-3 text-xs text-muted">
              {t("disclaimer")}
              <Link href="/credits" className="ms-3 inline-block min-h-6 text-brand underline">{t("creditsLink")}</Link>
            </p>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
