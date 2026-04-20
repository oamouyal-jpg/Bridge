/**
 * Server-side locale helpers used by API routes to make the AI reply in the
 * user's chosen language.
 *
 * The locale is written by `BridgeLocaleProvider` as the `bridge_locale` cookie;
 * route handlers read it here and pass it into AI service calls.
 */
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./types";

const LOCALE_COOKIE = "bridge_locale";

/** Read the current request's cookie locale; falls back to `en`. */
export async function getRequestLocale(): Promise<Locale> {
  const jar = await cookies();
  const raw = jar.get(LOCALE_COOKIE)?.value;
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}

const LANGUAGE_NAMES: Record<Locale, string> = {
  en: "English",
  he: "Hebrew",
  fr: "French",
  es: "Spanish",
  zh: "Simplified Chinese",
  ja: "Japanese",
  ar: "Arabic",
};

export function localeDisplayName(locale: Locale): string {
  return LANGUAGE_NAMES[locale] ?? "English";
}

/**
 * A short instruction appended to AI system prompts so the model responds in
 * the participant's chosen language. Returns an empty string for English so we
 * don't pollute English prompts.
 *
 * For JSON-returning prompts we still want keys in English and values in the
 * target language — this instruction handles that nuance.
 */
export function localeSystemInstruction(locale: Locale): string {
  if (locale === "en") return "";
  const name = localeDisplayName(locale);
  return `\n\nIMPORTANT — Language: Respond entirely in ${name}. Write every user-facing string (messages, titles, descriptions, suggestions, summaries, bullet items) in natural, fluent ${name}. Keep any JSON keys, enum values, and structural identifiers exactly as specified in English. If the participant writes in a different language, still answer in ${name}.`;
}
