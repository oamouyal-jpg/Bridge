import { completeJson, isAiConfigured } from "./ai";
import { GROUP_REWRITE_USER_APPEND } from "./group-mediation";
import type { ParticipantProfile, ConflictMap } from "./types";

export type RewriteKind = "clearer" | "gentler" | "deeper";

const BASE = `You help a participant revise a PRIVATE draft before mediation.
Return JSON: { "draft": "..." }
Keep emotional truth. Do not add new accusations. First person.`;

export async function rewriteDraft(input: {
  text: string;
  kind: RewriteKind;
  profile: ParticipantProfile;
  map: ConflictMap;
  groupRoom?: boolean;
}): Promise<string> {
  const t = input.text.trim();
  if (!t) return "";

  const instruction =
    input.kind === "clearer"
      ? "Make it clearer and more specific with less heat."
      : input.kind === "gentler"
        ? "Make it gentler while staying honest."
        : "Say what they really mean — emotionally honest but non-destructive.";

  if (!isAiConfigured()) {
    if (input.kind === "gentler") return `I want to talk about this gently: ${t}`;
    if (input.kind === "clearer")
      return `Here’s what I’m trying to say more clearly: ${t.slice(0, 800)}`;
    return `What I mean underneath the noise is: ${t}`;
  }

  const groupTail = input.groupRoom ? GROUP_REWRITE_USER_APPEND : "";
  const user = `${instruction}\n\nDraft:\n${t}${groupTail}\n\nProfile:\n${JSON.stringify(
    input.profile,
    null,
    2
  )}\n\nConflict map summary:\n${input.map.summary}`;

  const res = await completeJson<{ draft?: string }>(BASE, user);
  return String(res.draft ?? t).trim();
}
