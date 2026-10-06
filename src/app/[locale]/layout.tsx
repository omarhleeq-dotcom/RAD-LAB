import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Link } from "@/i18n/navigation";
import { dirFor, routing } from "@/i18n/routing";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return { title: `${t("appName")} — ${t("tagline")}` };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("common");

  return (
    <html lang={locale} dir={dirFor(locale)}>
      <body className="antialiased">
        <NextIntlClientProvider>
          <header className="border-b border-line bg-panel">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
              <Link href="/" className="flex items-baseline gap-3">
                <span dir="ltr" className="text-xl font-bold tracking-wide text-brand-strong">
                  RAD<span className="text-signal">·</span>LAB
                </span>
                <span className="hidden text-sm text-muted sm:inline">{t("tagline")}</span>
              </Link>
              <LanguageSwitcher />
            </div>
          </header>
          {children}
          <footer className="border-t border-line bg-panel">
            <p role="note" className="mx-auto max-w-7xl px-4 py-3 text-xs text-muted">
              {t("disclaimer")}
            </p>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
