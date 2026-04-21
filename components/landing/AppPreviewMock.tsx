"use client";

import { useEffect, useState } from "react";
import { Lock, MessageSquare, Shield } from "lucide-react";

type AppPreviewMockProps = {
  /** Landing: shorter demo so headline + room photo read first */
  compact?: boolean;
};

/** Static demo of the actual Bridge room UI — not a generic hero image. */
export function AppPreviewMock({ compact = false }: AppPreviewMockProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % 4);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative">
      {!compact && (
        <div
          className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-bridge-sage/15 via-transparent to-bridge-blush/20 blur-2xl"
          aria-hidden
        />
      )}
      <div
        className={`relative overflow-hidden rounded-2xl border border-bridge-mist/90 bg-white ${
          compact ? "shadow-md" : "shadow-[0_25px_60px_-15px_rgba(44,41,37,0.25)]"
        }`}
      >
        {/* Window chrome */}
        <div className="flex items-center gap-3 border-b border-bridge-mist bg-gradient-to-r from-bridge-sand/90 to-bridge-cream px-4 py-2.5">
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-[#e8a598]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#e5c07b]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#9ccc8a]" />
          </div>
          <p className="truncate text-center text-[11px] font-medium text-bridge-stone sm:flex-1">
            bridge.app · Room <span className="font-mono text-bridge-ink/80">K7-M2-QP</span>
          </p>
          <span className="hidden rounded-full bg-bridge-sage/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-bridge-sage sm:inline">
            Active
          </span>
        </div>

        <div
          className={`grid grid-cols-1 divide-y divide-bridge-mist md:grid-cols-2 md:divide-x md:divide-y-0 ${
            compact
              ? "h-[min(300px,48vh)]"
              : "h-[min(520px,70vh)]"
          }`}
        >
          {/* Private intake column */}
          <div className={`flex flex-col bg-bridge-cream/90 ${compact ? "p-2.5" : "p-3 sm:p-4"}`}>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-bridge-sageMuted">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Private — only you see this
            </div>
            <div
              className={`flex flex-1 flex-col gap-2 overflow-hidden rounded-xl border border-bridge-mist bg-white shadow-inner ${
                compact ? "min-h-[120px] p-2" : "min-h-[200px] p-3"
              }`}
            >
              <DemoBubble side="ai" text="What would you want them to understand first — even if it’s hard to say out loud?" />
              {step >= 1 && (
                <DemoBubble
                  side="user"
                  text="That I’m not attacking them. I’m scared we’re drifting and I miss us."
                />
              )}
              {step >= 2 && (
                <DemoBubble side="ai" text="Thanks. What would ‘moving forward’ look like for you this week?" />
              )}
              <div
                className={`mt-auto flex items-center gap-2 rounded-lg border border-dashed border-bridge-mist bg-bridge-cream/50 px-2 py-1.5 text-[10px] text-bridge-stone transition-opacity ${
                  step >= 3 ? "opacity-100" : "opacity-40"
                }`}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-bridge-sage/20 text-bridge-sage">
                  <MessageSquare className="h-3 w-3" aria-hidden />
                </span>
                Your raw words stay here until you send to the shared thread.
              </div>
            </div>
          </div>

          {/* Shared thread column */}
          <div className={`flex flex-col bg-white ${compact ? "p-2.5" : "p-3 sm:p-4"}`}>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-bridge-sageMuted">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden />
              Shared mediation thread
            </div>
            <div className="flex min-h-[200px] flex-1 flex-col gap-2 overflow-hidden">
              <div className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-[10px] text-amber-950/90">
                <span className="font-semibold">Safety:</span> Both people opted in · Pause anytime
              </div>
              {step >= 1 && (
                <SharedCard
                  from="Alex"
                  body="They’re asking for reassurance, not blame — they’re worried about losing closeness."
                  meta="Mediated for tone · Intent: repair"
                />
              )}
              {step >= 2 && (
                <SharedCard
                  from="Jordan"
                  body="I hear that you’re scared we’re drifting. I miss us too, and I want to find a way back."
                  meta="Mediated for tone · Intent: vulnerability"
                />
              )}
              <div
                className={`mt-auto rounded-lg border border-bridge-mist bg-bridge-cream/40 px-3 py-2 text-[10px] text-bridge-stone transition-opacity ${
                  step >= 3 ? "opacity-100" : "opacity-50"
                }`}
              >
                <Shield className="mb-1 inline h-3 w-3 text-bridge-sage" aria-hidden />
                Reality check & insight panels update as the thread grows — optional paid reports when
                you want a written path forward.
              </div>
            </div>
          </div>
        </div>

        {/* Composer bar */}
        <div className={`border-t border-bridge-mist bg-bridge-sand/30 ${compact ? "px-3 py-2" : "px-4 py-3"}`}>
          <div className="flex items-center gap-2 rounded-xl border border-bridge-mist bg-white px-3 py-2 shadow-sm">
            <div className="h-2 flex-1 rounded bg-bridge-mist/60" />
            <span className="rounded-full bg-bridge-ink px-3 py-1 text-[10px] font-medium text-bridge-cream">
              Send (mediated)
            </span>
          </div>
          <p className="mt-2 text-center text-[10px] text-bridge-stone">
            This is a live preview of the layout — your room will use real AI mediation.
          </p>
        </div>
      </div>
    </div>
  );
}

function DemoBubble({
  side,
  text,
}: {
  side: "ai" | "user";
  text: string;
}) {
  return (
    <div className={`max-w-[95%] ${side === "ai" ? "self-start" : "self-end"}`}>
      <div
        className={`rounded-2xl px-3 py-2 text-[11px] leading-relaxed sm:text-xs ${
          side === "ai"
            ? "rounded-tl-sm border border-bridge-mist bg-white text-bridge-ink shadow-sm"
            : "rounded-tr-sm bg-bridge-ink text-bridge-cream"
        }`}
      >
        {side === "ai" && (
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-bridge-sageMuted">
            Bridge
          </p>
        )}
        {text}
      </div>
    </div>
  );
}

function SharedCard({
  from,
  body,
  meta,
}: {
  from: string;
  body: string;
  meta: string;
}) {
  return (
    <div className="rounded-xl border border-bridge-mist bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2 text-[10px] text-bridge-stone">
        <span className="font-medium text-bridge-ink">From {from}</span>
        <span className="text-bridge-sageMuted">now</span>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-bridge-ink sm:text-xs">{body}</p>
      <p className="mt-2 text-[9px] text-bridge-sageMuted">{meta}</p>
    </div>
  );
}
