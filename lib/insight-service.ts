import { nanoid } from "nanoid";
import { completeJson, isAiConfigured } from "./ai";
import { GROUP_INSIGHT_USER_APPEND } from "./group-mediation";
import type { ConflictMap, InsightCard, InsightCardType, ParticipantProfile } from "./types";

const INSIGHT_SYSTEM = `You are a private reflection assistant inside a mediation app.

You support one participant privately while they communicate through an AI mediator.

You may generate:
- reflection prompts
- reframe suggestions
- warnings about escalation
- goal reminders
- pattern observations

Your tone should be sharp, calm, useful, and emotionally intelligent.
Do not sound cheesy, preachy, or clinical.

Return JSON:
{
  "cards": [
    {
      "title": "...",
      "body": "...",
      "type": "reflection" | "warning" | "goal" | "reframe" | "pattern"
    }
  ]
}`;

function now() {
  return new Date().toISOString();
}

export async function generateInsightCards(input: {
  roomId: string;
  participantId: string;
  draft: string;
  profile: ParticipantProfile;
  map: ConflictMap;
  /** When true, several people may read the eventual mediated line — cards stay dignified and non-"win". */
  groupRoom?: boolean;
}): Promise<InsightCard[]> {
  if (!isAiConfigured()) {
    return [
      {
        id: `ic_${nanoid(8)}`,
        roomId: input.roomId,
        participantId: input.participantId,
        title: "Aim: be understood, not win",
        body: "Short, specific, and curious usually lands better than a verdict.",
        type: "goal",
        createdAt: now(),
      },
      {
        id: `ic_${nanoid(8)}`,
        roomId: input.roomId,
        participantId: input.participantId,
        title: "Draft check",
        body:
          input.draft.length > 400
            ? "This is long — consider one feeling, one impact, one request."
            : "Try naming impact (“I felt…”) before interpretation (“you intended…”).",
        type: "reflection",
        createdAt: now(),
      },
    ];
  }

  const groupTail = input.groupRoom ? GROUP_INSIGHT_USER_APPEND : "";
  const user = `Private draft (not shared verbatim):\n${input.draft}${groupTail}\n\nProfile:\n${JSON.stringify(
    input.profile,
    null,
    2
  )}\n\nConflict map:\n${JSON.stringify(input.map, null, 2)}`;

  const raw = await completeJson<{ cards?: { title?: string; body?: string; type?: string }[] }>(
    INSIGHT_SYSTEM,
    user
  );

  const cards: InsightCard[] = (raw.cards ?? []).slice(0, 6).map((c) => ({
    id: `ic_${nanoid(10)}`,
    roomId: input.roomId,
    participantId: input.participantId,
    title: String(c.title ?? "").trim() || "Reflection",
    body: String(c.body ?? "").trim(),
    type: normalizeType(c.type),
    createdAt: now(),
  }));

  return cards;
}

function normalizeType(v: unknown): InsightCardType {
  const s = String(v);
  const ok: InsightCardType[] = ["reflection", "warning", "goal", "reframe", "pattern"];
  return ok.includes(s as InsightCardType) ? (s as InsightCardType) : "reflection";
}
