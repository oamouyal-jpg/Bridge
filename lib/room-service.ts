import { nanoid } from "nanoid";
import { defaultEntitlements, migrateMonetizationFields } from "@/lib/entitlements";
import { clampMaxParticipants } from "@/lib/room-capacity";
import type { Room, RoomCategory, RoomStatus, Participant, TranslationMode } from "./types";
import {
  getOrCreateAggregate,
  hasInviteCode,
  registerNewRoom,
  resolveRoomIdFromInviteCode,
  saveRoomAggregate,
  type RoomAggregate,
} from "./store";

const CODE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

function nowIso() {
  return new Date().toISOString();
}

function uniqueInviteCode(): string {
  let code = "";
  for (let g = 0; g < 30; g++) {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    if (!hasInviteCode(code)) return code;
  }
  return nanoid(6).toLowerCase();
}

export function resolveRoomIdFromCode(code: string): string | null {
  return resolveRoomIdFromInviteCode(code) ?? null;
}

export function createRoom(input: {
  title: string;
  displayName: string;
  category: RoomCategory;
  maxParticipants?: unknown;
}): { room: Room; participant: Participant; aggregate: RoomAggregate } {
  const roomId = nanoid(12);
  const inviteCode = uniqueInviteCode();
  const ts = nowIso();
  const participantId = `p_${nanoid(10)}`;
  const maxParticipants = clampMaxParticipants(input.maxParticipants, input.category);

  const room: Room = {
    id: roomId,
    title: input.title.trim() || "Untitled room",
    inviteCode,
    category: input.category,
    status: "intake_in_progress",
    participantIds: [participantId],
    maxParticipants,
    createdAt: ts,
    updatedAt: ts,
    isBusiness: input.category === "workplace",
    entitlements: defaultEntitlements(),
  };

  const participant: Participant = {
    id: participantId,
    roomId,
    displayName: input.displayName.trim(),
    joinedAt: ts,
    translationMode: "softened",
    intakeCompleted: false,
  };

  const aggregate = registerNewRoom(room);
  aggregate.participants.set(participantId, participant);
  saveRoomAggregate(aggregate);

  return { room, participant, aggregate };
}

export function joinRoom(input: {
  inviteCode: string;
  displayName: string;
}): { room: Room; participant: Participant; aggregate: RoomAggregate } {
  const roomId = resolveRoomIdFromCode(input.inviteCode);
  if (!roomId) throw new Error("Room not found.");

  const aggregate = getOrCreateAggregate(roomId);
  if (!aggregate) throw new Error("Room not found.");

  const cap = aggregate.room.maxParticipants ?? 2;
  if (aggregate.participants.size >= cap) {
    throw new Error(`This room is full (${cap} participants).`);
  }

  const ts = nowIso();
  const participantId = `p_${nanoid(10)}`;
  const participant: Participant = {
    id: participantId,
    roomId,
    displayName: input.displayName.trim(),
    joinedAt: ts,
    translationMode: "softened",
    intakeCompleted: false,
  };

  aggregate.participants.set(participantId, participant);
  aggregate.room.participantIds = [...aggregate.room.participantIds, participantId];
  aggregate.room.status = "intake_in_progress";
  aggregate.room.updatedAt = ts;
  saveRoomAggregate(aggregate);

  return { room: aggregate.room, participant, aggregate };
}

/** Legacy rooms: host could not start intake until someone joined — move solo rooms straight to intake. */
function migrateSoloIntakeFlow(agg: RoomAggregate): void {
  if (
    agg.room.status === "waiting_for_second_participant" &&
    agg.participants.size === 1
  ) {
    agg.room.status = "intake_in_progress";
    agg.room.updatedAt = nowIso();
    saveRoomAggregate(agg);
  }
}

export function getAggregate(roomId: string): RoomAggregate | undefined {
  const agg = getOrCreateAggregate(roomId);
  if (agg) {
    migrateMonetizationFields(agg);
    migrateSoloIntakeFlow(agg);
  }
  return agg;
}

export function bumpRoomStatus(aggregate: RoomAggregate, status: RoomStatus): void {
  aggregate.room.status = status;
  aggregate.room.updatedAt = nowIso();
  saveRoomAggregate(aggregate);
}

export function setParticipantTranslationMode(
  aggregate: RoomAggregate,
  participantId: string,
  mode: TranslationMode
): void {
  const p = aggregate.participants.get(participantId);
  if (!p) throw new Error("Participant not found.");
  p.translationMode = mode;
  aggregate.participants.set(participantId, p);
  saveRoomAggregate(aggregate);
}
