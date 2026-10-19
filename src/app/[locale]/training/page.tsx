import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { MyAttempts } from "@/features/pilot/MyAttempts";

export async function generateMetadata({ params }: PageProps<"/[locale]/training">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "training" });
  return { title: t("title") };
}
export default async function TrainingPage({ params }: PageProps<"/[locale]/training">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("training");
  return <div className="platform-page" data-testid="training-page"><h1>{t("title")}</h1><p className="platform-intro mt-3">{t("practiceOnly")}</p><MyAttempts /></div>;
}
