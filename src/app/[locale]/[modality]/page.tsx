import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/shell/Breadcrumb";
import { MODALITIES } from "@/data/modalities";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import { examPath } from "@/features/platform/routes";
import { groupExamsByBodyPart } from "@/features/platform/catalogue";
import { examsOf, findModality } from "@/features/platform/resolve";

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
  const t = await getTranslations("modality");
  const tc = await getTranslations("common");
  const groups = groupExamsByBodyPart(examsOf(m));

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <Breadcrumb items={[{ label: localize(m.name, locale) }]} />
      <h1 className="text-3xl font-bold">{localize(m.name, locale)}</h1>
      <section aria-labelledby="exams-heading">
        <h2 id="exams-heading" className="text-xl font-semibold">
          {t("examsTitle")}
        </h2>
        <div className="mt-4 space-y-6">
          {groups.map(({ bodyPart, exams }) => (
            <section key={bodyPart.id} aria-labelledby={`body-part-${bodyPart.id}`} data-testid={`body-part-${bodyPart.id}`}>
              <h3 id={`body-part-${bodyPart.id}`} className="text-lg font-semibold">{localize(bodyPart.name, locale)}</h3>
              <ul className="mt-4 grid gap-4 md:grid-cols-2">
                {exams.map((e) => (
                  <li key={e.id} data-testid={`exam-${e.id}`} className="flex flex-col rounded-lg border border-line bg-panel p-5">
                    <h4 className="text-lg font-semibold">
                      <Link href={examPath(m.id, e.id)} className="text-brand hover:underline">
                        {localize(e.title, locale)}
                      </Link>
                    </h4>
                    {e.provisional && (
                      <p className="mt-2">
                        <span className="rounded bg-signal/20 px-2 py-1 text-xs font-medium text-warn">{tc("provisionalBadge")}</span>
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
