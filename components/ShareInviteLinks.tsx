"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";
import {
  emailShareUrl,
  facebookShareUrl,
  inviteShareMessage,
  joinRoomUrl,
  whatsAppShareUrl,
} from "@/lib/share-links";
import { Copy, Mail, MessageCircle, Share2 } from "lucide-react";

type Props = {
  inviteCode: string;
  roomTitle?: string;
  maxParticipants?: number;
  /** Compact = icon row; full = labels (default in waiting room) */
  variant?: "full" | "compact";
};

export function ShareInviteLinks({
  inviteCode,
  roomTitle,
  maxParticipants,
  variant = "full",
}: Props) {
  const [origin, setOrigin] = useState(
    () => process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? ""
  );
  const [copied, setCopied] = useState<"link" | "ig" | "code" | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const joinUrl = useMemo(() => {
    if (!origin) return "";
    return joinRoomUrl(origin, inviteCode);
  }, [origin, inviteCode]);

  const message = useMemo(
    () => inviteShareMessage({ joinUrl, inviteCode, roomTitle, maxParticipants }),
    [joinUrl, inviteCode, roomTitle, maxParticipants]
  );

  async function copy(text: string, kind: "link" | "ig" | "code") {
    setCopyError(null);
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2500);
    } else {
      setCopyError(
        "Couldn’t copy automatically — select the link or code below and copy it manually."
      );
    }
  }

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function nativeShare() {
    if (!canNativeShare || !joinUrl) return;
    try {
      await navigator.share({
        title: "Join me on Bridge — talk safe",
        text: message,
        url: joinUrl,
      });
    } catch {
      /* user cancelled or error */
    }
  }

  if (!joinUrl) {
    return (
      <p className="text-xs text-bridge-stone">Preparing share links…</p>
    );
  }

  const btnClass =
    variant === "compact"
      ? "h-9 w-9 shrink-0 rounded-full p-0"
      : "justify-start gap-2 rounded-xl";

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-bridge-sageMuted">
        Send a link
      </p>
      <div className="rounded-xl border border-bridge-mist bg-bridge-cream/40 p-4 text-xs">
        <p className="font-medium uppercase tracking-wide text-bridge-sageMuted">
          Join link
        </p>
        <button
          type="button"
          onClick={() => void copy(joinUrl, "link")}
          className="mt-1 block w-full select-all break-all text-left font-mono text-sm font-medium text-bridge-ink underline underline-offset-4 hover:text-bridge-sage"
          aria-label="Copy join link"
          title="Tap to copy — opens Bridge in any browser"
        >
          {joinUrl}
        </button>
        <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-bridge-sageMuted">
          Or share the short code
        </p>
        <button
          type="button"
          onClick={() => void copy(inviteCode, "code")}
          className="mt-1 block select-all text-left font-mono text-lg tracking-wide text-bridge-ink underline-offset-4 hover:underline"
          aria-label="Copy invite code"
        >
          {inviteCode}
        </button>
      </div>
      <div
        className={
          variant === "compact"
            ? "flex flex-wrap items-center gap-2"
            : "flex flex-col gap-2 sm:flex-row sm:flex-wrap"
        }
      >
        <Button
          type="button"
          variant="secondary"
          size={variant === "compact" ? "icon" : "default"}
          className={btnClass}
          asChild
        >
          <a href={whatsAppShareUrl(message)} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" aria-hidden />
            {variant === "full" && <span>WhatsApp</span>}
          </a>
        </Button>
        <Button
          type="button"
          variant="secondary"
          size={variant === "compact" ? "icon" : "default"}
          className={btnClass}
          asChild
        >
          <a href={facebookShareUrl(joinUrl)} target="_blank" rel="noopener noreferrer">
            <span className="text-[11px] font-bold" aria-hidden>
              f
            </span>
            {variant === "full" && <span>Facebook</span>}
          </a>
        </Button>
        <Button
          type="button"
          variant="secondary"
          size={variant === "compact" ? "icon" : "default"}
          className={btnClass}
          asChild
        >
          <a
            href={emailShareUrl(
              "Join me on Bridge — talk safe",
              `${message}\n\n`
            )}
          >
            <Mail className="h-4 w-4" aria-hidden />
            {variant === "full" && <span>Email</span>}
          </a>
        </Button>
        <Button
          type="button"
          variant="secondary"
          size={variant === "compact" ? "icon" : "default"}
          className={btnClass}
          onClick={() => void copy(message, "ig")}
          title="Instagram has no share button — copies message to paste in DM or story"
        >
          <span className="text-[11px] font-semibold" aria-hidden>
            IG
          </span>
          {variant === "full" && <span>Instagram (copy)</span>}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size={variant === "compact" ? "icon" : "default"}
          className={btnClass}
          onClick={() => void copy(joinUrl, "link")}
        >
          <Copy className="h-4 w-4" aria-hidden />
          {variant === "full" && <span>Copy link</span>}
        </Button>
        {canNativeShare && (
          <Button
            type="button"
            variant="outline"
            size={variant === "compact" ? "icon" : "default"}
            className={btnClass}
            onClick={() => void nativeShare()}
          >
            <Share2 className="h-4 w-4" aria-hidden />
            {variant === "full" && <span>More…</span>}
          </Button>
        )}
      </div>
      {copied === "ig" && (
        <p className="text-xs text-bridge-sage">Copied — paste into Instagram DM or a story link sticker.</p>
      )}
      {copied === "link" && (
        <p className="text-xs text-bridge-sage">Join link copied.</p>
      )}
      {copied === "code" && (
        <p className="text-xs text-bridge-sage">Invite code copied.</p>
      )}
      {copyError && (
        <p className="text-xs text-red-700">{copyError}</p>
      )}
      <p className="text-[11px] leading-relaxed text-bridge-stone">
        Link opens the join page with the code pre-filled. Your invite text also includes a link to
        get Bridge on your phone (app store or browser).
      </p>
    </div>
  );
}
