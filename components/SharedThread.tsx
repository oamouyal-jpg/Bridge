"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBridgeLocale } from "@/components/i18n/BridgeLocaleProvider";
import { formatTime } from "@/lib/utils";
import type { Participant, SharedMediatedMessage } from "@/lib/types";

type Perspective = {
  underneath: string;
  likelyNeed: string;
  suggestion: string;
};

export function SharedThread({
  roomId,
  viewerParticipantId,
  messages,
  participants,
}: {
  roomId: string;
  viewerParticipantId: string;
  messages: SharedMediatedMessage[];
  participants: Participant[];
}) {
  const { t } = useBridgeLocale();
  const names = Object.fromEntries(participants.map((p) => [p.id, p.displayName]));

  // Per-message perspective state: messageId → result | "loading" | error.
  const [perspectives, setPerspectives] = useState<
    Record<string, { status: "loading" } | { status: "ready"; data: Perspective } | { status: "error"; message: string }>
  >({});
  const [openId, setOpenId] = useState<string | null>(null);

  async function loadPerspective(messageId: string) {
    setOpenId(messageId);
    if (perspectives[messageId]?.status === "ready") return;
    setPerspectives((prev) => ({ ...prev, [messageId]: { status: "loading" } }));
    try {
      const res = await fetch(
        `/api/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}/perspective`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ readerParticipantId: viewerParticipantId }),
        }
      );
      const data = (await res.json()) as { perspective?: Perspective; error?: string };
      if (!res.ok || !data.perspective) {
        throw new Error(data.error ?? "Could not read context.");
      }
      setPerspectives((prev) => ({
        ...prev,
        [messageId]: { status: "ready", data: data.perspective! },
      }));
    } catch (e) {
      setPerspectives((prev) => ({
        ...prev,
        [messageId]: {
          status: "error",
          message: e instanceof Error ? e.message : "Could not read context.",
        },
      }));
    }
  }

  function deliveryLabel(mode?: SharedMediatedMessage["deliveryMode"]): string {
    switch (mode) {
      case "sender_original":
        return t.sharedThread.originalTag;
      case "mediated_edited":
        return t.sharedThread.editedTag;
      case "mediated":
      default:
        return t.sharedThread.mediatedTag;
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-bridge-sageMuted">
          {t.sharedThread.heading}
        </p>
        <span className="text-[11px] text-bridge-stone">
          {messages.length === 0
            ? ""
            : `${messages.length} ${messages.length === 1 ? "message" : "messages"}`}
        </span>
      </div>
      <div className="max-h-[min(60vh,560px)] min-h-[220px] space-y-3 overflow-y-auto rounded-xl border border-bridge-mist bg-white/60 p-3">
        {messages.length === 0 && (
          <div className="flex h-full min-h-[180px] items-center justify-center px-4 text-center text-sm leading-relaxed text-bridge-stone">
            {t.room.sharedSession.waitingForOther}
          </div>
        )}
        {messages.map((m) => {
          const isFromOther = m.sourceParticipantId !== viewerParticipantId;
          const perspective = perspectives[m.id];
          const open = openId === m.id;
          return (
            <Card key={m.id} className="border-bridge-mist bg-white">
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2 text-xs text-bridge-stone">
                  <span className="font-medium text-bridge-ink">
                    From {names[m.sourceParticipantId] ?? "Participant"}
                  </span>
                  <span>{formatTime(m.createdAt)}</span>
                </div>
                <p className="text-sm leading-relaxed text-bridge-ink">{m.mediatedContent}</p>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span
                    className={
                      m.deliveryMode === "sender_original"
                        ? "rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-medium text-amber-800"
                        : "rounded-full border border-bridge-sage/30 bg-bridge-mist/40 px-2 py-0.5 font-medium text-bridge-sageMuted"
                    }
                  >
                    {deliveryLabel(m.deliveryMode)}
                  </span>
                  {m.detectedIntent && (
                    <span className="text-bridge-sageMuted">
                      {t.sharedThread.intentLabel}: {m.detectedIntent}
                    </span>
                  )}
                  {isFromOther && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="ml-auto rounded-full px-3 py-0 text-[11px] text-bridge-sage hover:text-bridge-sageMuted"
                      onClick={() => void loadPerspective(m.id)}
                    >
                      {t.sharedThread.readWithContext}
                    </Button>
                  )}
                </div>

                {isFromOther && open && (
                  <div className="mt-2 rounded-lg border border-bridge-sage/30 bg-bridge-mist/40 p-3 text-xs leading-relaxed text-bridge-ink">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-bridge-sage">
                        {t.sharedThread.contextHeading}
                      </p>
                      <button
                        type="button"
                        className="text-[11px] text-bridge-stone underline"
                        onClick={() => setOpenId(null)}
                      >
                        {t.sharedThread.contextClose}
                      </button>
                    </div>
                    {!perspective || perspective.status === "loading" ? (
                      <p className="mt-2 text-bridge-stone">{t.sharedThread.contextLoading}</p>
                    ) : perspective.status === "error" ? (
                      <p className="mt-2 text-red-700">{perspective.message}</p>
                    ) : (
                      <div className="mt-2 space-y-2 text-bridge-stone">
                        <p>{perspective.data.underneath}</p>
                        <p>{perspective.data.likelyNeed}</p>
                        <p className="italic text-bridge-ink">{perspective.data.suggestion}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
