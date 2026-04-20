"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";
import { emailShareUrl, facebookShareUrl, whatsAppShareUrl } from "@/lib/share-links";
import { useBridgeLocale } from "@/components/i18n/BridgeLocaleProvider";
import { Copy, Mail, MessageCircle, Share2 } from "lucide-react";

export function ShareAppLink() {
  const { t } = useBridgeLocale();
  const s = t.share;

  const [origin, setOrigin] = useState(
    () => process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? ""
  );
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const appUrl = useMemo(() => origin.replace(/\/$/, "") || "", [origin]);
  const message = useMemo(
    () => `${s.appBeforeUrl}${appUrl}${s.appAfterUrl}`,
    [appUrl, s.appAfterUrl, s.appBeforeUrl]
  );

  async function copyAppUrl() {
    if (!appUrl) return;
    setCopyError(null);
    const ok = await copyToClipboard(appUrl);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      setCopyError("Couldn’t copy — select the link above and copy it manually.");
    }
  }

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function nativeShare() {
    if (!canNativeShare || !appUrl) return;
    try {
      await navigator.share({
        title: s.nativeTitle,
        text: message,
        url: appUrl,
      });
    } catch {
      /* ignore */
    }
  }

  if (!appUrl) return null;

  const instagramHint = s.instagramHint.replace("{copy}", s.copyLink);

  return (
    <div className="bridge-card p-6 sm:p-8">
      <h3 className="bridge-heading-display text-lg text-bridge-ink">{s.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-bridge-stone">{s.lead}</p>
      <p className="mt-3 break-all rounded-lg bg-bridge-sand/50 px-3 py-2 font-mono text-xs text-bridge-ink">
        {appUrl}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" className="rounded-full" asChild>
          <a href={whatsAppShareUrl(message)} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="me-1.5 h-4 w-4" aria-hidden />
            {s.whatsapp}
          </a>
        </Button>
        <Button variant="secondary" size="sm" className="rounded-full" asChild>
          <a href={facebookShareUrl(appUrl)} target="_blank" rel="noopener noreferrer">
            {s.facebook}
          </a>
        </Button>
        <Button variant="secondary" size="sm" className="rounded-full" asChild>
          <a href={emailShareUrl(s.emailSubject, `${message}\n`)}>
            <Mail className="me-1.5 h-4 w-4" aria-hidden />
            {s.email}
          </a>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="rounded-full"
          type="button"
          onClick={() => void copyAppUrl()}
        >
          <Copy className="me-1.5 h-4 w-4" aria-hidden />
          {s.copyLink}
        </Button>
        {canNativeShare && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            type="button"
            onClick={() => void nativeShare()}
          >
            <Share2 className="me-1.5 h-4 w-4" aria-hidden />
            {s.shareNative}
          </Button>
        )}
      </div>
      <p className="mt-3 text-[11px] text-bridge-stone">{instagramHint}</p>
      {copied && <p className="mt-2 text-xs text-bridge-sage">{s.copied}</p>}
      {copyError && <p className="mt-2 text-xs text-red-700">{copyError}</p>}
    </div>
  );
}
