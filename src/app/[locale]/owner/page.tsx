import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { OwnerPanel } from "@/features/pilot/OwnerPanel";
import { routing } from "@/i18n/routing";

export async function generateMetadata({ params }: PageProps<"/[locale]/owner">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "owner" });
  return { title: t("title") };
}

export default async function OwnerPage({ params }: PageProps<"/[locale]/owner">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("owner");
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-3 text-muted">{t("intro")}</p>
      <div className="mt-6">
        <OwnerPanel />
      </div>
    </div>
  );
}
