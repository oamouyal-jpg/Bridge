"use client";

import { Mic } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRoomUiStore } from "@/stores/room-ui-store";
import type { RealityCheckResult, TranslationMode } from "@/lib/types";
import { TranslationModeSelector } from "./TranslationModeSelector";
import { VoiceInputControl, type VoiceInputHandle } from "./VoiceInputControl";
import { useBridgeLocale } from "@/components/i18n/BridgeLocaleProvider";

export function PrivateComposer({
  roomId,
  participantId,
  disabled,
  messageBlocked,
  onMessageBlocked,
  onSent,
}: {
  roomId: string;
  participantId: string;
  disabled?: boolean;
  /** At free message cap */
  messageBlocked?: boolean;
  onMessageBlocked?: () => void;
  onSent: () => Promise<void> | void;
}) {
  const { t } = useBridgeLocale();
  const draft = useRoomUiStore((s) => s.draft);
  const setDraft = useRoomUiStore((s) => s.setDraft);
  const translationMode = useRoomUiStore((s) => s.translationMode);
  const setTranslationMode = useRoomUiStore((s) => s.setTranslationMode);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reality, setReality] = useState<RealityCheckResult | null>(null);
  const voiceRef = useRef<VoiceInputHandle | null>(null);

  async function quickRewrite(kind: "clearer" | "gentler" | "deeper") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, draft, kind }),
      });
      const data = (await res.json()) as { error?: string; draft?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not rewrite.");
      if (data.draft) setDraft(data.draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rewrite failed.");
    } finally {
      setBusy(false);
    }
  }

  async function send(confirmDespiteReality: boolean) {
    const text = draft.trim();
    if (!text || busy || disabled || messageBlocked) return;
    // Optimistic clear + stop voice so late `onresult` events can't write the
    // sent message back into the box. We restore the draft only if something
    // goes wrong or the AI wants us to pause (reality check, safety, limit).
    voiceRef.current?.stopAndReset();
    setDraft("");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          content: text,
          translationMode,
          confirmDespiteReality,
          skipRealityCheck: false,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        code?: string;
        limitReached?: boolean;
        phase?: string;
        realityCheck?: RealityCheckResult;
        ok?: boolean;
        safety?: { userMessage?: string };
      };
      if (res.status === 402 && data.code === "MESSAGE_LIMIT") {
        onMessageBlocked?.();
        setError(t.composer.messageBlocked);
        setDraft(text);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Could not send.");

      if (data.ok === false && data.phase === "safety") {
        setError(data.safety?.userMessage ?? "Safety pause — please revise or seek human support.");
        setDraft(text);
        return;
      }

      if (data.phase === "reality_check" && data.realityCheck) {
        // Put the draft back so the user can revise it with the reality prompts.
        setDraft(text);
        setReality(data.realityCheck);
        return;
      }

      setReality(null);
      await onSent();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed.");
      setDraft(text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-bridge-mist bg-white">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-bridge-sageMuted">
            {t.composer.header}
          </p>
          <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-bridge-sage">
            <Mic className="h-3.5 w-3.5" aria-hidden />
            {t.composer.typeOrSpeak}
          </span>
        </div>
        <p className="text-xs text-bridge-stone">{t.composer.blurb}</p>

        <TranslationModeSelector
          value={translationMode as TranslationMode}
          onChange={(m) => setTranslationMode(m)}
          disabled={busy || disabled}
        />

        {messageBlocked && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            {t.composer.messageBlocked}
          </p>
        )}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
          <Textarea
            className="min-h-[140px] lg:min-h-[160px] lg:flex-1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t.composer.draftPlaceholder}
            disabled={busy || disabled || messageBlocked}
          />
          <VoiceInputControl
            ref={voiceRef}
            className="lg:w-[min(280px,100%)] lg:shrink-0"
            value={draft}
            onChange={setDraft}
            disabled={busy || disabled || messageBlocked}
          />
        </div>

        {reality && reality.hasConcern && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-bridge-ink">
            <p className="font-medium">{t.composer.realityHeader}</p>
            <ul className="mt-2 space-y-2">
              {reality.flags.map((f) => (
                <li key={f.title}>
                  <span className="font-medium">{f.title}</span>
                  <span className="text-bridge-stone"> — {f.body}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="rounded-full"
                disabled={busy}
                onClick={() => send(true)}
              >
                {t.composer.sendAsIs}
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-full"
                disabled={busy}
                onClick={() => void quickRewrite("clearer")}
              >
                {t.composer.reviseWithFairness}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={busy}
                onClick={() => void quickRewrite("deeper")}
              >
                {t.composer.addEvidence}
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full"
            disabled={busy || disabled}
            onClick={() => void quickRewrite("clearer")}
          >
            {t.composer.sayMoreClearly}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full"
            disabled={busy || disabled}
            onClick={() => void quickRewrite("gentler")}
          >
            {t.composer.sayMoreGently}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full"
            disabled={busy || disabled}
            onClick={() => void quickRewrite("deeper")}
          >
            {t.composer.sayWhatIMean}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-bridge-mist pt-3">
          <Button
            type="button"
            className="rounded-full"
            disabled={busy || disabled}
            onClick={() => void send(false)}
          >
            {busy ? t.composer.sending : t.composer.send}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px] text-bridge-stone">
          <span className="font-medium text-bridge-ink">{t.composer.fairnessHelpers}</span>
          <button type="button" className="underline" onClick={() => void quickRewrite("gentler")}>
            {t.composer.makeFairer}
          </button>
          <button type="button" className="underline" onClick={() => void quickRewrite("clearer")}>
            {t.composer.separateFactFeeling}
          </button>
          <button type="button" className="underline" onClick={() => void quickRewrite("deeper")}>
            {t.composer.addAccountability}
          </button>
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}
      </CardContent>
    </Card>
  );
}
