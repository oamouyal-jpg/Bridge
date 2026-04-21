"use client";

import { cn } from "@/lib/utils";
import type { TranslationMode } from "@/lib/types";

const modes: { id: TranslationMode; label: string; hint: string }[] = [
  { id: "softened", label: "Softened", hint: "Lower heat, more room" },
  { id: "direct_respectful", label: "Direct", hint: "Clear and respectful" },
  { id: "emotionally_honest", label: "Honest", hint: "Emotionally vivid, still safe" },
];

export function TranslationModeSelector({
  value,
  onChange,
  disabled,
}: {
  value: TranslationMode;
  onChange: (m: TranslationMode) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-bridge-sage">
        Translation mode
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(m.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-left text-xs transition",
              value === m.id
                ? "border-bridge-ink bg-bridge-ink text-bridge-cream"
                : "border-bridge-mist bg-white text-bridge-ink hover:border-bridge-sage",
              disabled && "opacity-50"
            )}
          >
            <span className="block font-medium">{m.label}</span>
            <span
              className={cn(
                "block text-[10px]",
                value === m.id ? "text-bridge-cream/95" : "text-bridge-clay"
              )}
            >
              {m.hint}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
