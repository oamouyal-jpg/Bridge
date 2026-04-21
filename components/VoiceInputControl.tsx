"use client";

import { Mic, MicOff } from "lucide-react";
import { forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { useVoiceDictation } from "@/hooks/useVoiceDictation";
import { useBridgeLocale } from "@/components/i18n/BridgeLocaleProvider";
import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

/**
 * Map Bridge UI locales to a sensible BCP-47 tag for the browser's
 * SpeechRecognition engine. Without this the recognizer defaults to en-US
 * and prints phonetic-English garbage when the user speaks another language.
 */
const LOCALE_TO_BCP47: Record<Locale, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  he: "he-IL",
  ar: "ar-SA",
  ja: "ja-JP",
  zh: "zh-CN",
};

type Props = {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  className?: string;
  /** Shorter label for tight layouts */
  compact?: boolean;
};

/**
 * Imperative handle exposed to callers (composer, intake) so they can stop
 * dictation and wipe its internal buffers before clearing the draft. Without
 * this, a late `onresult` event would restore the just-sent text.
 */
export type VoiceInputHandle = {
  stopAndReset: () => void;
};

/**
 * Speak-to-text control: appends recognized speech to the current field (prefix = value at tap).
 */
export const VoiceInputControl = forwardRef<VoiceInputHandle, Props>(function VoiceInputControl(
  { value, onChange, disabled, className, compact },
  ref
) {
  const { locale } = useBridgeLocale();
  const { supported, listening, voiceError, start, stop, setVoiceError } = useVoiceDictation({
    onText: onChange,
    lang: LOCALE_TO_BCP47[locale] ?? "en-US",
  });

  useImperativeHandle(ref, () => ({ stopAndReset: stop }), [stop]);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-bridge-mist bg-bridge-sand p-3 sm:p-4",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={listening ? "default" : "secondary"}
          size="lg"
          className={cn(
            "h-12 w-12 shrink-0 rounded-full p-0 shadow-sm",
            listening && "animate-pulse bg-bridge-sage text-white hover:bg-bridge-sage/90"
          )}
          disabled={disabled || !supported}
          onClick={() => {
            setVoiceError(null);
            if (listening) stop();
            else start(value);
          }}
          title={listening ? "Stop listening" : "Speak — text appears in the box"}
        >
          {listening ? <MicOff className="h-5 w-5" aria-hidden /> : <Mic className="h-5 w-5" aria-hidden />}
        </Button>
        <div className="min-w-0 flex-1 text-xs leading-snug text-bridge-ink">
          {!supported ? (
            <span className="text-bridge-warn">
              Voice typing needs Chrome, Edge, or Safari 16.4+.
            </span>
          ) : listening ? (
            <span className="font-medium text-bridge-ink">
              {compact ? "Listening…" : "Listening — speak naturally. Tap the mic again to stop."}
            </span>
          ) : (
            <span>
              {compact
                ? "Tap mic to speak."
                : "Tap the mic to talk instead of type. Your words fill the box above; edit before you send."}
            </span>
          )}
        </div>
      </div>
      {voiceError && <p className="text-xs text-red-700">{voiceError}</p>}
    </div>
  );
});
