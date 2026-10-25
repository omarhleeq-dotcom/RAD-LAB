import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { FeedbackContent } from "@/features/pilot/FeedbackContent";
export default async function FeedbackPage({params}:PageProps<"/[locale]/feedback">) {
 const {locale}=await params;
 if(!hasLocale(routing.locales,locale))notFound();
 setRequestLocale(locale);
 const t=await getTranslations("c2");
 return <div className="platform-page space-y-4 p-4"><h1 className="text-2xl font-semibold">{t("feedback")}</h1><FeedbackContent/></div>;
}
