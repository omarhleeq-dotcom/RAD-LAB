import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/shell/Breadcrumb";
import { MODALITIES } from "@/data/modalities";
import { routing } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import { examPath } from "@/features/platform/routes";
import { librarySections } from "@/features/platform/library";
import { ExamCatalogue } from "@/features/platform/ExamCatalogue";
import { casesOf, examsOf, findModality } from "@/features/platform/resolve";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => MODALITIES.filter((m) => m.status === "available").map((m) => ({ locale, modality: m.id })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/[modality]">): Promise<Metadata> {
  const { locale, modality } = await params;
  const m = findModality(modality);
  return { title: m ? localize(m.name, locale) : undefined };
}

export default async function ModalityPage({ params }: PageProps<"/[locale]/[modality]">) {
  const { locale, modality } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const m = findModality(modality);
  if (!m) notFound();
  const t = await getTranslations("library");
  const th = await getTranslations("home");
  const sections = librarySections(examsOf(m).map((exam) => ({
    id: exam.id, title: exam.title, bodyPart: exam.bodyPart, projection: exam.requiredProjection,
    href: examPath(m.id, exam.id), caseCount: casesOf(exam).length, provisional: exam.provisional,
  })));
  return (
    <div className="platform-page">
      <Breadcrumb items={[{ label: localize(m.name, locale) }]} />
      <div className="platform-heading"><h1>{t("title")}</h1><span className="practice-chip">{th("mvpNote")}</span></div>
      <p className="platform-intro">{t("intro", { modality: localize(m.name, locale) })}</p>
      <ExamCatalogue sections={sections} />
    </div>
  );
}
