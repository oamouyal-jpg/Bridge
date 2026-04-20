import { completeJson, isAiConfigured } from "./ai";
import { localeSystemInstruction } from "./i18n/server-locale";
import type { Locale } from "./i18n/types";
import type { AdvancedInsightReport, ConflictMap, ParticipantProfile, SharedMediatedMessage } from "./types";

function groupReportUserPrefix(profileCount: number): string {
  if (profileCount <= 2) return "";
  return `This room involves ${profileCount} participants. The field "dynamicBetweenParticipants" must describe group-level dynamics (coalitions, triangulation, inclusion/exclusion, who speaks for whom) — not only a two-person dyad. Other arrays may reference multiple people or sub-patterns accordingly.\n\n`;
}

const SYSTEM = `You produce an advanced insight report for a mediation app.

Return JSON only:
{
  "emotionalPatterns": ["..."],
  "dynamicBetweenParticipants": "paragraph",
  "repeatedTriggers": ["..."],
  "riskPatterns": ["observable interaction risks, not person labels"],
  "communicationStrategy": ["..."],
  "summary": "short paragraph"
}

No diagnosis. No calling anyone abusive or unstable. Describe dynamics and patterns only.`;

export async function generateAdvancedInsightReport(input: {
  sharedMessages: SharedMediatedMessage[];
  profiles: ParticipantProfile[];
  map: ConflictMap;
  locale?: Locale;
}): Promise<AdvancedInsightReport> {
  const thread = input.sharedMessages.map((m) => m.mediatedContent).join("\n---\n");
  const prefix = groupReportUserPrefix(input.profiles.length);
  const user = `${prefix}Conflict map:\n${JSON.stringify(input.map, null, 2)}\n\nProfiles:\n${input.profiles
    .map((p) => JSON.stringify(p, null, 2))
    .join("\n")}\n\nThread:\n${thread}`;

  if (!isAiConfigured()) {
    const dynamic =
      input.profiles.length > 2
        ? "Several people appear to be navigating overlapping needs — watch for coalition pressure, triangulation, and who feels on the spot in the shared thread."
        : "Both sides appear to be protecting something important — closeness versus autonomy may be colliding.";
    return {
      emotionalPatterns: ["Heightened sensitivity to being unseen", "Protectiveness under stress"],
      dynamicBetweenParticipants: dynamic,
      repeatedTriggers: ["Last-minute changes", "Feeling monitored"],
      riskPatterns: ["Escalation when motives are inferred rather than checked"],
      communicationStrategy: [
        "Slow the tempo",
        "Use impact statements before interpretations",
        "Agree on one rule for the next week",
      ],
      summary:
        "The tension looks less like disagreement on facts and more like two different fears about what the conflict means.",
      createdAt: new Date().toISOString(),
    };
  }

  const system = input.locale ? `${SYSTEM}${localeSystemInstruction(input.locale)}` : SYSTEM;
  const raw = await completeJson<Record<string, unknown>>(system, user);

  return {
    emotionalPatterns: arr(raw.emotionalPatterns),
    dynamicBetweenParticipants: String(raw.dynamicBetweenParticipants ?? "").trim(),
    repeatedTriggers: arr(raw.repeatedTriggers),
    riskPatterns: arr(raw.riskPatterns),
    communicationStrategy: arr(raw.communicationStrategy),
    summary: String(raw.summary ?? "").trim(),
    createdAt: new Date().toISOString(),
  };
}

function arr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(String).filter(Boolean);
}
