"use client";

import type { Locale } from "@/lib/i18n/types";
import { LOCALES } from "@/lib/i18n/types";
import { useBridgeLocale } from "./BridgeLocaleProvider";
import { cn } from "@/lib/utils";

const LABELS: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  zh: "中文",
  ja: "日本語",
  he: "עברית",
  ar: "العربية",
};

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useBridgeLocale();

  return (
    <label className={cn("flex items-center gap-2", className)}>
      <span className="text-bridge-stone/80" aria-hidden>
        🌐
      </span>
      <select
        aria-label="Choose language"
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className={cn(
          "max-w-[10.5rem] cursor-pointer rounded-full border border-white/50 bg-white/35 py-1.5 pe-2 ps-3 text-xs font-medium text-bridge-ink shadow-sm backdrop-blur-sm",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bridge-sage"
        )}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
