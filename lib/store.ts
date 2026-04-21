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
 * In-memory aggregate shape. This is the *runtime* representation: nested
 * `Map`s so mutation sites stay cheap. The persistent store (SQLite) serializes
 * this via `lib/stores/serialize.ts` — any new field added here must also be
 * mirrored there or it will silently drop on the next save.
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

/**
 * Storage backend contract. Both `memoryStore` and `createSqliteStore` satisfy
 * it; which one we use is a pure env-var decision (see `selectStore` below).
 * All call sites in the app must go through the functional API at the bottom
 * of this file rather than reaching into a backend directly.
 */
export interface BridgeStore {
  readonly kind: "memory" | "sqlite";
  getAggregate(roomId: string): RoomAggregate | undefined;
  saveAggregate(agg: RoomAggregate): void;
  registerNewRoom(room: Room): RoomAggregate;
  /** `codeLower` must already be lowercased by the caller */
  resolveRoomIdFromInviteCode(codeLower: string): string | undefined;
  /** `codeLower` must already be lowercased by the caller */
  hasInviteCode(codeLower: string): boolean;
}

let activeStore: BridgeStore | null = null;

function loadMemoryStore(): BridgeStore {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("./stores/memory-store") as typeof import("./stores/memory-store");
  return mod.memoryStore;
}

function selectStore(): BridgeStore {
  if (activeStore) return activeStore;

  const dbPath = process.env.BRIDGE_DB_PATH?.trim();
  if (dbPath) {
    try {
      /**
       * Lazy-require the sqlite implementation so local dev / serverless edge
       * builds that never set `BRIDGE_DB_PATH` don't have to load the native
       * `better-sqlite3` binding at all.
       */
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require("./stores/sqlite-store") as typeof import("./stores/sqlite-store");
      activeStore = mod.createSqliteStore(dbPath);
      if (process.env.NODE_ENV !== "test") {
        console.log(`[bridge] using SQLite store at ${dbPath}`);
      }
      return activeStore;
    } catch (err) {
      /**
       * If SQLite can't open (e.g. the persistent disk isn't actually mounted
       * at BRIDGE_DB_PATH yet), we DO NOT want to make every API call throw
       * forever. Fall back to the in-memory store so the site keeps working
       * for the duration of this process. Shout loudly so the operator sees
       * the misconfiguration in the logs.
       */
      console.error(
        "[bridge] SQLite init FAILED — falling back to in-memory store. Data will not persist across restarts. Original error:",
        err
      );
      activeStore = loadMemoryStore();
      return activeStore;
    }
  }

  activeStore = loadMemoryStore();
  if (process.env.NODE_ENV !== "test") {
    console.warn(
      "[bridge] using IN-MEMORY store — data will NOT persist across restarts. Set BRIDGE_DB_PATH to enable SQLite."
    );
  }
  return activeStore;
}

/** Test-only: drop the cached backend so the next call re-reads env vars. */
export function __resetStoreForTests(): void {
  activeStore = null;
}

// ---------- Functional API used by the rest of the app ----------

export function getOrCreateAggregate(roomId: string): RoomAggregate | undefined {
  return selectStore().getAggregate(roomId);
}

export function saveRoomAggregate(agg: RoomAggregate): void {
  selectStore().saveAggregate(agg);
}

export function registerNewRoom(room: Room): RoomAggregate {
  return selectStore().registerNewRoom(room);
}

export function resolveRoomIdFromInviteCode(code: string): string | undefined {
  return selectStore().resolveRoomIdFromInviteCode(code.trim().toLowerCase());
}

export function hasInviteCode(code: string): boolean {
  return selectStore().hasInviteCode(code.trim().toLowerCase());
}
