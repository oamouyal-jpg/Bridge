"use client";

import type { ChatMessage } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

const VIEWER_SELF: "a" | "b" = "a";

export function TypingDots() {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-2xl border border-bridge-mist bg-white px-3 py-2 shadow-sm"
      aria-label="Bridge is reflecting"
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bridge-stone" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bridge-stone [animation-delay:120ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bridge-stone [animation-delay:240ms]" />
    </div>
  );
}

export function DemoMessageList({
  messages,
  sessionKind,
  participantNames,
}: {
  messages: ChatMessage[];
  sessionKind: "private" | "joint";
  /** When set, private user bubbles and joint labels use these instead of You/Partner. */
  participantNames?: { a: string; b: string };
}) {
  return (
    <>
      {messages.map((m) => (
        <DemoMessage key={m.id} message={m} sessionKind={sessionKind} participantNames={participantNames} />
      ))}
    </>
  );
}

function DemoMessage({
  message,
  sessionKind,
  participantNames,
}: {
  message: ChatMessage;
  sessionKind: "private" | "joint";
  participantNames?: { a: string; b: string };
}) {
  const labelA = participantNames?.a ?? "You";
  const labelB = participantNames?.b ?? "Partner";

  if (message.role === "system") {
    return (
      <div className="flex justify-center px-2 py-2">
        <p className="max-w-[19rem] text-center text-[11px] leading-relaxed text-bridge-stone">
          {message.content}
        </p>
      </div>
    );
  }

  const isAssistant = message.role === "assistant";
  const isUser = message.role === "user";
  const participant = message.participant ?? VIEWER_SELF;

  if (sessionKind === "private") {
    return (
      <div
        className={cn(
          "flex max-w-[95%] flex-col gap-1",
          isUser ? "ms-auto items-end" : "items-start",
        )}
      >
        {isUser && participantNames ? (
          <p className="text-[10px] font-semibold uppercase tracking-wide text-bridge-sageMuted">
            {participant === "a" ? labelA : labelB}
          </p>
        ) : null}
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm leading-relaxed",
            isAssistant
              ? "border border-bridge-mist bg-bridge-honey text-bridge-ink shadow-sm"
              : "bg-bridge-ink text-bridge-cream shadow-sm",
          )}
        >
          {isAssistant ? (
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-bridge-sageMuted">
              Bridge
            </p>
          ) : null}
          <p>{message.content}</p>
        </div>
      </div>
    );
  }

  if (isAssistant) {
    return (
      <div className="mx-auto max-w-[95%] space-y-1">
        <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-bridge-sageMuted">
          Bridge
        </p>
        <div className="rounded-2xl border-2 border-bridge-mist bg-bridge-honey px-3 py-2 text-sm leading-relaxed text-bridge-ink shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  if (isUser) {
    const isSelf = participant === VIEWER_SELF;
    return (
      <div className={cn("max-w-[95%] space-y-1", isSelf ? "ml-auto text-right" : "mr-auto text-left")}>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-bridge-sageMuted">
          {participant === "a" ? labelA : labelB}
        </p>
        <div
          className={cn(
            "inline-block rounded-2xl border-2 px-3 py-2 text-left text-sm leading-relaxed shadow-sm",
            isSelf
              ? "border-bridge-ink/20 bg-bridge-ink text-bridge-cream"
              : "border-bridge-mist bg-bridge-sand text-bridge-ink",
          )}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return null;
}
