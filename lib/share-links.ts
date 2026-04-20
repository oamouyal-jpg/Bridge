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

  let downloadBlock = "";
  try {
    const origin = new URL(opts.joinUrl).origin;
    const downloadUrl = bridgeDownloadPageUrl(origin);
    const stores = nativeStoreLinkLines();
    downloadBlock = `\n\nGet the Bridge app (or use Bridge in your browser): ${downloadUrl}${stores}`;
  } catch {
    /* joinUrl must be absolute for share flows */
  }

  const cap = opts.maxParticipants ?? 2;
  const flow =
    cap <= 2
      ? "Bridge is built for two people at a time: you each speak privately first, then you share a mediated thread — couples, family, or colleagues."
      : `This Bridge room has up to ${cap} seats: everyone gets a private intake first, then you share one mediated thread — useful for family or small team check-ins.`;

  return `${head}

Tap to join (your code is filled in): ${opts.joinUrl}

Invite code: ${opts.inviteCode}

${flow}${downloadBlock}`;
}

export function appShareMessage(appUrl: string): string {
  return `I wanted to share Bridge — a softer place for hard talks between partners, family, or coworkers (private first, then together). Paid resolutions are there when you need clear language for home or work.

${appUrl}

Open it on your phone or computer when you’re ready.`;
}
