import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppShell } from "@/components/shell/AppShell";
import { RouteFocus } from "@/components/shell/RouteFocus";
import { SessionGate, SessionProvider } from "@/features/pilot/SessionGate";
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
          <SessionProvider>
            <AppShell>
              <RouteFocus />
              <main id="main-content" tabIndex={-1} className="outline-none">
                <SessionGate>{children}</SessionGate>
              </main>
            </AppShell>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
