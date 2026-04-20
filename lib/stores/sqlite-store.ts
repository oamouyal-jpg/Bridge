import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Room } from "../types";
import type { RoomAggregate, BridgeStore } from "../store";
import { fromSerializable, toSerializable, type SerializableAggregate } from "./serialize";

/**
 * SQLite-backed store. One row per room; the full `RoomAggregate` is
 * JSON-serialized into the `data` column. `invite_code` is denormalized onto a
 * unique column so the join-by-code path stays a single indexed lookup instead
 * of a full table scan.
 *
 * Why this shape (blob-per-aggregate) instead of normalized tables:
 *   - We always load/save the whole aggregate — every API route mutates Maps
 *     in memory and then calls `saveRoomAggregate`. Splitting into 8 tables
 *     would force a transactional rewrite of every save site for zero perf
 *     gain at our volume (small N of rooms, bursty writes).
 *   - Schema evolves fast (new AI outputs, credits fields, etc). A JSON blob
 *     costs nothing to migrate; column-level migrations would be churn.
 *   - If this ever outgrows SQLite, we swap to Postgres and mirror this same
 *     shape into a `jsonb` column as a stepping stone.
 *
 * Concurrency: `better-sqlite3` is synchronous. Writes are serialized by the
 * single-threaded Node event loop inside one process. We additionally enable
 * WAL mode so read queries don't block the writer.
 */

type Ctor = new (path: string, opts?: Database.Options) => Database.Database;

function openDb(path: string): Database.Database {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const DB = Database as unknown as Ctor;
  const db = new DB(path);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      room_id      TEXT PRIMARY KEY,
      invite_code  TEXT NOT NULL,
      data         TEXT NOT NULL,
      updated_at   INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS rooms_invite_code_unique
      ON rooms(invite_code);
  `);
  return db;
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

export function createSqliteStore(dbPath: string): BridgeStore {
  const db = openDb(dbPath);

  const selectById = db.prepare<{ room_id: string }, { data: string }>(
    "SELECT data FROM rooms WHERE room_id = @room_id"
  );
  const selectIdByCode = db.prepare<
    { invite_code: string },
    { room_id: string }
  >("SELECT room_id FROM rooms WHERE invite_code = @invite_code");
  const codeExists = db.prepare<{ invite_code: string }, { one: number }>(
    "SELECT 1 AS one FROM rooms WHERE invite_code = @invite_code"
  );
  const upsert = db.prepare(`
    INSERT INTO rooms (room_id, invite_code, data, updated_at)
    VALUES (@room_id, @invite_code, @data, @updated_at)
    ON CONFLICT(room_id) DO UPDATE SET
      invite_code = excluded.invite_code,
      data        = excluded.data,
      updated_at  = excluded.updated_at
  `);

  function readAggregate(roomId: string): RoomAggregate | undefined {
    const row = selectById.get({ room_id: roomId });
    if (!row) return undefined;
    try {
      const parsed = JSON.parse(row.data) as SerializableAggregate;
      return fromSerializable(parsed);
    } catch (err) {
      console.error("[sqlite-store] failed to parse aggregate", roomId, err);
      return undefined;
    }
  }

  function writeAggregate(agg: RoomAggregate): void {
    const payload = JSON.stringify(toSerializable(agg));
    upsert.run({
      room_id: agg.room.id,
      invite_code: agg.room.inviteCode.toLowerCase(),
      data: payload,
      updated_at: Date.now(),
    });
  }

  return {
    kind: "sqlite",

    getAggregate(roomId) {
      return readAggregate(roomId);
    },

    saveAggregate(agg) {
      writeAggregate(agg);
    },

    registerNewRoom(room) {
      const agg = emptyAggregate(room);
      writeAggregate(agg);
      return agg;
    },

    resolveRoomIdFromInviteCode(codeLower) {
      const row = selectIdByCode.get({ invite_code: codeLower });
      return row?.room_id;
    },

    hasInviteCode(codeLower) {
      return Boolean(codeExists.get({ invite_code: codeLower }));
    },
  };
}
