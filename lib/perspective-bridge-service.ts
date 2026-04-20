import { completeJson, isAiConfigured } from "./ai";
import { localeSystemInstruction } from "./i18n/server-locale";
import type { Locale } from "./i18n/types";
import type {
  ConflictMap,
  MessageAnalysis,
  ParticipantProfile,
  SharedMediatedMessage,
} from "./types";

/**
 * Reader-side perspective-bridging output. Intentionally small: we do NOT want
 * to generate a verdict, a deep clinical analysis, or a reframe of the other
 * person. We offer the reader two or three short paragraphs that help them
 * hold the message without flipping into defensiveness.
 */
export type PerspectiveBridge = {
  /** 1–2 sentences on what the sender's message may be coming from. */
  underneath: string;
  /** 1–2 sentences describing what the sender likely needs right now. */
  likelyNeed: string;
  /** 1 short suggestion for the reader: how to hold this well. Not a reply. */
  suggestion: string;
};

const SYSTEM = `You are a perspective-bridging assistant inside an AI mediation app.

A reader just received a mediated message from the other participant. They want help understanding what may be underneath that message — without any verdict about who is right and without putting words in the sender's mouth.

Rules:
- Do not take sides.
- Do not say the sender is or feels something with certainty; use language like "may be", "it sounds like", "this might come from".
- Do not attack or moralize about either party.
- Do not write a reply for the reader. You are not composing their response.
- Do not mention this app, mediation, or the AI.
- Keep it brief, warm, emotionally precise, and grounded in the sender's profile and the shared conflict map.

Return JSON:
{
  "underneath": "1–2 sentences on what the sender's message may be coming from emotionally",
  "likelyNeed": "1–2 sentences on what the sender likely needs to feel understood here",
  "suggestion": "1 short sentence to the reader on how to hold this without flipping into defensiveness — NOT a reply they should send"
}`;

export async function generatePerspectiveBridge(input: {
  message: SharedMediatedMessage;
  senderProfile: ParticipantProfile;
  senderDisplayName: string;
  map: ConflictMap;
  /** The reader's display name, for framing only. */
  readerDisplayName: string;
  locale?: Locale;
}): Promise<PerspectiveBridge> {
  const { message, senderProfile, senderDisplayName, readerDisplayName, map } = input;

  if (!isAiConfigured()) {
    return {
      underneath: `This may be coming from a place where ${senderDisplayName} is protecting something important — often what sounds like blame is someone trying to say they feel hurt or unseen.`,
      likelyNeed: `They likely need to feel that what they said was heard and taken in, not immediately countered. Understanding is not the same as agreeing.`,
      suggestion: `Before reacting, try naming one thing you heard — even if you see it differently.`,
    };
  }

  const analysisBlock = message.analysis
    ? `\n\nMediator's private signal on this specific message (not shown to anyone else):\n${JSON.stringify(
        {
          feelings: message.analysis.feelings,
          needs: message.analysis.needs,
          fears: message.analysis.fears,
          intent: message.analysis.intent,
          intensity: message.analysis.intensity,
        } satisfies MessageAnalysis,
        null,
        2
      )}`
    : "";

  const user = `Reader: ${readerDisplayName}
Sender: ${senderDisplayName}

The sender's mediated message (what the reader just saw):
"""
${message.mediatedContent}
"""${analysisBlock}

Sender profile (private to the app, use only to ground your inference — never quote it back literally):
${JSON.stringify(senderProfile, null, 2)}

Shared conflict map summary:
${map.summary}

Shared surface issue: ${map.surfaceIssue}
Shared underlying issue: ${map.underlyingIssue}
Sender's view in the map: ${map.participantAView || "(not specified)"}
Other view in the map: ${map.participantBView || "(not specified)"}`;

  const system = input.locale ? `${SYSTEM}${localeSystemInstruction(input.locale)}` : SYSTEM;
  const raw = await completeJson<{
    underneath?: string;
    likelyNeed?: string;
    suggestion?: string;
  }>(system, user);

  return {
    underneath: String(raw.underneath ?? "").trim() || "This message may be carrying more than the words alone.",
    likelyNeed:
      String(raw.likelyNeed ?? "").trim() ||
      "They likely want to feel heard, not immediately corrected.",
    suggestion:
      String(raw.suggestion ?? "").trim() ||
      "Try naming one thing you heard before you respond.",
  };
}
