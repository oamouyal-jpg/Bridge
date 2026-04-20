"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppPreviewMock } from "@/components/landing/AppPreviewMock";
import { useBridgeLocale } from "@/components/i18n/BridgeLocaleProvider";

export function LandingHero() {
  const { t } = useBridgeLocale();
  const tags = [t.hero.tagCouples, t.hero.tagFamily, t.hero.tagWork, t.hero.tagRes];

  return (
    <section className="relative px-4 pb-16 pt-8 sm:px-5 lg:pb-24 lg:pt-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
          <div className="bridge-inroom-copy space-y-8 px-6 py-9 sm:px-8 sm:py-10 lg:col-span-6 xl:col-span-5">
            <header className="text-center lg:text-left">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/25 px-4 py-1.5 text-sm font-medium text-bridge-clay backdrop-blur-sm">
                <span className="h-2 w-2 shrink-0 rounded-full bg-bridge-sage ring-2 ring-bridge-sage/25" aria-hidden />
                {t.hero.badge}
              </p>
              <h1 className="bridge-heading-display mt-6 text-4xl sm:text-5xl lg:mt-7 lg:text-[3.15rem] [text-shadow:0_1px_2px_rgba(255,255,255,0.6)]">
                {t.hero.h1a}{" "}
                <span className="bg-gradient-to-r from-bridge-sage to-bridge-clay bg-clip-text text-transparent">
                  {t.hero.h1b}
                </span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-bridge-ink lg:mx-0">
                {t.hero.lead}
              </p>
            </header>

            <div className="border-t border-white/35 pt-8">
              <ul className="space-y-4 text-start text-sm leading-relaxed text-bridge-ink">
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-bridge-sage" aria-hidden />
                  <span>
                    <span className="font-semibold text-bridge-ink">{t.hero.b1a}</span> {t.hero.b1b}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-bridge-sage" aria-hidden />
                  <span>
                    <span className="font-semibold text-bridge-ink">{t.hero.b2a}</span> {t.hero.b2b}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-bridge-sage" aria-hidden />
                  <span>
                    <span className="font-semibold text-bridge-ink">{t.hero.b3a}</span> {t.hero.b3b}
                  </span>
                </li>
              </ul>

              <div className="mt-8 flex flex-wrap justify-center gap-2 lg:justify-start">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/45 bg-white/25 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-bridge-clay backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                <Button asChild size="lg" className="rounded-full px-8">
                  <Link href="/create">{t.hero.ctaStart}</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="rounded-full border-white/50 bg-white/50 px-8 backdrop-blur-sm hover:bg-white/70"
                >
                  <Link href="/join">{t.hero.ctaJoin}</Link>
                </Button>
              </div>
              <p className="mt-6 max-w-lg text-pretty text-xs leading-relaxed text-bridge-stone">
                {t.hero.disclaimer}
              </p>
            </div>
          </div>

          <aside className="mx-auto w-full max-w-md lg:col-span-6 lg:mx-0 lg:max-w-none xl:col-span-7">
            <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-bridge-ink/70 lg:text-start">
              {t.hero.demoCaption}
            </p>
            <div className="rounded-2xl border border-white/40 bg-white/20 p-2 shadow-lg backdrop-blur-xl sm:p-2.5">
              <AppPreviewMock compact />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
