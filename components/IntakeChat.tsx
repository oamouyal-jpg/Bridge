"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { VoiceInputControl } from "@/components/VoiceInputControl";
import type { IntakeMessage } from "@/lib/types";

export function IntakeChat({
  roomId,
  participantId,
  initialMessages,
  onUpdate,
}: {
  roomId: string;
  participantId: string;
  initialMessages: IntakeMessage[];
  onUpdate: () => Promise<void> | void;
}) {
  const [messages, setMessages] = useState<IntakeMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (startedRef.current) return;
    if (messages.length > 0) return;
    startedRef.current = true;
    (async () => {
      try {
        setBusy(true);
        const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/intake/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantId }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Could not start intake.");
        await onUpdate();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not start.");
        startedRef.current = false;
      } finally {
        setBusy(false);
      }
    })();
  }, [messages.length, participantId, roomId, onUpdate]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/intake/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, message: text }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not send.");
      setInput("");
      await onUpdate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-bridge-mist bg-white">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-bridge-sageMuted">
            Understanding your side
          </p>
          <p className="mt-1 text-sm text-bridge-stone">
            This is private. The other person can&apos;t see your answers. One step at a time.
          </p>
        </div>
        <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-xl border border-bridge-mist bg-bridge-cream/40 p-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[95%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                m.role === "assistant"
                  ? "bg-white text-bridge-ink shadow-sm"
                  : "ml-auto bg-bridge-ink text-bridge-cream"
              }`}
            >
              {m.content}
            </div>
          ))}
          {busy && <p className="text-xs text-bridge-stone">Thinking…</p>}
        </div>
        {error && (
          <p className="text-sm text-red-700">{error}</p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <Textarea
            className="min-h-[120px] sm:min-h-[140px] sm:flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or dictate your answer…"
            disabled={busy}
          />
          <VoiceInputControl
            className="sm:w-[min(260px,100%)] sm:shrink-0"
            value={input}
            onChange={setInput}
            disabled={busy}
            compact
          />
        </div>
        <Button type="button" className="w-full rounded-full" disabled={busy} onClick={send}>
          {busy ? "Sending…" : "Send"}
        </Button>
      </CardContent>
    </Card>
  );
}
