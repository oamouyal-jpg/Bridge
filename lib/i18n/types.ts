export const LOCALES = ["en", "he", "fr", "es", "zh", "ar", "ja"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string | null | undefined): value is Locale {
  return value !== undefined && value !== null && (LOCALES as readonly string[]).includes(value);
}

export function isRtlLocale(locale: Locale): boolean {
  return locale === "he" || locale === "ar";
}

/** BCP 47 for `lang` attribute */
export function localeToHtmlLang(locale: Locale): string {
  switch (locale) {
    case "zh":
      return "zh-CN";
    default:
      return locale;
  }
}
