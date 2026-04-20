"use client";

import { Bell, X } from "lucide-react";
import { useEffect } from "react";
import { useBridgeLocale } from "@/components/i18n/BridgeLocaleProvider";

export type RoomJoinToast = {
  /** Stable id so re-renders don't duplicate-fire animation */
  id: string;
  /** One toast per join event; groups multiple names if they arrived in the same poll */
  names: string[];
};

/**
 * Floating, stacked toasts that fire the moment a new participant is detected
 * in the room's `others` list. Auto-dismissed by the parent (see
 * `app/room/[roomId]/page.tsx`) after ~8s. Positioned top-right on desktop,
 * top-center on small screens so it doesn't obscure the invite card.
 */
export function RoomJoinToasts({
  toasts,
  onDismiss,
}: {
  toasts: RoomJoinToast[];
  onDismiss: (id: string) => void;
}) {
  const { t } = useBridgeLocale();

  // Small ambient ping when a new toast mounts — nice for tabbed-away users.
  // Uses Web Audio so we don't have to ship an asset. Silently no-ops where
  // browsers block audio outside of a user gesture.
  useEffect(() => {
    if (toasts.length === 0) return;
    try {
      type AudioWin = Window & {
        webkitAudioContext?: typeof AudioContext;
        AudioContext?: typeof AudioContext;
      };
      const w = window as unknown as AudioWin;
      const Ctor = w.AudioContext ?? w.webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(660, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.38);
      o.onended = () => void ctx.close().catch(() => {});
    } catch {
      /* audio not allowed — stay silent */
    }
  }, [toasts.length]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:end-4 sm:top-4 sm:items-end"
      aria-live="polite"
      role="status"
    >
      {toasts.map((toast) => {
        const namesText = toast.names.join(", ");
        const title = t.room.toast.joinedTitle.replace("{name}", namesText);
        const body =
          toast.names.length > 1
            ? t.room.toast.joinedBodyMulti.replace("{names}", namesText)
            : t.room.toast.joinedBody.replace("{name}", namesText);
        return (
          <div
            key={toast.id}
            className="pointer-events-auto w-full max-w-sm animate-[bridge-toast-in_260ms_ease-out] rounded-2xl border border-bridge-sage/40 bg-white/95 p-4 shadow-xl ring-1 ring-bridge-sage/10 backdrop-blur-sm"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bridge-sage/15 text-bridge-sage">
                <Bell className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-bridge-ink">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-bridge-stone">{body}</p>
              </div>
              <button
                type="button"
                className="ms-2 rounded-full p-1 text-bridge-stone transition hover:bg-bridge-sand/70 hover:text-bridge-ink"
                aria-label={t.room.toast.dismiss}
                onClick={() => onDismiss(toast.id)}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        );
      })}
      <style>{`
        @keyframes bridge-toast-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[bridge-toast-in_260ms_ease-out\\] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
