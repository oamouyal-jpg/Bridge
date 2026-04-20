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
/** Also read by server-side API routes so AI output follows the user's chosen language. */
const COOKIE_KEY = "bridge_locale";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type BridgeLocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: BridgeMessages;
  dir: "ltr" | "rtl";
};

const BridgeLocaleContext = createContext<BridgeLocaleContextValue | null>(null);

function readCookieLocale(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_KEY}=`));
  if (!match) return null;
  const raw = decodeURIComponent(match.slice(COOKIE_KEY.length + 1));
  return isLocale(raw) ? raw : null;
}

function writeCookieLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(locale)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function BridgeLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get("lang");
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const fromCookie = readCookieLocale();
    const next: Locale | null = isLocale(fromQuery)
      ? fromQuery
      : isLocale(stored)
        ? stored
        : fromCookie;
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
    writeCookieLocale(next);
  }, []);

  const t = useMemo(() => getMessages(locale), [locale]);
  const dir: "ltr" | "rtl" = isRtlLocale(locale) ? "rtl" : "ltr";

  /**
   * Sync the <html> element so RTL/LTR flips everywhere (scrollbars, form
   * controls, modals that portal outside this provider, etc.) without an SSR
   * hydration mismatch — we only touch it after mount.
   */
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = localeToHtmlLang(locale);
    document.documentElement.dir = dir;
  }, [locale, dir]);

  /** Keep the cookie in sync on first mount so API calls before any change still see the user's real locale. */
  useEffect(() => {
    writeCookieLocale(locale);
  }, [locale]);

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
