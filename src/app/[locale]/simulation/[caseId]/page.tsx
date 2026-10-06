import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { CASES, getCase } from "@/data/cases";
import { SimulationWorkspace } from "@/features/simulation/SimulationWorkspace";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => CASES.map((c) => ({ locale, caseId: c.id })));
}

export default async function SimulationPage({ params }: PageProps<"/[locale]/simulation/[caseId]">) {
  const { locale, caseId } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const radCase = getCase(caseId);
  if (!radCase) notFound();
  return <SimulationWorkspace caseId={radCase.id} />;
}
