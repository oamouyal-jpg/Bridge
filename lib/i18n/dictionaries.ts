import type { Locale } from "./types";
import { DEFAULT_LOCALE } from "./types";
import type { BridgeMessages } from "./schema";
import { en } from "./locales/en";
import { he } from "./locales/he";
import { fr } from "./locales/fr";
import { es } from "./locales/es";
import { zh } from "./locales/zh";
import { ar } from "./locales/ar";
import { ja } from "./locales/ja";

export const dictionaries: Record<Locale, BridgeMessages> = {
  en,
  he,
  fr,
  es,
  zh,
  ar,
  ja,
};

export function getMessages(locale: Locale): BridgeMessages {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}
