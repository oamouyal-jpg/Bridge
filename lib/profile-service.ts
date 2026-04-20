import { completeJson, isAiConfigured } from "./ai";
import type { ParticipantProfile, EmotionalPrimary } from "./types";
import type { RoomAggregate } from "./store";
import { saveRoomAggregate } from "./store";

const PROFILE_SYSTEM = `You are an expert conflict-pattern analyzer.

Given a participant's intake transcript, extract a structured emotional profile.

Be careful not to overstate certainty.
Infer only what is reasonably supported by the transcript.
Return valid JSON only.

Required JSON shape:
{
  "presentingComplaint": string,
  "emotionalState": {
    "primary": "hurt" | "angry" | "fearful" | "overwhelmed" | "shut_down" | "confused" | "resentful",
    "secondary": string optional,
    "intensity": number (1-10)
  },
  "coreNeeds": string[],
  "dominantFears": string[],
  "triggers": string[],
  "conflictStyle": "pursuing" | "withdrawing" | "defensive" | "appeasing" | "controlling" | "mixed",
  "communicationRisks": string[],
  "desiredOutcome": "repair" | "clarity" | "apology" | "boundary" | "space" | "closure" | "unknown",
  "opennessToRepair": number (1-10),
  "readinessForMediation": number (1-10),
  "summary": string
}`;

function transcript(aggregate: RoomAggregate, participantId: string): string {
  const msgs = aggregate.intakeMessages.get(participantId) ?? [];
  return msgs.map((m) => `${m.role}: ${m.content}`).join("\n");
}

const PRIMARIES: EmotionalPrimary[] = [
  "hurt",
  "angry",
  "fearful",
  "overwhelmed",
  "shut_down",
  "confused",
  "resentful",
];

function normalizePrimary(v: unknown): EmotionalPrimary {
  const s = String(v);
  return (PRIMARIES.includes(s as EmotionalPrimary) ? s : "hurt") as EmotionalPrimary;
}

function mockProfile(participantId: string): ParticipantProfile {
  return {
    participantId,
    presentingComplaint: "Tension and repeated hurt in a high-stakes relationship moment.",
    emotionalState: { primary: "hurt", secondary: "fear of being unseen", intensity: 7 },
    coreNeeds: ["reassurance", "clarity", "fair hearing"],
    dominantFears: ["being dismissed", "losing connection"],
    triggers: ["last-minute changes", "feeling optional"],
    conflictStyle: "mixed",
    communicationRisks: ["accusatory tone under stress", "withdrawal when flooded"],
    desiredOutcome: "repair",
    opennessToRepair: 7,
    readinessForMediation: 7,
    summary:
      "The participant is trying to protect the relationship while feeling emotionally exposed; they want understanding more than a verdict.",
  };
}

export async function extractParticipantProfile(
  aggregate: RoomAggregate,
  participantId: string
): Promise<ParticipantProfile> {
  if (!isAiConfigured()) {
    const p = mockProfile(participantId);
    aggregate.profiles.set(participantId, p);
    const part = aggregate.participants.get(participantId);
    if (part) {
      part.intakeCompleted = true;
      aggregate.participants.set(participantId, part);
    }
    saveRoomAggregate(aggregate);
    return p;
  }

  const user = `Transcript:\n${transcript(aggregate, participantId)}`;
  const raw = await completeJson<Record<string, unknown>>(PROFILE_SYSTEM, user);

  const profile: ParticipantProfile = {
    participantId,
    presentingComplaint: String(raw.presentingComplaint ?? "").trim() || "(unspecified)",
    emotionalState: {
      primary: normalizePrimary(
        (raw.emotionalState as { primary?: unknown } | undefined)?.primary
      ),
      secondary: (raw.emotionalState as { secondary?: unknown } | undefined)?.secondary
        ? String((raw.emotionalState as { secondary?: unknown }).secondary)
        : undefined,
      intensity: clamp(
        Number((raw.emotionalState as { intensity?: unknown } | undefined)?.intensity ?? 5),
        1,
        10
      ),
    },
    coreNeeds: arr(raw.coreNeeds),
    dominantFears: arr(raw.dominantFears),
    triggers: arr(raw.triggers),
    conflictStyle: normalizeStyle(raw.conflictStyle),
    communicationRisks: arr(raw.communicationRisks),
    desiredOutcome: normalizeOutcome(raw.desiredOutcome),
    opennessToRepair: clamp(Number(raw.opennessToRepair ?? 5), 1, 10),
    readinessForMediation: clamp(Number(raw.readinessForMediation ?? 5), 1, 10),
    summary: String(raw.summary ?? "").trim() || "Summary unavailable.",
  };

  aggregate.profiles.set(participantId, profile);
  const part = aggregate.participants.get(participantId);
  if (part) {
    part.intakeCompleted = true;
    aggregate.participants.set(participantId, part);
  }
  saveRoomAggregate(aggregate);
  return profile;
}

function arr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x)).filter(Boolean);
}

function clamp(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

function normalizeStyle(
  v: unknown
): ParticipantProfile["conflictStyle"] {
  const s = String(v);
  const ok = ["pursuing", "withdrawing", "defensive", "appeasing", "controlling", "mixed"];
  return (ok.includes(s) ? s : "mixed") as ParticipantProfile["conflictStyle"];
}

function normalizeOutcome(v: unknown): ParticipantProfile["desiredOutcome"] {
  const s = String(v);
  const ok = ["repair", "clarity", "apology", "boundary", "space", "closure", "unknown"];
  return (ok.includes(s) ? s : "unknown") as ParticipantProfile["desiredOutcome"];
}
