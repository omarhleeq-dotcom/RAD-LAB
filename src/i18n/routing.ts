import { defineRouting } from "next-intl/routing";
import { LOCALES } from "@/domain/localized";

export const routing = defineRouting({
  locales: [...LOCALES],
  defaultLocale: "en",
  localePrefix: "always",
});

export const RTL_LOCALES: readonly string[] = ["ar"];
export const dirFor = (locale: string) => (RTL_LOCALES.includes(locale) ? "rtl" : "ltr");
