import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/shell/Breadcrumb";
import { MODES } from "@/data/modalities";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import { modalityPath, practicePath } from "@/features/platform/routes";
import { allExamRoutes, casesOf, findExam, findModality } from "@/features/platform/resolve";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => allExamRoutes().map((r) => ({ locale, ...r })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/[modality]/[exam]">): Promise<Metadata> {
  const { locale, modality, exam } = await params;
  const e = findExam(modality, exam);
  return { title: e ? localize(e.title, locale) : undefined };
}

export default async function ExamPage({ params }: PageProps<"/[locale]/[modality]/[exam]">) {
  const { locale, modality, exam: examId } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const m = findModality(modality);
  const exam = findExam(modality, examId);
  if (!m || !exam) notFound();
  const t = await getTranslations("exam");
  const tc = await getTranslations("common");
  const ts = await getTranslations("sex");
  const th = await getTranslations("home");
  const cases = casesOf(exam);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <Breadcrumb items={[{ label: localize(m.name, locale), href: modalityPath(m.id) }, { label: localize(exam.title, locale) }]} />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">{localize(exam.title, locale)}</h1>
        {exam.provisional && <span className="rounded bg-signal/20 px-2 py-1 text-xs font-medium text-warn">{tc("provisionalBadge")}</span>}
      </div>

      {MODES.map((mode) => (
        <section key={mode.id} aria-labelledby={`mode-${mode.id}`} data-testid={`mode-${mode.id}`}>
          <h2 id={`mode-${mode.id}`} className="text-xl font-semibold">
            {localize(mode.name, locale)}
          </h2>
          <p className="mt-1 max-w-3xl text-muted">{t(`modes.${mode.id}`)}</p>
          <h3 className="mt-4 text-sm font-semibold uppercase tracking-wider text-muted">{t("casesTitle")}</h3>
          <ul className="mt-2 grid gap-4 md:grid-cols-2">
            {cases.map((c) => (
              <li key={c.id} className="flex flex-col rounded-lg border border-line bg-panel p-5">
                <p className="text-sm text-muted">{th("patientLine", { age: c.patient.age, sex: c.patient.sex, sexLabel: ts(c.patient.sex) })}</p>
                <p className="mt-3 flex-1">{localize(c.clinicalScenario, locale)}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Link
                    href={practicePath(m.id, exam, c)}
                    className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand-strong"
                  >
                    {t("startCase")}
                  </Link>
                  {c.provisional && <span className="rounded bg-signal/20 px-2 py-1 text-xs font-medium text-warn">{tc("provisionalBadge")}</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="max-w-3xl text-sm text-muted">{th("provisionalNotice")}</p>
    </div>
  );
}
