"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useBridgeLocale } from "@/components/i18n/BridgeLocaleProvider";
import { WarmPageFrame } from "@/components/WarmPageFrame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { DEMO_OPTIONS } from "@/lib/demo/demo-registry";
import { getScreenplayById, useScreenplayPlayback } from "@/lib/demo/screenplay";
import { cn } from "@/lib/utils";
import { DemoMessageList, TypingDots } from "./DemoShared";

export function ScreenplayDemoPanel({
  selectedId,
  onSelectId,
  fillParent = false,
}: {
  selectedId: string;
  onSelectId: (id: string) => void;
  /** When true, page fills a fixed 9:16 outer frame (see `/demo?tiktok=1`). */
  fillParent?: boolean;
}) {
  const { t } = useBridgeLocale();
  const manifest = getScreenplayById(selectedId)!;
  const demo = useScreenplayPlayback(manifest);
  const scrollRef = useRef<HTMLDivElement>(null);
  /** Body + `position: fixed` so overlays sit above `/demo?tiktok=1` (z-200) and are never clipped by inner `overflow-hidden`. */
  const [bodyPortal, setBodyPortal] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (typeof document !== "undefined") setBodyPortal(document.body);
  }, []);

  const names = {
    a: manifest.participants.him.displayName,
    b: manifest.participants.her.displayName,
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [demo.messages, demo.showAssistantTyping, demo.summaryVisible, demo.bridgePromptVisible]);

  const cardHeader =
    demo.sessionKind === "private" ? (
      <>
        <p className="text-xs font-semibold uppercase tracking-wide text-bridge-sageMuted">
          {t.intakeChat.header}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-bridge-ink/75">{t.intakeChat.privacyNote}</p>
      </>
    ) : (
      <>
        <p className="text-xs font-semibold uppercase tracking-wide text-bridge-sage">
          {t.sharedThread.heading}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-bridge-ink/75">{t.room.sharedSession.subtitle}</p>
      </>
    );

  const composerPlaceholder =
    demo.sessionKind === "private"
      ? demo.privateParticipant === "him"
        ? t.intakeChat.placeholder
        : t.composer.draftPlaceholder
      : t.room.sharedSession.waitingForOther;

  const progress = ((demo.stepIndex + 1) / Math.max(manifest.steps.length, 1)) * 100;

  return (
    <WarmPageFrame contentVeil="solid" emphasis="soft" fillParent={fillParent} className={fillParent ? "min-h-0 h-full" : "min-h-svh"}>
      <div
        className={cn(
          "mx-auto flex max-w-lg flex-col px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]",
          fillParent ? "h-full min-h-0 overflow-y-auto" : "min-h-svh",
        )}
      >
        <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-wide text-bridge-sage">{t.nav.demo}</p>
            <h1 className="font-display text-xl text-bridge-ink">{manifest.title}</h1>
          </div>
          <Badge variant="secondary" className="w-fit shrink-0">
            {t.nav.demo}
          </Badge>
        </header>

        <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-bridge-mist">
          <div
            className="h-1 rounded-full bg-bridge-ink transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="demo-script-screenplay">
              Demo script
            </label>
            <select
              id="demo-script-screenplay"
              value={selectedId}
              onChange={(e) => onSelectId(e.target.value)}
              className="rounded-full border border-bridge-mist bg-white px-3 py-2 text-xs text-bridge-ink outline-none ring-bridge-sage focus-visible:ring-2"
            >
              {DEMO_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            <Button type="button" variant="secondary" className="rounded-full text-xs" onClick={demo.replay}>
              Replay
            </Button>
            <Button type="button" variant="ghost" className="rounded-full text-xs" asChild>
              <Link href="/">{t.room.header.exit}</Link>
            </Button>
          </div>
        </div>

        <p className="mb-3 text-[11px] leading-relaxed text-bridge-ink/70">
          <span className="font-medium text-bridge-ink">{demo.phaseLabel}</span>
          {demo.isComplete ? (
            <span className="mt-1 block text-bridge-sage">— End of demo</span>
          ) : null}
        </p>

        <Card className="relative flex min-h-0 flex-1 flex-col overflow-hidden border-bridge-mist bg-white shadow-bridge">
          <CardContent className="flex min-h-0 flex-1 flex-col space-y-4 p-5 sm:p-6">
            <div>{cardHeader}</div>

            {demo.sessionKind === "joint" && demo.summary && demo.summaryVisible ? (
              <Card className="border-bridge-mist bg-bridge-honey shadow-sm ring-1 ring-bridge-mist/60">
                <CardContent className="space-y-3 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-bridge-sage">
                    Bridge
                  </p>
                  <p className="font-display text-base leading-snug text-bridge-ink">{demo.summary.title}</p>
                  <ul className="space-y-2">
                    {demo.summary.bullets.map((line) => (
                      <li
                        key={line}
                        className="border-l-[3px] border-bridge-sage pl-3 text-sm font-medium leading-relaxed text-bridge-ink"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                  {demo.summary.insight ? (
                    <p className="border-t border-bridge-mist pt-3 font-display text-base font-bold leading-snug text-bridge-ink">
                      {demo.summary.insight}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {demo.bridgePrompt && demo.bridgePromptVisible ? (
              <div className="rounded-xl border border-bridge-mist bg-white px-4 py-3 text-center shadow-sm ring-1 ring-bridge-mist/40">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-bridge-sage">Bridge</p>
                <p className="mt-1 text-sm font-semibold leading-snug text-bridge-ink">{demo.bridgePrompt.message}</p>
              </div>
            ) : null}

            <div
              ref={scrollRef}
              className="min-h-[200px] max-h-[min(52vh,420px)] space-y-3 overflow-y-auto rounded-xl border border-bridge-mist bg-white p-3 sm:max-h-[min(56vh,480px)]"
            >
              <DemoMessageList
                messages={demo.messages}
                sessionKind={demo.sessionKind}
                participantNames={names}
              />
              {demo.showAssistantTyping ? (
                <div
                  className={cn(
                    "flex flex-col gap-1 px-1",
                    demo.sessionKind === "private" ? "items-start" : "items-center",
                  )}
                >
                  <TypingDots />
                  <p className="text-xs text-bridge-stone">{t.intakeChat.thinking}</p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3">
              <Textarea
                className="min-h-[80px] sm:min-h-[100px]"
                value={demo.composerText}
                onChange={() => {}}
                placeholder={composerPlaceholder}
                readOnly
                disabled
              />
              <Button type="button" className="w-full rounded-full" disabled>
                {t.intakeChat.send}
              </Button>
            </div>
          </CardContent>

          {demo.invite ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center px-4 py-6">
              <div className="absolute inset-0 rounded-lg bg-bridge-cream backdrop-blur-[2px] max-md:backdrop-blur-none" />
              <Card className="relative z-10 w-full max-w-sm border-bridge-mist shadow-bridge-lift">
                <CardContent className="space-y-3 p-6 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-bridge-sageMuted">
                    Invitation
                  </p>
                  <p className="font-display text-2xl text-bridge-ink">{demo.invite.title}</p>
                  {demo.invite.subtitle ? (
                    <p className="text-sm font-medium text-bridge-ink/85">{demo.invite.subtitle}</p>
                  ) : null}
                  <div className="flex justify-center pt-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-bridge-mist bg-bridge-honey text-bridge-sage">
                      ✓
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </Card>

      </div>

      {bodyPortal && demo.screenTitle
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Demo title"
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 2147483000,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2.5rem 1.5rem",
                margin: 0,
                backgroundColor: "#fffbf7",
                color: "#2f2823",
                pointerEvents: "auto",
                WebkitFontSmoothing: "antialiased",
              }}
            >
              <div className="font-sans max-w-md rounded-2xl border border-neutral-300 bg-white px-6 py-10 text-center shadow-xl">
                <p className="font-display text-2xl leading-snug sm:text-3xl">{demo.screenTitle.title}</p>
                {demo.screenTitle.subtitle ? (
                  <p className="mt-4 text-base leading-relaxed opacity-90 sm:text-lg">{demo.screenTitle.subtitle}</p>
                ) : null}
              </div>
            </div>,
            bodyPortal,
          )
        : null}

      {bodyPortal && demo.endCard
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Demo closing"
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 2147483001,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "max(3rem, env(safe-area-inset-top)) max(1.25rem, env(safe-area-inset-right)) max(3rem, env(safe-area-inset-bottom)) max(1.25rem, env(safe-area-inset-left))",
                margin: 0,
                backgroundColor: "#12100e",
                backgroundImage: "none",
                color: "#f5f0e8",
                pointerEvents: "auto",
                isolation: "isolate",
                transform: "translateZ(0)",
                WebkitFontSmoothing: "antialiased",
              }}
            >
              <div className="font-sans mx-auto max-w-md px-3 text-center">
                {demo.endCard.brand ? (
                  <p
                    className="uppercase"
                    style={{ color: "#c4beb4", fontSize: "10px", fontWeight: 600, letterSpacing: "0.2em" }}
                  >
                    {demo.endCard.brand}
                  </p>
                ) : null}
                <p
                  className="font-display mt-3 text-2xl leading-snug sm:text-3xl"
                  style={{ color: "#ffffff", textShadow: "0 2px 6px rgba(0,0,0,0.75)" }}
                >
                  {demo.endCard.title}
                </p>
                {demo.endCard.subtitle ? (
                  <p className="mt-4 text-base leading-relaxed" style={{ color: "#e6e0d8" }}>
                    {demo.endCard.subtitle}
                  </p>
                ) : null}
                {demo.endCard.cta ? (
                  <p className="mt-8 text-sm font-semibold leading-snug" style={{ color: "#ffffff", textShadow: "0 1px 4px rgba(0,0,0,0.65)" }}>
                    {demo.endCard.cta}
                  </p>
                ) : null}
              </div>
            </div>,
            bodyPortal,
          )
        : null}
    </WarmPageFrame>
  );
}
