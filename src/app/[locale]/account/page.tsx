import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AccountPanel } from "@/features/pilot/AccountPanel";
import { routing } from "@/i18n/routing";
import { P1_AVAILABLE } from "@/features/supervisor/p1-availability";
import { P1Session } from "@/features/supervisor/P1Session";

export async function generateMetadata({ params }: PageProps<"/[locale]/account">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: t("title") };
}

export default async function AccountPage({ params }: PageProps<"/[locale]/account">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("account");
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <div className="mt-6">
        <AccountPanel />
        {P1_AVAILABLE && <P1Session role="student" />}
      </div>
    </div>
  );
}
