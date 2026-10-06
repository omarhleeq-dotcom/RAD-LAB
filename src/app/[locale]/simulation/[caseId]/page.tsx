import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { LEGACY_CASE_ROUTES } from "@/data/legacy-routes";
import { LegacyRedirect } from "@/features/platform/LegacyRedirect";
import { routing } from "@/i18n/routing";

/**
 * Old URL `/{locale}/simulation/{caseId}`. The host redirects it (public/_redirects, next.config redirects); this
 * page is the client-side fallback so a link still reaches the exam if those rules are not applied.
 */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) => LEGACY_CASE_ROUTES.map((r) => ({ locale, caseId: r.caseId })));
}

export default async function LegacySimulationPage({ params }: PageProps<"/[locale]/simulation/[caseId]">) {
  const { locale, caseId } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  if (!LEGACY_CASE_ROUTES.some((r) => r.caseId === caseId)) notFound();
  return <LegacyRedirect caseId={caseId} />;
}
