"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { VoiceInputControl, type VoiceInputHandle } from "@/components/VoiceInputControl";
import { useBridgeLocale } from "@/components/i18n/BridgeLocaleProvider";
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
  const { t } = useBridgeLocale();
  const [messages, setMessages] = useState<IntakeMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const voiceRef = useRef<VoiceInputHandle | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  /**
   * Auto-scroll the message list to the bottom as new turns arrive (and while
   * the AI is "thinking"), so the user always sees the latest exchange without
   * having to manually scroll inside the chat box.
   */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

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
    // Stop voice dictation and clear the draft optimistically so the textbox
    // empties the instant the user hits send — even while the AI is thinking.
    voiceRef.current?.stopAndReset();
    setInput("");
    setBusy(true);
    setError(null);

    // Submit the answer. Only restore the draft if THIS request failed —
    // never restore it just because a follow-up refresh hiccuped. Conflating
    // the two caused the input to re-fill with the previous answer after a
    // few turns whenever room polling had a transient error.
    let submitted = false;
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/intake/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, message: text }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not send.");
      submitted = true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send.");
      setInput(text);
      setBusy(false);
      return;
    }

    try {
      if (submitted) await onUpdate();
    } catch {
      /* refresh errors are non-fatal: the message was accepted */
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-bridge-mist bg-white">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-bridge-sageMuted">
            {t.intakeChat.header}
          </p>
          <p className="mt-1 text-sm text-bridge-stone">{t.intakeChat.privacyNote}</p>
        </div>
        <div
          ref={scrollRef}
          className="max-h-[55vh] min-h-[180px] space-y-3 overflow-y-auto rounded-xl border border-bridge-mist bg-white p-3 sm:max-h-[420px]"
        >
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
          {busy && <p className="text-xs text-bridge-stone">{t.intakeChat.thinking}</p>}
        </div>
        {error && (
          <p className="text-sm text-red-700">{error}</p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <Textarea
            className="min-h-[80px] sm:min-h-[140px] sm:flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.intakeChat.placeholder}
            disabled={busy}
          />
          <VoiceInputControl
            ref={voiceRef}
            className="sm:w-[min(260px,100%)] sm:shrink-0"
            value={input}
            onChange={setInput}
            disabled={busy}
            compact
          />
        </div>
        <Button type="button" className="w-full rounded-full" disabled={busy} onClick={send}>
          {busy ? t.intakeChat.sending : t.intakeChat.send}
        </Button>
      </CardContent>
    </Card>
  );
}
