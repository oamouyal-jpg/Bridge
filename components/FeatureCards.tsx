"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, MessageSquareText, Shield, Sparkles } from "lucide-react";
import { useBridgeLocale } from "@/components/i18n/BridgeLocaleProvider";

export function FeatureCards() {
  const { t } = useBridgeLocale();
  const f = t.features;

  const pillars = useMemo(
    () => [
      {
        icon: Lock,
        title: f.pillars.p1.title,
        body: f.pillars.p1.body,
        mock: (
          <div className="space-y-2 rounded-xl border border-bridge-mist bg-bridge-cream/80 p-3 text-[10px] shadow-inner">
            <div className="rounded-lg border border-bridge-mist bg-white px-2.5 py-2 text-bridge-stone">
              <span className="font-semibold text-bridge-sageMuted">Bridge</span>
              <span className="mt-0.5 block text-bridge-ink">{f.pillars.p1.ask}</span>
            </div>
            <div className="ms-3 rounded-lg bg-bridge-ink px-2.5 py-2 text-bridge-cream">{f.pillars.p1.reply}</div>
          </div>
        ),
      },
      {
        icon: MessageSquareText,
        title: f.pillars.p2.title,
        body: f.pillars.p2.body,
        mock: (
          <div className="space-y-2 rounded-xl border border-bridge-mist bg-white p-3 text-[10px] shadow-sm">
            <div className="rounded-lg border border-bridge-mist px-2.5 py-2">
              <span className="text-bridge-stone">{f.pillars.p2.medLabel}</span>
              <p className="mt-1 leading-snug text-bridge-ink">{f.pillars.p2.medLine}</p>
            </div>
            <div className="rounded-md bg-bridge-sage/10 px-2 py-1.5 text-center text-bridge-sageMuted">
              {f.pillars.p2.tags}
            </div>
          </div>
        ),
      },
      {
        icon: Sparkles,
        title: f.pillars.p3.title,
        body: f.pillars.p3.body,
        mock: (
          <div className="rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-amber-50/50 p-3 text-[10px] text-amber-950 shadow-sm">
            <div className="flex items-center gap-1.5 font-semibold">
              <Shield className="h-3.5 w-3.5" aria-hidden />
              {f.pillars.p3.checkTitle}
            </div>
            <p className="mt-1.5 leading-snug">{f.pillars.p3.checkBody}</p>
          </div>
        ),
      },
    ],
    [f]
  );

  return (
    <section className="border-t border-white/25 py-8 sm:py-10 lg:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-5">
        <div className="mx-auto max-w-2xl bridge-inroom-copy px-6 py-10 text-center sm:px-8 sm:py-12">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-bridge-sageMuted">{f.why}</p>
          <h2 className="bridge-heading-display relative mt-3 text-3xl sm:text-4xl">{f.headline}</h2>
          <div
            className="mx-auto mt-5 h-1 w-20 rounded-full bg-gradient-to-r from-transparent via-bridge-sage/45 to-transparent"
            aria-hidden
          />
          <p className="mt-6 text-pretty text-lg leading-relaxed text-bridge-stone">{f.intro}</p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {pillars.map((it) => (
            <Card
              key={it.title}
              className="bridge-card flex flex-col overflow-hidden border border-white/70 bg-white/85 shadow-lg backdrop-blur-xl transition-shadow hover:shadow-xl"
            >
              <div className="border-b border-white/60 bg-white/55 px-5 py-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-bridge-mist/80">
                    <it.icon className="h-5 w-5 text-bridge-sage" aria-hidden />
                  </div>
                  <h3 className="bridge-heading-display text-lg leading-tight">{it.title}</h3>
                </div>
              </div>
              <CardContent className="flex flex-1 flex-col gap-4 p-5">
                <p className="text-sm leading-relaxed text-bridge-stone">{it.body}</p>
                <div className="mt-auto">{it.mock}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 rounded-[2rem] bridge-inroom-copy p-8 shadow-lg lg:p-12">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
            <div>
              <h2 className="bridge-heading-display text-2xl sm:text-3xl">{f.flowTitle}</h2>
              <ol className="mt-6 space-y-5 text-sm leading-relaxed text-bridge-stone">
                <li className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-bridge-peach/80 to-bridge-sage/20 font-display text-sm font-semibold text-bridge-ink shadow-sm">
                    1
                  </span>
                  <span>
                    <strong className="font-semibold text-bridge-ink">{f.f1a}</strong> {f.f1b}
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-bridge-peach/80 to-bridge-sage/20 font-display text-sm font-semibold text-bridge-ink shadow-sm">
                    2
                  </span>
                  <span>
                    <strong className="font-semibold text-bridge-ink">{f.f2a}</strong> {f.f2b}
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-bridge-peach/80 to-bridge-sage/20 font-display text-sm font-semibold text-bridge-ink shadow-sm">
                    3
                  </span>
                  <span>
                    <strong className="font-semibold text-bridge-ink">{f.f3a}</strong> {f.f3b}
                  </span>
                </li>
              </ol>
              <div className="mt-8">
                <Button asChild size="lg" className="rounded-full px-8">
                  <Link href="/create">
                    {f.ctaFlow}
                    <ArrowRight className="ms-2 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/75 p-6 shadow-inner backdrop-blur-md lg:p-8">
              <p className="text-xs font-semibold tracking-wide text-bridge-sageMuted">{f.spaceTitle}</p>
              <ul className="mt-5 space-y-3 text-sm text-bridge-ink">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-bridge-sage" />
                  {f.space1}
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-bridge-sage" />
                  {f.space2}
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-bridge-sage" />
                  {f.space3}
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-bridge-sage" />
                  {f.space4}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-3xl bridge-inroom-copy px-6 py-9 text-center sm:px-10">
          <p className="bridge-heading-display text-lg sm:text-xl">{f.workplaceTitle}</p>
          <p className="mt-3 text-sm leading-relaxed text-bridge-stone">
            {f.wp2a}
            <strong className="font-semibold text-bridge-ink">{f.wp2bResolution}</strong>
            {f.wp2c}
            <strong className="font-semibold text-bridge-ink">{f.wp2dWorkplace}</strong>
            {f.wp2e}
          </p>
        </div>
      </div>
    </section>
  );
}
