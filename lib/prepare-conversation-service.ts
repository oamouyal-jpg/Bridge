import { completeJson, isAiConfigured } from "./ai";
import { groupPrepareResolutionUserAppend } from "./group-mediation";
import type {
  ConflictMap,
  ParticipantProfile,
  PrepareConversationKind,
  PrepareConversationResult,
  SharedMediatedMessage,
} from "./types";

const SYSTEM = `You prepare someone for a real-world conversation after mediation.

Return JSON:
{
  "whatToSay": ["short bullets"],
  "whatToAvoid": ["..."],
  "triggersToWatch": ["..."],
  "toneGuidance": "one paragraph"
}

No therapy or legal advice. Practical and respectful.`;

export async function generatePrepareConversation(input: {
  kind: PrepareConversationKind;
  sharedMessages: SharedMediatedMessage[];
  profiles: ParticipantProfile[];
  map: ConflictMap;
}): Promise<PrepareConversationResult> {
  const thread = input.sharedMessages.map((m) => m.mediatedContent).join("\n---\n");
  const groupTail = groupPrepareResolutionUserAppend(input.profiles.length);
  const user = `Channel: ${input.kind}

Map:\n${JSON.stringify(input.map, null, 2)}

Profiles:\n${input.profiles.map((p) => JSON.stringify(p, null, 2)).join("\n")}

Thread:\n${thread}${groupTail}`;

  if (!isAiConfigured()) {
    return {
      kind: input.kind,
      whatToSay: [
        "Open with appreciation for willingness to talk.",
        "Name one concrete topic; avoid a laundry list.",
        "Ask what a workable next step could look like on their side.",
      ],
      whatToAvoid: ["Global character labels", "Dredging unrelated past fights in the same breath"],
      triggersToWatch: ["Rising volume", "Mind-reading language", "Urgency that feels like pressure"],
      toneGuidance:
        "Steady, warm, and curious — like you’re building a bridge, not winning a trial.",
      createdAt: new Date().toISOString(),
    };
  }

  const raw = await completeJson<{
    whatToSay?: unknown;
    whatToAvoid?: unknown;
    triggersToWatch?: unknown;
    toneGuidance?: string;
  }>(SYSTEM, user);

  return {
    kind: input.kind,
    whatToSay: arr(raw.whatToSay),
    whatToAvoid: arr(raw.whatToAvoid),
    triggersToWatch: arr(raw.triggersToWatch),
    toneGuidance: String(raw.toneGuidance ?? "").trim(),
    createdAt: new Date().toISOString(),
  };
}

function arr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(String).filter(Boolean);
}
