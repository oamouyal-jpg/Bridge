"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useBridgeLocale } from "@/components/i18n/BridgeLocaleProvider";

export function DownloadPageInner() {
  const { t } = useBridgeLocale();
  const ios = process.env.NEXT_PUBLIC_IOS_APP_URL?.trim();
  const play =
    process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim() ??
    process.env.NEXT_PUBLIC_ANDROID_APP_URL?.trim();

  return (
    <main className="min-h-screen bg-bridge-cream px-4 py-16 text-bridge-ink">
      <div className="mx-auto max-w-md rounded-2xl border border-bridge-mist bg-white p-8 shadow-md">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>
        <h1 className="font-display text-2xl tracking-tight">{t.download.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-bridge-stone">{t.download.intro}</p>
        <div className="mt-8 flex flex-col gap-3">
          <Button asChild className="w-full rounded-full">
            <Link href="/">{t.download.openInBrowser}</Link>
          </Button>
          {ios ? (
            <Button asChild variant="secondary" className="w-full rounded-full">
              <a href={ios} target="_blank" rel="noopener noreferrer">
                {t.download.ios}
              </a>
            </Button>
          ) : null}
          {play ? (
            <Button asChild variant="secondary" className="w-full rounded-full">
              <a href={play} target="_blank" rel="noopener noreferrer">
                {t.download.play}
              </a>
            </Button>
          ) : null}
        </div>
        {!ios && !play ? (
          <p className="mt-6 text-xs leading-relaxed text-bridge-stone">
            {t.download.notConfiguredYet}
          </p>
        ) : (
          <p className="mt-6 text-xs leading-relaxed text-bridge-stone">
            {t.download.afterInstalling}
          </p>
        )}
      </div>
    </main>
  );
}
