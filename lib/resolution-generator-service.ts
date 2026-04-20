import { completeJson, isAiConfigured } from "./ai";
import { groupPrepareResolutionUserAppend } from "./group-mediation";
import type {
  ConflictMap,
  ParticipantProfile,
  ResolutionGeneration,
  ResolutionGenerationType,
  SharedMediatedMessage,
} from "./types";

const SYSTEM = `You help people turn mediated conversations into practical next steps.

Return JSON only:
{
  "title": "short title",
  "steps": ["concrete step strings"],
  "exampleMessage": "example wording they might use",
  "guidance": ["brief bullet guidance"]
}

No therapy diagnosis. No legal advice. Neutral, humane tone.`;

export async function generateResolution(input: {
  type: ResolutionGenerationType;
  sharedMessages: SharedMediatedMessage[];
  profiles: ParticipantProfile[];
  map: ConflictMap;
}): Promise<ResolutionGeneration> {
  const thread = input.sharedMessages.map((m) => m.mediatedContent).join("\n---\n");
  const groupTail = groupPrepareResolutionUserAppend(input.profiles.length);
  const user = `Type: ${input.type}

Conflict map:
${JSON.stringify(input.map, null, 2)}

Profiles:
${input.profiles.map((p) => JSON.stringify(p, null, 2)).join("\n\n")}

Mediated thread:
${thread}${groupTail}`;

  if (!isAiConfigured()) {
    return {
      type: input.type,
      title:
        input.type === "repair"
          ? "Repair conversation"
          : input.type === "boundary"
            ? "Boundary message"
            : input.type === "closure"
              ? "Closure conversation"
              : "Prepare for discussion",
      steps: [
        "Name one feeling and one impact without proving intent.",
        "Ask one clarifying question before proposing a next step.",
        "Agree on one small follow-up that feels safe for both.",
      ],
      exampleMessage:
        "I want to find a way forward that works for both of us. Can we talk about what would feel fair for the next step?",
      guidance: [
        "Keep turns short; pause if the tone spikes.",
        "Separate facts from the story you’re afraid of.",
      ],
      createdAt: new Date().toISOString(),
    };
  }

  const raw = await completeJson<{
    title?: string;
    steps?: unknown;
    exampleMessage?: string;
    guidance?: unknown;
  }>(SYSTEM, user);

  return {
    type: input.type,
    title: String(raw.title ?? "Resolution plan").trim(),
    steps: Array.isArray(raw.steps) ? raw.steps.map(String).filter(Boolean).slice(0, 12) : [],
    exampleMessage: String(raw.exampleMessage ?? "").trim(),
    guidance: Array.isArray(raw.guidance)
      ? raw.guidance.map(String).filter(Boolean).slice(0, 12)
      : [],
    createdAt: new Date().toISOString(),
  };
}
