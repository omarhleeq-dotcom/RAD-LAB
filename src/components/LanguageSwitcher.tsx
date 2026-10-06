"use client";

import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABELS: Record<string, { short: string; native: string }> = {
  en: { short: "EN", native: "English" },
  ar: { short: "ع", native: "العربية" },
};

export function LanguageSwitcher() {
  const t = useTranslations("common");
  const current = useLocale();
  const pathname = usePathname();
  return (
    <nav aria-label={t("language")} className="flex overflow-hidden rounded-md border border-line bg-panel text-sm">
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href={pathname}
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
