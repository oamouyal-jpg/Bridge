"use client";

import { Mic } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRoomUiStore } from "@/stores/room-ui-store";
import type { MessageAnalysis, RealityCheckResult, TranslationMode } from "@/lib/types";
import { TranslationModeSelector } from "./TranslationModeSelector";
import { VoiceInputControl, type VoiceInputHandle } from "./VoiceInputControl";
import { useBridgeLocale } from "@/components/i18n/BridgeLocaleProvider";

type PreviewData = {
  /** The exact raw draft text the preview was computed for. */
  originalDraft: string;
  /** Mediator's rewrite (initially). Becomes the editable text. */
  mediated: string;
  detectedIntent?: string;
  escalationRisk?: number;
  analysis?: MessageAnalysis;
};

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
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [editingPreview, setEditingPreview] = useState(false);
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

  /**
   * First phase: ask the server to mediate but NOT persist. Returns the
   * mediated text + analysis so the sender can review before commit.
   * Reality-check and safety gates still fire here.
   */
  async function requestPreview(confirmDespiteReality: boolean) {
    const text = draft.trim();
    if (!text || busy || disabled || messageBlocked) return;
    voiceRef.current?.stopAndReset();
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
          preview: true,
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
        preview?: {
          mediated: string;
          detectedIntent?: string;
          escalationRisk?: number;
          analysis?: MessageAnalysis;
        };
      };
      if (res.status === 402 && data.code === "MESSAGE_LIMIT") {
        onMessageBlocked?.();
        setError(t.composer.messageBlocked);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Could not send.");

      if (data.ok === false && data.phase === "safety") {
        setError(data.safety?.userMessage ?? "Safety pause — please revise or seek human support.");
        return;
      }

      if (data.phase === "reality_check" && data.realityCheck) {
        setReality(data.realityCheck);
        return;
      }

      if (data.phase === "preview" && data.preview) {
        setReality(null);
        setPreview({
          originalDraft: text,
          mediated: data.preview.mediated,
          detectedIntent: data.preview.detectedIntent,
          escalationRisk: data.preview.escalationRisk,
          analysis: data.preview.analysis,
        });
        setEditingPreview(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed.");
    } finally {
      setBusy(false);
    }
  }

  /**
   * Second phase: commit the previewed (optionally edited) message OR the
   * sender's own wording. Safety check still runs server-side on the raw.
   */
  async function commit(mode: "mediated" | "mediated_edited" | "sender_original") {
    if (!preview || busy) return;
    const raw = preview.originalDraft;
    const outgoing =
      mode === "sender_original" ? raw : preview.mediated.trim() || raw;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          content: raw,
          translationMode,
          // Reality check already cleared in the preview step. Safety still runs.
          skipRealityCheck: true,
          confirmDespiteReality: true,
          overrideMediated: outgoing,
          deliveryMode: mode,
          // Only forward mediator analysis when the user is keeping the mediated
          // text (possibly with edits). Sending original means no mediator analysis.
          analysis: mode === "sender_original" ? undefined : preview.analysis,
          detectedIntent: mode === "sender_original" ? undefined : preview.detectedIntent,
          escalationRisk: mode === "sender_original" ? undefined : preview.escalationRisk,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        ok?: boolean;
        phase?: string;
        safety?: { userMessage?: string };
      };
      if (!res.ok) throw new Error(data.error ?? "Could not send.");
      if (data.ok === false && data.phase === "safety") {
        setError(data.safety?.userMessage ?? "Safety pause — please revise or seek human support.");
        return;
      }
      setPreview(null);
      setEditingPreview(false);
      setDraft("");
      await onSent();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed.");
    } finally {
      setBusy(false);
    }
  }

  function cancelPreview() {
    setPreview(null);
    setEditingPreview(false);
  }

  async function handleSendOriginal() {
    if (!preview) return;
    if (typeof window !== "undefined") {
      const ok = window.confirm(t.composer.sendOriginalConfirm);
      if (!ok) return;
    }
    await commit("sender_original");
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
            disabled={busy || disabled || messageBlocked || Boolean(preview)}
          />
          <VoiceInputControl
            ref={voiceRef}
            className="lg:w-[min(280px,100%)] lg:shrink-0"
            value={draft}
            onChange={setDraft}
            disabled={busy || disabled || messageBlocked || Boolean(preview)}
          />
        </div>

        {reality && reality.hasConcern && !preview && (
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
                onClick={() => void requestPreview(true)}
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

        {preview && (
          <div className="space-y-3 rounded-xl border border-bridge-sage/30 bg-bridge-mist/40 p-4 text-sm text-bridge-ink">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-bridge-sageMuted">
                {t.composer.previewHeader}
              </p>
              <p className="mt-1 text-xs text-bridge-stone">{t.composer.previewBlurb}</p>
            </div>

            <div className="rounded-lg border border-bridge-mist bg-white/70 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-bridge-stone">
                {t.composer.yourDraftLabel}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-bridge-ink/80">
                {preview.originalDraft}
              </p>
            </div>

            <div className="rounded-lg border border-bridge-sage/40 bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-bridge-sage">
                {t.composer.mediatedLabel}
              </p>
              {editingPreview ? (
                <Textarea
                  className="mt-1 min-h-[120px]"
                  value={preview.mediated}
                  onChange={(e) =>
                    setPreview((p) => (p ? { ...p, mediated: e.target.value } : p))
                  }
                  disabled={busy}
                />
              ) : (
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-bridge-ink">
                  {preview.mediated}
                </p>
              )}

              {(preview.detectedIntent || typeof preview.escalationRisk === "number") && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-bridge-stone">
                  {preview.detectedIntent && (
                    <span>
                      <span className="font-medium text-bridge-ink">
                        {t.composer.intentLabel}:
                      </span>{" "}
                      {preview.detectedIntent}
                    </span>
                  )}
                  {typeof preview.escalationRisk === "number" && (
                    <span>
                      <span className="font-medium text-bridge-ink">
                        {t.composer.intensityLabel}:
                      </span>{" "}
                      {preview.escalationRisk}/10
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="rounded-full"
                disabled={busy}
                onClick={() =>
                  void commit(editingPreview ? "mediated_edited" : "mediated")
                }
              >
                {busy ? t.composer.sending : t.composer.sendMediated}
              </Button>
              {!editingPreview && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="rounded-full"
                  disabled={busy}
                  onClick={() => setEditingPreview(true)}
                >
                  {t.composer.editMediated}
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={busy}
                onClick={() => void handleSendOriginal()}
              >
                {t.composer.sendOriginal}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="rounded-full"
                disabled={busy}
                onClick={cancelPreview}
              >
                {t.composer.cancelPreview}
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
            disabled={busy || disabled || Boolean(preview)}
            onClick={() => void requestPreview(false)}
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
