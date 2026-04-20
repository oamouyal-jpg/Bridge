import { completeJson, isAiConfigured } from "./ai";
import { groupSummaryUserPrefix } from "./group-mediation";
import type { ConflictMap, SessionDebrief, SharedMediatedMessage } from "./types";

const SUMMARY_SYSTEM = `You are generating a session debrief for an AI-mediated communication room.

Given the conflict map and the shared mediated message thread, return JSON:
{
  "whatEachSideNeeds": string[],
  "coreStruggle": string,
  "misunderstandings": string[],
  "bestNextStep": string,
  "repairMessage": string optional,
  "boundaryMessage": string optional,
  "closureMessage": string optional
}

Neutral, non-clinical, non-legal. No therapy.`;

export async function generateSessionDebrief(input: {
  map: ConflictMap;
  shared: SharedMediatedMessage[];
  participantCount?: number;
}): Promise<SessionDebrief> {
  if (!isAiConfigured()) {
    return {
      whatEachSideNeeds: ["emotional safety", "understanding", "a workable next step"],
      coreStruggle:
        "The same events are being read through different fears — closeness versus pressure.",
      misunderstandings: ["What intent means", "What each person is protecting"],
      bestNextStep: "Agree on one small rule for the next week and revisit tone.",
      repairMessage: "I want to repair this. Can we slow down and try one small change together?",
      boundaryMessage: "I need a boundary: I can’t stay in this conversation if it becomes personal attacks.",
      closureMessage: "I care about you, and I need to pause this chapter for my own stability.",
    };
  }

  const n = input.participantCount ?? 2;
  const prefix = groupSummaryUserPrefix(n);
  const user = `${prefix}Conflict map:\n${JSON.stringify(input.map, null, 2)}\n\nShared thread:\n${input.shared
    .map((m) => `- ${m.sourceParticipantId}: ${m.mediatedContent}`)
    .join("\n")}`;

  const raw = await completeJson<Record<string, unknown>>(SUMMARY_SYSTEM, user);

  return {
    whatEachSideNeeds: arr(raw.whatEachSideNeeds),
    coreStruggle: String(raw.coreStruggle ?? "").trim(),
    misunderstandings: arr(raw.misunderstandings),
    bestNextStep: String(raw.bestNextStep ?? "").trim(),
    repairMessage: opt(raw.repairMessage),
    boundaryMessage: opt(raw.boundaryMessage),
    closureMessage: opt(raw.closureMessage),
  };
}

function arr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(String).filter(Boolean);
}

function opt(v: unknown): string | undefined {
  const s = String(v ?? "").trim();
  return s || undefined;
}
