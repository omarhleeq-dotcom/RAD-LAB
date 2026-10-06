export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

/** Text stored inside case data. Every supported locale is required. */
export type LocalizedText = Record<Locale, string>;
