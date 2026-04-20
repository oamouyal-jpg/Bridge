"use client";

import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceDictation } from "@/hooks/useVoiceDictation";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  className?: string;
  /** Shorter label for tight layouts */
  compact?: boolean;
};

/**
 * Speak-to-text control: appends recognized speech to the current field (prefix = value at tap).
 */
export function VoiceInputControl({ value, onChange, disabled, className, compact }: Props) {
  const { supported, listening, voiceError, start, stop, setVoiceError } = useVoiceDictation({
    onText: onChange,
  });

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-bridge-mist bg-bridge-sand/40 p-3 sm:p-4",
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
        <div className="min-w-0 flex-1 text-xs leading-snug text-bridge-stone">
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
}
