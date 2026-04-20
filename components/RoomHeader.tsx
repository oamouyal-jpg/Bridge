"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";
import type { Room, RoomStatus } from "@/lib/types";

const statusLabel: Record<RoomStatus, string> = {
  waiting_for_second_participant: "Updating…",
  intake_in_progress: "Private background",
  ready_for_mediation: "Ready",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
};

export function RoomHeader({
  room,
  participantCount,
  onExitHref = "/",
}: {
  room: Room;
  participantCount: number;
  onExitHref?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

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
        <p className="text-xs font-medium tracking-wide text-bridge-sageMuted">Your room</p>
        <h1 className="font-display text-xl text-bridge-ink">{room.title}</h1>
        <p className="text-sm text-bridge-stone">
          {participantCount} / {room.maxParticipants ?? 2} people ·{" "}
          <button
            type="button"
            onClick={() => void handleCopyCode()}
            className="rounded-md border border-bridge-mist/70 bg-white/60 px-1.5 py-0.5 font-mono text-sm text-bridge-ink underline-offset-2 transition hover:bg-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-bridge-sage"
            aria-label={`Copy invite code ${room.inviteCode}`}
            title="Click to copy"
          >
            {room.inviteCode}
          </button>
          {copied && (
            <span className="ms-2 text-xs text-bridge-sage" role="status">
              Copied
            </span>
          )}
          {copyError && (
            <span className="ms-2 text-xs text-red-700" role="status">
              Copy blocked — select the code to copy manually
            </span>
          )}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{statusLabel[room.status]}</Badge>
        <Button variant="secondary" asChild className="rounded-full">
          <Link href={onExitHref}>Exit</Link>
        </Button>
      </div>
    </header>
  );
}
