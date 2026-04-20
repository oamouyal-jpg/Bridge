import { completeJson, isAiConfigured } from "./ai";
import type { ConflictMap, ParticipantProfile } from "./types";
import type { RoomAggregate } from "./store";
import { saveRoomAggregate } from "./store";

const MAPPER_SYSTEM_PAIR = `You are a conflict-mapping engine for a mediation app.

You receive two participant profiles. Your task is to identify:
- the likely surface conflict
- the likely underlying conflict
- where each participant's needs align
- where their needs clash
- risk factors for escalation
- the best mediation strategy and tone

Do not moralize.
Do not choose a winner.
Focus on dynamics, not blame.

Return valid JSON only with:
- surfaceIssue
- underlyingIssue
- participantAView
- participantBView
- sharedNeeds
- opposingNeeds
- escalationRisks
- mediationGoals
- recommendedTone ("gentle" | "direct" | "structured")
- summary`;

const MAPPER_SYSTEM_GROUP = `You are a conflict-mapping engine for a small-group mediation room (family or workplace).

You receive several participant profiles (private intake summaries). Your task is to identify:
- the likely surface tension (what people say the problem is about)
- underlying dynamics (needs, fears, role pressures)
- participantAView: themes that unite or align most of the group
- participantBView: tensions, mismatches, or subgroup differences (without blaming individuals)
- sharedNeeds, opposingNeeds, escalationRisks, mediationGoals
- recommendedTone ("gentle" | "direct" | "structured")
- summary (fair, neutral, actionable)

Do not moralize or label people as "the problem."
Return valid JSON only with the same keys as for a pair: surfaceIssue, underlyingIssue, participantAView, participantBView, sharedNeeds, opposingNeeds, escalationRisks, mediationGoals, recommendedTone, summary.`;

function mockMap(roomId: string): ConflictMap {
  return {
    roomId,
    surfaceIssue: "Scheduling, responsiveness, and priorities.",
    underlyingIssue:
      "Both want emotional safety, but one seeks it through closeness and the other through distance when overloaded.",
    participantAView: "I feel deprioritized when plans shift without me.",
    participantBView: "I feel monitored when I need autonomy under stress.",
    sharedNeeds: ["respect", "goodwill", "less escalation"],
    opposingNeeds: ["more predictability", "more freedom to say yes spontaneously"],
    escalationRisks: ["interpreting motives as character flaws", "scorekeeping"],
    mediationGoals: ["slow the tempo", "name fears", "agree on one communication rule"],
    recommendedTone: "gentle",
    summary:
      "Both participants appear to want connection, but one seeks reassurance through closeness while the other seeks safety through distance. The conflict is being experienced as rejection by one side and pressure by the other.",
  };
}

function mockMapGroup(roomId: string, n: number): ConflictMap {
  return {
    roomId,
    surfaceIssue: "Logistics, roles, and how decisions get made in the group.",
    underlyingIssue:
      "Different members carry different loads of emotional or operational labor; some want more structure, others more flexibility.",
    participantAView: `Across ${n} people, recurring themes include wanting respect, clarity, and to feel heard when stakes are high.`,
    participantBView:
      "Tensions show up when assumptions differ about who owns a decision, how fast to move, or what 'fair' looks like in this context.",
    sharedNeeds: ["psychological safety", "clear next steps", "space to repair"],
    opposingNeeds: ["tighter agreements", "more room to improvise"],
    escalationRisks: ["side conversations", "reading silence as agreement", "role confusion"],
    mediationGoals: ["name shared standards", "one explicit decision rule", "check pace weekly"],
    recommendedTone: "structured",
    summary:
      "This is a multi-person room: the map highlights group-level patterns so mediation can stay neutral and forward-looking.",
  };
}

export async function buildConflictMap(aggregate: RoomAggregate): Promise<ConflictMap> {
  const ids = aggregate.room.participantIds;
  if (ids.length < 2) throw new Error("Conflict map needs at least two participants.");

  if (ids.length === 2) {
    return buildPairConflictMap(aggregate, ids[0], ids[1]);
  }
  return buildGroupConflictMap(aggregate, ids);
}

async function buildPairConflictMap(
  aggregate: RoomAggregate,
  a: string,
  b: string
): Promise<ConflictMap> {
  const pa = aggregate.profiles.get(a);
  const pb = aggregate.profiles.get(b);
  if (!pa || !pb) throw new Error("Both profiles are required.");

  if (!isAiConfigured()) {
    const map = mockMap(aggregate.room.id);
    aggregate.conflictMap = map;
    saveRoomAggregate(aggregate);
    return map;
  }

  const user = `Participant A profile:\n${JSON.stringify(pa, null, 2)}\n\nParticipant B profile:\n${JSON.stringify(
    pb,
    null,
    2
  )}`;

  const raw = await completeJson<Record<string, unknown>>(MAPPER_SYSTEM_PAIR, user);
  const map = rawToConflictMap(aggregate.room.id, raw);
  aggregate.conflictMap = map;
  saveRoomAggregate(aggregate);
  return map;
}

async function buildGroupConflictMap(
  aggregate: RoomAggregate,
  ids: string[]
): Promise<ConflictMap> {
  const profiles = ids
    .map((id) => {
      const p = aggregate.profiles.get(id);
      const name = aggregate.participants.get(id)?.displayName ?? id;
      return p ? { id, name, profile: p } : null;
    })
    .filter((x): x is { id: string; name: string; profile: ParticipantProfile } => Boolean(x));

  if (profiles.length !== ids.length) {
    throw new Error("Every participant needs a completed profile for the group map.");
  }

  if (!isAiConfigured()) {
    const map = mockMapGroup(aggregate.room.id, ids.length);
    aggregate.conflictMap = map;
    saveRoomAggregate(aggregate);
    return map;
  }

  const user = profiles
    .map(
      (row, i) =>
        `Participant ${i + 1} (${row.name}, id ${row.id}):\n${JSON.stringify(row.profile, null, 2)}`
    )
    .join("\n\n");

  const raw = await completeJson<Record<string, unknown>>(MAPPER_SYSTEM_GROUP, user);
  const map = rawToConflictMap(aggregate.room.id, raw);
  aggregate.conflictMap = map;
  saveRoomAggregate(aggregate);
  return map;
}

function rawToConflictMap(roomId: string, raw: Record<string, unknown>): ConflictMap {
  return {
    roomId,
    surfaceIssue: String(raw.surfaceIssue ?? "").trim(),
    underlyingIssue: String(raw.underlyingIssue ?? "").trim(),
    participantAView: String(raw.participantAView ?? "").trim(),
    participantBView: String(raw.participantBView ?? "").trim(),
    sharedNeeds: arr(raw.sharedNeeds),
    opposingNeeds: arr(raw.opposingNeeds),
    escalationRisks: arr(raw.escalationRisks),
    mediationGoals: arr(raw.mediationGoals),
    recommendedTone: normalizeTone(raw.recommendedTone),
    summary: String(raw.summary ?? "").trim(),
  };
}

function arr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x)).filter(Boolean);
}

function normalizeTone(v: unknown): ConflictMap["recommendedTone"] {
  const s = String(v);
  return s === "direct" || s === "structured" || s === "gentle" ? s : "gentle";
}

export function serializeProfilesForPrompt(
  profile: ParticipantProfile,
  label: string
): string {
  return `${label}:\n${JSON.stringify(profile, null, 2)}`;
}
