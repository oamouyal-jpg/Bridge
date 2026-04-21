"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShareAppButton } from "@/components/ShareAppButton";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useBridgeLocale } from "@/components/i18n/BridgeLocaleProvider";
import { copyToClipboard } from "@/lib/clipboard";
import type { Room, RoomStatus } from "@/lib/types";

export function RoomHeader({
  room,
  participantCount,
  onExitHref = "/",
}: {
  room: Room;
  participantCount: number;
  onExitHref?: string;
}) {
  const { t } = useBridgeLocale();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const statusLabel: Record<RoomStatus, string> = {
    waiting_for_second_participant: t.room.header.statusWaiting,
    intake_in_progress: t.room.header.statusIntake,
    ready_for_mediation: t.room.header.statusReady,
    active: t.room.header.statusActive,
    paused: t.room.header.statusPaused,
    completed: t.room.header.statusCompleted,
  };

  async function handleCopyCode() {
    setCopyError(false);
    const ok = await copyToClipboard(room.inviteCode);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      setCopyError(true);
      window.setTimeout(() => setCopyError(false), 3000);
    }
  }

  return (
    <header className="flex flex-col gap-4 border-b border-bridge-mist/80 bg-gradient-to-r from-white via-bridge-honey/35 to-bridge-peach/15 px-4 py-4 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-medium tracking-wide text-bridge-sageMuted">{t.room.header.yourRoom}</p>
        <h1 className="font-display text-xl text-bridge-ink">{room.title}</h1>
        <p className="text-sm text-bridge-stone">
          {participantCount} / {room.maxParticipants ?? 2} ·{" "}
          <button
            type="button"
            onClick={() => void handleCopyCode()}
            className="rounded-md border border-bridge-mist/70 bg-white/60 px-1.5 py-0.5 font-mono text-sm text-bridge-ink underline-offset-2 transition hover:bg-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-bridge-sage"
            aria-label={`${t.room.header.copyAriaPrefix} ${room.inviteCode}`}
            title={t.room.header.copyTitle}
          >
            {room.inviteCode}
          </button>
          {copied && (
            <span className="ms-2 text-xs text-bridge-sage" role="status">
              {t.room.header.copied}
            </span>
          )}
          {copyError && (
            <span className="ms-2 text-xs text-red-700" role="status">
              {t.room.header.copyBlocked}
            </span>
          )}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ShareAppButton />
        <LanguageSwitcher />
        <Badge variant="secondary">{statusLabel[room.status]}</Badge>
        <Button variant="secondary" asChild className="rounded-full">
          <Link href={onExitHref}>{t.room.header.exit}</Link>
        </Button>
      </div>
    </header>
  );
}
