"use client";

import Link from "next/link";
import { FeatureCards } from "@/components/FeatureCards";
import { LandingHero } from "@/components/LandingHero";
import { ShareAppLink } from "@/components/ShareAppLink";
import { ShareAppButton } from "@/components/ShareAppButton";
import { useBridgeLocale } from "@/components/i18n/BridgeLocaleProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

function HomeHeader() {
  const { t } = useBridgeLocale();
  return (
    <header className="bridge-sticky-header bridge-nav-glass">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <Link href="/" className="group flex min-w-0 items-baseline gap-2 no-underline">
          <span className="bridge-heading-display text-xl">Bridge</span>
          <span className="hidden truncate text-xs font-medium uppercase tracking-wider text-bridge-stone sm:inline">
            {t.nav.tagline}
          </span>
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <ShareAppButton />
          <LanguageSwitcher />
          <nav className="flex items-center gap-2">
            <Link href="/download" className="bridge-btn-ghost text-sm">
              {t.nav.getApp}
            </Link>
            <Link href="/join" className="bridge-btn-ghost text-sm">
              {t.nav.join}
            </Link>
            <Link href="/create" className="bridge-btn-primary text-sm">
              {t.nav.startRoom}
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

function HomeFooter() {
  const { t } = useBridgeLocale();
  return (
    <footer className="border-t border-white/30 bg-white/15 px-4 py-12 backdrop-blur-xl sm:px-5">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="bridge-heading-display text-lg">Bridge</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-bridge-stone">{t.footer.blurb}</p>
          </div>
          <div className="flex flex-wrap gap-8 text-sm">
            <div className="space-y-2">
              <p className="font-medium text-bridge-ink">{t.footer.getStarted}</p>
              <ul className="space-y-1.5 text-bridge-stone">
                <li>
                  <Link href="/create" className="text-bridge-ink underline-offset-4 hover:underline">
                    {t.footer.createRoom}
                  </Link>
                </li>
                <li>
                  <Link href="/join" className="text-bridge-ink underline-offset-4 hover:underline">
                    {t.footer.joinCode}
                  </Link>
                </li>
                <li>
                  <Link href="/download" className="text-bridge-ink underline-offset-4 hover:underline">
                    {t.nav.getApp}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-10 border-t border-bridge-mist/80 pt-8 text-center text-xs text-bridge-stone">
          {t.footer.crisis}
        </p>
        <p className="mt-4 text-center text-[11px] text-bridge-stone/80">
          {t.footer.photoPrefix}{" "}
          <a
            className="underline decoration-bridge-mist underline-offset-2 hover:text-bridge-ink"
            href="https://unsplash.com/?utm_source=bridge&utm_medium=referral"
            target="_blank"
            rel="noreferrer"
          >
            {t.footer.unsplash}
          </a>
          {t.footer.photoSuffix}
        </p>
      </div>
    </footer>
  );
}

function HomeMarketingInner() {
  return (
    <>
      <HomeHeader />
      <main>
        <LandingHero />
        <FeatureCards />
        <section className="border-t border-white/25 px-4 py-10 sm:px-5 sm:py-12">
          <div className="mx-auto max-w-xl bridge-inroom-copy px-6 py-8 sm:px-8 sm:py-10">
            <ShareAppLink />
          </div>
        </section>
      </main>
      <HomeFooter />
    </>
  );
}

export function HomeMarketingShell() {
  return <HomeMarketingInner />;
}
