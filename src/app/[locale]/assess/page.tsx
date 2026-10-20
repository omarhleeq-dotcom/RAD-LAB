import { hasLocale } from "next-intl";
import { getTranslations,setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { AssessPanel } from "@/features/assess/AssessPanel";
export default async function AssessPage({params}:PageProps<"/[locale]/assess">){
  const {locale}=await params;if(!hasLocale(routing.locales,locale))notFound();setRequestLocale(locale);
  const t=await getTranslations("assess");return <div className="platform-page"><h1>{t("title")}</h1><AssessPanel/></div>;
}
