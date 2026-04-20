"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getMessages } from "@/lib/i18n/dictionaries";
import type { BridgeMessages } from "@/lib/i18n/schema";
import type { Locale } from "@/lib/i18n/types";
import {
  DEFAULT_LOCALE,
  isLocale,
  isRtlLocale,
  localeToHtmlLang,
} from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "bridge-marketing-locale";

export type BridgeLocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: BridgeMessages;
  dir: "ltr" | "rtl";
};

const BridgeLocaleContext = createContext<BridgeLocaleContextValue | null>(null);

export function BridgeLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get("lang");
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const next: Locale | null = isLocale(fromQuery)
      ? fromQuery
      : isLocale(stored)
        ? stored
        : null;
    if (next !== null) {
      setLocaleState((prev) => (prev === next ? prev : next));
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useMemo(() => getMessages(locale), [locale]);
  const dir: "ltr" | "rtl" = isRtlLocale(locale) ? "rtl" : "ltr";

  const value = useMemo(
    () => ({ locale, setLocale, t, dir }),
    [locale, setLocale, t, dir]
  );

  return (
    <BridgeLocaleContext.Provider value={value}>
      <div
        lang={localeToHtmlLang(locale)}
        dir={dir}
        className={cn("bridge-i18n-root min-h-[inherit]", dir === "rtl" && "text-start")}
      >
        {children}
      </div>
    </BridgeLocaleContext.Provider>
  );
}

export function useBridgeLocale(): BridgeLocaleContextValue {
  const ctx = useContext(BridgeLocaleContext);
  if (!ctx) {
    throw new Error("useBridgeLocale must be used within BridgeLocaleProvider");
  }
  return ctx;
}
