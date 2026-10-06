import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/shell/Breadcrumb";
import { MODES } from "@/data/modalities";
import { routing } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import { PracticeEntry } from "@/features/platform/PracticeEntry";
import { examPath, modalityPath } from "@/features/platform/routes";
import { allExamRoutes, findExam, findModality } from "@/features/platform/resolve";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => allExamRoutes().map((r) => ({ locale, ...r })));
}

const practice = MODES[0]!;

export async function generateMetadata({ params }: PageProps<"/[locale]/[modality]/[exam]/practice">): Promise<Metadata> {
  const { locale, modality, exam } = await params;
  const e = findExam(modality, exam);
  return { title: e ? `${localize(practice.name, locale)} · ${localize(e.title, locale)}` : undefined };
}

export default async function PracticePage({ params }: PageProps<"/[locale]/[modality]/[exam]/practice">) {
  const { locale, modality, exam: examId } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const m = findModality(modality);
  const exam = findExam(modality, examId);
  if (!m || !exam) notFound();
  const t = await getTranslations("common");

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <Breadcrumb
          items={[
            { label: localize(m.name, locale), href: modalityPath(m.id) },
            { label: localize(exam.title, locale), href: examPath(m.id, exam.id) },
            { label: localize(practice.name, locale) },
          ]}
        />
      </div>
      <Suspense fallback={<p className="mx-auto max-w-7xl px-4 py-6 text-muted">{t("loading")}</p>}>
        <PracticeEntry modality={m.id} examId={exam.id} />
      </Suspense>
    </>
  );
}
