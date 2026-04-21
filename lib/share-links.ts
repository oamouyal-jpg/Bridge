/** URL builders for sharing — works with WhatsApp, Facebook, email, and copy-to-clipboard flows. */

export function whatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function facebookShareUrl(pageUrl: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
}

export function emailShareUrl(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function joinRoomUrl(origin: string, inviteCode: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/join?code=${encodeURIComponent(inviteCode)}`;
}

/** Page that lists App Store / Play links (from env) and opening Bridge in the browser. */
export function bridgeDownloadPageUrl(origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/download`;
}

/** Optional native store URLs — set in deployment env. */
function nativeStoreLinkLines(): string {
  const ios = process.env.NEXT_PUBLIC_IOS_APP_URL?.trim();
  const play =
    process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim() ??
    process.env.NEXT_PUBLIC_ANDROID_APP_URL?.trim();
  const lines: string[] = [];
  if (ios) lines.push(`iPhone / iPad (App Store): ${ios}`);
  if (play) lines.push(`Android (Google Play): ${play}`);
  return lines.length ? `\n${lines.join("\n")}` : "";
}

export function inviteShareMessage(opts: {
  joinUrl: string;
  inviteCode: string;
  roomTitle?: string;
  /** When >2, invite text explains small-group rooms (family / work). */
  maxParticipants?: number;
}): string {
  const title = opts.roomTitle?.trim();
  const head = title
    ? `I opened a Bridge room (“${title}”) — a calmer way for us to talk (private first, then together when we’re ready).`
    : `I opened a Bridge room — a calmer way for us to talk (private first, then together when we’re ready).`;

  const cap = opts.maxParticipants ?? 2;
  const flow =
    cap <= 2
      ? "Bridge is built for two people at a time: you each speak privately first, then share a mediated thread. Couples, family, or colleagues."
      : `This Bridge room has up to ${cap} seats: everyone does a private intake first, then shares one mediated thread — useful for family or small team check-ins.`;

  // Optional: if a native store URL is configured, include it as an extra
  // option for users who'd rather install a wrapper app later. The web link
  // above is always the primary path — there's nothing to install.
  const stores = nativeStoreLinkLines();
  const storesBlock = stores ? `\n\nPrefer a phone app?${stores}` : "";

  let manualFallback = `enter code ${opts.inviteCode}`;
  try {
    const origin = new URL(opts.joinUrl).origin;
    manualFallback = `go to ${origin}/join and enter code ${opts.inviteCode}`;
  } catch {
    /* joinUrl should be absolute, but don't crash the share if it isn't */
  }

  return `${head}

Tap this link to join — it opens right in your browser, nothing to install:
${opts.joinUrl}

(If the link doesn't open, ${manualFallback}.)

${flow}${storesBlock}`;
}

export function appShareMessage(appUrl: string): string {
  return `I wanted to share Bridge — a softer place for hard talks between partners, family, or coworkers (private first, then together). Paid resolutions are there when you need clear language for home or work.

${appUrl}

Open it on your phone or computer when you’re ready.`;
}
