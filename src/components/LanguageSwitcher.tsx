"use client";

import { Suspense } from "react";
import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABELS: Record<string, { short: string; native: string }> = {
  en: { short: "EN", native: "English" },
  ar: { short: "ع", native: "العربية" },
};

function Switcher({ query }: { query: string }) {
  const t = useTranslations("common");
  const current = useLocale();
  const pathname = usePathname();
  return (
    <nav aria-label={t("language")} className="flex overflow-hidden rounded-md border border-line bg-panel text-sm">
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href={`${pathname}${query}`}
          locale={locale}
          hrefLang={locale}
          lang={locale}
          aria-current={locale === current ? "true" : undefined}
          title={LABELS[locale]?.native}
          className={clsx(
            "px-3 py-1.5 font-medium",
            locale === current ? "bg-brand text-white" : "text-ink hover:bg-paper",
          )}
        >
          {LABELS[locale]?.native ?? locale}
        </Link>
      ))}
    </nav>
  );
}

/** Keeps the page and its query (`?case=`) when switching language. The query is read on the client only. */
function WithQuery() {
  const q = useSearchParams().toString();
  return <Switcher query={q ? `?${q}` : ""} />;
}

export function LanguageSwitcher() {
  return (
    <Suspense fallback={<Switcher query="" />}>
      <WithQuery />
    </Suspense>
  );
}
