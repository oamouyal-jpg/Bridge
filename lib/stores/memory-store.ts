import type { Room } from "../types";
import type { RoomAggregate, BridgeStore } from "../store";

/**
 * Process-local in-memory store. Fast, zero-config, and the right choice for
 * `npm run dev`. Survives HMR (we stash on `globalThis`) but is lost on any
 * cold restart — do NOT use in production. Set `BRIDGE_DB_PATH` in the env to
 * switch to the SQLite store instead.
 */

type InternalState = {
  rooms: Map<string, RoomAggregate>;
  inviteCodeToRoomId: Map<string, string>;
};

const GLOBAL_KEY = "__bridge_data_store_v2__";

function getState(): InternalState {
  const g = globalThis as unknown as Record<string, InternalState | undefined>;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = {
      rooms: new Map(),
      inviteCodeToRoomId: new Map(),
    };
  }
  return g[GLOBAL_KEY]!;
}

function emptyAggregate(room: Room): RoomAggregate {
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

export const memoryStore: BridgeStore = {
  kind: "memory",

  getAggregate(roomId) {
    return getState().rooms.get(roomId);
  },

  saveAggregate(agg) {
    const s = getState();
    s.rooms.set(agg.room.id, agg);
    s.inviteCodeToRoomId.set(agg.room.inviteCode.toLowerCase(), agg.room.id);
  },

  registerNewRoom(room) {
    const agg = emptyAggregate(room);
    this.saveAggregate(agg);
    return agg;
  },

  resolveRoomIdFromInviteCode(codeLower) {
    const s = getState();
    if (s.rooms.has(codeLower)) return codeLower;
    return s.inviteCodeToRoomId.get(codeLower);
  },

  hasInviteCode(codeLower) {
    return getState().inviteCodeToRoomId.has(codeLower);
  },
};
