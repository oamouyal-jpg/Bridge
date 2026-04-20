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
  SharedMediatedMessage,
} from "./types";

/**
 * Aggregated persistence for a room. Replace with DB rows later:
 * rooms, participants, messages, profiles, conflict_maps, insights.
 */
export type RoomAggregate = {
  room: Room;
  participants: Map<string, Participant>;
  intakeMessages: Map<string, IntakeMessage[]>;
  /** Assistant turns count per participant (for min/max question rules) */
  intakeAssistantTurns: Map<string, number>;
  profiles: Map<string, ParticipantProfile>;
  conflictMap?: ConflictMap;
  privateRawMessages: PrivateRawMessage[];
  sharedMessages: SharedMediatedMessage[];
  insightsByParticipant: Map<string, InsightCard[]>;
  debrief?: import("./types").SessionDebrief;
  /** Updated after each mediated message when mediation is active */
  riskState?: RoomRiskState;
  credits: RoomCredits;
  /** Extra mediated messages purchased (+30 per extend_session) */
  additionalMessageAllowance: number;
  resolutionOutputs: ResolutionGeneration[];
  latestInsightReport?: AdvancedInsightReport;
  latestPrepare?: PrepareConversationResult;
};

export type BridgeDataStore = {
  rooms: Map<string, RoomAggregate>;
  inviteCodeToRoomId: Map<string, string>;
};

const GLOBAL_KEY = "__bridge_data_store_v2__";

function emptyRoomAggregate(room: Room): RoomAggregate {
  return {
    room,
    participants: new Map(),
    intakeMessages: new Map(),
    intakeAssistantTurns: new Map(),
    profiles: new Map(),
    privateRawMessages: [],
    sharedMessages: [],
    insightsByParticipant: new Map(),
    credits: {
      resolution: 0,
      insightReport: 0,
      prepareConversation: 0,
    },
    additionalMessageAllowance: 0,
    resolutionOutputs: [],
  };
}

export function getDataStore(): BridgeDataStore {
  const g = globalThis as unknown as Record<string, BridgeDataStore | undefined>;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = {
      rooms: new Map(),
      inviteCodeToRoomId: new Map(),
    };
  }
  return g[GLOBAL_KEY]!;
}

export function getOrCreateAggregate(roomId: string): RoomAggregate | undefined {
  return getDataStore().rooms.get(roomId);
}

export function saveRoomAggregate(agg: RoomAggregate): void {
  const store = getDataStore();
  store.rooms.set(agg.room.id, agg);
  store.inviteCodeToRoomId.set(agg.room.inviteCode.toLowerCase(), agg.room.id);
}

export function registerNewRoom(room: Room): RoomAggregate {
  const agg = emptyRoomAggregate(room);
  saveRoomAggregate(agg);
  return agg;
}
