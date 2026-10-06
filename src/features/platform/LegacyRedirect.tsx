"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LEGACY_CASE_ROUTES, legacyTarget } from "@/data/legacy-routes";
import { Link } from "@/i18n/navigation";

/** Client-side fallback for the old `/{locale}/simulation/{caseId}` URL when the host's redirect rules are not applied. */
export function LegacyRedirect({ caseId }: { caseId: string }) {
  const t = useTranslations("legacy");
  const locale = useLocale();
  const route = LEGACY_CASE_ROUTES.find((r) => r.caseId === caseId);
  const target = route ? legacyTarget(route, locale) : "/";
  useEffect(() => {
    window.location.replace(`${target}${window.location.hash}`);
  }, [target]);
  const path = target.slice(`/${locale}`.length) || "/";
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-3 text-muted">{t("body")}</p>
      <p className="mt-6">
        <Link href={path} className="font-medium text-brand underline">
          {t("link")}
        </Link>
      </p>
    </section>
  );
}
