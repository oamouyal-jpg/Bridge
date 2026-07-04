"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { useBridgeLocale } from "@/components/i18n/BridgeLocaleProvider";
import { WarmPageFrame } from "@/components/WarmPageFrame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { DEMO_OPTIONS } from "@/lib/demo/demo-registry";
import { getScriptById } from "@/lib/demo/scripts";
import { defaultCoupleScript } from "@/lib/demo/scripts/defaultCouple";
import { useDemoPlayback } from "@/lib/demo/useDemoPlayback";
import { cn } from "@/lib/utils";
import { DemoMessageList, TypingDots } from "./DemoShared";

export function LegacyDemoPanel({
  selectedId,
  onSelectId,
  fillParent = false,
}: {
  selectedId: string;
  onSelectId: (id: string) => void;
  fillParent?: boolean;
}) {
  const { t } = useBridgeLocale();
  const script = getScriptById(selectedId) ?? defaultCoupleScript;
  const demo = useDemoPlayback(script);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [demo.messages, demo.showAssistantTyping, demo.summaryVisible]);

  const phaseCopy = useMemo(() => {
    const found = demo.script.phases.find((p) => p.id === demo.phase);
    return found ?? demo.script.phases[0];
  }, [demo.phase, demo.script.phases]);

  const inviteToName =
    demo.script.beats.find((b) => b.kind === "invite_sent")?.toName ?? "Partner";

  const cardHeader =
    demo.sessionKind === "private" ? (
      <>
        <p className="text-xs font-semibold uppercase tracking-wide text-bridge-sageMuted">
          {t.intakeChat.header}
        </p>
        <p className="mt-1 text-sm text-bridge-stone">{t.intakeChat.privacyNote}</p>
      </>
    ) : (
      <>
        <p className="text-xs font-semibold uppercase tracking-wide text-bridge-sage">
          {t.sharedThread.heading}
        </p>
        <p className="mt-1 text-sm text-bridge-stone">{t.room.sharedSession.subtitle}</p>
      </>
    );

  const composerPlaceholder =
    demo.sessionKind === "private"
      ? demo.privateParticipant === "a"
        ? t.intakeChat.placeholder
        : t.composer.draftPlaceholder
      : t.room.sharedSession.waitingForOther;

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
            <h1 className="font-display text-xl text-bridge-ink">
              {demo.sessionKind === "private"
                ? t.intakeChat.header
                : t.room.sharedSession.title}
            </h1>
          </div>
          <Badge variant="secondary" className="w-fit shrink-0">
            {t.nav.demo}
          </Badge>
        </header>

        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {demo.script.phases.map((p) => (
              <span
                key={p.id}
                className={cn(
                  "h-1.5 w-6 shrink-0 rounded-full transition-all duration-[480ms]",
                  p.id === demo.phase ? "bg-bridge-ink" : "bg-bridge-mist",
                )}
                aria-hidden
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="demo-script-legacy">
              Demo script
            </label>
            <select
              id="demo-script-legacy"
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

        <p className="mb-3 text-[11px] leading-relaxed text-bridge-stone">
          <span className="font-medium text-bridge-ink">{phaseCopy.title}</span>
          {phaseCopy.subtitle ? (
            <>
              {" "}
              <span className="text-bridge-mist">·</span> {phaseCopy.subtitle}
            </>
          ) : null}
          {demo.isComplete ? (
            <span className="mt-1 block text-bridge-sage">— End of demo</span>
          ) : null}
        </p>

        <Card className="relative flex min-h-0 flex-1 flex-col overflow-hidden border-bridge-mist bg-white shadow-bridge">
          <CardContent className="flex min-h-0 flex-1 flex-col space-y-4 p-5 sm:p-6">
            <div>{cardHeader}</div>

            {demo.sessionKind === "joint" && demo.summary ? (
              <div
                className={cn(
                  "transition-all duration-[480ms] ease-out",
                  demo.summaryVisible ? "opacity-100" : "pointer-events-none opacity-0",
                )}
              >
                <Card className="border-bridge-mist bg-bridge-honey shadow-sm ring-1 ring-bridge-mist/60">
                  <CardContent className="space-y-3 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-bridge-sage">
                      Bridge
                    </p>
                    <p className="font-display text-base leading-snug text-bridge-ink">{demo.summary.headline}</p>
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
                    <p className="border-t border-bridge-mist pt-3 text-sm font-semibold leading-relaxed text-bridge-ink">
                      {demo.summary.guidance}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            <div
              ref={scrollRef}
              className="min-h-[200px] max-h-[min(52vh,420px)] space-y-3 overflow-y-auto rounded-xl border border-bridge-mist bg-white p-3 sm:max-h-[min(56vh,480px)]"
            >
              <DemoMessageList messages={demo.messages} sessionKind={demo.sessionKind} />
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
                disabled={demo.composerDisabled}
              />
              <Button type="button" className="w-full rounded-full" disabled>
                {t.intakeChat.send}
              </Button>
            </div>
          </CardContent>

          {demo.inviteVisible ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center px-4 py-6">
              <div className="absolute inset-0 rounded-lg bg-bridge-cream backdrop-blur-[2px] max-md:backdrop-blur-none" />
              <Card className="relative z-10 w-full max-w-sm border-bridge-mist shadow-bridge-lift">
                <CardContent className="space-y-3 p-6 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-bridge-sageMuted">
                    Invitation
                  </p>
                  <p className="font-display text-2xl text-bridge-ink">Invite sent</p>
                  <p className="text-sm leading-relaxed text-bridge-stone">
                    {inviteToName} can join this Bridge when they are ready.
                  </p>
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
    </WarmPageFrame>
  );
}
