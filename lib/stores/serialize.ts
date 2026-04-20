import type {
  AdvancedInsightReport,
  ConflictMap,
  InsightCard,
  IntakeMessage,
  Participant,
  ParticipantProfile,
  PrepareConversationResult,
  PrivateRawMessage,
  ResolutionGeneration,
  Room,
  RoomCredits,
  RoomRiskState,
  SessionDebrief,
  SharedMediatedMessage,
} from "../types";
import type { RoomAggregate } from "../store";

/**
 * JSON-friendly shape of a `RoomAggregate`. The in-memory representation uses
 * `Map`s (cheap lookups, no schema); the persisted shape flattens those into
 * plain object entries so it can be `JSON.stringify`'d straight into SQLite.
 *
 * Keep this symmetric with `toSerializable` / `fromSerializable` below — if you
 * add a new field to `RoomAggregate`, add it here too or it silently drops off
 * disk on the next save.
 */
export type SerializableAggregate = {
  room: Room;
  participants: Array<[string, Participant]>;
  intakeMessages: Array<[string, IntakeMessage[]]>;
  intakeAssistantTurns: Array<[string, number]>;
  profiles: Array<[string, ParticipantProfile]>;
  conflictMap?: ConflictMap;
  privateRawMessages: PrivateRawMessage[];
  sharedMessages: SharedMediatedMessage[];
  insightsByParticipant: Array<[string, InsightCard[]]>;
  debrief?: SessionDebrief;
  riskState?: RoomRiskState;
  credits: RoomCredits;
  additionalMessageAllowance: number;
  resolutionOutputs: ResolutionGeneration[];
  latestInsightReport?: AdvancedInsightReport;
  latestPrepare?: PrepareConversationResult;
};

export function toSerializable(agg: RoomAggregate): SerializableAggregate {
  return {
    room: agg.room,
    participants: Array.from(agg.participants.entries()),
    intakeMessages: Array.from(agg.intakeMessages.entries()),
    intakeAssistantTurns: Array.from(agg.intakeAssistantTurns.entries()),
    profiles: Array.from(agg.profiles.entries()),
    conflictMap: agg.conflictMap,
    privateRawMessages: agg.privateRawMessages,
    sharedMessages: agg.sharedMessages,
    insightsByParticipant: Array.from(agg.insightsByParticipant.entries()),
    debrief: agg.debrief,
    riskState: agg.riskState,
    credits: agg.credits,
    additionalMessageAllowance: agg.additionalMessageAllowance,
    resolutionOutputs: agg.resolutionOutputs,
    latestInsightReport: agg.latestInsightReport,
    latestPrepare: agg.latestPrepare,
  };
}

export function fromSerializable(data: SerializableAggregate): RoomAggregate {
  return {
    room: data.room,
    participants: new Map(data.participants ?? []),
    intakeMessages: new Map(data.intakeMessages ?? []),
    intakeAssistantTurns: new Map(data.intakeAssistantTurns ?? []),
    profiles: new Map(data.profiles ?? []),
    conflictMap: data.conflictMap,
    privateRawMessages: data.privateRawMessages ?? [],
    sharedMessages: data.sharedMessages ?? [],
    insightsByParticipant: new Map(data.insightsByParticipant ?? []),
    debrief: data.debrief,
    riskState: data.riskState,
    credits: data.credits ?? {
      resolution: 0,
      insightReport: 0,
      prepareConversation: 0,
    },
    additionalMessageAllowance: data.additionalMessageAllowance ?? 0,
    resolutionOutputs: data.resolutionOutputs ?? [],
    latestInsightReport: data.latestInsightReport,
    latestPrepare: data.latestPrepare,
  };
}
