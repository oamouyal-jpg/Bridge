import { Card, CardContent } from "@/components/ui/card";
import { formatTime } from "@/lib/utils";
import type { Participant, SharedMediatedMessage } from "@/lib/types";

export function SharedThread({
  messages,
  participants,
}: {
  messages: SharedMediatedMessage[];
  participants: Participant[];
}) {
  const names = Object.fromEntries(participants.map((p) => [p.id, p.displayName]));

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-bridge-sageMuted">
        Shared mediation thread
      </p>
      <div className="max-h-[min(70vh,720px)] space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <Card className="border-dashed border-bridge-mist bg-white">
            <CardContent className="p-4 text-sm text-bridge-stone">
              Mediated messages will appear here — calm, readable, and translated for understanding.
            </CardContent>
          </Card>
        )}
        {messages.map((m) => (
          <Card key={m.id} className="border-bridge-mist bg-white">
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between gap-2 text-xs text-bridge-stone">
                <span className="font-medium text-bridge-ink">
                  From {names[m.sourceParticipantId] ?? "Participant"}
                </span>
                <span>{formatTime(m.createdAt)}</span>
              </div>
              <p className="text-sm leading-relaxed text-bridge-ink">{m.mediatedContent}</p>
              {m.detectedIntent && (
                <p className="text-xs text-bridge-sageMuted">Intent: {m.detectedIntent}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
