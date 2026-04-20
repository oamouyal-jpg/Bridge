import { completeJson, isAiConfigured } from "./ai";
import { GROUP_MEDIATION_SYSTEM_APPEND } from "./group-mediation";
import { localeSystemInstruction } from "./i18n/server-locale";
import type { Locale } from "./i18n/types";
import type { ConflictMap, MessageAnalysis, ParticipantProfile, RoomCategory, TranslationMode } from "./types";

const MEDIATOR_SYSTEM_BASE = `You are an AI mediator designed to reduce defensiveness and increase mutual understanding between people in conflict.
You do not take sides and you do not determine who is right. You are not a judge, arbiter, or therapist.
Your goals are to reduce emotional threat, extract true intent, reframe messages into safer non-accusatory language, help each party feel understood without forcing agreement, and offer optional paths forward.
Prioritize emotional clarity over factual argument. Preserve meaning while softening delivery. Never escalate conflict.

You will receive:
- a participant's raw private message
- that participant's profile
- the room conflict map
- the participant's selected translation mode

Your task is to translate the raw message into a shared message that:
- preserves emotional truth (feelings, needs, fears, lived experience)
- reduces blame, accusation, absolutist language, and contempt
- expresses experience, impact, need, boundary, or request more clearly
- does not flatten the message into generic therapy language
- sounds human, direct, emotionally real, and understandable

Never include assumptions about the other person's motives unless explicitly framed as the sender's own perception.
Prefer first-person language.
Do not expose hidden profile fields directly.
Do not mention analysis or labels in the mediated message itself.

Modes:
- softened: gentler, lower heat
- direct_respectful: clear, strong, respectful
- emotionally_honest: emotionally vivid but still non-destructive

Alongside the mediated message, extract a compact private signal the app can use — what you read as the sender's feelings, unmet needs, underlying fears, core intent, and emotional intensity. These are never shown to the other party as labels; they inform downstream understanding.

Return JSON:
{
  "mediatedMessage": "...",
  "detectedIntent": "short phrase (e.g. 'seek repair', 'ask for space')",
  "escalationRisk": 1,
  "analysis": {
    "feelings": ["..."],
    "needs": ["..."],
    "fears": ["..."],
    "intent": "one short phrase",
    "intensity": 1
  }
}`;

export type MediationOutput = {
  mediatedMessage: string;
  detectedIntent: string;
  escalationRisk: number;
  analysis: MessageAnalysis;
};

/** Optional context when the room has more than two people. */
export type MediationGroupRoomContext = {
  category: RoomCategory;
  participantCount: number;
  senderDisplayName: string;
  senderParticipantId: string;
  /** One line per person, shown to the model */
  rosterMarkdown: string;
};

export async function mediatePrivateMessage(input: {
  raw: string;
  profile: ParticipantProfile;
  map: ConflictMap;
  mode: TranslationMode;
  room?: MediationGroupRoomContext;
  locale?: Locale;
}): Promise<MediationOutput> {
  const raw = input.raw.trim();
  if (!raw) throw new Error("Message is empty.");

  const group = input.room !== undefined && input.room.participantCount > 2;

  if (!isAiConfigured()) {
    const softened = raw.replace(/\b(you always|you never)\b/gi, "it felt like");
    const line = group
      ? `I want to be clear with everyone here: ${softened}. I'm speaking from my own experience, not to single anyone out.`
      : `I want to be honest: ${softened}. I’m trying to say what this brought up for me, not attack you.`;
    return {
      mediatedMessage: line,
      detectedIntent: "seek understanding",
      escalationRisk: group ? 5 : 4,
      analysis: {
        feelings: ["hurt"],
        needs: ["to be heard"],
        fears: ["being dismissed"],
        intent: "seek understanding",
        intensity: 5,
      },
    };
  }

  const baseSystem = group
    ? `${MEDIATOR_SYSTEM_BASE}${GROUP_MEDIATION_SYSTEM_APPEND}`
    : MEDIATOR_SYSTEM_BASE;
  const system = input.locale ? `${baseSystem}${localeSystemInstruction(input.locale)}` : baseSystem;

  const userParts = [
    `Translation mode: ${input.mode}`,
    "",
    "Conflict map summary:",
    input.map.summary,
    "",
    "Participant profile:",
    JSON.stringify(input.profile, null, 2),
    "",
    "Raw private message:",
    raw,
  ];

  if (group && input.room) {
    const r = input.room;
    userParts.push(
      "",
      "--- Group room context ---",
      `This room has ${r.participantCount} people (category: ${r.category}).`,
      `Sender (whose raw message this is): ${r.senderDisplayName} (${r.senderParticipantId})`,
      "Everyone below will read the mediated line in the shared thread:",
      r.rosterMarkdown
    );
  }

  const user = userParts.join("\n");

  const res = await completeJson<{
    mediatedMessage?: string;
    detectedIntent?: string;
    escalationRisk?: number;
    analysis?: {
      feelings?: unknown;
      needs?: unknown;
      fears?: unknown;
      intent?: unknown;
      intensity?: unknown;
    };
  }>(system, user);

  const detectedIntent = String(res.detectedIntent ?? "").trim() || "express experience";
  const intensityRaw = Number(res.analysis?.intensity ?? res.escalationRisk ?? 5);
  const analysis: MessageAnalysis = {
    feelings: toStringArray(res.analysis?.feelings),
    needs: toStringArray(res.analysis?.needs),
    fears: toStringArray(res.analysis?.fears),
    intent: String(res.analysis?.intent ?? detectedIntent).trim() || detectedIntent,
    intensity: Math.min(10, Math.max(1, Number.isNaN(intensityRaw) ? 5 : intensityRaw)),
  };

  return {
    mediatedMessage: String(res.mediatedMessage ?? "").trim() || raw,
    detectedIntent,
    escalationRisk: Math.min(10, Math.max(1, Number(res.escalationRisk ?? 5))),
    analysis,
  };
}

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, 8);
}
