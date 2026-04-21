"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Mail, MessageCircle, Share2 } from "lucide-react";
import { copyToClipboard } from "@/lib/clipboard";
import {
  emailShareUrl,
  whatsAppShareUrl,
} from "@/lib/share-links";
import { useBridgeLocale } from "@/components/i18n/BridgeLocaleProvider";
import { cn } from "@/lib/utils";

/**
 * Compact "Share the app" control for the top navigation.
 *
 * Behaviour:
 * - On devices that support the Web Share API (most mobile browsers) a single
 *   tap opens the native share sheet directly.
 * - On desktops it opens a small popover with WhatsApp / Email / Copy link.
 * - Falls back to "copy link" if the browser blocks the share sheet.
 */
export function ShareAppButton({ className }: { className?: string }) {
  const { t } = useBridgeLocale();
  const s = t.share;

  const [origin, setOrigin] = useState(
    () => process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? ""
  );
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true);
    }
  }, []);

  const appUrl = useMemo(() => origin.replace(/\/$/, ""), [origin]);
  const message = useMemo(
    () => `${s.appBeforeUrl}${appUrl}${s.appAfterUrl}`,
    [appUrl, s.appAfterUrl, s.appBeforeUrl]
  );

  const closeMenu = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const root = containerRef.current;
      if (root && event.target instanceof Node && !root.contains(event.target)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const doNativeShare = useCallback(async () => {
    if (!appUrl) return false;
    try {
      await navigator.share({
        title: s.nativeTitle,
        text: message,
        url: appUrl,
      });
      return true;
    } catch {
      return false;
    }
  }, [appUrl, message, s.nativeTitle]);

  const doCopy = useCallback(async () => {
    if (!appUrl) return;
    const ok = await copyToClipboard(appUrl);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [appUrl]);

  const handleTriggerClick = useCallback(async () => {
    if (!appUrl) return;
    if (canNativeShare) {
      const shared = await doNativeShare();
      if (shared) return;
    }
    setOpen((prev) => !prev);
  }, [appUrl, canNativeShare, doNativeShare]);

  if (!appUrl) return null;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => void handleTriggerClick()}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/35 px-3 py-1.5 text-xs font-medium text-bridge-ink shadow-sm backdrop-blur-sm transition",
          "hover:bg-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bridge-sage"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={s.nativeTitle}
      >
        <Share2 className="h-3.5 w-3.5" aria-hidden />
        <span>{t.nav.share}</span>
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute end-0 top-full z-50 mt-2 min-w-[13rem] rounded-xl border border-white/60 bg-white/95 p-1.5 shadow-lg backdrop-blur-md",
            "text-sm text-bridge-ink"
          )}
        >
          <a
            role="menuitem"
            href={whatsAppShareUrl(message)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMenu}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-bridge-sand/60"
          >
            <MessageCircle className="h-4 w-4 text-bridge-stone" aria-hidden />
            <span>{s.whatsapp}</span>
          </a>
          <a
            role="menuitem"
            href={emailShareUrl(s.emailSubject, `${message}\n`)}
            onClick={closeMenu}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-bridge-sand/60"
          >
            <Mail className="h-4 w-4 text-bridge-stone" aria-hidden />
            <span>{s.email}</span>
          </a>
          <button
            role="menuitem"
            type="button"
            onClick={() => void doCopy()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-bridge-sand/60"
          >
            {copied ? (
              <Check className="h-4 w-4 text-bridge-sage" aria-hidden />
            ) : (
              <Copy className="h-4 w-4 text-bridge-stone" aria-hidden />
            )}
            <span>{copied ? s.copied : s.copyLink}</span>
          </button>
          {canNativeShare && (
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                closeMenu();
                void doNativeShare();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-bridge-sand/60"
            >
              <Share2 className="h-4 w-4 text-bridge-stone" aria-hidden />
              <span>{s.shareNative}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
