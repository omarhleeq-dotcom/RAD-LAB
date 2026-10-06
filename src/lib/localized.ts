import type { Locale, LocalizedText } from "@/domain/localized";

export const localize = (text: LocalizedText, locale: string): string =>
  text[locale as Locale] ?? text.en;
