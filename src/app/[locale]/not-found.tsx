import { getTranslations } from "next-intl/server";
import { DocumentTitle } from "@/components/shell/DocumentTitle";
import { NotFoundView } from "@/components/shell/NotFoundView";

/** Unknown modality / exam / mode under a known locale (server-rendered builds). The static host serves `global-not-found`. */
export default async function LocaleNotFound() {
  const t = await getTranslations("notFound");
  const tc = await getTranslations("common");
  return (
    <>
      <DocumentTitle title={`${t("title")} — ${tc("appName")}`} />
      <NotFoundView title={t("title")} body={t("body")} linkLabel={tc("backHome")} />
    </>
  );
}
